# ==============================================================================
# Layer: Core Storage Abstraction (app/core/storage_service.py)
# DESIGN INTENT:
#   - This class provides an isolated abstraction layer for binary document storage.
#   - In this development/hackathon deployment, documents are persisted to local disk
#     under backend/storage/documents/.
#   - For production cloud deployments, this entire service is designed as a ONE-FILE
#     SWAP to cloud object storage (e.g., AWS S3, Google Cloud Storage, or Azure Blob)
#     by replacing the method bodies of save(), get_bytes(), and exists() with
#     boto3 / google-cloud-storage SDK calls, without altering any business logic
#     or route handlers.
# NOT ALLOWED:
#   - Never hardcode raw file-path string concatenation directly in API route handlers.
#   - Route handlers and services must strictly interact through StorageService methods.
# ==============================================================================

import os
from pathlib import Path
from typing import Optional


class StorageService:
    """
    Abstracted file storage interface for statutory and evidentiary documents.
    Enforces path containment, directory initialization, and binary I/O isolation.
    """

    # Default storage directory relative to backend root: backend/storage/documents/
    _BASE_DIR = Path(__file__).resolve().parent.parent.parent / "storage" / "documents"

    @classmethod
    def get_base_dir(cls) -> Path:
        """Returns the canonical storage root, ensuring the directory exists on disk."""
        cls._BASE_DIR.mkdir(parents=True, exist_ok=True)
        return cls._BASE_DIR

    @classmethod
    def get_path(cls, key: str) -> Path:
        """
        Resolves the local Path for a given storage key.
        Guards against directory traversal (path traversal vulnerabilities).
        """
        base_dir = cls.get_base_dir().resolve()
        # Clean relative key
        clean_key = key.lstrip("/\\")
        target_path = (base_dir / clean_key).resolve()

        if not str(target_path).startswith(str(base_dir)):
            raise ValueError(f"Security violation: path traversal detected for storage key '{key}'")

        return target_path

    @classmethod
    def save(cls, file_bytes: bytes, key: str) -> None:
        """
        Persists binary content associated with the storage key.
        Ensures parent directory structure exists prior to writing.
        """
        target_path = cls.get_path(key)
        target_path.parent.mkdir(parents=True, exist_ok=True)
        with open(target_path, "wb") as f:
            f.write(file_bytes)

    @classmethod
    def get_bytes(cls, key: str) -> bytes:
        """
        Retrieves raw binary content for a given storage key.
        Raises FileNotFoundError if the file does not exist on disk.
        """
        target_path = cls.get_path(key)
        if not target_path.is_file():
            raise FileNotFoundError(f"Document with storage key '{key}' not found at {target_path}")
        with open(target_path, "rb") as f:
            return f.read()

    @classmethod
    def exists(cls, key: str) -> bool:
        """Checks if a document with the given storage key exists."""
        try:
            target_path = cls.get_path(key)
            return target_path.is_file()
        except ValueError:
            return False

    @classmethod
    def delete(cls, key: str) -> bool:
        """Removes a document from disk if present."""
        try:
            target_path = cls.get_path(key)
            if target_path.is_file():
                target_path.unlink()
                return True
        except Exception:
            pass
        return False
