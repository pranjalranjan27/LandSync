# ==============================================================================
# Layer: Containerization / Deployment (Dockerfile)
# ALLOWED:
#   - Build the container environment, install OS-level libraries (PostGIS / GDAL / GEOS / libpq),
#     copy requirements, install python packages, copy source code, and define entrypoint.
# NOT ALLOWED:
#   - Do not store production secrets or hardcode dynamic configuration directly inside this image.
# ==============================================================================

FROM python:3.11-slim

# Prevent Python from writing .pyc files and buffer stdout/stderr
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Install system dependencies for PostGIS, GeoAlchemy2, Shapely, and Psycopg2
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    gdal-bin \
    libgeos-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy backend source tree
COPY . .

# Expose FastAPI default port
EXPOSE 8000

# Default command: run uvicorn server with hot reload enabled for local development
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
