"""User analytics endpoints"""
from fastapi import APIRouter, HTTPException, Query
from datetime import datetime, timedelta
import pandas as pd
from loguru import logger

from app.core.database import db_manager
from app.models.schemas import UserAnalytics, DateRange
from app.services.cache_service import cache_service

router = APIRouter()

@router.get("/overview", response_model=UserAnalytics)
async def get_user_analytics(
    start_date: datetime = Query(None),
    end_date: datetime = Query(None)
):
    """Get comprehensive user analytics"""
    try:
        # Default to last 30 days
        if not end_date:
            end_date = datetime.utcnow()
        if not start_date:
            start_date = end_date - timedelta(days=30)
        
        # Check cache
        cache_key = f"user_analytics:{start_date.date()}:{end_date.date()}"
        cached = await cache_service.get(cache_key)
        if cached:
            return cached
        
        # Get users collection
        users_collection = db_manager.get_collection("users")
        
        # Fetch all users (or use aggregation for large datasets)
        users_cursor = users_collection.find({})
        users_list = await users_cursor.to_list(length=100000)
        
        # Convert to pandas DataFrame
        df = pd.DataFrame(users_list)
        
        if df.empty:
            return UserAnalytics(
                total_users=0,
                new_users=0,
                active_users=0,
                by_subscription={},
                growth_rate=0.0,
                period_start=start_date,
                period_end=end_date
            )
        
        # Ensure datetime columns
        df['createdAt'] = pd.to_datetime(df['createdAt'])
        if 'lastActive' in df.columns:
            df['lastActive'] = pd.to_datetime(df['lastActive'])
        
        # Calculate metrics
        total_users = len(df)
        new_users = len(df[
            (df['createdAt'] >= start_date) & 
            (df['createdAt'] <= end_date)
        ])
        
        # Active users (last 7 days)
        week_ago = datetime.utcnow() - timedelta(days=7)
        active_users = len(df[df['lastActive'] >= week_ago]) if 'lastActive' in df.columns else 0
        
        # Subscription breakdown
        subscription_col = 'subscription.plan' if 'subscription.plan' in df.columns else 'subscription'
        by_subscription = {}
        if 'subscription' in df.columns:
            # Handle nested subscription data
            subs = df['subscription'].apply(lambda x: x.get('plan', 'free') if isinstance(x, dict) else 'free')
            by_subscription = subs.value_counts().to_dict()
        
        # Growth rate (vs previous period)
        prev_start = start_date - (end_date - start_date)
        prev_users = len(df[
            (df['createdAt'] >= prev_start) & 
            (df['createdAt'] < start_date)
        ])
        growth_rate = ((new_users - prev_users) / prev_users * 100) if prev_users > 0 else 0.0
        
        result = UserAnalytics(
            total_users=total_users,
            new_users=new_users,
            active_users=active_users,
            by_subscription=by_subscription,
            growth_rate=growth_rate,
            period_start=start_date,
            period_end=end_date
        )
        
        # Cache for 5 minutes
        await cache_service.set(cache_key, result, ttl=300)
        
        logger.info(f"User analytics calculated: {total_users} total, {new_users} new")
        
        return result
        
    except Exception as e:
        logger.error(f"User analytics error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/growth")
async def get_user_growth(days: int = Query(30, ge=7, le=365)):
    """Get daily user growth over time"""
    try:
        users_collection = db_manager.get_collection("users")
        users_list = await users_collection.find({}).to_list(length=100000)
        
        df = pd.DataFrame(users_list)
        if df.empty:
            return []
        
        df['createdAt'] = pd.to_datetime(df['createdAt'])
        
        # Group by date
        df['date'] = df['createdAt'].dt.date
        daily_counts = df.groupby('date').size()
        
        # Get last N days
        end_date = datetime.utcnow().date()
        start_date = end_date - timedelta(days=days)
        
        # Create full date range
        date_range = pd.date_range(start=start_date, end=end_date, freq='D')
        result = []
        
        for date in date_range:
            count = daily_counts.get(date.date(), 0)
            result.append({
                "date": date.strftime('%Y-%m-%d'),
                "new_users": int(count)
            })
        
        return result
        
    except Exception as e:
        logger.error(f"User growth error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

