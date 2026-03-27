import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.models.user import User
from app.models.purchase_order import PurchaseOrder, PurchaseOrderItem, POStatus
from app.schemas.purchase_order import (
    PurchaseOrderCreate,
    PurchaseOrderUpdate,
    PurchaseOrderResponse,
    PurchaseOrderListResponse,
    POItemCreate,
    POItemResponse,
    StatusUpdateRequest,
)
from app.middleware.auth import get_current_user
from app.services.po_service import (
    create_purchase_order,
    transition_status,
    add_po_item,
    remove_po_item,
    _recalculate_po_totals,
)
from app.services.audit_service import log_action

router = APIRouter()


@router.get("", response_model=dict)
async def list_purchase_orders(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: str = Query("", max_length=255),
    status_filter: POStatus | None = Query(None, alias="status"),
    date_from: datetime | None = Query(None),
    date_to: datetime | None = Query(None),
    vendor_id: uuid.UUID | None = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = select(PurchaseOrder).where(PurchaseOrder.is_deleted == False)
    count_query = select(func.count(PurchaseOrder.id)).where(PurchaseOrder.is_deleted == False)

    if search:
        query = query.where(PurchaseOrder.reference_number.ilike(f"%{search}%"))
        count_query = count_query.where(PurchaseOrder.reference_number.ilike(f"%{search}%"))

    if status_filter:
        query = query.where(PurchaseOrder.status == status_filter)
        count_query = count_query.where(PurchaseOrder.status == status_filter)

    if date_from:
        query = query.where(PurchaseOrder.created_at >= date_from)
        count_query = count_query.where(PurchaseOrder.created_at >= date_from)

    if date_to:
        query = query.where(PurchaseOrder.created_at <= date_to)
        count_query = count_query.where(PurchaseOrder.created_at <= date_to)

    if vendor_id:
        query = query.where(PurchaseOrder.vendor_id == vendor_id)
        count_query = count_query.where(PurchaseOrder.vendor_id == vendor_id)

    total = (await db.execute(count_query)).scalar_one()
    result = await db.execute(
        query.order_by(PurchaseOrder.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    orders = result.scalars().all()

    items = []
    for po in orders:
        vendor_name = po.vendor.name if po.vendor else None
        items.append(
            PurchaseOrderListResponse(
                id=po.id,
                reference_number=po.reference_number,
                vendor_id=po.vendor_id,
                vendor_name=vendor_name,
                status=po.status,
                total=po.total,
                items_count=len(po.items),
                created_at=po.created_at,
            )
        )

    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size if page_size > 0 else 0,
    }


@router.get("/{po_id}", response_model=PurchaseOrderResponse)
async def get_purchase_order(
    po_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(PurchaseOrder).where(
            PurchaseOrder.id == po_id, PurchaseOrder.is_deleted == False
        )
    )
    po = result.scalar_one_or_none()
    if not po:
        raise HTTPException(status_code=404, detail="Purchase order not found")

    vendor_name = po.vendor.name if po.vendor else None
    items = []
    for item in po.items:
        product_name = item.product.name if item.product else None
        product_sku = item.product.sku if item.product else None
        items.append(
            POItemResponse(
                id=item.id,
                product_id=item.product_id,
                product_name=product_name,
                product_sku=product_sku,
                quantity=item.quantity,
                unit_price=item.unit_price,
                line_total=item.line_total,
                created_at=item.created_at,
            )
        )

    return PurchaseOrderResponse(
        id=po.id,
        reference_number=po.reference_number,
        vendor_id=po.vendor_id,
        vendor_name=vendor_name,
        status=po.status,
        subtotal=po.subtotal,
        tax_amount=po.tax_amount,
        shipping_cost=po.shipping_cost,
        discount=po.discount,
        total=po.total,
        notes=po.notes,
        items=items,
        created_at=po.created_at,
        updated_at=po.updated_at,
        created_by=po.created_by,
    )


@router.post("", response_model=PurchaseOrderResponse, status_code=201)
async def create_po(
    data: PurchaseOrderCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    po = await create_purchase_order(db, data, current_user.id)
    # Reload with relationships
    return await get_purchase_order(po.id, db, current_user)


@router.put("/{po_id}", response_model=PurchaseOrderResponse)
async def update_po(
    po_id: uuid.UUID,
    data: PurchaseOrderUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(PurchaseOrder).where(
            PurchaseOrder.id == po_id, PurchaseOrder.is_deleted == False
        )
    )
    po = result.scalar_one_or_none()
    if not po:
        raise HTTPException(status_code=404, detail="Purchase order not found")

    if po.status not in (POStatus.DRAFT, POStatus.PENDING_STOCK):
        raise HTTPException(
            status_code=400, detail="Can only update draft or pending stock POs"
        )

    update_data = data.model_dump(exclude_unset=True)
    old_values = {k: getattr(po, k) for k in update_data}
    for key, value in update_data.items():
        setattr(po, key, value)

    # Recalculate totals if shipping/discount changed
    if "shipping_cost" in update_data or "discount" in update_data:
        await _recalculate_po_totals(db, po)

    await log_action(
        db, "purchase_order", po.id, "updated", current_user.id,
        old_value={k: str(v) for k, v in old_values.items()},
        new_value={k: str(v) for k, v in update_data.items()},
    )
    await db.flush()

    return await get_purchase_order(po.id, db, current_user)


@router.delete("/{po_id}", status_code=204)
async def delete_po(
    po_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(PurchaseOrder).where(
            PurchaseOrder.id == po_id, PurchaseOrder.is_deleted == False
        )
    )
    po = result.scalar_one_or_none()
    if not po:
        raise HTTPException(status_code=404, detail="Purchase order not found")

    if po.status != POStatus.DRAFT:
        raise HTTPException(status_code=400, detail="Can only delete draft POs")

    po.is_deleted = True
    await log_action(db, "purchase_order", po.id, "deleted", current_user.id)
    await db.flush()


@router.patch("/{po_id}/status", response_model=PurchaseOrderResponse)
async def update_status(
    po_id: uuid.UUID,
    data: StatusUpdateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(PurchaseOrder).where(
            PurchaseOrder.id == po_id, PurchaseOrder.is_deleted == False
        )
    )
    po = result.scalar_one_or_none()
    if not po:
        raise HTTPException(status_code=404, detail="Purchase order not found")

    await transition_status(db, po, data.status, current_user.id)
    await db.flush()

    return await get_purchase_order(po.id, db, current_user)


@router.post("/{po_id}/items", response_model=POItemResponse, status_code=201)
async def add_item(
    po_id: uuid.UUID,
    data: POItemCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(PurchaseOrder).where(
            PurchaseOrder.id == po_id, PurchaseOrder.is_deleted == False
        )
    )
    po = result.scalar_one_or_none()
    if not po:
        raise HTTPException(status_code=404, detail="Purchase order not found")

    item = await add_po_item(db, po, data, current_user.id)
    product = item.product
    return POItemResponse(
        id=item.id,
        product_id=item.product_id,
        product_name=product.name if product else None,
        product_sku=product.sku if product else None,
        quantity=item.quantity,
        unit_price=item.unit_price,
        line_total=item.line_total,
        created_at=item.created_at,
    )


@router.delete("/{po_id}/items/{item_id}", status_code=204)
async def remove_item(
    po_id: uuid.UUID,
    item_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(PurchaseOrder).where(
            PurchaseOrder.id == po_id, PurchaseOrder.is_deleted == False
        )
    )
    po = result.scalar_one_or_none()
    if not po:
        raise HTTPException(status_code=404, detail="Purchase order not found")

    await remove_po_item(db, po, item_id, current_user.id)
