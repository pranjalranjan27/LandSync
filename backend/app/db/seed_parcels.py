# ==============================================================================
# Layer: Database Seeding — Synthetic Cadastral GIS Parcels & Circle Rates (app/db/seed_parcels.py)
#
# REAL-WORLD INTEGRATION DESIGN NOTE:
# Real government databases (NJDG for court litigation, NGDRS for land registration and circle rates,
# and Bhu-Naksha for cadastral shapes) are offline and inaccessible for hackathon environments.
#
# This seeder provides realistic synthetic data for Gautam Buddha Nagar district, Uttar Pradesh:
# 1. Cadastral parcels with 80% clear title, 15% pending civil litigation (NJDG), 5% prohibited reserves (NGDRS).
# 2. Statutory Village Circle Rates modeled on how NGDRS's property valuation module estimates
#    statutory land compensation value under Section 26 of the RFCTLARR Act, 2013.
# ==============================================================================

import uuid
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.models.parcel import Parcel
from app.models.case import Case
from app.models.village_circle_rate import VillageCircleRate
from app.models.enums import EncroachmentStatus, OwnershipType, DisputeStatus
from app.repositories.parcel_repo import ParcelRepository


# Statutory village circle rates notified by the District Magistrate, Gautam Buddha Nagar
# In production, this mirrors the National Generic Document Registration System (NGDRS) valuation table
SYNTHETIC_CIRCLE_RATES = [
    {"village": "Chhapraula", "district": "Gautam Buddha Nagar", "rate_per_sqm": 4500.0, "effective_year": 2026},
    {"village": "Bisrakh Jalalpur", "district": "Gautam Buddha Nagar", "rate_per_sqm": 5200.0, "effective_year": 2026},
    {"village": "Dhoom Manikpur", "district": "Gautam Buddha Nagar", "rate_per_sqm": 3800.0, "effective_year": 2026},
    {"village": "Shahpur Govardhanpur", "district": "Gautam Buddha Nagar", "rate_per_sqm": 4100.0, "effective_year": 2026},
    {"village": "Bhangel", "district": "Gautam Buddha Nagar", "rate_per_sqm": 6500.0, "effective_year": 2026},
    {"village": "Dayanatpur", "district": "Gautam Buddha Nagar", "rate_per_sqm": 3200.0, "effective_year": 2026},
    {"village": "Kishorepur", "district": "Gautam Buddha Nagar", "rate_per_sqm": 2800.0, "effective_year": 2026},
    {"village": "Rohi", "district": "Gautam Buddha Nagar", "rate_per_sqm": 2600.0, "effective_year": 2026},
]


def generate_synthetic_parcels() -> List[Dict[str, Any]]:
    """
    Generate 40 realistic synthetic cadastral parcels clustered across key Tehsils
    in Gautam Buddha Nagar (Dadri, Jewar, Sadar) with real coordinates (~28.4-28.6° N, 77.4-77.6° E).
    Dispute distribution: ~80% clear, 15% under_litigation, 5% prohibited.
    """
    villages = [
        {"name": "Chhapraula", "tehsil": "Dadri", "sheet": "14-B", "base_lat": 28.590, "base_lng": 77.460},
        {"name": "Bisrakh Jalalpur", "tehsil": "Dadri", "sheet": "12-A", "base_lat": 28.560, "base_lng": 77.440},
        {"name": "Dhoom Manikpur", "tehsil": "Dadri", "sheet": "08-C", "base_lat": 28.535, "base_lng": 77.490},
        {"name": "Shahpur Govardhanpur", "tehsil": "Sadar", "sheet": "15-A", "base_lat": 28.505, "base_lng": 77.410},
        {"name": "Bhangel", "tehsil": "Sadar", "sheet": "09-D", "base_lat": 28.530, "base_lng": 77.380},
        {"name": "Dayanatpur", "tehsil": "Jewar", "sheet": "22-A", "base_lat": 28.410, "base_lng": 77.560},
        {"name": "Kishorepur", "tehsil": "Jewar", "sheet": "22-B", "base_lat": 28.425, "base_lng": 77.575},
        {"name": "Rohi", "tehsil": "Jewar", "sheet": "24-C", "base_lat": 28.435, "base_lng": 77.545},
    ]

    ownerships = [
        OwnershipType.PRIVATE.value,
        OwnershipType.PRIVATE.value,
        OwnershipType.GOVERNMENT.value,
        OwnershipType.COMMUNITY.value,
        OwnershipType.PRIVATE.value,
    ]

    parcels_data = []
    parcel_counter = 1

    for v in villages:
        # 5 parcels per village = 40 parcels total
        for p_idx in range(5):
            khasra_num = f"UP-GB-{10000 + parcel_counter}"
            ownership = ownerships[(parcel_counter - 1) % len(ownerships)]

            # Dispute distribution across 40 parcels:
            # 2 parcels prohibited (~5%): parcel 7 (Bisrakh) & parcel 23 (Dayanatpur)
            # 6 parcels under_litigation (~15%): parcels 4, 12, 18, 28, 33, 39
            # Remaining 32 parcels clear (~80%)
            if parcel_counter in (7, 23):
                dispute_status = DisputeStatus.PROHIBITED.value
                dispute_source = "NGDRS / State IGR"
                dispute_notes = (
                    "Section 77 UP Revenue Code: Notified Gram Sabha pond/pastureland reserve; "
                    "prohibited from statutory acquisition or alienation."
                )
                encroachment = EncroachmentStatus.CLEAR.value
            elif parcel_counter in (4, 12, 18, 28, 33, 39):
                dispute_status = DisputeStatus.UNDER_LITIGATION.value
                dispute_source = "NJDG"
                dispute_notes = (
                    f"Civil Suit OS {100 + parcel_counter}/2024: Partition & injunction suit pending before "
                    f"Civil Judge (Senior Division), Gautam Buddha Nagar."
                )
                encroachment = EncroachmentStatus.DISPUTED.value
            else:
                dispute_status = DisputeStatus.CLEAR.value
                dispute_source = None
                dispute_notes = None
                encroachment = EncroachmentStatus.CLEAR.value

            # Small offsets to create non-overlapping parcel boundaries
            lat_offset = (p_idx % 3) * 0.003 + (p_idx // 3) * 0.001
            lng_offset = (p_idx // 3) * 0.0035 + (p_idx % 3) * 0.0015

            c_lat = round(v["base_lat"] + lat_offset, 6)
            c_lng = round(v["base_lng"] + lng_offset, 6)

            dx = 0.0012 + (p_idx * 0.0001)
            dy = 0.0010 + (p_idx * 0.0001)

            p1 = (round(c_lng - dx, 6), round(c_lat - dy, 6))
            p2 = (round(c_lng + dx, 6), round(c_lat - dy + 0.0002, 6))
            p3 = (round(c_lng + dx + 0.0001, 6), round(c_lat + dy, 6))
            p4 = (round(c_lng - dx + 0.0001, 6), round(c_lat + dy, 6))
            p5 = p1

            wkt_geom = f"POLYGON(({p1[0]} {p1[1]}, {p2[0]} {p2[1]}, {p3[0]} {p3[1]}, {p4[0]} {p4[1]}, {p5[0]} {p5[1]}))"
            area_sqm = round((dx * 111000 * 2) * (dy * 111000 * 2), 1)

            parcels_data.append({
                "id": uuid.uuid4(),
                "khasra_number": khasra_num,
                "village": v["name"],
                "tehsil": v["tehsil"],
                "district": "Gautam Buddha Nagar",
                "state": "Uttar Pradesh",
                "revenue_sheet_no": v["sheet"],
                "geometry": wkt_geom,
                "centroid_lat": c_lat,
                "centroid_lng": c_lng,
                "area_sqm": area_sqm,
                "encroachment_status": encroachment,
                "dispute_status": dispute_status,
                "dispute_source": dispute_source,
                "dispute_notes": dispute_notes,
                "ownership_type": ownership,
                "case_id": None
            })

            parcel_counter += 1

    return parcels_data


def seed_village_circle_rates(db: Session) -> int:
    """Seed synthetic statutory circle rates for Gautam Buddha Nagar revenue villages."""
    count = 0
    for entry in SYNTHETIC_CIRCLE_RATES:
        stmt = select(VillageCircleRate).where(
            VillageCircleRate.village == entry["village"],
            VillageCircleRate.district == entry["district"],
            VillageCircleRate.effective_year == entry["effective_year"]
        )
        existing = db.scalars(stmt).first()
        if not existing:
            cr = VillageCircleRate(
                id=uuid.uuid4(),
                village=entry["village"],
                district=entry["district"],
                rate_per_sqm=entry["rate_per_sqm"],
                effective_year=entry["effective_year"]
            )
            db.add(cr)
            count += 1
    if count > 0:
        db.commit()
        print(f"[LandSync GIS] Seeded {count} statutory village circle rates for Gautam Buddha Nagar.")
    return count


def seed_cadastral_parcels(db: Session) -> int:
    """Seed synthetic cadastral parcels and circle rates into the database."""
    # First ensure circle rates are seeded
    seed_village_circle_rates(db)

    existing_count = db.query(Parcel).count()
    if existing_count >= 30:
        return existing_count

    cases = db.query(Case).all()
    case_ids = [c.id for c in cases]

    parcels_data = generate_synthetic_parcels()

    # Pre-link subsets of parcels to seeded cases
    # Case 1 (Jewar Cargo Link): link Jewar parcels (indices 25-34)
    # Case 5 (Metro Extension): link Chhapraula & Bisrakh parcels (indices 0-4)
    # Case 2 (Yamuna Exp): link Dhoom Manikpur parcels (indices 10-14)
    # Case 3 (Dadri Logistics): link Shahpur parcels (indices 15-18)
    for idx, p in enumerate(parcels_data):
        if case_ids:
            if 25 <= idx <= 34 and 1 in case_ids:
                p["case_id"] = 1
            elif 0 <= idx <= 4 and 5 in case_ids:
                p["case_id"] = 5
            elif 10 <= idx <= 14 and 2 in case_ids:
                p["case_id"] = 2
            elif 15 <= idx <= 18 and 3 in case_ids:
                p["case_id"] = 3

        ParcelRepository.create_parcel(db, p)

    db.commit()
    print(f"[LandSync GIS] Seeded {len(parcels_data)} synthetic cadastral parcels for Gautam Buddha Nagar.")
    return len(parcels_data)


if __name__ == "__main__":
    from app.db.session import SessionLocal
    with SessionLocal() as session:
        seed_cadastral_parcels(session)
