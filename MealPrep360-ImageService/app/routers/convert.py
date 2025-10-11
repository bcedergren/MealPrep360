"""Image format conversion endpoints"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from loguru import logger

from app.services.image_processor import image_processor

router = APIRouter()

class ConvertRequest(BaseModel):
    image_data: str
    target_format: str = "webp"  # webp, png, jpeg
    quality: int = 85

@router.post("/format")
async def convert_format(request: ConvertRequest):
    """Convert image to different format"""
    try:
        result = await image_processor.convert_format(
            request.image_data,
            target_format=request.target_format,
            quality=request.quality
        )
        
        return {
            "converted_image": result,
            "format": request.target_format
        }
        
    except Exception as e:
        logger.error(f"Conversion error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

