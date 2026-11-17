import time
import json
import asyncio
from typing import Any, Optional, Dict, Tuple


class FastCache:
    """
    High-performance in-memory TTL cache with namespace/prefix invalidation.
    Designed for fast read operations (<0.05ms) to eliminate repetitive DB round-trips
    for public catalogs, homepage listings, articles, and pricing packages.
    """

    def __init__(self):
        self._store: Dict[str, Tuple[float, Any]] = {}
        self._lock = asyncio.Lock()

    async def get(self, key: str) -> Optional[Any]:
        entry = self._store.get(key)
        if not entry:
            return None
        expires_at, value = entry
        if time.time() > expires_at:
            # Stale key, remove it asynchronously
            try:
                del self._store[key]
            except KeyError:
                pass
            return None
        return value

    async def set(self, key: str, value: Any, ttl_seconds: int = 60) -> None:
        expires_at = time.time() + ttl_seconds
        self._store[key] = (expires_at, value)

    async def delete(self, key: str) -> None:
        try:
            del self._store[key]
        except KeyError:
            pass

    async def invalidate_prefix(self, prefix: str) -> None:
        """Invalidate all keys starting with prefix (e.g. 'listings:', 'catalog:')."""
        keys_to_del = [k for k in self._store.keys() if k.startswith(prefix)]
        for k in keys_to_del:
            try:
                del self._store[k]
            except KeyError:
                pass

    async def clear(self) -> None:
        self._store.clear()


# Global singleton cache instance
fast_cache = FastCache()
