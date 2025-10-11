"""Configuration"""
from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    ENVIRONMENT: str = "development"
    API_PORT: int = 8003
    ALLOWED_ORIGINS: List[str] = ["http://localhost:3000"]
    
    # USDA API (Free tier: 1000 requests/hour)
    USDA_API_KEY: str = "DEMO_KEY"  # Get free key at: https://fdc.nal.usda.gov/api-key-signup.html
    
    # MongoDB
    MONGODB_URI: str = "mongodb://localhost:27017"
    MONGODB_DB_NAME: str = "mealprep360"
    
    # Redis
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_DB: int = 4
    
    class Config:
        env_file = ".env"

settings = Settings()

