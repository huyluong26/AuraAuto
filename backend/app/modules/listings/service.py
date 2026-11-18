from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.listings.services.query_service import ListingQueryMixin
from app.modules.listings.services.mutation_service import ListingMutationMixin


class ListingService(ListingQueryMixin, ListingMutationMixin):
    """
    Unified Listing Service facade combining:
    - ListingQueryMixin: Querying, filtering, sorting, pagination, and detail views (CQRS Query side)
    - ListingMutationMixin: Draft creation, submission, status changes, revisions, editing (CQRS Command side)
    """

    def __init__(self, db: AsyncSession):
        self.db = db
