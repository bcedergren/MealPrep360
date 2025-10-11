"""Image optimization endpoints"""
from fastapi import APIRouter, HTTPException, UploadFile, File
from pydantic import BaseModel
from typing import Optional
import base64

from app.services.image_processor import image_processor

router = APIRouter()

class ImageRequest(BaseModel):
    image_data: str
    quality: int = 85
    max_width: int = 1024
    max_height: int = 1024

class ImageResponse(BaseModel):
    main: str
    thumbnail: str
    mobile: str
    original_size: tuple
    savings_percent: float

@router.post("/optimize", response_model=ImageResponse)
async def optimize_image(request: ImageRequest):
    """
    Optimize a single image
    Returns main, thumbnail, and mobile versions
    """
    try:
        result = await image_processor.optimize_image(
            request.image_data,
            quality=request.quality,
            max_size=(request.max_width, request.max_height)
        )
        
        # Calculate savings
        original_size = len(request.image_data)
        optimized_size = len(result['main'])
        savings = ((original_size - optimized_size) / original_size * 100) if original_size > 0 else 0
        
        return ImageResponse(
            main=result['main'],
            thumbnail=result['thumbnail'],
            mobile=result['mobile'],
            original_size=result['original_size'],
            savings_percent=savings
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/upload")
async def upload_and_optimize(file: UploadFile = File(...)):
    """Upload and optimize an image file"""
    try:
        # Read file
        contents = await file.read()
        img_base64 = base64.b64encode(contents).decode()
        img_data = f"data:image/jpeg;base64,{img_base64}"
        
        # Process
        result = await image_processor.optimize_image(img_data)
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

