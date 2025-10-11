"""Application configuration"""
from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    """Application settings"""
    
    # Environment
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    
    # MongoDB Configuration
    MONGODB_URI: str
    MONGODB_DB_NAME: str = "mealprep360"
    
    # Redis Configuration
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_DB: int = 1  # Different from AI service
    REDIS_PASSWORD: str | None = None
    
    # API Configuration
    API_HOST: str = "0.0.0.0"
    API_PORT: int = 8001
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:3003"
    ]
    
    # Cache Settings
    CACHE_TTL: int = 300  # 5 minutes for analytics
    ENABLE_CACHING: bool = True
    
    # Analytics Settings
    DEFAULT_DATE_RANGE_DAYS: int = 30
    MAX_EXPORT_ROWS: int = 10000
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()

