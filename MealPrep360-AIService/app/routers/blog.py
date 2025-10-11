"""Blog content generation endpoints"""
from fastapi import APIRouter, HTTPException
from loguru import logger

from app.models.schemas import BlogContentRequest, BlogContent
from app.services.openai_service import openai_service
from app.services.prompt_manager import prompt_manager

router = APIRouter()

@router.post("/generate", response_model=BlogContent)
async def generate_blog_content(request: BlogContentRequest):
    """Generate blog post content"""
    try:
        messages = prompt_manager.build_blog_messages(request)
        
        content, cost = await openai_service.generate_structured_response(
            response_model=BlogContent,
            messages=messages,
            model="gpt-4o",  # Use GPT-4o for blog content
            endpoint="blog_generation"
        )
        
        return content
        
    except Exception as e:
        logger.error(f"Blog generation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

