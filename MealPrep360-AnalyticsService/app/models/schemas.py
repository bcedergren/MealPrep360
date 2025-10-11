"""Pydantic models for analytics"""
from pydantic import BaseModel, Field
from typing import Dict
from datetime import datetime

class UserAnalytics(BaseModel):
    """User analytics response"""
    total_users: int
    new_users: int
    active_users: int
    by_subscription: Dict[str, int]
    growth_rate: float = Field(..., description="Percentage growth vs previous period")
    period_start: datetime
    period_end: datetime

class RecipeAnalytics(BaseModel):
    """Recipe analytics response"""
    total_recipes: int
    new_recipes: int
    public_recipes: int
    by_season: Dict[str, int]
    by_cuisine: Dict[str, int]
    by_category: Dict[str, int]
    avg_prep_time: float
    avg_cook_time: float
    period_start: datetime
    period_end: datetime

class DateRange(BaseModel):
    """Date range for queries"""
    start_date: datetime
    end_date: datetime

