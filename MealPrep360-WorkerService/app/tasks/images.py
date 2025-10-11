"""Image processing background tasks"""
from celery import Task
from loguru import logger
import httpx

from app.celery_app import app
from app.core.database import get_db

@app.task(bind=True, max_retries=2)
def process_recipes_without_images(self):
    """Find recipes without images and generate them"""
    try:
        db = get_db()
        
        # Find recipes without images
        recipes = list(db.recipes.find(
            {"$or": [
                {"hasImage": False},
                {"imageUrl": {"$exists": False}},
                {"imageUrl": None}
            ]},
            limit=50  # Process 50 per run
        ))
        
        logger.info(f"Found {len(recipes)} recipes without images")
        
        processed = 0
        failed = 0
        
        for recipe in recipes:
            try:
                # Call AI service to generate image
                with httpx.Client(timeout=60.0) as client:
                    response = client.post(
                        "http://ai-service:8000/api/images/generate",
                        json={
                            "recipe_title": recipe['title'],
                            "recipe_description": recipe.get('description', '')
                        }
                    )
                    image_data = response.json()
                
                # Update recipe with image
                db.recipes.update_one(
                    {"_id": recipe['_id']},
                    {"$set": {
                        "imageUrl": image_data['url'],
                        "hasImage": True,
                        "updatedAt": datetime.utcnow()
                    }}
                )
                
                processed += 1
                logger.info(f"Generated image for: {recipe['title']}")
                
            except Exception as e:
                failed += 1
                logger.error(f"Failed to generate image for {recipe['title']}: {e}")
        
        return {
            "processed": processed,
            "failed": failed,
            "total": len(recipes)
        }
        
    except Exception as exc:
        logger.error(f"Image processing task failed: {exc}")
        raise self.retry(exc=exc, countdown=300)  # Retry after 5 mins

@app.task(bind=True)
def batch_optimize_images(self, recipe_ids: list):
    """Optimize images for multiple recipes"""
    try:
        db = get_db()
        
        # Get recipes
        recipes = list(db.recipes.find({"_id": {"$in": recipe_ids}}))
        
        # Get all images
        images = [r.get('imageUrl') for r in recipes if r.get('imageUrl')]
        
        if not images:
            return {"processed": 0}
        
        # Call image service for batch optimization
        with httpx.Client(timeout=120.0) as client:
            response = client.post(
                "http://image-service:8002/api/batch/process",
                json={"images": images, "quality": 85}
            )
            results = response.json()
        
        # Update recipes with optimized images
        for recipe, optimized in zip(recipes, results['results']):
            db.recipes.update_one(
                {"_id": recipe['_id']},
                {"$set": {
                    "imageUrl": optimized['main'],
                    "images": {
                        "main": optimized['main'],
                        "thumbnail": optimized['thumbnail'],
                        "mobile": optimized['mobile']
                    }
                }}
            )
        
        return results
        
    except Exception as exc:
        logger.error(f"Batch optimization failed: {exc}")
        raise

