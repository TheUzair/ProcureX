import uuid
from decimal import Decimal, ROUND_HALF_UP
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.purchase_order import PurchaseOrder, PurchaseOrderItem, POStatus
from app.models.product import Product
from app.models.vendor import Vendor
from app.schemas.purchase_order import PurchaseOrderCreate, POItemCreate
from app.services.stock_service import validate_stock, deduct_stock, restore_stock
from app.services.audit_service import log_action
from app.utils.ref_generator import generate_reference_number

TAX_RATE = Decimal("0.05")

# Valid status transitions
VALID_TRANSITIONS: dict[POStatus, set[POStatus]] = {
    POStatus.DRAFT: {POStatus.APPROVED, POStatus.CANCELLED},
    POStatus.APPROVED: {POStatus.COMPLETED, POStatus.CANCELLED},
    POStatus.PENDING_STOCK: {POStatus.APPROVED, POStatus.CANCELLED},
    POStatus.COMPLETED: set(),  # Locked — no transitions allowed
    POStatus.CANCELLED: set(),  # Locked — no transitions allowed
}


def calculate_totals(
    items: list, shipping_cost: Decimal = Decimal("0"), discount: Decimal = Decimal("0")
) -> dict:
    """Calculate subtotal, tax, and total for a purchase order."""
    subtotal = sum(
        (Decimal(str(item.unit_price)) * item.quantity for item in items),
        Decimal("0"),
    )
    subtotal = subtotal.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    tax_amount = (subtotal * TAX_RATE).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    total = (subtotal + tax_amount + shipping_cost - discount).quantize(
        Decimal("0.01"), rounding=ROUND_HALF_UP
    )
    return {
        "subtotal": subtotal,
        "tax_amount": tax_amount,
        "total": total,
    }


async def create_purchase_order(
    db: AsyncSession,
    data: PurchaseOrderCreate,
    user_id: uuid.UUID,
) -> PurchaseOrder:
    """Create a new purchase order with items."""
    # Verify vendor exists
    vendor_result = await db.execute(
        select(Vendor).where(Vendor.id == data.vendor_id, Vendor.is_deleted == False)
    )
    if vendor_result.scalar_one_or_none() is None:
        raise HTTPException(status_code=404, detail="Vendor not found")

    # Validate stock availability
    items_data = [{"product_id": item.product_id, "quantity": item.quantity} for item in data.items]
    stock_ok, stock_errors = await validate_stock(db, items_data)

    # Generate reference number
    ref_number = await generate_reference_number(db)

    # Create PO
    po = PurchaseOrder(
        reference_number=ref_number,
        vendor_id=data.vendor_id,
        status=POStatus.DRAFT if stock_ok else POStatus.PENDING_STOCK,
        shipping_cost=data.shipping_cost,
        discount=data.discount,
        notes=data.notes,
        created_by=user_id,
    )
    db.add(po)
    await db.flush()

    # Create items
    for item_data in data.items:
        product_result = await db.execute(
            select(Product).where(Product.id == item_data.product_id)
        )
        product = product_result.scalar_one_or_none()
        if product is None:
            raise HTTPException(status_code=404, detail=f"Product {item_data.product_id} not found")

        line_total = (product.unit_price * item_data.quantity).quantize(
            Decimal("0.01"), rounding=ROUND_HALF_UP
        )
        po_item = PurchaseOrderItem(
            purchase_order_id=po.id,
            product_id=item_data.product_id,
            quantity=item_data.quantity,
            unit_price=product.unit_price,
            line_total=line_total,
        )
        db.add(po_item)

    await db.flush()

    # Recalculate totals
    await _recalculate_po_totals(db, po)

    # Audit log
    await log_action(
        db,
        entity_type="purchase_order",
        entity_id=po.id,
        action="created",
        user_id=user_id,
        new_value={"reference_number": ref_number, "status": po.status.value},
    )

    await db.flush()
    return po


async def transition_status(
    db: AsyncSession,
    po: PurchaseOrder,
    new_status: POStatus,
    user_id: uuid.UUID,
) -> PurchaseOrder:
    """Validate and execute a status transition."""
    old_status = po.status
    allowed = VALID_TRANSITIONS.get(old_status, set())

    if new_status not in allowed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot transition from '{old_status.value}' to '{new_status.value}'",
        )

    # Business rules on approval
    if new_status == POStatus.APPROVED:
        items_data = [
            {"product_id": item.product_id, "quantity": item.quantity}
            for item in po.items
        ]
        success, errors = await deduct_stock(db, items_data)
        if not success:
            po.status = POStatus.PENDING_STOCK
            await db.flush()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Stock insufficient: {'; '.join(errors)}",
            )

    # Restore stock on cancellation if previously approved
    if new_status == POStatus.CANCELLED and old_status == POStatus.APPROVED:
        items_data = [
            {"product_id": item.product_id, "quantity": item.quantity}
            for item in po.items
        ]
        await restore_stock(db, items_data)

    po.status = new_status

    # Audit log
    await log_action(
        db,
        entity_type="purchase_order",
        entity_id=po.id,
        action="status_changed",
        user_id=user_id,
        old_value={"status": old_status.value},
        new_value={"status": new_status.value},
    )

    await db.flush()
    return po


async def add_po_item(
    db: AsyncSession,
    po: PurchaseOrder,
    item_data: POItemCreate,
    user_id: uuid.UUID,
) -> PurchaseOrderItem:
    """Add an item to a purchase order (draft/pending_stock only)."""
    if po.status not in (POStatus.DRAFT, POStatus.PENDING_STOCK):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Can only add items to draft or pending stock POs",
        )

    product_result = await db.execute(
        select(Product).where(Product.id == item_data.product_id, Product.is_deleted == False)
    )
    product = product_result.scalar_one_or_none()
    if product is None:
        raise HTTPException(status_code=404, detail="Product not found")

    line_total = (product.unit_price * item_data.quantity).quantize(
        Decimal("0.01"), rounding=ROUND_HALF_UP
    )
    po_item = PurchaseOrderItem(
        purchase_order_id=po.id,
        product_id=item_data.product_id,
        quantity=item_data.quantity,
        unit_price=product.unit_price,
        line_total=line_total,
    )
    db.add(po_item)
    await db.flush()

    await _recalculate_po_totals(db, po)

    await log_action(
        db,
        entity_type="purchase_order",
        entity_id=po.id,
        action="item_added",
        user_id=user_id,
        new_value={"product_id": str(item_data.product_id), "quantity": item_data.quantity},
    )

    await db.flush()
    return po_item


async def remove_po_item(
    db: AsyncSession,
    po: PurchaseOrder,
    item_id: uuid.UUID,
    user_id: uuid.UUID,
) -> None:
    """Remove an item from a purchase order (draft/pending_stock only)."""
    if po.status not in (POStatus.DRAFT, POStatus.PENDING_STOCK):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Can only remove items from draft or pending stock POs",
        )

    result = await db.execute(
        select(PurchaseOrderItem).where(
            PurchaseOrderItem.id == item_id,
            PurchaseOrderItem.purchase_order_id == po.id,
        )
    )
    item = result.scalar_one_or_none()
    if item is None:
        raise HTTPException(status_code=404, detail="Item not found")

    await log_action(
        db,
        entity_type="purchase_order",
        entity_id=po.id,
        action="item_removed",
        user_id=user_id,
        old_value={"product_id": str(item.product_id), "quantity": item.quantity},
    )

    await db.delete(item)
    await db.flush()

    await _recalculate_po_totals(db, po)
    await db.flush()


async def _recalculate_po_totals(db: AsyncSession, po: PurchaseOrder) -> None:
    """Recalculate and update PO totals based on current items."""
    result = await db.execute(
        select(PurchaseOrderItem).where(PurchaseOrderItem.purchase_order_id == po.id)
    )
    items = result.scalars().all()
    totals = calculate_totals(items, po.shipping_cost, po.discount)
    po.subtotal = totals["subtotal"]
    po.tax_amount = totals["tax_amount"]
    po.total = totals["total"]
