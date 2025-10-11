"""
MealPrep360 Report Service
PDF generation for meal plans, shopping lists, and analytics
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from loguru import logger
import sys

from app.core.config import settings
from app.routers import meal_plans, shopping_lists, analytics

logger.remove()
logger.add(sys.stdout, level="INFO")

app = FastAPI(
    title="MealPrep360 Report Service",
    description="PDF generation and data exports",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(meal_plans.router, prefix="/api/reports/meal-plans", tags=["meal-plans"])
app.include_router(shopping_lists.router, prefix="/api/reports/shopping-lists", tags=["shopping-lists"])
app.include_router(analytics.router, prefix="/api/reports/analytics", tags=["analytics"])

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "reports", "version": "1.0.0"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8005, reload=True)

