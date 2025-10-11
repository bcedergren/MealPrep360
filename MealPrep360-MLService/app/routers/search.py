"""Search endpoints"""
from fastapi import APIRouter, HTTPException, Query
from loguru import logger

from app.core.database import db_manager
from app.services.search_engine import search_engine

router = APIRouter()

@router.get("/recipes")
async def search_recipes(
    q: str = Query(..., min_length=2),
    limit: int = Query(10, ge=1, le=50)
):
    """
    Semantic search for recipes
    Better than basic text matching!
    """
    try:
        # Get all recipes (in production, use caching)
        recipes_collection = db_manager.get_collection("recipes")
        all_recipes = await recipes_collection.find({}).to_list(length=10000)
        
        # Build/rebuild index
        await search_engine.index_recipes(all_recipes)
        
        # Search
        results = await search_engine.search(q, k=limit)
        
        logger.info(f"Search for '{q}' returned {len(results)} results")
        
        return {
            "query": q,
            "results": results,
            "total": len(results)
        }
        
    except Exception as e:
        logger.error(f"Search error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

