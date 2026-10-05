"""
Lumina AI - Retrieval Agent (Milestone 1.4 / Milestone 2.2)
===========================================================
Performs semantic vector search across indexed knowledge documents.
Generates query embeddings, calculates cosine relevance, ranks results,
and returns Top-K chunks with metadata.
"""

from typing import List, Dict, Any, Optional

from app.services.embedding import generate_embedding
from app.services.vector_store import vector_store
from app.schemas.models import RetrievedChunk


def retrieve_relevant_chunks(
    query: str,
    top_k: int = 3,
    threshold: float = 0.60,
    domain: Optional[str] = "all"
) -> List[RetrievedChunk]:
    """
    Executes semantic vector retrieval:
    1. Embeds user query using Gemini embedding model
    2. Searches vector store for nearest chunks
    3. Calculates cosine similarity
    4. Filters out chunks below threshold
    5. Returns Top-K ranked chunks
    """
    if not query or not query.strip():
        return []

    # 1. Generate query embedding
    query_vector = generate_embedding(query.strip())

    # 2. Vector search & similarity ranking
    raw_results = vector_store.search(
        query_vector=query_vector,
        top_k=top_k,
        threshold=threshold,
        domain=domain
    )

    # 3. Format as structured RetrievedChunk models
    results: List[RetrievedChunk] = []
    for item in raw_results:
        results.append(RetrievedChunk(
            chunk_id=item["chunk_id"],
            document_id=item["document_id"],
            document_name=item["document_name"],
            page=item["page"],
            text=item["text"],
            relevance_score=item["relevance_score"],
            chunk_position=item["chunk_position"]
        ))

    return results
