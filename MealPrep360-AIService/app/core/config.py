"""Application configuration"""
from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    """Application settings"""
    
    # Environment
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    
    # OpenAI Configuration
    OPENAI_API_KEY: str
    OPENAI_MODEL: str = "gpt-4o"
    OPENAI_TEMPERATURE: float = 0.7
    OPENAI_MAX_TOKENS: int = 4000
    
    # OpenRouter (alternative)
    OPENROUTER_API_KEY: str | None = None
    USE_OPENROUTER: bool = False
    
    # API Configuration
    API_HOST: str = "0.0.0.0"
    API_PORT: int = 8000
    ALLOWED_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:3001"]
    
    # Redis Configuration
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_DB: int = 0
    REDIS_PASSWORD: str | None = None
    
    # Cache Settings
    CACHE_TTL: int = 604800  # 7 days in seconds
    ENABLE_CACHING: bool = True
    
    # Cost Tracking
    ENABLE_COST_TRACKING: bool = True
    COST_ALERT_THRESHOLD: float = 100.0  # Alert if daily cost exceeds $100
    
    # Rate Limiting
    RATE_LIMIT_REQUESTS: int = 100
    RATE_LIMIT_WINDOW: int = 60  # seconds
    
    # Monitoring
    ENABLE_METRICS: bool = True
    LOG_LEVEL: str = "INFO"
    
    # Model Pricing (per 1M tokens)
    GPT4_INPUT_PRICE: float = 30.0
    GPT4_OUTPUT_PRICE: float = 60.0
    GPT4O_INPUT_PRICE: float = 5.0
    GPT4O_OUTPUT_PRICE: float = 15.0
    GPT4O_MINI_INPUT_PRICE: float = 0.15
    GPT4O_MINI_OUTPUT_PRICE: float = 0.60
    DALLE3_PRICE: float = 0.040  # per image (1024x1024)
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()

