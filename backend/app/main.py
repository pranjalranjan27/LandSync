# ==============================================================================
# Layer: Application Entrypoint (app/main.py)
# ALLOWED:
#   - Instantiate the FastAPI application, configure global middleware (CORS),
#     and register top-level API routers.
#   - Define health-check endpoints and startup directory verifications.
# NOT ALLOWED:
#   - NO business logic, NO repository queries, and NO database mutations directly in main.py.
# ==============================================================================

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.api.routes import api_router

app = FastAPI(
    title="LandSync — Government Land Acquisition Platform",
    description=(
        "Backend API for statutory land acquisition workflows (SIH 2026). "
        "Engineered with strict 7-layer separation, PostGIS spatial indexing, "
        "and hybrid RBAC + ABAC jurisdiction enforcement."
    ),
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Cross-Origin Resource Sharing (CORS) Middleware for frontend consumption
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register central API routers
app.include_router(api_router, prefix=settings.API_V1_STR)


@app.on_event("startup")
def startup_event():
    """Ensure runtime uploads directory exists."""
    settings.upload_path


@app.get("/health", tags=["System"])
def health_check():
    """Liveness probe returning service and environment status."""
    return {
        "status": "healthy",
        "service": "LandSync Backend",
        "environment": settings.ENVIRONMENT
    }


@app.get("/", tags=["System"])
def root():
    """Root metadata redirecting to OpenAPI documentation."""
    return {
        "service": "LandSync Backend",
        "documentation": "/docs",
        "health": "/health"
    }
