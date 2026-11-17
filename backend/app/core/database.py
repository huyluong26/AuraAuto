import os
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import declarative_base

from app.core.config import settings

# Engine configuration: disable SQL stdout echo by default to avoid blocking Python async loop
sql_echo = os.getenv("SQL_ECHO", "false").lower() in ("true", "1", "yes")
engine_kwargs = {
    "echo": sql_echo,
    "future": True,
}

# If PostgreSQL, set optimized pool options for cloud/Neon database
if "postgresql" in settings.DATABASE_URL:
    engine_kwargs.update({
        "pool_size": 20,
        "max_overflow": 30,
        "pool_recycle": 300,
        "pool_timeout": 15,
        "pool_pre_ping": True,
    })

# If Neon or PgBouncer pooler is used, disable asyncpg prepared statement caching to support transaction pooling
if "neon.tech" in settings.DATABASE_URL or "pooler" in settings.DATABASE_URL:
    engine_kwargs["connect_args"] = {
        "statement_cache_size": 0,
        "prepared_statement_cache_size": 0,
    }

async_engine = create_async_engine(settings.DATABASE_URL, **engine_kwargs)

AsyncSessionLocal = async_sessionmaker(
    bind=async_engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
    autocommit=False,
)

Base = declarative_base()


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Dependency that provides an async database session per request."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
