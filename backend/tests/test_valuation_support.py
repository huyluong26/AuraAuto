from unittest.mock import AsyncMock, MagicMock, patch

from app.modules.ai.schemas import ValuationRequest
from app.modules.ai.service import AIService
from ml_training.preprocess import extract_variant


def run_immediate(coroutine):
    """Drive this fully mocked coroutine without opening an event-loop socket."""
    try:
        coroutine.send(None)
    except StopIteration as completed:
        return completed.value
    raise AssertionError("Mocked valuation unexpectedly suspended")


def test_supported_and_unsupported_valuation():
    db = AsyncMock()
    db.execute.return_value = MagicMock(all=lambda: [])
    service = AIService(db)
    assert extract_variant("Toyota", "Vios", "Toyota Vios 1.5G CVT") == "G CVT"
    with (
        patch("app.modules.ai.service.gemini_client.explain_valuation", new_callable=AsyncMock) as explain,
        patch("app.modules.ai.service.gemini_client.research_market_valuation", new_callable=AsyncMock) as research,
        patch("app.modules.ai.service.asyncio.to_thread", new_callable=AsyncMock) as to_thread,
    ):
        explain.return_value = None
        research.return_value = None
        to_thread.side_effect = lambda func: func()
        supported = run_immediate(service.estimate_valuation(ValuationRequest(
            brand="Toyota", model="Vios", variant="G CVT", manufacture_year=2022,
            odometer_km=30000, body_type="SEDAN", engine_displacement=1.5)))
        assert supported.status == "PREDICTED"
        assert supported.model_version == "3.0.0"
        assert supported.interval_low_vnd < supported.estimated_price_vnd < supported.interval_high_vnd
        assert supported.reference_count >= 10
        fallback = run_immediate(service.estimate_valuation(ValuationRequest(
            brand="UnseenBrand", model="UnseenCar", manufacture_year=2022, odometer_km=30000)))
        assert fallback.status == "PREDICTED"
        assert fallback.estimated_price_vnd > 0
        assert fallback.confidence_level == "LOW"
        assert fallback.reason
        assert explain.await_count == 2


def test_valuation_uses_only_the_trained_model():
    db = AsyncMock()
    db.execute.return_value = MagicMock(all=lambda: [])
    service = AIService(db)
    request = ValuationRequest(brand="Toyota", model="Vios", variant="G CVT",
        manufacture_year=2022, odometer_km=30000, body_type="SEDAN", engine_displacement=1.5)
    with (
        patch("app.modules.ai.service.gemini_client.research_market_valuation", new_callable=AsyncMock) as research,
        patch("app.modules.ai.service.asyncio.to_thread", new_callable=AsyncMock) as to_thread,
    ):
        to_thread.side_effect = lambda func: func()
        result = run_immediate(service.estimate_valuation(request))
    assert result.status == "PREDICTED"
    assert result.pricing_method == "ML_ONLY"
    assert result.ml_price_vnd == result.estimated_price_vnd
    assert result.gemini_market_price_vnd is None
    assert result.market_sources == []
    research.assert_not_awaited()
