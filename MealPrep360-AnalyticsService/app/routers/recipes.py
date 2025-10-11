"""Recipe analytics endpoints"""
from fastapi import APIRouter, HTTPException, Query
from datetime import datetime, timedelta
import pandas as pd
from loguru import logger

from app.core.database import db_manager
from app.models.schemas import RecipeAnalytics
from app.services.cache_service import cache_service

router = APIRouter()

@router.get("/overview", response_model=RecipeAnalytics)
async def get_recipe_analytics(
    start_date: datetime = Query(None),
    end_date: datetime = Query(None)
):
    """Get comprehensive recipe analytics"""
    try:
        # Default to last 30 days
        if not end_date:
            end_date = datetime.utcnow()
        if not start_date:
            start_date = end_date - timedelta(days=30)
        
        cache_key = f"recipe_analytics:{start_date.date()}:{end_date.date()}"
        cached = await cache_service.get(cache_key)
        if cached:
            return cached
        
        # Get recipes
        recipes_collection = db_manager.get_collection("recipes")
        recipes_list = await recipes_collection.find({}).to_list(length=100000)
        
        df = pd.DataFrame(recipes_list)
        
        if df.empty:
            return RecipeAnalytics(
                total_recipes=0,
                new_recipes=0,
                public_recipes=0,
                by_season={},
                by_cuisine={},
                by_category={},
                avg_prep_time=0.0,
                avg_cook_time=0.0,
                period_start=start_date,
                period_end=end_date
            )
        
        # Convert datetime columns
        df['createdAt'] = pd.to_datetime(df['createdAt'])
        
        # Calculate metrics
        total_recipes = len(df)
        new_recipes = len(df[
            (df['createdAt'] >= start_date) & 
            (df['createdAt'] <= end_date)
        ])
        public_recipes = len(df[df.get('isPublic', False) == True])
        
        # Breakdown by attributes
        by_season = df['season'].value_counts().to_dict() if 'season' in df.columns else {}
        by_cuisine = df['cuisine'].value_counts().to_dict() if 'cuisine' in df.columns else {}
        by_category = df['category'].value_counts().to_dict() if 'category' in df.columns else {}
        
        # Average times
        avg_prep_time = float(df['prepTime'].mean()) if 'prepTime' in df.columns else 0.0
        avg_cook_time = float(df['cookTime'].mean()) if 'cookTime' in df.columns else 0.0
        
        result = RecipeAnalytics(
            total_recipes=total_recipes,
            new_recipes=new_recipes,
            public_recipes=public_recipes,
            by_season=by_season,
            by_cuisine=by_cuisine,
            by_category=by_category,
            avg_prep_time=avg_prep_time,
            avg_cook_time=avg_cook_time,
            period_start=start_date,
            period_end=end_date
        )
        
        await cache_service.set(cache_key, result, ttl=300)
        
        return result
        
    except Exception as e:
        logger.error(f"Recipe analytics error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/popular")
async def get_popular_recipes(limit: int = Query(10, ge=1, le=100)):
    """Get most popular recipes"""
    try:
        recipes_collection = db_manager.get_collection("recipes")
        
        # Get recipes with view counts
        pipeline = [
            {"$match": {"isPublic": True}},
            {"$sort": {"views": -1}},  # Assuming you track views
            {"$limit": limit},
            {"$project": {
                "title": 1,
                "category": 1,
                "cuisine": 1,
                "views": 1,
                "saves": 1
            }}
        ]
        
        results = await recipes_collection.aggregate(pipeline).to_list(length=limit)
        
        return results
        
    except Exception as e:
        logger.error(f"Popular recipes error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/trends")
async def get_recipe_trends(days: int = Query(30)):
    """Get recipe creation trends"""
    try:
        recipes_collection = db_manager.get_collection("recipes")
        recipes_list = await recipes_collection.find({}).to_list(length=100000)
        
        df = pd.DataFrame(recipes_list)
        if df.empty:
            return []
        
        df['createdAt'] = pd.to_datetime(df['createdAt'])
        df['date'] = df['createdAt'].dt.date
        
        # Get trends
        daily = df.groupby('date').size()
        
        # Last N days
        end_date = datetime.utcnow().date()
        start_date = end_date - timedelta(days=days)
        
        result = []
        for date in pd.date_range(start=start_date, end=end_date, freq='D'):
            count = daily.get(date.date(), 0)
            result.append({
                "date": date.strftime('%Y-%m-%d'),
                "recipes_created": int(count)
            })
        
        return result
        
    except Exception as e:
        logger.error(f"Recipe trends error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

