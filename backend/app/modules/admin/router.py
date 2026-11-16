import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, BackgroundTasks, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import require_admin, require_super_admin
from app.models.user import User
from app.modules.admin.service import AdminService
from app.modules.admin.schemas import (
    AdminMetricsResponse,
    RejectListingRequest,
    TakeDownListingRequest,
    SubmitInspectionRequest,
    AdminUpdateListingRequest,
    VerifyShowroomRequest,
    UpdateUserStatusRequest,
    BulkUpdateUserStatusRequest,
    BulkUpdateShowroomStatusRequest,
    BulkVerifyShowroomRequest,
    BulkDeleteShowroomRequest,
    UpdateUserRoleRequest,
    AdminCreateUserRequest,
    AdminUpdateUserRequest,
    AdminCreateShowroomRequest,
    AdminUpdateShowroomRequest,
    AdminListingItemResponse,
    AdminListingDetailResponse,
    AdminAppointmentItemResponse,
    AdminCancelAppointmentRequest,
    AdminPromotionPackageResponse,
    AdminCreatePromotionPackageRequest,
    AdminUpdatePromotionPackageRequest,
    AdminFeaturedListingItemResponse,
    AdminGrantFeaturedRequest,
    AdminRevokeFeaturedRequest,
    AdminPaymentTransactionItemResponse,
    AdminPromotionsOverviewResponse,
)
from app.modules.auth.schemas import UserBriefResponse
from app.shared.schemas import SuccessResponse

router = APIRouter(prefix="/admin", tags=["Admin"], dependencies=[Depends(require_admin)])


# ==========================================
# 1. METRICS & KPI
# ==========================================
@router.get("/metrics", response_model=AdminMetricsResponse)
async def get_dashboard_metrics(db: AsyncSession = Depends(get_db)):
    service = AdminService(db)
    return await service.get_dashboard_metrics()


# ==========================================
# 2. LISTINGS MANAGEMENT
# ==========================================
@router.get("/listings", response_model=List[AdminListingItemResponse])
async def list_admin_listings(
    status_filter: Optional[str] = Query(None, description="ALL, PENDING_REVIEW, PUBLISHED, REJECTED, SOLD, DRAFT, REMOVED"),
    search: Optional[str] = Query(None, description="Tìm kiếm theo tiêu đề xe hoặc tên người bán"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
):
    service = AdminService(db)
    return await service.list_listings(status_filter=status_filter, search=search, limit=limit, offset=offset)


@router.get("/listings/pending", response_model=List[AdminListingItemResponse])
async def list_pending_listings(db: AsyncSession = Depends(get_db)):
    service = AdminService(db)
    return await service.list_listings(status_filter="PENDING_REVIEW")


@router.get("/listings/{id}", response_model=AdminListingDetailResponse)
async def get_admin_listing_detail(id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    service = AdminService(db)
    return await service.get_listing_detail(id)


@router.post("/listings/{id}/approve", response_model=SuccessResponse)
async def approve_listing(
    id: uuid.UUID,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    service = AdminService(db)
    return await service.approve_listing(id, background_tasks)


@router.post("/listings/{id}/reject", response_model=SuccessResponse)
async def reject_listing(
    id: uuid.UUID,
    data: RejectListingRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    service = AdminService(db)
    return await service.reject_listing(id, data, background_tasks)


@router.post("/listings/{id}/takedown", response_model=SuccessResponse)
async def takedown_listing(
    id: uuid.UUID,
    data: TakeDownListingRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    service = AdminService(db)
    return await service.takedown_listing(id, data, background_tasks)


@router.delete("/listings/{id}", response_model=SuccessResponse)
async def delete_listing(id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    service = AdminService(db)
    return await service.delete_listing(id)


@router.post("/listings/{id}/inspection", response_model=SuccessResponse)
async def submit_inspection(
    id: uuid.UUID,
    data: SubmitInspectionRequest,
    db: AsyncSession = Depends(get_db),
):
    service = AdminService(db)
    return await service.submit_inspection(id, data)


@router.patch("/listings/{id}", response_model=SuccessResponse)
async def admin_update_listing(
    id: uuid.UUID,
    data: AdminUpdateListingRequest,
    db: AsyncSession = Depends(get_db),
):
    service = AdminService(db)
    return await service.update_listing(id, data)


# ==========================================
# 3. USERS MANAGEMENT
# ==========================================
@router.get("/users", response_model=List[UserBriefResponse])
async def list_admin_users(
    role: Optional[str] = Query(None, description="USER, ADMIN"),
    status: Optional[str] = Query(None, description="ACTIVE, SUSPENDED, DELETED"),
    search: Optional[str] = Query(None, description="Tìm theo tên, email, sđt"),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    service = AdminService(db)
    return await service.list_users(role=role, status_filter=status, search=search, limit=page_size, offset=(page - 1) * page_size)


@router.post("/users", response_model=UserBriefResponse, status_code=status.HTTP_201_CREATED)
async def create_user_by_admin(data: AdminCreateUserRequest, db: AsyncSession = Depends(get_db)):
    service = AdminService(db)
    return await service.create_user(data)


@router.patch("/users/{id}", response_model=SuccessResponse)
async def update_user_by_admin(
    id: uuid.UUID,
    data: AdminUpdateUserRequest,
    db: AsyncSession = Depends(get_db),
):
    service = AdminService(db)
    return await service.update_user(id, data)


@router.delete("/users/{id}", response_model=SuccessResponse)
async def delete_user_by_admin(
    id: uuid.UUID,
    super_admin: User = Depends(require_super_admin),
    db: AsyncSession = Depends(get_db),
):
    service = AdminService(db)
    return await service.delete_user(id, super_admin)


@router.patch("/users/{id}/status", response_model=SuccessResponse)
async def update_user_status(
    id: uuid.UUID,
    data: UpdateUserStatusRequest,
    admin_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    service = AdminService(db)
    return await service.update_user_status(id, data, admin_user)


@router.post("/users/bulk-status", response_model=SuccessResponse)
async def bulk_update_user_status(
    data: BulkUpdateUserStatusRequest,
    admin_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    service = AdminService(db)
    return await service.bulk_update_user_status(data, admin_user)


@router.patch("/users/{id}/role", response_model=SuccessResponse)
async def update_user_role(
    id: uuid.UUID,
    data: UpdateUserRoleRequest,
    super_admin: User = Depends(require_super_admin),
    db: AsyncSession = Depends(get_db),
):
    service = AdminService(db)
    return await service.update_user_role(id, data, super_admin)


# ==========================================
# 4. SHOWROOMS MANAGEMENT
# ==========================================
@router.post("/showrooms", response_model=SuccessResponse, status_code=status.HTTP_201_CREATED)
async def create_showroom_by_admin(data: AdminCreateShowroomRequest, db: AsyncSession = Depends(get_db)):
    service = AdminService(db)
    return await service.create_showroom(data)


@router.patch("/showrooms/{id}", response_model=SuccessResponse)
async def update_showroom_by_admin(
    id: uuid.UUID,
    data: AdminUpdateShowroomRequest,
    db: AsyncSession = Depends(get_db),
):
    service = AdminService(db)
    return await service.update_showroom(id, data)


@router.delete("/showrooms/{id}", response_model=SuccessResponse)
async def delete_showroom_by_admin(id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    service = AdminService(db)
    return await service.delete_showroom(id)


@router.post("/showrooms/{id}/verify", response_model=SuccessResponse)
async def verify_showroom(
    id: uuid.UUID,
    data: VerifyShowroomRequest,
    admin_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    service = AdminService(db)
    return await service.verify_showroom(id, data, admin_user)


@router.post("/showrooms/bulk-status", response_model=SuccessResponse)
async def bulk_update_showroom_status(
    data: BulkUpdateShowroomStatusRequest,
    db: AsyncSession = Depends(get_db),
):
    service = AdminService(db)
    return await service.bulk_update_showroom_status(data)


@router.post("/showrooms/bulk-verify", response_model=SuccessResponse)
async def bulk_verify_showrooms(
    data: BulkVerifyShowroomRequest,
    admin_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    service = AdminService(db)
    return await service.bulk_verify_showroom(data, admin_user)


@router.post("/showrooms/bulk-delete", response_model=SuccessResponse)
async def bulk_delete_showrooms(
    data: BulkDeleteShowroomRequest,
    db: AsyncSession = Depends(get_db),
):
    service = AdminService(db)
    return await service.bulk_delete_showroom(data)


# ==========================================
# 5. MAINTENANCE & AI RETRAIN
# ==========================================
@router.post("/maintenance/cleanup", response_model=SuccessResponse)
async def trigger_maintenance_cleanup(db: AsyncSession = Depends(get_db)):
    service = AdminService(db)
    return await service.run_cleanup()


@router.post("/ai/retrain", response_model=SuccessResponse)
async def trigger_ai_model_retrain(db: AsyncSession = Depends(get_db)):
    service = AdminService(db)
    return await service.retrain_ai()


# ==========================================
# 6. APPOINTMENTS MANAGEMENT
# ==========================================
@router.get("/appointments", response_model=List[AdminAppointmentItemResponse])
async def list_admin_appointments(
    status_filter: Optional[str] = Query(None, description="PENDING, CONFIRMED, COMPLETED, CANCELLED, DECLINED"),
    search: Optional[str] = Query(None, description="Tìm theo tên hoặc số điện thoại"),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    service = AdminService(db)
    return await service.list_appointments(status_filter=status_filter, search=search, page=page, page_size=page_size)


@router.get("/appointments/{id}", response_model=AdminAppointmentItemResponse)
async def get_admin_appointment_detail(id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    service = AdminService(db)
    return await service.get_appointment_detail(id)


@router.post("/appointments/{id}/cancel", response_model=SuccessResponse)
async def admin_cancel_appointment(
    id: uuid.UUID,
    data: AdminCancelAppointmentRequest,
    admin_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    service = AdminService(db)
    return await service.cancel_appointment(id, data, admin_user)


# ==========================================
# 7. PROMOTIONS & VIP PACKAGES MANAGEMENT
# ==========================================
@router.get("/promotions/overview", response_model=AdminPromotionsOverviewResponse)
async def get_admin_promotions_overview(
    admin_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    service = AdminService(db)
    return await service.get_promotions_overview()


@router.get("/promotions/packages", response_model=List[AdminPromotionPackageResponse])
async def get_admin_promotion_packages(
    admin_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    service = AdminService(db)
    return await service.get_promotion_packages()


@router.post("/promotions/packages", response_model=SuccessResponse, status_code=status.HTTP_201_CREATED)
async def create_admin_promotion_package(
    data: AdminCreatePromotionPackageRequest,
    admin_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    service = AdminService(db)
    return await service.create_promotion_package(data)


@router.patch("/promotions/packages/{id}", response_model=SuccessResponse)
async def update_admin_promotion_package(
    id: uuid.UUID,
    data: AdminUpdatePromotionPackageRequest,
    admin_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    service = AdminService(db)
    return await service.update_promotion_package(id, data)


@router.delete("/promotions/packages/{id}", response_model=SuccessResponse)
async def delete_admin_promotion_package(
    id: uuid.UUID,
    admin_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    service = AdminService(db)
    return await service.delete_promotion_package(id)


@router.get("/promotions/featured-listings", response_model=List[AdminFeaturedListingItemResponse])
async def get_admin_featured_listings(
    status_filter: Optional[str] = Query(None, description="ACTIVE, EXPIRED, ALL"),
    search: Optional[str] = Query(None, description="Tìm kiếm theo tiêu đề xe hoặc tên chủ xe"),
    admin_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    service = AdminService(db)
    return await service.list_featured_listings(status_filter=status_filter, search=search)


@router.post("/promotions/featured-listings/{listing_id}/grant", response_model=SuccessResponse)
async def admin_grant_featured_listing(
    listing_id: uuid.UUID,
    data: AdminGrantFeaturedRequest,
    admin_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    service = AdminService(db)
    return await service.grant_featured(listing_id, data)


@router.post("/promotions/featured-listings/{listing_id}/revoke", response_model=SuccessResponse)
async def admin_revoke_featured_listing(
    listing_id: uuid.UUID,
    data: AdminRevokeFeaturedRequest,
    admin_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    service = AdminService(db)
    return await service.revoke_featured(listing_id, data)


@router.get("/promotions/transactions", response_model=List[AdminPaymentTransactionItemResponse])
async def get_admin_payment_transactions(
    status_filter: Optional[str] = Query(None, description="SUCCESS, PENDING, FAILED, CANCELLED"),
    search: Optional[str] = Query(None, description="Tìm theo mã đơn hàng hoặc mã GD VNPay"),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    admin_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    service = AdminService(db)
    return await service.list_payment_transactions(status_filter=status_filter, search=search, page=page, page_size=page_size)
