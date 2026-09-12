# ==============================================================================
# Layer: SQLAlchemy Models — Statutory Village Circle Rates (app/models/village_circle_rate.py)
#
# REAL-WORLD INTEGRATION DESIGN NOTE:
# This model represents government circle rates (minimum valuation rates) established by
# the District Magistrate / Inspector General of Registration (IGR). In production, this data
# synchronizes with the National Generic Document Registration System (NGDRS) Property Valuation
# module (https://ngdrs.gov.in), which dynamically computes statutory land value based on
# village cadastral code, agricultural vs. non-agricultural classification, and road frontage.
# For SIH 2026 hackathon purposes with external APIs offline, synthetic circle rates are
# scoped to notified villages of Gautam Buddha Nagar, Uttar Pradesh.
# ==============================================================================

import uuid
from sqlalchemy import String, Integer, Float, Uuid, UniqueConstraint, Index
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class VillageCircleRate(Base):
    """
    Statutory circle rate (notified benchmark land rate) per square meter for a revenue village.
    Used by the Risk Analysis module to compute total land value exposure under Section 26
    of the RFCTLARR Act, 2013.
    """
    __tablename__ = "village_circle_rates"
    __table_args__ = (
        UniqueConstraint("village", "district", "effective_year", name="uq_village_district_year"),
        Index("idx_circle_rates_lookup", "district", "village"),
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    village: Mapped[str] = mapped_column(String(150), nullable=False, index=True)
    district: Mapped[str] = mapped_column(String(150), nullable=False, index=True)
    rate_per_sqm: Mapped[float] = mapped_column(Float, nullable=False)
    effective_year: Mapped[int] = mapped_column(Integer, nullable=False)
