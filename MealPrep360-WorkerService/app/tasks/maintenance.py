"""Maintenance tasks"""
from celery import Task
from loguru import logger
from datetime import datetime, timedelta

from app.celery_app import app
from app.core.database import get_db

@app.task
def cleanup_old_jobs(days: int = 30):
    """Clean up completed/failed jobs older than N days"""
    try:
        db = get_db()
        
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        
        # Delete old completed jobs
        result = db.jobs.delete_many({
            "status": {"$in": ["completed", "failed"]},
            "updatedAt": {"$lt": cutoff_date}
        })
        
        logger.info(f"Cleaned up {result.deleted_count} old jobs")
        
        return {"deleted": result.deleted_count}
        
    except Exception as e:
        logger.error(f"Cleanup task failed: {e}")
        raise

@app.task
def cleanup_temp_files():
    """Clean up temporary files"""
    import os
    import glob
    
    temp_dir = "/tmp/mealprep360"
    if os.path.exists(temp_dir):
        files = glob.glob(f"{temp_dir}/*")
        for f in files:
            try:
                if os.path.isfile(f):
                    os.remove(f)
            except Exception as e:
                logger.error(f"Failed to delete {f}: {e}")
        
        logger.info(f"Cleaned up {len(files)} temp files")
    
    return {"cleaned": len(files) if 'files' in locals() else 0}

