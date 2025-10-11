"""
MealPrep360 Analytics Service
High-performance analytics and data processing with Pandas
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from contextlib import asynccontextmanager
from loguru import logger
import sys

from app.core.config import settings
from app.core.database import db_manager
from app.routers import users, recipes, system, exports

# Configure logging
logger.remove()
logger.add(
    sys.stdout,
    format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan> - <level>{message}</level>",
    level="INFO"
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    logger.info("🚀 Starting Analytics Service")
    logger.info(f"Environment: {settings.ENVIRONMENT}")
    
    # Connect to MongoDB
    await db_manager.connect()
    
    yield
    
    # Cleanup
    logger.info("Shutting down Analytics Service")
    await db_manager.disconnect()

app = FastAPI(
    title="MealPrep360 Analytics Service",
    description="High-performance analytics and data processing with Pandas",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs" if settings.ENVIRONMENT != "production" else None,
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
app.include_router(users.router, prefix="/api/analytics/users", tags=["user-analytics"])
app.include_router(recipes.router, prefix="/api/analytics/recipes", tags=["recipe-analytics"])
app.include_router(system.router, prefix="/api/analytics/system", tags=["system-analytics"])
app.include_router(exports.router, prefix="/api/exports", tags=["exports"])

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    db_status = "connected" if db_manager.client else "disconnected"
    return {
        "status": "healthy",
        "service": "analytics",
        "database": db_status,
        "version": "1.0.0"
    }

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": "MealPrep360 Analytics",
        "docs": "/docs",
        "health": "/health"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8001,
        reload=settings.ENVIRONMENT == "development"
    )

