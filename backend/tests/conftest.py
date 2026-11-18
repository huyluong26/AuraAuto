import pytest
from app.core.database import async_engine

@pytest.fixture(autouse=True)
async def reset_engine_after_test():
    yield
    await async_engine.dispose()
