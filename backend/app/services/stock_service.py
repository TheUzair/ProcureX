import uuid
from decimal import Decimal
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.product import Product


async def validate_stock(
    db: AsyncSession, items: list[dict]
) -> tuple[bool, list[str]]:
    """
    Check if all items have sufficient stock.
    Returns (all_available, list_of_error_messages).
    """
    errors = []
    for item in items:
        result = await db.execute(
            select(Product).where(
                Product.id == item["product_id"],
                Product.is_deleted == False,
                Product.is_active == True,
            )
        )
        product = result.scalar_one_or_none()
        if product is None:
            errors.append(f"Product {item['product_id']} not found or inactive")
            continue
        if product.stock_quantity < item["quantity"]:
            errors.append(
                f"Insufficient stock for {product.name} (SKU: {product.sku}): "
                f"available={product.stock_quantity}, requested={item['quantity']}"
            )
    return len(errors) == 0, errors


async def deduct_stock(
    db: AsyncSession, items: list[dict]
) -> tuple[bool, list[str]]:
    """
    Deduct stock for all items using row-level locking (SELECT FOR UPDATE).
    Must be called within a transaction. Returns (success, errors).
    """
    errors = []
    for item in items:
        # Row-level lock to prevent race conditions
        result = await db.execute(
            select(Product)
            .where(Product.id == item["product_id"])
            .with_for_update()
        )
        product = result.scalar_one_or_none()
        if product is None:
            errors.append(f"Product {item['product_id']} not found")
            continue
        if product.stock_quantity < item["quantity"]:
            errors.append(
                f"Insufficient stock for {product.name}: "
                f"available={product.stock_quantity}, requested={item['quantity']}"
            )
            continue
        product.stock_quantity -= item["quantity"]

    return len(errors) == 0, errors


async def restore_stock(
    db: AsyncSession, items: list[dict]
) -> None:
    """
    Restore stock for all items (e.g., on cancellation after approval).
    Uses row-level locking. Must be called within a transaction.
    """
    for item in items:
        result = await db.execute(
            select(Product)
            .where(Product.id == item["product_id"])
            .with_for_update()
        )
        product = result.scalar_one_or_none()
        if product is not None:
            product.stock_quantity += item["quantity"]
