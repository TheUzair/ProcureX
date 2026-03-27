import uuid
from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel, Field
from app.models.purchase_order import POStatus


class POItemCreate(BaseModel):
    product_id: uuid.UUID
    quantity: int = Field(gt=0)


class POItemResponse(BaseModel):
    id: uuid.UUID
    product_id: uuid.UUID
    product_name: str | None = None
    product_sku: str | None = None
    quantity: int
    unit_price: Decimal
    line_total: Decimal
    created_at: datetime

    model_config = {"from_attributes": True}


class PurchaseOrderCreate(BaseModel):
    vendor_id: uuid.UUID
    items: list[POItemCreate] = Field(min_length=1)
    shipping_cost: Decimal = Field(default=Decimal("0.00"), ge=0)
    discount: Decimal = Field(default=Decimal("0.00"), ge=0)
    notes: str | None = None


class PurchaseOrderUpdate(BaseModel):
    vendor_id: uuid.UUID | None = None
    shipping_cost: Decimal | None = Field(None, ge=0)
    discount: Decimal | None = Field(None, ge=0)
    notes: str | None = None


class StatusUpdateRequest(BaseModel):
    status: POStatus


class PurchaseOrderResponse(BaseModel):
    id: uuid.UUID
    reference_number: str
    vendor_id: uuid.UUID
    vendor_name: str | None = None
    status: POStatus
    subtotal: Decimal
    tax_amount: Decimal
    shipping_cost: Decimal
    discount: Decimal
    total: Decimal
    notes: str | None
    items: list[POItemResponse] = []
    created_at: datetime
    updated_at: datetime
    created_by: uuid.UUID | None

    model_config = {"from_attributes": True}


class PurchaseOrderListResponse(BaseModel):
    id: uuid.UUID
    reference_number: str
    vendor_id: uuid.UUID
    vendor_name: str | None = None
    status: POStatus
    total: Decimal
    items_count: int = 0
    created_at: datetime

    model_config = {"from_attributes": True}
