"""Recipe-related background tasks"""
from celery import Task
from loguru import logger
import httpx
from datetime import datetime

from app.celery_app import app
from app.core.database import get_db

class RecipeTask(Task):
    """Base task with progress tracking"""
    def on_success(self, retval, task_id, args, kwargs):
        logger.info(f"Task {task_id} completed successfully")
    
    def on_failure(self, exc, task_id, args, kwargs, einfo):
        logger.error(f"Task {task_id} failed: {exc}")

@app.task(base=RecipeTask, bind=True, max_retries=3)
def generate_recipe_batch(self, season: str, count: int, job_id: str):
    """
    Generate multiple recipes in background
    No time limits!
    """
    try:
        logger.info(f"Starting batch generation: {count} recipes for {season}")
        
        # Update job status
        db = get_db()
        db.jobs.update_one(
            {"_id": job_id},
            {"$set": {"status": "processing", "progress": 0, "total": count}}
        )
        
        generated = []
        failed = 0
        
        for i in range(count):
            try:
                # Call AI service
                with httpx.Client(timeout=60.0) as client:
                    response = client.post(
                        "http://ai-service:8000/api/recipes/generate",
                        json={"season": season, "servings": 6}
                    )
                    recipe_data = response.json()
                    recipe = recipe_data['recipe']
                
                # Save to database
                db.recipes.insert_one({
                    **recipe,
                    "jobId": job_id,
                    "createdAt": datetime.utcnow(),
                    "updatedAt": datetime.utcnow()
                })
                
                generated.append(recipe['title'])
                
                # Update progress
                progress = i + 1
                self.update_state(
                    state='PROGRESS',
                    meta={'current': progress, 'total': count}
                )
                
                db.jobs.update_one(
                    {"_id": job_id},
                    {"$set": {"progress": progress}}
                )
                
                logger.info(f"Generated recipe {progress}/{count}: {recipe['title']}")
                
            except Exception as e:
                logger.error(f"Failed to generate recipe {i+1}: {e}")
                failed += 1
                
                if failed > count * 0.5:  # More than 50% failed
                    raise Exception(f"Too many failures: {failed}/{count}")
        
        # Complete job
        db.jobs.update_one(
            {"_id": job_id},
            {"$set": {
                "status": "completed",
                "completedAt": datetime.utcnow(),
                "data.recipesGenerated": len(generated),
                "data.recipesFailed": failed
            }}
        )
        
        logger.info(f"Batch complete: {len(generated)} generated, {failed} failed")
        
        return {
            "generated": len(generated),
            "failed": failed,
            "recipes": generated
        }
        
    except Exception as exc:
        # Retry with exponential backoff
        db.jobs.update_one(
            {"_id": job_id},
            {"$set": {"status": "failed", "error": str(exc)}}
        )
        raise self.retry(exc=exc, countdown=60 * (self.request.retries + 1))

@app.task
def generate_daily_recipes():
    """Scheduled task: Generate recipes daily"""
    import random
    seasons = ['spring', 'summer', 'fall', 'winter']
    season = random.choice(seasons)
    
    logger.info(f"Daily recipe generation starting for {season}")
    
    # Create job
    db = get_db()
    job_id = f"daily_{datetime.utcnow().strftime('%Y%m%d')}"
    
    db.jobs.insert_one({
        "_id": job_id,
        "type": "daily_generation",
        "status": "pending",
        "createdAt": datetime.utcnow()
    })
    
    # Trigger batch generation
    generate_recipe_batch.delay(season, 10, job_id)

