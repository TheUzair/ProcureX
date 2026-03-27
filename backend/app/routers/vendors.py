import uuid
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func, or_
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.models.user import User
from app.models.vendor import Vendor
from app.schemas.vendor import VendorCreate, VendorUpdate, VendorResponse
from app.middleware.auth import get_current_user
from app.services.audit_service import log_action

router = APIRouter()


@router.get("", response_model=dict)
async def list_vendors(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: str = Query("", max_length=255),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = select(Vendor).where(Vendor.is_deleted == False)
    count_query = select(func.count(Vendor.id)).where(Vendor.is_deleted == False)

    if search:
        search_filter = or_(
            Vendor.name.ilike(f"%{search}%"),
            Vendor.email.ilike(f"%{search}%"),
        )
        query = query.where(search_filter)
        count_query = count_query.where(search_filter)

    total = (await db.execute(count_query)).scalar_one()
    result = await db.execute(
        query.order_by(Vendor.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    vendors = result.scalars().all()

    return {
        "items": [VendorResponse.model_validate(v) for v in vendors],
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size if page_size > 0 else 0,
    }


@router.get("/{vendor_id}", response_model=VendorResponse)
async def get_vendor(
    vendor_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Vendor).where(Vendor.id == vendor_id, Vendor.is_deleted == False)
    )
    vendor = result.scalar_one_or_none()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    return vendor


@router.post("", response_model=VendorResponse, status_code=201)
async def create_vendor(
    data: VendorCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    vendor = Vendor(**data.model_dump(), created_by=current_user.id)
    db.add(vendor)
    await db.flush()

    await log_action(
        db, "vendor", vendor.id, "created", current_user.id,
        new_value=data.model_dump(mode="json"),
    )
    await db.flush()
    return vendor


@router.put("/{vendor_id}", response_model=VendorResponse)
async def update_vendor(
    vendor_id: uuid.UUID,
    data: VendorUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Vendor).where(Vendor.id == vendor_id, Vendor.is_deleted == False)
    )
    vendor = result.scalar_one_or_none()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")

    old_values = {k: getattr(vendor, k) for k in data.model_dump(exclude_unset=True)}
    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(vendor, key, value)

    await log_action(
        db, "vendor", vendor.id, "updated", current_user.id,
        old_value={k: str(v) for k, v in old_values.items()},
        new_value={k: str(v) for k, v in update_data.items()},
    )
    await db.flush()
    return vendor


@router.delete("/{vendor_id}", status_code=204)
async def delete_vendor(
    vendor_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Vendor).where(Vendor.id == vendor_id, Vendor.is_deleted == False)
    )
    vendor = result.scalar_one_or_none()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")

    vendor.is_deleted = True
    await log_action(db, "vendor", vendor.id, "deleted", current_user.id)
    await db.flush()
