"""Redis connection and caching utilities."""
from typing import Any, Optional
import redis.asyncio as redis
from app.config import get_settings
from app.utils import get_logger


logger = get_logger(__name__)

_redis_client = None


async def init_redis() -> None:
    """Initialize Redis connection."""
    global _redis_client
    
    settings = get_settings()
    
    _redis_client = await redis.from_url(
        settings.REDIS_URL,
        db=settings.REDIS_DB,
        encoding=settings.REDIS_ENCODING,
        decode_responses=settings.REDIS_DECODE_RESPONSES,
    )
    
    try:
        await _redis_client.ping()
        logger.info("Redis connected successfully")
    except Exception as e:
        logger.error(f"Redis connection error: {e}")
        raise


async def close_redis() -> None:
    """Close Redis connection."""
    global _redis_client
    
    if _redis_client:
        await _redis_client.close()
        logger.info("Redis connection closed")


async def get_redis() -> redis.Redis:
    """Get Redis client."""
    if not _redis_client:
        raise RuntimeError("Redis not initialized")
    return _redis_client


async def cache_get(key: str) -> Optional[Any]:
    """Get value from cache."""
    try:
        redis_client = await get_redis()
        return await redis_client.get(key)
    except Exception as e:
        logger.error(f"Cache get error: {e}")
        return None


async def cache_set(key: str, value: Any, ttl: int = 3600) -> bool:
    """Set value in cache with TTL."""
    try:
        redis_client = await get_redis()
        await redis_client.setex(key, ttl, str(value))
        return True
    except Exception as e:
        logger.error(f"Cache set error: {e}")
        return False


async def cache_delete(key: str) -> bool:
    """Delete value from cache."""
    try:
        redis_client = await get_redis()
        await redis_client.delete(key)
        return True
    except Exception as e:
        logger.error(f"Cache delete error: {e}")
        return False


async def cache_clear_pattern(pattern: str) -> int:
    """Clear cache by pattern."""
    try:
        redis_client = await get_redis()
        keys = await redis_client.keys(pattern)
        if keys:
            return await redis_client.delete(*keys)
        return 0
    except Exception as e:
        logger.error(f"Cache clear error: {e}")
        return 0
