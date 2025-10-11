"""
MealPrep360 AI Service
FastAPI microservice for all OpenAI/AI operations
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
from loguru import logger
import sys

from app.core.config import settings
from app.core.monitoring import metrics_middleware
from app.routers import recipes, blog, suggestions, images
from app.services.cost_tracker import cost_tracker

# Configure logging
logger.remove()
logger.add(
    sys.stdout,
    format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan> - <level>{message}</level>",
    level="INFO"
)
logger.add(
    "logs/ai_service_{time:YYYY-MM-DD}.log",
    rotation="00:00",
    retention="30 days",
    level="DEBUG"
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    logger.info("🚀 Starting MealPrep360 AI Service")
    logger.info(f"Environment: {settings.ENVIRONMENT}")
    logger.info(f"OpenAI Model: {settings.OPENAI_MODEL}")
    
    # Initialize services
    await cost_tracker.initialize()
    
    yield
    
    # Cleanup
    logger.info("Shutting down AI Service")
    await cost_tracker.save_stats()

# Create FastAPI app
app = FastAPI(
    title="MealPrep360 AI Service",
    description="AI-powered recipe generation, meal planning, and content creation",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs" if settings.ENVIRONMENT != "production" else None,
    redoc_url="/redoc" if settings.ENVIRONMENT != "production" else None,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Metrics middleware
app.middleware("http")(metrics_middleware)

# Include routers
app.include_router(recipes.router, prefix="/api/recipes", tags=["recipes"])
app.include_router(blog.router, prefix="/api/blog", tags=["blog"])
app.include_router(suggestions.router, prefix="/api/suggestions", tags=["suggestions"])
app.include_router(images.router, prefix="/api/images", tags=["images"])

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "mealprep360-ai",
        "version": "1.0.0"
    }

@app.get("/metrics")
async def get_metrics():
    """Get cost and usage metrics"""
    return await cost_tracker.get_stats()

@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    """Custom HTTP exception handler"""
    logger.error(f"HTTP {exc.status_code}: {exc.detail}")
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": exc.detail}
    )

@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    """General exception handler"""
    logger.exception(f"Unhandled exception: {exc}")
    return JSONResponse(
        status_code=500,
        content={"error": "Internal server error"}
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.ENVIRONMENT == "development"
    )

