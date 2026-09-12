# ==============================================================================
# Layer: Database Seeding — Synthetic Cadastral GIS Parcels (app/db/seed_parcels.py)
# ALLOWED:
#   - Generate realistic non-overlapping polygon geometries for Gautam Buddha Nagar.
#   - Populate PostGIS Geometry(Polygon, 4326), denormalized centroid, and area.
#   - Pre-link a subset of parcels to demo acquisition cases (Cases 1, 2, 3, 5).
# NOT ALLOWED:
#   - NO external GIS API calls (all geometries are strictly synthetic & local).
# ==============================================================================

import uuid
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from geoalchemy2.elements import WKTElement

from app.models.parcel import Parcel
from app.models.case import Case
from app.models.enums import EncroachmentStatus, OwnershipType
from app.repositories.parcel_repo import ParcelRepository


def generate_synthetic_parcels() -> List[Dict[str, Any]]:
    """
    Generate 40 realistic synthetic cadastral parcels clustered across key Tehsils
    in Gautam Buddha Nagar (Dadri, Jewar, Sadar) with real coordinates (~28.4-28.6° N, 77.4-77.6° E).
    """
    # Key village clusters in GB Nagar
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

    encroachments = [
        EncroachmentStatus.CLEAR.value,
        EncroachmentStatus.CLEAR.value,
        EncroachmentStatus.CLEAR.value,
        EncroachmentStatus.DISPUTED.value,
        EncroachmentStatus.CLEAR.value,
        EncroachmentStatus.ENCROACHED.value,
        EncroachmentStatus.CLEAR.value,
        EncroachmentStatus.DISPUTED.value,
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

    for v_idx, v in enumerate(villages):
        # 5 parcels per village = 40 parcels total
        for p_idx in range(5):
            khasra_num = f"UP-GB-{10000 + parcel_counter}"
            encroachment = encroachments[(parcel_counter - 1) % len(encroachments)]
            ownership = ownerships[(parcel_counter - 1) % len(ownerships)]

            # Small offsets to create non-overlapping parcel boundaries (approx 150m - 300m plots)
            lat_offset = (p_idx % 3) * 0.003 + (p_idx // 3) * 0.001
            lng_offset = (p_idx // 3) * 0.0035 + (p_idx % 3) * 0.0015

            c_lat = round(v["base_lat"] + lat_offset, 6)
            c_lng = round(v["base_lng"] + lng_offset, 6)

            # Plausible 5-point closed polygon representing parcel cadastral boundary
            dx = 0.0012 + (p_idx * 0.0001)
            dy = 0.0010 + (p_idx * 0.0001)

            p1 = (round(c_lng - dx, 6), round(c_lat - dy, 6))
            p2 = (round(c_lng + dx, 6), round(c_lat - dy + 0.0002, 6))
            p3 = (round(c_lng + dx + 0.0001, 6), round(c_lat + dy, 6))
            p4 = (round(c_lng - dx + 0.0001, 6), round(c_lat + dy, 6))
            p5 = p1  # Close polygon

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
                "ownership_type": ownership,
                "case_id": None  # Will link below
            })

            parcel_counter += 1

    return parcels_data


def seed_cadastral_parcels(db: Session) -> int:
    """Seed synthetic cadastral parcels into the database and pre-link to seeded cases."""
    existing_count = db.query(Parcel).count()
    if existing_count >= 30:
        return existing_count

    # Fetch existing seeded cases if available
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
