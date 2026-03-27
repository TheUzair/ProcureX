import httpx
from app.config import get_settings

settings = get_settings()

GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"


async def generate_product_description(
    product_name: str, category: str
) -> str:
    """Generate a 2-line marketing description using Groq API."""
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
            GROQ_URL,
            headers={
                "Authorization": f"Bearer {settings.groq_api_key}",
                "Content-Type": "application/json",
            },
            json={
                "model": "llama-3.1-8b-instant",
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0.7,
                "max_tokens": 150,
            },
        )
        response.raise_for_status()
        data = response.json()

    text = data["choices"][0]["message"]["content"]
    return text.strip()
