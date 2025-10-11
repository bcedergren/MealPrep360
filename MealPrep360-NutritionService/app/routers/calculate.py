"""Nutrition calculation endpoints"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict
from loguru import logger

from app.services.usda_client import usda_client

router = APIRouter()

class Ingredient(BaseModel):
    name: str
    amount: float
    unit: str

class RecipeNutrition Request(BaseModel):
    ingredients: List[Ingredient]
    servings: int = 4

@router.post("/calculate")
async def calculate_recipe_nutrition(request: RecipeNutritionRequest):
    """
    Calculate total nutrition for a recipe from ingredients
    Returns per-serving nutrition
    """
    try:
        total_nutrition = {
            'calories': 0.0,
            'protein': 0.0,
            'carbs': 0.0,
            'fat': 0.0,
            'fiber': 0.0,
            'sugar': 0.0,
            'sodium': 0.0
        }
        
        # Calculate for each ingredient
        for ing in request.ingredients:
            nutrition = await usda_client.get_nutrition(
                ing.name,
                ing.amount,
                ing.unit
            )
            
            for key in total_nutrition:
                total_nutrition[key] += nutrition.get(key, 0)
        
        # Calculate per serving
        per_serving = {
            k: round(v / request.servings, 1)
            for k, v in total_nutrition.items()
        }
        
        return {
            "total": total_nutrition,
            "per_serving": per_serving,
            "servings": request.servings
        }
        
    except Exception as e:
        logger.error(f"Nutrition calculation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

