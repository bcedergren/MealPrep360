"""OpenAI service with cost tracking and type safety"""
import instructor
from openai import AsyncOpenAI
from loguru import logger
import time
from typing import Type, TypeVar, Optional
import asyncio
from functools import wraps

from app.core.config import settings
from app.services.cost_tracker import cost_tracker
from app.services.cache_service import cache_service

T = TypeVar('T')

class OpenAIService:
    """Centralized OpenAI service with automatic cost tracking"""
    
    def __init__(self):
        """Initialize OpenAI client with instructor for type safety"""
        if settings.USE_OPENROUTER and settings.OPENROUTER_API_KEY:
            self.client = instructor.patch(
                AsyncOpenAI(
                    api_key=settings.OPENROUTER_API_KEY,
                    base_url="https://openrouter.ai/api/v1"
                )
            )
            logger.info("Using OpenRouter API")
        else:
            self.client = instructor.patch(
                AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
            )
            logger.info("Using OpenAI API")
        
        self.semaphore = asyncio.Semaphore(settings.RATE_LIMIT_REQUESTS)
    
    async def generate_structured_response(
        self,
        response_model: Type[T],
        messages: list,
        model: Optional[str] = None,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
        endpoint: str = "unknown",
        cache_key: Optional[str] = None
    ) -> tuple[T, float]:
        """
        Generate structured response with automatic cost tracking
        
        Args:
            response_model: Pydantic model for response validation
            messages: List of chat messages
            model: Model to use (defaults to settings.OPENAI_MODEL)
            temperature: Temperature setting
            max_tokens: Max tokens to generate
            endpoint: Endpoint name for tracking
            cache_key: Optional cache key
            
        Returns:
            Tuple of (response_object, cost_in_usd)
        """
        # Check cache first
        if cache_key and settings.ENABLE_CACHING:
            cached = await cache_service.get(cache_key)
            if cached:
                logger.info(f"Cache hit for {cache_key}")
                return cached, 0.0
        
        # Rate limiting
        async with self.semaphore:
            start_time = time.time()
            
            try:
                # Call OpenAI with type-safe response
                response = await self.client.chat.completions.create(
                    model=model or settings.OPENAI_MODEL,
                    messages=messages,
                    response_model=response_model,
                    temperature=temperature or settings.OPENAI_TEMPERATURE,
                    max_tokens=max_tokens or settings.OPENAI_MAX_TOKENS,
                )
                
                generation_time = time.time() - start_time
                
                # Track cost (using litellm for accurate pricing)
                cost = await self._calculate_cost(
                    model or settings.OPENAI_MODEL,
                    response._raw_response
                )
                
                # Log metrics
                await cost_tracker.track_request(
                    endpoint=endpoint,
                    model=model or settings.OPENAI_MODEL,
                    input_tokens=response._raw_response.usage.prompt_tokens,
                    output_tokens=response._raw_response.usage.completion_tokens,
                    cost=cost,
                    duration=generation_time
                )
                
                logger.info(
                    f"Generated {endpoint} response in {generation_time:.2f}s "
                    f"(cost: ${cost:.4f}, tokens: {response._raw_response.usage.total_tokens})"
                )
                
                # Cache result
                if cache_key and settings.ENABLE_CACHING:
                    await cache_service.set(cache_key, response, ttl=settings.CACHE_TTL)
                
                return response, cost
                
            except Exception as e:
                logger.error(f"OpenAI API error: {e}")
                raise
    
    async def _calculate_cost(self, model: str, response) -> float:
        """Calculate cost based on model and token usage"""
        input_tokens = response.usage.prompt_tokens
        output_tokens = response.usage.completion_tokens
        
        # Get pricing based on model
        if "gpt-4o-mini" in model:
            input_price = settings.GPT4O_MINI_INPUT_PRICE
            output_price = settings.GPT4O_MINI_OUTPUT_PRICE
        elif "gpt-4o" in model:
            input_price = settings.GPT4O_INPUT_PRICE
            output_price = settings.GPT4O_OUTPUT_PRICE
        elif "gpt-4" in model:
            input_price = settings.GPT4_INPUT_PRICE
            output_price = settings.GPT4_OUTPUT_PRICE
        else:
            # Default to GPT-4o pricing
            input_price = settings.GPT4O_INPUT_PRICE
            output_price = settings.GPT4O_OUTPUT_PRICE
        
        # Calculate cost (price is per 1M tokens)
        input_cost = (input_tokens / 1_000_000) * input_price
        output_cost = (output_tokens / 1_000_000) * output_price
        
        return input_cost + output_cost
    
    async def generate_image(
        self,
        prompt: str,
        size: str = "1024x1024",
        quality: str = "standard",
        cache_key: Optional[str] = None
    ) -> tuple[str, str, float]:
        """
        Generate image with DALL-E
        
        Returns:
            Tuple of (image_url, revised_prompt, cost)
        """
        # Check cache
        if cache_key and settings.ENABLE_CACHING:
            cached = await cache_service.get(cache_key)
            if cached:
                return cached[0], cached[1], 0.0
        
        try:
            # Use raw OpenAI client (not instructor-patched) for images
            raw_client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
            
            response = await raw_client.images.generate(
                model="dall-e-3",
                prompt=prompt,
                size=size,
                quality=quality,
                n=1
            )
            
            url = response.data[0].url
            revised_prompt = response.data[0].revised_prompt or prompt
            cost = settings.DALLE3_PRICE
            
            # Track cost
            await cost_tracker.track_request(
                endpoint="image_generation",
                model="dall-e-3",
                input_tokens=0,
                output_tokens=0,
                cost=cost,
                duration=0
            )
            
            # Cache result
            if cache_key and settings.ENABLE_CACHING:
                await cache_service.set(
                    cache_key,
                    (url, revised_prompt, cost),
                    ttl=settings.CACHE_TTL
                )
            
            logger.info(f"Generated image (cost: ${cost:.4f})")
            
            return url, revised_prompt, cost
            
        except Exception as e:
            logger.error(f"Image generation error: {e}")
            raise

# Singleton instance
openai_service = OpenAIService()

