"""System analytics endpoints"""
from fastapi import APIRouter, HTTPException
import pandas as pd
from loguru import logger
from datetime import datetime

from app.core.database import db_manager

router = APIRouter()

@router.get("/overview")
async def get_system_overview():
    """Get system-wide statistics"""
    try:
        # Get counts from all collections
        users_count = await db_manager.get_collection("users").count_documents({})
        recipes_count = await db_manager.get_collection("recipes").count_documents({})
        
        # Try to get other collections (may not exist)
        try:
            meal_plans_count = await db_manager.get_collection("mealplans").count_documents({})
        except:
            meal_plans_count = 0
        
        try:
            posts_count = await db_manager.get_collection("posts").count_documents({})
        except:
            posts_count = 0
        
        try:
            jobs_collection = db_manager.get_collection("jobs")
            total_jobs = await jobs_collection.count_documents({})
            completed_jobs = await jobs_collection.count_documents({"status": "completed"})
            failed_jobs = await jobs_collection.count_documents({"status": "failed"})
            pending_jobs = await jobs_collection.count_documents({"status": "pending"})
        except:
            total_jobs = completed_jobs = failed_jobs = pending_jobs = 0
        
        return {
            "timestamp": datetime.utcnow(),
            "collections": {
                "users": users_count,
                "recipes": recipes_count,
                "meal_plans": meal_plans_count,
                "posts": posts_count
            },
            "jobs": {
                "total": total_jobs,
                "completed": completed_jobs,
                "failed": failed_jobs,
                "pending": pending_jobs,
                "success_rate": (completed_jobs / total_jobs * 100) if total_jobs > 0 else 0
            }
        }
        
    except Exception as e:
        logger.error(f"System overview error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/database-stats")
async def get_database_stats():
    """Get database statistics"""
    try:
        # Get database stats using MongoDB commands
        stats = await db_manager.db.command("dbStats")
        
        return {
            "database": stats.get("db"),
            "collections": stats.get("collections"),
            "data_size_mb": stats.get("dataSize", 0) / (1024 * 1024),
            "storage_size_mb": stats.get("storageSize", 0) / (1024 * 1024),
            "indexes": stats.get("indexes"),
            "index_size_mb": stats.get("indexSize", 0) / (1024 * 1024)
        }
        
    except Exception as e:
        logger.error(f"Database stats error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

