from app.modules.ai.gemini_client import GeminiClient


def run_immediate(coroutine):
    try:
        coroutine.send(None)
    except StopIteration as completed:
        return completed.value
    raise AssertionError("Local explanation unexpectedly suspended")


def test_rule_based_natural_search_parser():
    client = GeminiClient()

    # Test 1: SUV dưới 700 triệu đời từ 2021
    res1 = client._fallback_rule_based_parse("Tìm xe SUV 5 chỗ dưới 700 triệu đời từ 2021")
    assert res1.body_type == "SUV"
    assert res1.max_price_vnd == 700_000_000
    assert res1.min_year == 2021

    # Test 2: Bán tải Ford tầm 1 tỷ
    res2 = client._fallback_rule_based_parse("Cần mua xe bán tải Ford tầm 1 tỷ")
    assert res2.body_type == "PICKUP"
    assert res2.brand == "Ford"
    assert res2.max_price_vnd == 1_000_000_000

    # Test 3: Sedan máy dầu
    res3 = client._fallback_rule_based_parse("Xe sedan máy dầu đi gia đình")
    assert res3.body_type == "SEDAN"
    assert res3.fuel_type == "DIESEL"


def test_explain_valuation_fallback():
    client = GeminiClient()
    explanation = run_immediate(client.explain_valuation(
        brand="Toyota",
        model="Vios",
        year=2022,
        odometer_km=30000,
        estimated_price_vnd=480_000_000,
    ))
    assert explanation.summary is not None
    assert len(explanation.positive_factors) > 0
    assert explanation.market_advice is not None
