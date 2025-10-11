"""Image generation endpoints"""
from fastapi import APIRouter, HTTPException
from loguru import logger

from app.models.schemas import ImageGenerationRequest, ImageResponse
from app.services.openai_service import openai_service

router = APIRouter()

@router.post("/generate", response_model=ImageResponse)
async def generate_image(request: ImageGenerationRequest):
    """Generate recipe image with DALL-E"""
    try:
        # Build image prompt
        prompt = f"Food photography of {request.recipe_title}"
        if request.recipe_description:
            prompt += f": {request.recipe_description}"
        prompt += f". Professional {request.style} style, appetizing, high quality."
        
        url, revised_prompt, cost = await openai_service.generate_image(
            prompt=prompt,
            size=request.size,
            cache_key=f"image:{request.recipe_title}"
        )
        
        return ImageResponse(
            url=url,
            revised_prompt=revised_prompt,
            cost=cost
        )
        
    except Exception as e:
        logger.error(f"Image generation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

