import logging
from sqlalchemy import select

from app.core.config import settings
from app.core.database import AsyncSessionLocal
from app.core.security import get_password_hash
from app.models.user import User
from app.models.catalog import VehicleBrand, VehicleModel

logger = logging.getLogger(__name__)


async def seed_initial_data() -> None:
    """Seed initial Admin and prominent car brands if database is empty."""
    async with AsyncSessionLocal() as session:
        # 1. Admin Seed
        admin_stmt = select(User).where(User.email == settings.INITIAL_ADMIN_EMAIL.lower())
        admin_res = await session.execute(admin_stmt)
        if not admin_res.scalar_one_or_none():
            admin = User(
                email=settings.INITIAL_ADMIN_EMAIL.lower(),
                password_hash=get_password_hash(settings.INITIAL_ADMIN_PASSWORD),
                display_name="Hệ Thống Quản Trị",
                role="ADMIN",
                status="ACTIVE",
                phone="0900000000",
            )
            session.add(admin)
            logger.info(f"Seeded initial admin: {settings.INITIAL_ADMIN_EMAIL}")

        # 2. Car Brands & Models Seed
        brand_stmt = select(VehicleBrand).limit(1)
        brand_res = await session.execute(brand_stmt)
        if not brand_res.scalar_one_or_none():
            brands_data = [
                {
                    "name": "Toyota",
                    "slug": "toyota",
                    "models": [("Vios", "SEDAN"), ("Corolla Cross", "SUV"), ("Fortuner", "SUV"), ("Camry", "SEDAN"), ("Innova", "MPV")]
                },
                {
                    "name": "Hyundai",
                    "slug": "hyundai",
                    "models": [("Accent", "SEDAN"), ("Creta", "SUV"), ("Tucson", "SUV"), ("Santa Fe", "SUV"), ("Grand i10", "HATCHBACK")]
                },
                {
                    "name": "Mazda",
                    "slug": "mazda",
                    "models": [("Mazda 3", "SEDAN"), ("CX-5", "SUV"), ("CX-8", "SUV"), ("Mazda 2", "SEDAN"), ("CX-30", "SUV")]
                },
                {
                    "name": "Kia",
                    "slug": "kia",
                    "models": [("Seltos", "SUV"), ("K3", "SEDAN"), ("Carnival", "MPV"), ("Sonet", "SUV"), ("Morning", "HATCHBACK")]
                },
                {
                    "name": "Honda",
                    "slug": "honda",
                    "models": [("City", "SEDAN"), ("CR-V", "SUV"), ("Civic", "SEDAN"), ("HR-V", "SUV"), ("BR-V", "MPV")]
                },
                {
                    "name": "Ford",
                    "slug": "ford",
                    "models": [("Ranger", "PICKUP"), ("Everest", "SUV"), ("Territory", "SUV"), ("Explorer", "SUV")]
                },
                {
                    "name": "Mitsubishi",
                    "slug": "mitsubishi",
                    "models": [("Xpander", "MPV"), ("Xforce", "SUV"), ("Outlander", "SUV"), ("Attrage", "SEDAN"), ("Triton", "PICKUP")]
                },
                {
                    "name": "VinFast",
                    "slug": "vinfast",
                    "models": [("VF 3", "SUV"), ("VF 5", "SUV"), ("VF e34", "SUV"), ("VF 8", "SUV"), ("VF 9", "SUV"), ("Fadil", "HATCHBACK")]
                },
            ]

            for b_info in brands_data:
                brand = VehicleBrand(name=b_info["name"], slug=b_info["slug"])
                session.add(brand)
                await session.flush()
                for m_name, b_type in b_info["models"]:
                    model = VehicleModel(
                        brand_id=brand.id,
                        name=m_name,
                        slug=m_name.lower().replace(" ", "-"),
                        body_type=b_type,
                    )
                    session.add(model)
            logger.info("Seeded initial vehicle brands and models")

        await session.commit()
