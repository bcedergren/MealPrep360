"""
MealPrep360 Image Processing Service
High-performance image optimization with Pillow
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from loguru import logger
import sys

from app.core.config import settings
from app.routers import optimize, batch, convert

# Configure logging
logger.remove()
logger.add(sys.stdout, level="INFO")

app = FastAPI(
    title="MealPrep360 Image Service",
    description="High-performance image processing and optimization",
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
app.include_router(optimize.router, prefix="/api/images", tags=["optimize"])
app.include_router(batch.router, prefix="/api/batch", tags=["batch"])
app.include_router(convert.router, prefix="/api/convert", tags=["convert"])

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "image-processing",
        "version": "1.0.0"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8002, reload=True)

