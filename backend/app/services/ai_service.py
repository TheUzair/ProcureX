import httpx
from app.config import get_settings

settings = get_settings()

GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent"


async def generate_product_description(
    product_name: str, category: str
) -> str:
    """Generate a 2-line marketing description using Gemini API."""
    prompt = (
        f"Write a concise, professional 2-line marketing description for the following product.\n"
        f"Product Name: {product_name}\n"
        f"Category: {category}\n\n"
        f"Requirements:\n"
        f"- Exactly 2 lines\n"
        f"- Professional and compelling\n"
        f"- Highlight key benefits\n"
        f"- Suitable for a B2B procurement catalog"
    )

    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(
            GEMINI_URL,
            params={"key": settings.gemini_api_key},
            json={
                "contents": [{"parts": [{"text": prompt}]}],
                "generationConfig": {
                    "temperature": 0.7,
                    "maxOutputTokens": 150,
                },
            },
        )
        response.raise_for_status()
        data = response.json()

    text = data["candidates"][0]["content"]["parts"][0]["text"]
    return text.strip()
