"""Configuration"""
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    ENVIRONMENT: str = "development"
    
    # Redis
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_DB: int = 3
    REDIS_PASSWORD: str | None = None
    
    # MongoDB
    MONGODB_URI: str
    MONGODB_DB_NAME: str = "mealprep360"
    
    # Service URLs
    AI_SERVICE_URL: str = "http://ai-service:8000"
    IMAGE_SERVICE_URL: str = "http://image-service:8002"
    
    class Config:
        env_file = ".env"

settings = Settings()

