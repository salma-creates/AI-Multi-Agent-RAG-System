"""
Lumina AI - Knowledge Base Ingestion Pipeline (Milestone 1.3)
============================================================
Coordinates document validation, storage, text extraction, cleaning,
chunking, embedding generation, database persistence, and vector indexing.
"""

import os
import shutil
from pathlib import Path
from typing import Dict, Any

from app.config import (
    UPLOAD_DIR,
    ALLOWED_EXTENSIONS,
    MAX_FILE_SIZE_BYTES,
    DEFAULT_CHUNK_SIZE,
    DEFAULT_CHUNK_OVERLAP,
    EMBEDDING_MODEL
)
from app.services.extraction import extract_text, ExtractionError
from app.services.cleaning import clean_text
from app.services.chunking import chunk_document_units
from app.services.embedding import generate_batch_embeddings
from app.services.vector_store import vector_store
from app.models.db import (
    create_document,
    update_document_status,
    save_chunks_and_embeddings,
    get_document,
    get_settings
)


class IngestionError(Exception):
    pass


def process_uploaded_file(
    file_bytes: bytes,
    original_filename: str,
    domain: str = "general"
) -> Dict[str, Any]:
    """
    Executes the 10-step Knowledge Base Ingestion process:
    1. Validate file extension and size
    2. Store document file locally in uploads/
    3. Register document in database
    4. Extract text units with page/section labels
    5. Clean and normalize text
    6. Split text into chunks
    7. Generate vector embeddings
    8. Store embeddings and chunk metadata in SQLite
    9. Index chunks in VectorStore for immediate searchability
    10. Update document status to 'ready'
    """
    # 1. Validation
    ext = Path(original_filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise IngestionError(
            f"Unsupported file format '{ext}'. Allowed formats: PDF, DOCX, TXT, CSV."
        )

    file_size = len(file_bytes)
    if file_size == 0:
        raise IngestionError("The uploaded file is empty (0 bytes).")
    if file_size > MAX_FILE_SIZE_BYTES:
        raise IngestionError(f"File exceeds maximum allowed size of 30MB.")

    # 2. Storage
    sanitized_filename = "".join(c for c in original_filename if c.isalnum() or c in "._- ")
    target_path = UPLOAD_DIR / sanitized_filename

    # Handle collision
    base_stem = target_path.stem
    counter = 1
    while target_path.exists():
        target_path = UPLOAD_DIR / f"{base_stem}_{counter}{ext}"
        counter += 1

    with open(target_path, "wb") as f:
        f.write(file_bytes)

    # 3. Create DB Record
    doc_id = create_document(
        document_name=original_filename,
        file_type=ext.lstrip("."),
        file_size=file_size,
        domain=domain,
        storage_path=str(target_path)
    )

    try:
        update_document_status(doc_id, "processing")

        # 4. Extract Text
        raw_units = extract_text(str(target_path), ext)
        if not raw_units:
            raise IngestionError("Extraction returned no text units.")

        # 5. Clean Text
        cleaned_units = []
        for text, label in raw_units:
            cleaned = clean_text(text)
            if cleaned:
                cleaned_units.append((cleaned, label))

        if not cleaned_units:
            raise IngestionError("Document text was empty after cleaning and normalization.")

        # 6. Chunk Text
        settings = get_settings()
        chunk_size = settings.get("chunk_size", DEFAULT_CHUNK_SIZE)
        chunk_overlap = settings.get("chunk_overlap", DEFAULT_CHUNK_OVERLAP)

        chunks = chunk_document_units(
            units=cleaned_units,
            document_id=doc_id,
            document_name=original_filename,
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap
        )

        if not chunks:
            raise IngestionError("Chunking produced 0 chunks from the document.")

        # 7. Generate Embeddings
        chunk_texts = [c["text"] for c in chunks]
        vectors = generate_batch_embeddings(chunk_texts)

        chunks_with_vectors = []
        for i, chunk in enumerate(chunks):
            chunk["vector"] = vectors[i]
            chunk["embedding_model"] = EMBEDDING_MODEL
            chunk["domain"] = domain
            chunks_with_vectors.append(chunk)

        # 8. Store in SQLite
        save_chunks_and_embeddings(doc_id, chunks_with_vectors)

        # 9. Index in Vector Store (immediate searchability)
        vector_store.add_chunks(chunks_with_vectors)

        # 10. Update Status
        update_document_status(doc_id, "ready", chunk_count=len(chunks))

        doc_record = get_document(doc_id)
        return {
            "success": True,
            "document_id": doc_id,
            "document_name": original_filename,
            "chunk_count": len(chunks),
            "file_type": ext.lstrip("."),
            "file_size": file_size,
            "domain": domain,
            "message": f"Successfully ingested '{original_filename}' ({len(chunks)} chunks indexed)."
        }

    except Exception as e:
        error_msg = str(e)
        update_document_status(doc_id, "failed", error_message=error_msg)
        print(f"[Ingestion Error] Failed processing {original_filename}: {error_msg}")
        raise IngestionError(f"Failed to process document '{original_filename}': {error_msg}")
