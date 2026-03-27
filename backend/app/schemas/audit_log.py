import uuid
from datetime import datetime
from pydantic import BaseModel


class AuditLogResponse(BaseModel):
    id: uuid.UUID
    entity_type: str
    entity_id: uuid.UUID
    action: str
    old_value: dict | None
    new_value: dict | None
    user_id: uuid.UUID | None
    username: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}
