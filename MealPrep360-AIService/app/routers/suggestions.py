"""Recipe suggestion endpoints"""
from fastapi import APIRouter, HTTPException
from loguru import logger

from app.models.schemas import SuggestionRequest, SuggestionResponse
from app.services.openai_service import openai_service
from app.services.prompt_manager import prompt_manager

router = APIRouter()

@router.post("/generate", response_model=SuggestionResponse)
async def generate_suggestions(request: SuggestionRequest):
    """Generate recipe suggestions based on query"""
    try:
        messages = prompt_manager.build_suggestion_messages(request)
        
        suggestions, cost = await openai_service.generate_structured_response(
            response_model=SuggestionResponse,
            messages=messages,
            model="gpt-4o-mini",  # Use mini model for simple suggestions
            endpoint="suggestions"
        )
        
        return suggestions
        
    except Exception as e:
        logger.error(f"Suggestion generation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

