# ==============================================================================
# Layer: Configuration (app/core/config.py)
# ALLOWED:
#   - Load, parse, validate, and provide type-safe access to environment variables.
#   - Use pydantic-settings to validate types at application startup.
# NOT ALLOWED:
#   - NEVER import from models/, repositories/, or services/.
#   - Never hardcode dynamic runtime data or database query logic here.
# ==============================================================================

from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "LandSync"
    API_V1_STR: str = ""
    ENVIRONMENT: str = "development"

    # Database Settings (PostgreSQL + PostGIS)
    DATABASE_URL: str = "postgresql+psycopg2://postgres:postgrespassword@localhost:5432/landsync_db"

    # Security & JWT Auth
    JWT_SECRET_KEY: str = "landsync_hackathon_super_secret_jwt_key_2026_change_in_prod"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours

    # File Storage
    UPLOAD_DIR: str = "./uploads"

    # Pydantic v2 Settings configuration
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )

    @property
    def upload_path(self) -> Path:
        path = Path(self.UPLOAD_DIR)
        path.mkdir(parents=True, exist_ok=True)
        return path


settings = Settings()
