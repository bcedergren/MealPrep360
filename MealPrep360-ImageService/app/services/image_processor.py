"""Image processing service using Pillow"""
from PIL import Image, ImageEnhance, ImageFilter
import io
import base64
from typing import Tuple, List
from loguru import logger

class ImageProcessor:
    """High-performance image processing"""
    
    async def optimize_image(
        self,
        image_data: str,
        quality: int = 85,
        max_size: Tuple[int, int] = (1024, 1024)
    ) -> dict:
        """
        Optimize a single image
        Returns main, thumbnail, and mobile versions
        """
        try:
            # Decode base64
            img_bytes = base64.b64decode(image_data.split(',')[1] if ',' in image_data else image_data)
            img = Image.open(io.BytesIO(img_bytes))
            
            # Convert to RGB if necessary
            if img.mode in ('RGBA', 'P'):
                img = img.convert('RGB')
            
            # Generate multiple sizes
            return {
                "main": self._process_image(img, (1024, 1024), quality=85),
                "thumbnail": self._process_image(img, (300, 300), quality=70),
                "mobile": self._process_image(img, (640, 640), quality=75),
                "original_size": img.size,
                "optimized": True
            }
            
        except Exception as e:
            logger.error(f"Image optimization error: {e}")
            raise
    
    async def batch_optimize(
        self,
        images: List[str],
        quality: int = 85
    ) -> List[dict]:
        """
        Optimize multiple images concurrently
        """
        import asyncio
        
        tasks = [self.optimize_image(img, quality) for img in images]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Filter out errors
        successful = [r for r in results if not isinstance(r, Exception)]
        failed = len([r for r in results if isinstance(r, Exception)])
        
        logger.info(f"Batch processed {len(successful)} images, {failed} failed")
        
        return successful
    
    def _process_image(
        self,
        img: Image.Image,
        size: Tuple[int, int],
        quality: int
    ) -> str:
        """Process and encode image"""
        # Resize maintaining aspect ratio
        img_copy = img.copy()
        img_copy.thumbnail(size, Image.Resampling.LANCZOS)
        
        # Enhance slightly
        enhancer = ImageEnhance.Sharpness(img_copy)
        img_copy = enhancer.enhance(1.1)
        
        # Save to buffer
        buffer = io.BytesIO()
        img_copy.save(buffer, format='JPEG', quality=quality, optimize=True, progressive=True)
        
        # Encode to base64
        img_base64 = base64.b64encode(buffer.getvalue()).decode()
        return f"data:image/jpeg;base64,{img_base64}"
    
    async def convert_format(
        self,
        image_data: str,
        target_format: str = "webp",
        quality: int = 85
    ) -> str:
        """Convert image to different format (WebP, PNG, etc)"""
        try:
            img_bytes = base64.b64decode(image_data.split(',')[1] if ',' in image_data else image_data)
            img = Image.open(io.BytesIO(img_bytes))
            
            if img.mode in ('RGBA', 'P') and target_format.lower() != 'png':
                img = img.convert('RGB')
            
            buffer = io.BytesIO()
            
            if target_format.lower() == 'webp':
                img.save(buffer, format='WEBP', quality=quality, method=6)
                mime = "image/webp"
            elif target_format.lower() == 'png':
                img.save(buffer, format='PNG', optimize=True)
                mime = "image/png"
            else:  # JPEG
                img.save(buffer, format='JPEG', quality=quality, optimize=True)
                mime = "image/jpeg"
            
            img_base64 = base64.b64encode(buffer.getvalue()).decode()
            return f"data:{mime};base64,{img_base64}"
            
        except Exception as e:
            logger.error(f"Format conversion error: {e}")
            raise

# Singleton
image_processor = ImageProcessor()

