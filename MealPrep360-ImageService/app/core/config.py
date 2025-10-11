"""Configuration"""
from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    ENVIRONMENT: str = "development"
    API_PORT: int = 8002
    ALLOWED_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:3001"]
    
    # Redis
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_DB: int = 2
    REDIS_PASSWORD: str | None = None
    
    class Config:
        env_file = ".env"

settings = Settings()

