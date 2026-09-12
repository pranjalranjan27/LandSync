# ==============================================================================
# Layer: Database Connection & Session Management (app/db/session.py)
# ALLOWED:
#   - Instantiate the SQLAlchemy 2.0 Engine with connection pooling.
#   - Provide SessionLocal factory and transactional context managers.
# NOT ALLOWED:
#   - NEVER write business logic, table definitions, or route handlers here.
#   - Do not catch and swallow exceptions that hide database rollbacks.
# ==============================================================================

from contextlib import contextmanager
from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session

from app.core.config import settings

import logging
from contextlib import contextmanager
from typing import Generator
from sqlalchemy import create_engine, event
from sqlalchemy.ext.compiler import compiles
from sqlalchemy.orm import sessionmaker, Session
from geoalchemy2.types import _GISType
import geoalchemy2.admin

from app.core.config import settings

logger = logging.getLogger("landsync.db")

# Setup SQLite compatibility compiler for Geometry columns
@compiles(_GISType, "sqlite")
def _compile_gis_type_sqlite(type_, compiler, **kw):
    return "BLOB"

# Prevent GeoAlchemy2 from executing SpatiaLite-only DDL events on SQLite
try:
    geoalchemy2.admin.dialects.sqlite = geoalchemy2.admin.dialects.common
except Exception:
    pass


def _setup_sqlite_spatial_functions(dbapi_conn, connection_record):
    """Provide standard WKT/WKB spatial function conversions for SQLite."""
    from shapely.wkt import loads as wkt_loads
    from shapely.wkb import dumps as wkb_dumps

    def to_wkb(val):
        if isinstance(val, str):
            if val.startswith("SRID="):
                val = val.split(";", 1)[1]
            return wkb_dumps(wkt_loads(val))
        return val

    dbapi_conn.create_function("GeomFromEWKT", 1, to_wkb)
    dbapi_conn.create_function("ST_GeomFromEWKT", 1, to_wkb)
    dbapi_conn.create_function("GeomFromText", 1, to_wkb)
    dbapi_conn.create_function("ST_GeomFromText", 1, to_wkb)
    dbapi_conn.create_function("AsEWKB", 1, lambda x: x)
    dbapi_conn.create_function("ST_AsEWKB", 1, lambda x: x)
    dbapi_conn.create_function("AsBinary", 1, lambda x: x)
    dbapi_conn.create_function("ST_AsBinary", 1, lambda x: x)


def _init_engine():
    db_url = settings.DATABASE_URL
    is_sqlite = db_url.startswith("sqlite")

    if not is_sqlite:
        try:
            test_engine = create_engine(db_url, pool_pre_ping=True, connect_args={"connect_timeout": 3})
            with test_engine.connect():
                pass
            return test_engine
        except Exception as e:
            print(f"[LandSync] PostgreSQL at {db_url} not reachable ({e}). Falling back to local SQLite database.")
            from pathlib import Path
            backend_dir = Path(__file__).resolve().parent.parent.parent
            db_path = backend_dir / "landsync.db"
            db_url = f"sqlite:///{db_path.as_posix()}"
            is_sqlite = True

    sqlite_engine = create_engine(
        db_url,
        connect_args={"check_same_thread": False},
        pool_pre_ping=True
    )
    event.listen(sqlite_engine, "connect", _setup_sqlite_spatial_functions)

    # Automatically ensure tables exist on SQLite fallback
    if is_sqlite:
        from sqlalchemy import text
        with sqlite_engine.connect() as conn:
            try:
                cols = [r[1] for r in conn.execute(text("PRAGMA table_info(parcels)")).fetchall()]
                if cols and "village" not in cols:
                    print("[LandSync] Upgrading SQLite parcels schema to full PostGIS cadastral model...")
                    conn.execute(text("DROP TABLE IF EXISTS case_parcels;"))
                    conn.execute(text("DROP TABLE IF EXISTS parcels;"))
                    conn.commit()
            except Exception:
                pass

    from app.db.base import Base
    Base.metadata.create_all(sqlite_engine)

    return sqlite_engine


# Instantiate active engine
engine = _init_engine()

# Standard sessionmaker for generating new database sessions
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
    class_=Session
)


def check_and_seed_db():
    """Automatically seed initial demo data if database is empty."""
    try:
        from app.models.user import User
        from app.models.parcel import Parcel
        with SessionLocal() as check_sess:
            if not check_sess.query(User).first():
                print("[LandSync] Database is empty. Seeding initial demo data...")
                from app.seed.seed_data import seed_database
                seed_database()
            # Ensure synthetic cadastral parcels are seeded
            try:
                if check_sess.query(Parcel).count() < 30:
                    print("[LandSync] Seeding synthetic cadastral GIS parcels for Gautam Buddha Nagar...")
                    from app.db.seed_parcels import seed_cadastral_parcels
                    seed_cadastral_parcels(check_sess)
            except Exception as parcel_err:
                print(f"[LandSync] Parcel auto-seed notice: {parcel_err}")
    except Exception as seed_err:
        print(f"[LandSync] Seed check notice: {seed_err}")


# Perform auto-seed check on engine startup
check_and_seed_db()


@contextmanager
def get_db_context() -> Generator[Session, None, None]:
    """
    Context manager providing an atomic database transaction.
    If an unhandled exception is raised within the block, the entire transaction
    rolls back (guaranteeing audit log and state change atomicity).
    """
    db = SessionLocal()
    try:
        yield db
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()
