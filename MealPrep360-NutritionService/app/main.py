"""
MealPrep360 Nutrition Service
Automatic nutrition calculation using USDA FoodData Central API
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from loguru import logger
import sys

from app.core.config import settings
from app.routers import calculate, ingredients, meal_plans

logger.remove()
logger.add(sys.stdout, level="INFO")

app = FastAPI(
    title="MealPrep360 Nutrition Service",
    description="Automatic nutrition calculation and analysis",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(calculate.router, prefix="/api/nutrition", tags=["nutrition"])
app.include_router(ingredients.router, prefix="/api/ingredients", tags=["ingredients"])
app.include_router(meal_plans.router, prefix="/api/meal-plans", tags=["meal-plans"])

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "nutrition",
        "version": "1.0.0"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8003, reload=True)

