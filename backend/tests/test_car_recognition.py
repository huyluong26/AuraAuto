import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.modules.ai.schemas import CarRecognitionResponse
from unittest.mock import patch, AsyncMock


@pytest.mark.asyncio
async def test_recognize_car_endpoint():
    transport = ASGITransport(app=app)
    mock_resp = CarRecognitionResponse(
        brand="Toyota",
        model="Vios",
        trim="1.5G",
        manufacture_year=2022,
        body_type="SEDAN",
        color="Trắng",
        fuel_type="GASOLINE",
        transmission="AUTOMATIC",
        seats=5,
        confidence_score=0.95,
        suggested_title="Bán xe Toyota Vios 1.5G 2022 màu trắng tự động",
        suggested_description="Xe giữ gìn cẩn thận, nội ngoại thất như mới.",
    )

    with patch("app.modules.ai.service.gemini_client.recognize_car_from_image", new_callable=AsyncMock) as mock_gemini:
        mock_gemini.return_value = mock_resp
        async with AsyncClient(transport=transport, base_url="http://test") as ac:
            files = {"file": ("test_car.jpg", b"fake_image_bytes", "image/jpeg")}
            response = await ac.post("/api/v1/ai/recognize-car", files=files)
            assert response.status_code == 200
            data = response.json()
            assert data["brand"] == "Toyota"
            assert data["model"] == "Vios"
            assert data["manufacture_year"] == 2022
            assert data["confidence_score"] == 0.95
