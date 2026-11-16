import uuid
from sqlalchemy import ForeignKey, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel


class Favorite(BaseModel):
    __tablename__ = "favorites"

    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    listing_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("listings.id", ondelete="CASCADE"), nullable=False)

    __table_args__ = (
        Index("uq_favorite_user_listing", "user_id", "listing_id", unique=True),
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="favorites")
    listing: Mapped["Listing"] = relationship("Listing")
