from sqlalchemy.ext.asyncio import AsyncSession
from app.modules.admin.services.metrics_service import AdminMetricsMixin
from app.modules.admin.services.listings_service import AdminListingsMixin
from app.modules.admin.services.users_service import AdminUsersMixin
from app.modules.admin.services.appointments_service import AdminAppointmentsMixin
from app.modules.admin.services.promotions_service import AdminPromotionsMixin


class AdminService(
    AdminMetricsMixin,
    AdminListingsMixin,
    AdminUsersMixin,
    AdminAppointmentsMixin,
    AdminPromotionsMixin,
):
    def __init__(self, db: AsyncSession):
        self.db = db
