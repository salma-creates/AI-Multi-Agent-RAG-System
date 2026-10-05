"""
Lumina AI - REST API Endpoints
==============================
Exposes all required FastAPI endpoints for document upload,
multi-agent query resolution, document management, conversations,
analytics, and runtime settings.
"""

import os
import uuid
from pathlib import Path
from typing import Optional
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Query, status

from app.schemas.models import (
    DocumentUploadResponse,
    DocumentListResponse,
    DocumentInfo,
    QueryRequest,
    QueryResponse,
    ConversationHistoryResponse,
    AnalyticsSummary,
    SettingsModel
)
from app.services.ingestion import process_uploaded_file, IngestionError
from app.services.vector_store import vector_store
from app.agents.orchestrator import process_query_pipeline
from app.models.db import (
    get_all_documents,
    get_document,
    delete_document,
    get_conversation_history,
    get_all_conversations,
    get_analytics,
    get_settings,
    update_settings
)
from app.config import (
    ALLOWED_EXTENSIONS,
    MAX_FILE_SIZE_BYTES,
    HAS_GEMINI_KEY,
    EMBEDDING_MODEL,
    LLM_MODEL,
    BACKEND_DIR
)

router = APIRouter()


# --- Health & Status ---
@router.get("/health", tags=["System"])
def health_check():
    return {
        "status": "healthy",
        "service": "Lumina AI Multi-Agent RAG System",
        "gemini_api_configured": HAS_GEMINI_KEY,
        "embedding_model": EMBEDDING_MODEL,
        "llm_model": LLM_MODEL,
        "indexed_chunks": vector_store.get_chunk_count()
    }


# --- Document Upload & Management (Milestone 1.3) ---
@router.post("/upload", response_model=DocumentUploadResponse, tags=["Knowledge Base"])
async def upload_document(
    file: UploadFile = File(..., description="Document file (PDF, DOCX, TXT, CSV)"),
    domain: str = Form("general", description="Knowledge domain (e.g. general, tech, medical)")
):
    """
    Ingests and indexes an uploaded document:
    Validates format, extracts text, cleans, chunks, generates embeddings,
    and indexes into vector storage for immediate searchability.
    """
    filename = file.filename or "uploaded_file"
    ext = Path(filename).suffix.lower()

    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file format '{ext}'. Allowed extensions: {', '.join(sorted(ALLOWED_EXTENSIONS))}"
        )

    try:
        content = await file.read()
        if len(content) == 0:
            raise HTTPException(status_code=400, detail="The uploaded file is empty (0 bytes).")
        if len(content) > MAX_FILE_SIZE_BYTES:
            raise HTTPException(status_code=400, detail="File size exceeds maximum 30MB limit.")

        result = process_uploaded_file(
            file_bytes=content,
            original_filename=filename,
            domain=domain
        )

        doc_record = get_document(result["document_id"])
        doc_info = DocumentInfo(
            document_id=doc_record["document_id"],
            document_name=doc_record["document_name"],
            file_type=doc_record["file_type"],
            file_size=doc_record["file_size"],
            domain=doc_record["domain"],
            upload_timestamp=doc_record["upload_timestamp"],
            processing_status=doc_record["processing_status"],
            error_message=doc_record.get("error_message"),
            chunk_count=doc_record["chunk_count"]
        )

        return DocumentUploadResponse(
            success=True,
            message=result["message"],
            document=doc_info
        )

    except IngestionError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected server error during upload: {str(e)}")


@router.get("/documents", response_model=DocumentListResponse, tags=["Knowledge Base"])
def list_documents():
    """Returns all ingested documents, processing statuses, and chunk counts."""
    docs = get_all_documents()
    parsed_docs = [
        DocumentInfo(
            document_id=d["document_id"],
            document_name=d["document_name"],
            file_type=d["file_type"],
            file_size=d["file_size"],
            domain=d["domain"],
            upload_timestamp=d["upload_timestamp"],
            processing_status=d["processing_status"],
            error_message=d.get("error_message"),
            chunk_count=d.get("chunk_count", 0)
        )
        for d in docs
    ]
    return DocumentListResponse(count=len(parsed_docs), documents=parsed_docs)


@router.delete("/documents/{document_id}", tags=["Knowledge Base"])
def delete_knowledge_document(document_id: str):
    """Deletes a document and removes all its chunks from SQLite and the in-memory vector index."""
    doc = get_document(document_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")

    vector_store.remove_document(document_id)
    return {"success": True, "message": f"Document '{doc['document_name']}' successfully removed from knowledge base."}


# --- Query Resolution Pipeline (Milestone 1.4 & Milestone 2) ---
@router.post("/query", response_model=QueryResponse, tags=["Multi-Agent Pipeline"])
def execute_query(request: QueryRequest):
    """
    Executes the automated multi-agent query pipeline:
    Query Understanding -> Retrieval -> Grounded Generation / Clarification -> Memory.
    """
    if not request.query.strip():
        raise HTTPException(status_code=400, detail="Query text cannot be empty.")

    try:
        response = process_query_pipeline(request)
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Pipeline execution error: {str(e)}")


# --- Conversation Memory (Milestone 3.2) ---
@router.get("/conversations", tags=["Conversation Memory"])
def list_conversations():
    """Lists all active conversation sessions and recent activity."""
    return get_all_conversations()


@router.get("/conversations/{conversation_id}", response_model=ConversationHistoryResponse, tags=["Conversation Memory"])
def get_conversation(conversation_id: str, limit: int = Query(20, ge=1, le=100)):
    """Retrieves conversation history turns for a given session."""
    turns = get_conversation_history(conversation_id, limit=limit)
    return ConversationHistoryResponse(
        conversation_id=conversation_id,
        turns=turns
    )


@router.post("/conversations", tags=["Conversation Memory"])
def create_new_conversation():
    """Initializes a new conversation session ID."""
    new_id = f"conv_{uuid.uuid4().hex[:12]}"
    return {"conversation_id": new_id, "created_at": str(uuid.uuid4())}


# --- Analytics & Knowledge Gap Detection (Milestone 4.1) ---
@router.get("/analytics", response_model=AnalyticsSummary, tags=["Analytics"])
def get_analytics_dashboard():
    """Returns analytics metrics, query distribution, latency, and knowledge gap items."""
    data = get_analytics()
    return AnalyticsSummary(**data)


# --- Settings & RAG Tuning (Milestone 4.3) ---
@router.get("/settings", response_model=SettingsModel, tags=["Settings"])
def read_settings():
    """Retrieves current RAG hyperparameters (Top-K, similarity threshold, chunk size)."""
    return SettingsModel(**get_settings())


@router.post("/settings", response_model=SettingsModel, tags=["Settings"])
def save_settings(settings: SettingsModel):
    """Updates runtime RAG hyperparameters."""
    update_settings(settings.model_dump())
    return settings


# --- Sample Document Preloading for Testing (Milestone 4.2) ---
@router.post("/test/preload-benchmark", tags=["Testing"])
def preload_benchmark_document():
    """
    Preloads the official Lumina RAG Test Document into the Knowledge Base
    for immediate verification of project facts (LUMINA-8472, year 2026, 5 agents, etc.).
    """
    test_doc_path = BACKEND_DIR / "data" / "test_documents" / "LUMINA_AI_RAG_TEST_DOCUMENT.txt"
    if not test_doc_path.exists():
        raise HTTPException(status_code=404, detail="Test document file not found.")

    with open(test_doc_path, "rb") as f:
        file_bytes = f.read()

    result = process_uploaded_file(
        file_bytes=file_bytes,
        original_filename="LUMINA_AI_RAG_TEST_DOCUMENT.txt",
        domain="lumina_test"
    )
    return result
