"""
Lumina AI - Pydantic Schemas
============================
Defines request and response schemas for all REST endpoints,
agents, and data transfers.
"""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


# --- Document & Chunk Schemas ---
class ChunkMetadata(BaseModel):
    chunk_id: str
    document_id: str
    document_name: str
    page_or_section: str
    chunk_position: int
    text: str
    relevance_score: Optional[float] = None


class DocumentInfo(BaseModel):
    document_id: str
    document_name: str
    file_type: str
    file_size: int
    domain: str
    upload_timestamp: float
    processing_status: str  # ready, processing, failed
    error_message: Optional[str] = None
    chunk_count: int = 0


class DocumentListResponse(BaseModel):
    count: int
    documents: List[DocumentInfo]


class DocumentUploadResponse(BaseModel):
    success: bool
    message: str
    document: Optional[DocumentInfo] = None
    error: Optional[str] = None


# --- Query & Retrieval Schemas ---
class QueryRequest(BaseModel):
    query: str = Field(..., description="The user query text")
    top_k: Optional[int] = Field(default=3, ge=1, le=10, description="Top-K chunks to retrieve")
    similarity_threshold: Optional[float] = Field(default=0.60, ge=0.0, le=1.0, description="Minimum relevance threshold")
    conversation_id: Optional[str] = Field(default=None, description="Conversation session ID")
    domain: Optional[str] = Field(default="all", description="Knowledge domain to scope retrieval")
    clarification_response: Optional[str] = Field(default=None, description="User response to a prior clarification question")


class QueryUnderstanding(BaseModel):
    query_type: str = Field(..., description="factual, procedural, comparative, or ambiguous")
    confidence: float = Field(..., ge=0.0, le=1.0)
    routing: str = Field(..., description="retrieval, clarification, or general_knowledge")
    refined_query: Optional[str] = None
    detected_entities: List[str] = Field(default_factory=list)
    reasoning: Optional[str] = None


class RetrievedChunk(BaseModel):
    chunk_id: str
    document_id: str
    document_name: str
    page: str
    text: str
    relevance_score: float
    chunk_position: int


class QueryResponse(BaseModel):
    query_id: str
    query: str
    answer: str
    confidence: float
    confidence_label: str  # high, medium, low, unavailable
    query_type: str
    classification_confidence: float
    routing: str
    sources: List[RetrievedChunk]
    conversation_id: str
    is_general_knowledge: bool = False
    requires_clarification: bool = False
    clarification_prompt: Optional[str] = None
    latency_ms: float = 0.0
    embedding_model: str = "gemini-embedding-001"
    llm_model: str = "gemini-3.8-flash"


# --- Conversation Memory Schemas ---
class ConversationTurn(BaseModel):
    turn_id: str
    role: str  # user, assistant, system
    content: str
    query_type: Optional[str] = None
    sources: Optional[List[Dict[str, Any]]] = None
    timestamp: float


class ConversationHistoryResponse(BaseModel):
    conversation_id: str
    turns: List[ConversationTurn]


# --- Analytics Schemas ---
class KnowledgeGapItem(BaseModel):
    query_text: str
    timestamp: float
    query_type: str
    reason: str
    best_score: float


class AnalyticsSummary(BaseModel):
    total_queries: int
    query_types: Dict[str, int]
    avg_confidence: float
    clarification_count: int
    low_confidence_count: int
    unanswered_count: int
    top_referenced_documents: List[Dict[str, Any]]
    frequently_asked_topics: List[Dict[str, Any]]
    knowledge_gaps: List[KnowledgeGapItem]
    total_documents: int
    total_chunks: int


# --- Settings Schemas ---
class SettingsModel(BaseModel):
    top_k: int = 3
    similarity_threshold: float = 0.60
    chunk_size: int = 800
    chunk_overlap: int = 150
    embedding_model: str = "gemini-embedding-001"
    llm_model: str = "gemini-3.8-flash"
    voice_language: str = "en-US"
