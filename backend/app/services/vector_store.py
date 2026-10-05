"""
Lumina AI - Vector Store & Semantic Retrieval (Milestone 1.4)
============================================================
In-memory vector similarity search engine backed by SQLite persistence.
Implements cosine similarity, Top-K ranking, and threshold filtering.
"""

import math
from typing import List, Dict, Any, Optional

from app.models.db import get_all_indexed_chunks, delete_document as db_delete_document


class VectorStore:
    def __init__(self):
        # List of indexed chunk items:
        # { chunk_id, document_id, document_name, domain, page, chunk_position, text, vector, norm }
        self._chunks: List[Dict[str, Any]] = []
        self._is_loaded = False

    def load_from_db(self):
        """Loads all existing chunks and embedding vectors from the database."""
        raw_chunks = get_all_indexed_chunks()
        self._chunks = []
        for c in raw_chunks:
            vec = c["vector"]
            norm = math.sqrt(sum(x * x for x in vec)) if vec else 0.0
            self._chunks.append({
                "chunk_id": c["chunk_id"],
                "document_id": c["document_id"],
                "document_name": c["document_name"],
                "domain": c["domain"],
                "page": c["page"],
                "chunk_position": c["chunk_position"],
                "text": c["text"],
                "vector": vec,
                "norm": norm
            })
        self._is_loaded = True
        print(f"[VectorStore] Loaded {len(self._chunks)} chunks into active memory index.")

    def add_chunks(self, chunks_with_vectors: List[Dict[str, Any]]):
        """Adds newly processed document chunks to the active memory index immediately."""
        for c in chunks_with_vectors:
            vec = c["vector"]
            norm = math.sqrt(sum(x * x for x in vec)) if vec else 0.0
            self._chunks.append({
                "chunk_id": c["chunk_id"],
                "document_id": c["document_id"],
                "document_name": c["document_name"],
                "domain": c.get("domain", "general"),
                "page": c.get("page_or_section", "Page 1"),
                "chunk_position": c.get("chunk_position", 1),
                "text": c["text"],
                "vector": vec,
                "norm": norm
            })
        print(f"[VectorStore] Added {len(chunks_with_vectors)} chunks. Total indexed: {len(self._chunks)}")

    def remove_document(self, document_id: str):
        """Removes all chunks belonging to a document from the memory index and database."""
        self._chunks = [c for c in self._chunks if c["document_id"] != document_id]
        db_delete_document(document_id)
        print(f"[VectorStore] Removed document {document_id}. Remaining chunks: {len(self._chunks)}")

    @staticmethod
    def cosine_similarity(vec_a: List[float], norm_a: float, vec_b: List[float], norm_b: float) -> float:
        """Calculates cosine similarity between two vectors."""
        if norm_a == 0.0 or norm_b == 0.0:
            return 0.0
        # Dot product
        # If dimensions match, compute sum of products
        limit = min(len(vec_a), len(vec_b))
        dot = sum(vec_a[i] * vec_b[i] for i in range(limit))
        score = dot / (norm_a * norm_b)
        return max(0.0, min(1.0, score))

    def search(
        self,
        query_vector: List[float],
        top_k: int = 3,
        threshold: float = 0.60,
        domain: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Executes semantic vector search:
        1. Calculates cosine similarity against all indexed chunks
        2. Ranks candidate chunks in descending order of similarity
        3. Filters out any chunks with score < threshold
        4. Returns Top-K results with full metadata
        """
        if not self._is_loaded:
            self.load_from_db()

        if not self._chunks or not query_vector:
            return []

        query_norm = math.sqrt(sum(x * x for x in query_vector))
        if query_norm == 0.0:
            return []

        scored_candidates = []

        for chunk in self._chunks:
            # Domain filter if requested
            if domain and domain != "all" and chunk.get("domain") != domain:
                continue

            similarity = self.cosine_similarity(
                query_vector,
                query_norm,
                chunk["vector"],
                chunk["norm"]
            )

            # Keep candidate if meets threshold
            if similarity >= threshold:
                scored_candidates.append({
                    "chunk_id": chunk["chunk_id"],
                    "document_id": chunk["document_id"],
                    "document_name": chunk["document_name"],
                    "page": chunk["page"],
                    "chunk_position": chunk["chunk_position"],
                    "text": chunk["text"],
                    "relevance_score": round(similarity, 4)
                })

        # Rank by score descending
        scored_candidates.sort(key=lambda item: item["relevance_score"], reverse=True)

        # Return Top-K
        return scored_candidates[:top_k]

    def get_chunk_count(self) -> int:
        return len(self._chunks)


# Global singleton instance
vector_store = VectorStore()
