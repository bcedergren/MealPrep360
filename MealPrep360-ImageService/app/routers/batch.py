"""Batch image processing endpoints"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List
from loguru import logger

from app.services.image_processor import image_processor

router = APIRouter()

class BatchImageRequest(BaseModel):
    images: List[str]
    quality: int = 85

class BatchImageResponse(BaseModel):
    results: List[dict]
    total_processed: int
    total_failed: int

@router.post("/process", response_model=BatchImageResponse)
async def batch_process_images(request: BatchImageRequest):
    """
    Process multiple images concurrently
    Much faster than sequential processing
    """
    try:
        logger.info(f"Starting batch processing of {len(request.images)} images")
        
        results = await image_processor.batch_optimize(
            request.images,
            quality=request.quality
        )
        
        total_processed = len(results)
        total_failed = len(request.images) - total_processed
        
        logger.info(f"Batch complete: {total_processed} successful, {total_failed} failed")
        
        return BatchImageResponse(
            results=results,
            total_processed=total_processed,
            total_failed=total_failed
        )
        
    except Exception as e:
        logger.error(f"Batch processing error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

