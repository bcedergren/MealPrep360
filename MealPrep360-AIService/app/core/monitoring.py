"""Monitoring middleware"""
from fastapi import Request
from loguru import logger
import time

async def metrics_middleware(request: Request, call_next):
    """Track request metrics"""
    start_time = time.time()
    
    response = await call_next(request)
    
    duration = time.time() - start_time
    
    logger.info(
        f"{request.method} {request.url.path} "
        f"completed in {duration:.3f}s "
        f"with status {response.status_code}"
    )
    
    return response

