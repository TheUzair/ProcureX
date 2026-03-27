from datetime import datetime, timezone
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.purchase_order import PurchaseOrder


async def generate_reference_number(db: AsyncSession) -> str:
    """Generate PO reference number in format PO-YYYY-NNNN."""
    year = datetime.now(timezone.utc).year
    prefix = f"PO-{year}-"

    result = await db.execute(
        select(func.count(PurchaseOrder.id)).where(
            PurchaseOrder.reference_number.like(f"{prefix}%")
        )
    )
    count = result.scalar_one() + 1

    return f"{prefix}{count:04d}"
