"""
Lumina AI - SQLite Database Layer
=================================
Manages all persistent storage for documents, chunks, vector embeddings,
queries, responses, conversation memory, and analytics metrics.
"""

import sqlite3
import json
import time
import uuid
from typing import List, Dict, Any, Optional
from contextlib import contextmanager

from app.config import (
    DB_PATH,
    DEFAULT_TOP_K,
    DEFAULT_SIMILARITY_THRESHOLD,
    DEFAULT_CHUNK_SIZE,
    DEFAULT_CHUNK_OVERLAP,
    EMBEDDING_MODEL,
    LLM_MODEL
)


def _gen_id(prefix: str) -> str:
    return f"{prefix}_{uuid.uuid4().hex[:12]}"


@contextmanager
def get_db():
    conn = sqlite3.connect(str(DB_PATH), check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()


def init_db():
    """Initializes SQLite tables if they do not already exist."""
    with get_db() as conn:
        c = conn.cursor()

        # Documents table
        c.execute("""
        CREATE TABLE IF NOT EXISTS documents (
            document_id TEXT PRIMARY KEY,
            document_name TEXT NOT NULL,
            file_type TEXT NOT NULL,
            file_size INTEGER NOT NULL,
            domain TEXT NOT NULL DEFAULT 'general',
            upload_timestamp REAL NOT NULL,
            processing_status TEXT NOT NULL,  -- pending, processing, ready, failed
            error_message TEXT,
            chunk_count INTEGER DEFAULT 0,
            storage_path TEXT
        )""")

        # Chunks table
        c.execute("""
        CREATE TABLE IF NOT EXISTS chunks (
            chunk_id TEXT PRIMARY KEY,
            document_id TEXT NOT NULL,
            text TEXT NOT NULL,
            page_or_section TEXT NOT NULL,
            chunk_position INTEGER NOT NULL,
            char_count INTEGER NOT NULL,
            created_at REAL NOT NULL,
            FOREIGN KEY (document_id) REFERENCES documents(document_id) ON DELETE CASCADE
        )""")

        # Embeddings table
        c.execute("""
        CREATE TABLE IF NOT EXISTS embeddings (
            embedding_id TEXT PRIMARY KEY,
            chunk_id TEXT NOT NULL,
            document_id TEXT NOT NULL,
            vector_json TEXT NOT NULL,
            embedding_model TEXT NOT NULL,
            dimensions INTEGER NOT NULL,
            created_at REAL NOT NULL,
            FOREIGN KEY (chunk_id) REFERENCES chunks(chunk_id) ON DELETE CASCADE,
            FOREIGN KEY (document_id) REFERENCES documents(document_id) ON DELETE CASCADE
        )""")

        # Queries table
        c.execute("""
        CREATE TABLE IF NOT EXISTS queries (
            query_id TEXT PRIMARY KEY,
            query_text TEXT NOT NULL,
            query_type TEXT NOT NULL,
            classification_confidence REAL NOT NULL,
            conversation_id TEXT NOT NULL,
            domain TEXT NOT NULL DEFAULT 'all',
            latency_ms REAL NOT NULL,
            top_k INTEGER NOT NULL,
            threshold REAL NOT NULL,
            timestamp REAL NOT NULL
        )""")

        # Responses table
        c.execute("""
        CREATE TABLE IF NOT EXISTS responses (
            response_id TEXT PRIMARY KEY,
            query_id TEXT NOT NULL,
            answer TEXT NOT NULL,
            confidence REAL NOT NULL,
            confidence_label TEXT NOT NULL,
            sources_json TEXT NOT NULL,
            retrieved_context_json TEXT,
            generator TEXT NOT NULL,
            created_at REAL NOT NULL,
            FOREIGN KEY (query_id) REFERENCES queries(query_id) ON DELETE CASCADE
        )""")

        # Conversation memory table
        c.execute("""
        CREATE TABLE IF NOT EXISTS conversation_memory (
            id TEXT PRIMARY KEY,
            conversation_id TEXT NOT NULL,
            turn_index INTEGER NOT NULL,
            role TEXT NOT NULL,
            content TEXT NOT NULL,
            query_type TEXT,
            sources_json TEXT,
            entities_json TEXT,
            timestamp REAL NOT NULL
        )""")

        # Settings key-value table
        c.execute("""
        CREATE TABLE IF NOT EXISTS app_settings (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL
        )""")

        # Default settings seed
        default_settings = {
            "top_k": str(DEFAULT_TOP_K),
            "similarity_threshold": str(DEFAULT_SIMILARITY_THRESHOLD),
            "chunk_size": str(DEFAULT_CHUNK_SIZE),
            "chunk_overlap": str(DEFAULT_CHUNK_OVERLAP),
            "embedding_model": EMBEDDING_MODEL,
            "llm_model": LLM_MODEL,
            "voice_language": "en-US"
        }
        for k, v in default_settings.items():
            c.execute("INSERT OR IGNORE INTO app_settings (key, value) VALUES (?, ?)", (k, v))


# --- Document Operations ---
def create_document(document_name: str, file_type: str, file_size: int, domain: str, storage_path: str) -> str:
    doc_id = _gen_id("doc")
    with get_db() as conn:
        conn.execute("""
            INSERT INTO documents (
                document_id, document_name, file_type, file_size, domain,
                upload_timestamp, processing_status, chunk_count, storage_path
            ) VALUES (?, ?, ?, ?, ?, ?, 'pending', 0, ?)
        """, (doc_id, document_name, file_type, file_size, domain, time.time(), storage_path))
    return doc_id


def update_document_status(document_id: str, status: str, error_message: Optional[str] = None, chunk_count: Optional[int] = None):
    with get_db() as conn:
        if chunk_count is not None:
            conn.execute("""
                UPDATE documents
                SET processing_status = ?, error_message = ?, chunk_count = ?
                WHERE document_id = ?
            """, (status, error_message, chunk_count, document_id))
        else:
            conn.execute("""
                UPDATE documents
                SET processing_status = ?, error_message = ?
                WHERE document_id = ?
            """, (status, error_message, document_id))


def get_all_documents() -> List[Dict[str, Any]]:
    with get_db() as conn:
        rows = conn.execute("""
            SELECT document_id, document_name, file_type, file_size, domain,
                   upload_timestamp, processing_status, error_message, chunk_count
            FROM documents
            ORDER BY upload_timestamp DESC
        """).fetchall()
        return [dict(r) for r in rows]


def get_document(document_id: str) -> Optional[Dict[str, Any]]:
    with get_db() as conn:
        row = conn.execute("""
            SELECT * FROM documents WHERE document_id = ?
        """, (document_id,)).fetchone()
        return dict(row) if row else None


def delete_document(document_id: str) -> bool:
    with get_db() as conn:
        res = conn.execute("DELETE FROM documents WHERE document_id = ?", (document_id,))
        return res.rowcount > 0


# --- Chunk & Embedding Operations ---
def save_chunks_and_embeddings(document_id: str, chunks_with_embeddings: List[Dict[str, Any]]):
    """
    Saves chunks and corresponding embedding vectors into SQLite within a transaction.
    """
    now = time.time()
    with get_db() as conn:
        for chunk in chunks_with_embeddings:
            chunk_id = chunk["chunk_id"]
            conn.execute("""
                INSERT INTO chunks (
                    chunk_id, document_id, text, page_or_section,
                    chunk_position, char_count, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (
                chunk_id,
                document_id,
                chunk["text"],
                chunk.get("page_or_section", "page 1"),
                chunk.get("chunk_position", 0),
                len(chunk["text"]),
                now
            ))

            emb_id = _gen_id("emb")
            vector_json = json.dumps(chunk["vector"])
            conn.execute("""
                INSERT INTO embeddings (
                    embedding_id, chunk_id, document_id, vector_json,
                    embedding_model, dimensions, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (
                emb_id,
                chunk_id,
                document_id,
                vector_json,
                chunk.get("embedding_model", EMBEDDING_MODEL),
                len(chunk["vector"]),
                now
            ))


def get_all_indexed_chunks(domain: Optional[str] = None) -> List[Dict[str, Any]]:
    """
    Returns all chunks paired with their vectors and document metadata for vector retrieval.
    """
    with get_db() as conn:
        query = """
            SELECT
                c.chunk_id, c.document_id, c.text, c.page_or_section, c.chunk_position,
                d.document_name, d.domain,
                e.vector_json, e.dimensions, e.embedding_model
            FROM chunks c
            JOIN documents d ON c.document_id = d.document_id
            JOIN embeddings e ON c.chunk_id = e.chunk_id
            WHERE d.processing_status = 'ready'
        """
        params = []
        if domain and domain != "all":
            query += " AND d.domain = ?"
            params.append(domain)

        rows = conn.execute(query, params).fetchall()

        results = []
        for r in rows:
            results.append({
                "chunk_id": r["chunk_id"],
                "document_id": r["document_id"],
                "document_name": r["document_name"],
                "domain": r["domain"],
                "page": r["page_or_section"],
                "chunk_position": r["chunk_position"],
                "text": r["text"],
                "vector": json.loads(r["vector_json"]),
                "dimensions": r["dimensions"],
                "embedding_model": r["embedding_model"]
            })
        return results


# --- Query & Response Logging ---
def log_query(
    query_id: str,
    query_text: str,
    query_type: str,
    classification_confidence: float,
    conversation_id: str,
    domain: str,
    latency_ms: float,
    top_k: int,
    threshold: float
):
    with get_db() as conn:
        conn.execute("""
            INSERT INTO queries (
                query_id, query_text, query_type, classification_confidence,
                conversation_id, domain, latency_ms, top_k, threshold, timestamp
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            query_id, query_text, query_type, classification_confidence,
            conversation_id, domain, latency_ms, top_k, threshold, time.time()
        ))


def log_response(
    query_id: str,
    answer: str,
    confidence: float,
    confidence_label: str,
    sources: List[Dict[str, Any]],
    retrieved_context: Optional[List[str]] = None,
    generator: str = "llm"
):
    resp_id = _gen_id("resp")
    with get_db() as conn:
        conn.execute("""
            INSERT INTO responses (
                response_id, query_id, answer, confidence, confidence_label,
                sources_json, retrieved_context_json, generator, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            resp_id,
            query_id,
            answer,
            confidence,
            confidence_label,
            json.dumps(sources),
            json.dumps(retrieved_context or []),
            generator,
            time.time()
        ))


# --- Conversation Memory ---
def add_conversation_turn(
    conversation_id: str,
    role: str,
    content: str,
    query_type: Optional[str] = None,
    sources: Optional[List[Dict[str, Any]]] = None,
    entities: Optional[List[str]] = None
):
    turn_id = _gen_id("turn")
    with get_db() as conn:
        # Determine next turn index
        row = conn.execute("""
            SELECT COUNT(*) as count FROM conversation_memory WHERE conversation_id = ?
        """, (conversation_id,)).fetchone()
        turn_index = row["count"] + 1

        conn.execute("""
            INSERT INTO conversation_memory (
                id, conversation_id, turn_index, role, content,
                query_type, sources_json, entities_json, timestamp
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            turn_id,
            conversation_id,
            turn_index,
            role,
            content,
            query_type,
            json.dumps(sources or []),
            json.dumps(entities or []),
            time.time()
        ))


def get_conversation_history(conversation_id: str, limit: int = 10) -> List[Dict[str, Any]]:
    with get_db() as conn:
        rows = conn.execute("""
            SELECT id, turn_index, role, content, query_type, sources_json, timestamp
            FROM conversation_memory
            WHERE conversation_id = ?
            ORDER BY turn_index ASC
            LIMIT ?
        """, (conversation_id, limit)).fetchall()

        history = []
        for r in rows:
            history.append({
                "turn_id": r["id"],
                "role": r["role"],
                "content": r["content"],
                "query_type": r["query_type"],
                "sources": json.loads(r["sources_json"]) if r["sources_json"] else [],
                "timestamp": r["timestamp"]
            })
        return history


def get_all_conversations() -> List[Dict[str, Any]]:
    with get_db() as conn:
        rows = conn.execute("""
            SELECT conversation_id, COUNT(*) as turn_count, MAX(timestamp) as last_activity,
                   MIN(content) as preview
            FROM conversation_memory
            WHERE role = 'user'
            GROUP BY conversation_id
            ORDER BY last_activity DESC
        """).fetchall()
        return [dict(r) for r in rows]


# --- Analytics & Knowledge Gap Detection ---
def get_analytics():
    with get_db() as conn:
        # Total queries
        total_queries = conn.execute("SELECT COUNT(*) FROM queries").fetchone()[0]

        # Query types
        type_counts = {}
        for row in conn.execute("SELECT query_type, COUNT(*) as cnt FROM queries GROUP BY query_type").fetchall():
            type_counts[row["query_type"]] = row["cnt"]

        # Confidence stats
        avg_conf_row = conn.execute("SELECT AVG(confidence) FROM responses").fetchone()
        avg_confidence = round(avg_conf_row[0] or 0.0, 3)

        # Clarifications
        clarification_count = type_counts.get("ambiguous", 0)

        # Low confidence (< 0.5)
        low_confidence_count = conn.execute("""
            SELECT COUNT(*) FROM responses WHERE confidence < 0.50 AND confidence > 0.0
        """).fetchone()[0]

        # Unanswered queries (confidence == 0 or confidence_label == 'unavailable')
        unanswered_count = conn.execute("""
            SELECT COUNT(*) FROM responses WHERE confidence = 0.0 OR confidence_label = 'unavailable'
        """).fetchone()[0]

        # Document count & chunk count
        total_docs = conn.execute("SELECT COUNT(*) FROM documents WHERE processing_status='ready'").fetchone()[0]
        total_chunks = conn.execute("SELECT COUNT(*) FROM chunks").fetchone()[0]

        # Knowledge gaps: queries where confidence is low or unavailable
        gaps_rows = conn.execute("""
            SELECT q.query_text, q.query_type, q.timestamp, r.confidence, r.confidence_label
            FROM queries q
            JOIN responses r ON q.query_id = r.query_id
            WHERE r.confidence < 0.50 OR r.confidence_label = 'unavailable'
            ORDER BY q.timestamp DESC
            LIMIT 15
        """).fetchall()

        knowledge_gaps = []
        for g in gaps_rows:
            reason = "No matching document information found" if g["confidence"] == 0 else "Low retrieval confidence score"
            knowledge_gaps.append({
                "query_text": g["query_text"],
                "query_type": g["query_type"],
                "timestamp": g["timestamp"],
                "reason": reason,
                "best_score": round(g["confidence"], 3)
            })

        # Top referenced documents from sources_json
        docs_rows = conn.execute("""
            SELECT document_name, chunk_count, upload_timestamp FROM documents WHERE processing_status = 'ready'
        """).fetchall()
        top_docs = [{"document_name": d["document_name"], "chunk_count": d["chunk_count"]} for d in docs_rows]

        # Frequently asked topics (group common words / queries)
        recent_queries = conn.execute("""
            SELECT query_text, COUNT(*) as frequency FROM queries GROUP BY query_text ORDER BY frequency DESC LIMIT 8
        """).fetchall()
        frequently_asked = [{"topic": q["query_text"], "frequency": q["frequency"]} for q in recent_queries]

        return {
            "total_queries": total_queries,
            "query_types": type_counts,
            "avg_confidence": avg_confidence,
            "clarification_count": clarification_count,
            "low_confidence_count": low_confidence_count,
            "unanswered_count": unanswered_count,
            "top_referenced_documents": top_docs,
            "frequently_asked_topics": frequently_asked,
            "knowledge_gaps": knowledge_gaps,
            "total_documents": total_docs,
            "total_chunks": total_chunks
        }


# --- Settings ---
def get_settings() -> Dict[str, Any]:
    with get_db() as conn:
        rows = conn.execute("SELECT key, value FROM app_settings").fetchall()
        data = {r["key"]: r["value"] for r in rows}
        return {
            "top_k": int(data.get("top_k", DEFAULT_TOP_K)),
            "similarity_threshold": float(data.get("similarity_threshold", DEFAULT_SIMILARITY_THRESHOLD)),
            "chunk_size": int(data.get("chunk_size", DEFAULT_CHUNK_SIZE)),
            "chunk_overlap": int(data.get("chunk_overlap", DEFAULT_CHUNK_OVERLAP)),
            "embedding_model": data.get("embedding_model", EMBEDDING_MODEL),
            "llm_model": data.get("llm_model", LLM_MODEL),
            "voice_language": data.get("voice_language", "en-US")
        }


def update_settings(settings: Dict[str, Any]):
    with get_db() as conn:
        for k, v in settings.items():
            conn.execute("INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)", (k, str(v)))
