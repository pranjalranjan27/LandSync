# ==============================================================================
# Layer: API Routes Package (app/api/routes/__init__.py)
# ALLOWED:
#   - Aggregate and export API sub-routers (auth, parcels, cases, analytics).
# NOT ALLOWED:
#   - Never implement database logic or domain workflows here.
# ==============================================================================

from fastapi import APIRouter

from app.api.routes.auth import router as auth_router
from app.api.routes.parcels import router as parcels_router
from app.api.routes.cases import router as cases_router
from app.api.routes.analytics import router as analytics_router
from app.api.routes.risk import router as risk_router
from app.api.routes.authority import router as authority_router
from app.api.routes.export import router as export_router
from app.api.routes.documents import router as documents_router
from app.api.routes.land_verification import router as land_verification_router

api_router = APIRouter()
api_router.include_router(auth_router)
api_router.include_router(parcels_router, prefix="/api/v1/parcels")
api_router.include_router(parcels_router, prefix="/parcels")
api_router.include_router(cases_router, prefix="/api/v1/cases")
api_router.include_router(cases_router, prefix="/cases")
api_router.include_router(risk_router, prefix="/api/v1/cases")
api_router.include_router(risk_router, prefix="/cases")
api_router.include_router(authority_router, prefix="/api/v1")
api_router.include_router(authority_router)
api_router.include_router(export_router, prefix="/api/v1/export")
api_router.include_router(export_router, prefix="/export")
api_router.include_router(documents_router, prefix="/api/v1/documents")
api_router.include_router(documents_router, prefix="/documents")
api_router.include_router(land_verification_router, prefix="/api/v1")
api_router.include_router(land_verification_router)
api_router.include_router(analytics_router)

__all__ = ["api_router"]
