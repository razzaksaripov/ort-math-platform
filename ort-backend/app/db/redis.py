"""
Async Redis client wrapper — connects to redis:7-alpine in Docker.
Used for caching topics, questions, and session data.
"""

import json
from typing import Any, Optional

import redis.asyncio as aioredis

from app.core.config import settings


class RedisClient:
    def __init__(self) -> None:
        self._redis: Optional[aioredis.Redis] = None

    async def initialize(self) -> None:
        self._redis = aioredis.from_url(
            settings.REDIS_URL,
            encoding="utf-8",
            decode_responses=True,
            max_connections=20,
        )

    async def close(self) -> None:
        if self._redis:
            await self._redis.close()

    @property
    def client(self) -> aioredis.Redis:
        if self._redis is None:
            raise RuntimeError("Redis not initialized — call initialize() first")
        return self._redis

    async def get(self, key: str) -> Optional[Any]:
        raw = await self.client.get(key)
        return json.loads(raw) if raw else None

    async def set(self, key: str, value: Any, ttl: int = settings.REDIS_CACHE_TTL) -> None:
        await self.client.set(key, json.dumps(value, default=str), ex=ttl)

    async def delete(self, key: str) -> None:
        await self.client.delete(key)

    async def delete_pattern(self, pattern: str) -> None:
        keys: list[str] = []
        async for key in self.client.scan_iter(match=pattern):
            keys.append(key)
        if keys:
            await self.client.delete(*keys)

    async def ping(self) -> bool:
        try:
            return await self.client.ping()
        except Exception:
            return False


redis_client = RedisClient()
