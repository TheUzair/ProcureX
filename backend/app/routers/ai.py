from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from app.models.user import User
from app.middleware.auth import get_current_user
from app.services.ai_service import generate_product_description
from app.config import get_settings

router = APIRouter()
settings = get_settings()


class GenerateDescriptionRequest(BaseModel):
    product_name: str = Field(min_length=1, max_length=255)
    category: str = Field(min_length=1, max_length=100)


class GenerateDescriptionResponse(BaseModel):
    description: str
    product_name: str
    category: str


@router.post("/generate-description", response_model=GenerateDescriptionResponse)
async def generate_description(
    data: GenerateDescriptionRequest,
    current_user: User = Depends(get_current_user),
):
    if not settings.groq_api_key:
        raise HTTPException(status_code=503, detail="AI service not configured")

    try:
        description = await generate_product_description(
            data.product_name, data.category
        )
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"AI service error: {str(e)}")

    return GenerateDescriptionResponse(
        description=description,
        product_name=data.product_name,
        category=data.category,
    )
