"""Recipe generation endpoints"""
from fastapi import APIRouter, HTTPException
from loguru import logger
import time

from app.models.schemas import RecipeRequest, RecipeResponse, Recipe
from app.services.openai_service import openai_service
from app.services.prompt_manager import prompt_manager

router = APIRouter()

@router.post("/generate", response_model=RecipeResponse)
async def generate_recipe(request: RecipeRequest):
    """
    Generate a freezer-friendly recipe using AI
    
    This endpoint generates detailed recipes optimized for batch cooking
    and freezer storage, perfect for meal prep.
    """
    start_time = time.time()
    
    try:
        # Build messages from prompt template
        messages = prompt_manager.build_recipe_messages(request)
        
        # Generate structured response with automatic validation
        recipe, cost = await openai_service.generate_structured_response(
            response_model=Recipe,
            messages=messages,
            endpoint="recipe_generation",
            cache_key=f"recipe:{request.season}:{request.recipe_name or 'random'}"
        )
        
        generation_time = time.time() - start_time
        
        return RecipeResponse(
            recipe=recipe,
            generation_time=generation_time,
            cost=cost,
            model_used=openai_service.client.model or "gpt-4o"
        )
        
    except Exception as e:
        logger.error(f"Recipe generation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/batch-generate")
async def batch_generate_recipes(season: str, count: int = 5):
    """Generate multiple recipes for a season"""
    if count > 10:
        raise HTTPException(status_code=400, detail="Maximum 10 recipes per batch")
    
    recipes = []
    total_cost = 0.0
    
    for i in range(count):
        request = RecipeRequest(season=season)
        try:
            response = await generate_recipe(request)
            recipes.append(response.recipe)
            total_cost += response.cost
        except Exception as e:
            logger.error(f"Failed to generate recipe {i+1}: {e}")
    
    return {
        "recipes": recipes,
        "total_generated": len(recipes),
        "total_cost": total_cost
    }

@router.post("/validate")
async def validate_recipe(recipe: Recipe):
    """Validate and audit a recipe"""
    # Perform validation (already done by Pydantic)
    return {
        "valid": True,
        "recipe": recipe
    }

