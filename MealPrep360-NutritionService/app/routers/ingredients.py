"""Ingredient nutrition lookup"""
from fastapi import APIRouter, HTTPException, Query

from app.services.usda_client import usda_client

router = APIRouter()

@router.get("/search")
async def search_ingredient(query: str = Query(..., min_length=2)):
    """Search for ingredient in USDA database"""
    try:
        result = await usda_client.search_food(query)
        
        if not result:
            return {"found": False, "query": query}
        
        return {
            "found": True,
            "food": {
                "name": result.get('description'),
                "fdcId": result.get('fdcId'),
                "dataType": result.get('dataType')
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/nutrition/{name}")
async def get_ingredient_nutrition(
    name: str,
    amount: float = Query(1.0),
    unit: str = Query("serving")
):
    """Get nutrition for specific ingredient and amount"""
    try:
        nutrition = await usda_client.get_nutrition(name, amount, unit)
        return nutrition
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

