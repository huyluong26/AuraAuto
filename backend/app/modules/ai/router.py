from typing import List, Optional
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.modules.ai.schemas import (
    ValuationRequest,
    ValuationResponse,
    NaturalSearchRequest,
    NaturalSearchResponse,
    RecommendationRequest,
    CarRecognitionResponse,
    CarRecognitionFromUrlRequest,
)
from app.modules.ai.service import AIService
from app.modules.listings.schemas import ListingListItemResponse

router = APIRouter(prefix="/ai", tags=["AI"])


@router.post("/recognize-car", response_model=CarRecognitionResponse)
async def recognize_car_from_upload(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
):
    """Nhận diện thông tin xe ô tô từ ảnh chụp thực tế bằng Gemini Vision AI."""
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Chỉ chấp nhận file định dạng hình ảnh (JPEG, PNG, WEBP).")

    content = await file.read()
    if len(content) > 15 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Dung lượng ảnh tối đa 15MB.")

    service = AIService(db)
    return await service.recognize_car_from_image(
        image_bytes=content,
        mime_type=file.content_type or "image/jpeg",
        filename=file.filename,
    )


@router.post("/recognize-car-url", response_model=CarRecognitionResponse)
async def recognize_car_from_url_or_base64(
    data: CarRecognitionFromUrlRequest,
    db: AsyncSession = Depends(get_db),
):
    """Nhận diện thông tin xe ô tô từ link ảnh (URL) hoặc chuỗi base64."""
    service = AIService(db)
    return await service.recognize_car_from_url_or_base64(data)


@router.post("/valuations", response_model=ValuationResponse)
async def estimate_valuation(
    data: ValuationRequest,
    db: AsyncSession = Depends(get_db),
):
    service = AIService(db)
    return await service.estimate_valuation(data)


@router.post("/natural-search", response_model=NaturalSearchResponse)
async def natural_search(
    data: NaturalSearchRequest,
    db: AsyncSession = Depends(get_db),
):
    service = AIService(db)
    return await service.natural_search(data.query)


@router.post("/recommendations", response_model=List[ListingListItemResponse])
async def get_recommendations(
    data: RecommendationRequest,
    db: AsyncSession = Depends(get_db),
):
    service = AIService(db)
    return await service.recommend_listings(data)


