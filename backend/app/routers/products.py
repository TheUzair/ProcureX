import uuid
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func, or_
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.models.user import User
from app.models.product import Product
from app.schemas.product import ProductCreate, ProductUpdate, ProductResponse
from app.middleware.auth import get_current_user
from app.services.audit_service import log_action

router = APIRouter()


@router.get("", response_model=dict)
async def list_products(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: str = Query("", max_length=255),
    category: str = Query("", max_length=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = select(Product).where(Product.is_deleted == False)
    count_query = select(func.count(Product.id)).where(Product.is_deleted == False)

    if search:
        search_filter = or_(
            Product.name.ilike(f"%{search}%"),
            Product.sku.ilike(f"%{search}%"),
        )
        query = query.where(search_filter)
        count_query = count_query.where(search_filter)

    if category:
        query = query.where(Product.category == category)
        count_query = count_query.where(Product.category == category)

    total = (await db.execute(count_query)).scalar_one()
    result = await db.execute(
        query.order_by(Product.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    products = result.scalars().all()

    return {
        "items": [ProductResponse.model_validate(p) for p in products],
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size if page_size > 0 else 0,
    }


@router.get("/{product_id}", response_model=ProductResponse)
async def get_product(
    product_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Product).where(Product.id == product_id, Product.is_deleted == False)
    )
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


@router.post("", response_model=ProductResponse, status_code=201)
async def create_product(
    data: ProductCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Check SKU uniqueness
    existing = await db.execute(
        select(Product).where(Product.sku == data.sku, Product.is_deleted == False)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="SKU already exists")

    product = Product(**data.model_dump(), created_by=current_user.id)
    db.add(product)
    await db.flush()

    await log_action(
        db, "product", product.id, "created", current_user.id,
        new_value=data.model_dump(mode="json"),
    )
    await db.flush()
    return product


@router.put("/{product_id}", response_model=ProductResponse)
async def update_product(
    product_id: uuid.UUID,
    data: ProductUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Product).where(Product.id == product_id, Product.is_deleted == False)
    )
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    update_data = data.model_dump(exclude_unset=True)

    # Check SKU uniqueness if changing SKU
    if "sku" in update_data and update_data["sku"] != product.sku:
        existing = await db.execute(
            select(Product).where(
                Product.sku == update_data["sku"],
                Product.is_deleted == False,
                Product.id != product_id,
            )
        )
        if existing.scalar_one_or_none():
            raise HTTPException(status_code=409, detail="SKU already exists")

    old_values = {k: getattr(product, k) for k in update_data}
    for key, value in update_data.items():
        setattr(product, key, value)

    await log_action(
        db, "product", product.id, "updated", current_user.id,
        old_value={k: str(v) for k, v in old_values.items()},
        new_value={k: str(v) for k, v in update_data.items()},
    )
    await db.flush()
    return product


@router.delete("/{product_id}", status_code=204)
async def delete_product(
    product_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Product).where(Product.id == product_id, Product.is_deleted == False)
    )
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    product.is_deleted = True
    await log_action(db, "product", product.id, "deleted", current_user.id)
    await db.flush()
