"""Recommendation endpoints"""
from fastapi import APIRouter, HTTPException
from loguru import logger

from app.core.database import db_manager
from app.services.search_engine import search_engine

router = APIRouter()

@router.get("/recipe/{recipe_id}")
async def get_similar_recipes(recipe_id: str, limit: int = 5):
    """
    Get recipes similar to a given recipe
    "You might also like..."
    """
    try:
        recipes_collection = db_manager.get_collection("recipes")
        all_recipes = await recipes_collection.find({}).to_list(length=10000)
        
        await search_engine.index_recipes(all_recipes)
        
        results = await search_engine.find_similar(recipe_id, k=limit)
        
        return {
            "recipe_id": recipe_id,
            "similar_recipes": results,
            "count": len(results)
        }
        
    except Exception as e:
        logger.error(f"Recommendations error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

