import uuid
from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel, Field


class ProductCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    sku: str = Field(min_length=1, max_length=100)
    category: str | None = Field(None, max_length=100)
    description: str | None = None
    unit_price: Decimal = Field(gt=0, decimal_places=2)
    stock_quantity: int = Field(ge=0)


class ProductUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=255)
    sku: str | None = Field(None, min_length=1, max_length=100)
    category: str | None = Field(None, max_length=100)
    description: str | None = None
    unit_price: Decimal | None = Field(None, gt=0, decimal_places=2)
    stock_quantity: int | None = Field(None, ge=0)


class ProductResponse(BaseModel):
    id: uuid.UUID
    name: str
    sku: str
    category: str | None
    description: str | None
    unit_price: Decimal
    stock_quantity: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
