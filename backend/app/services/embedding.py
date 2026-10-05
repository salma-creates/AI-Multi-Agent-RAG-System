"""
Lumina AI - Embedding Service (Milestone 1.3 / M1.4)
===================================================
Generates real dense vector embeddings using Google Gemini API (`gemini-embedding-001`).
Features robust batching, caching, and fallback handling.
"""

import math
import re
import hashlib
from typing import List, Union
from google import genai

from app.config import GEMINI_API_KEY, EMBEDDING_MODEL, HAS_GEMINI_KEY

# Cached genai client instance
_client = None


def get_genai_client():
    global _client
    if _client is None and HAS_GEMINI_KEY:
        try:
            _client = genai.Client(api_key=GEMINI_API_KEY)
        except Exception as e:
            print(f"[Warning] Failed to initialize Google GenAI Client: {e}")
            _client = None
    return _client


def _local_dense_vector(text: str, dimensions: int = 384) -> List[float]:
    """
    Deterministic dense feature vector generator used only if API is unreachable.
    Computes hashing-trick n-gram feature distribution and L2-normalizes it.
    """
    vec = [0.0] * dimensions
    tokens = re.findall(r"\b[a-zA-Z0-9_-]+\b", text.lower())
    if not tokens:
        return vec

    for i in range(len(tokens)):
        token = tokens[i]
        h1 = int(hashlib.sha256(token.encode("utf-8")).hexdigest()[:8], 16) % dimensions
        vec[h1] += 1.0
        # Bigram
        if i + 1 < len(tokens):
            bigram = f"{token}_{tokens[i+1]}"
            h2 = int(hashlib.md5(bigram.encode("utf-8")).hexdigest()[:8], 16) % dimensions
            vec[h2] += 1.5

    norm = math.sqrt(sum(x * x for x in vec))
    if norm > 0:
        vec = [round(x / norm, 6) for x in vec]
    return vec


def generate_embedding(text: str) -> List[float]:
    """
    Generates embedding for a single text string using Gemini gemini-embedding-001.
    """
    client = get_genai_client()
    if client:
        try:
            response = client.models.embed_content(
                model=EMBEDDING_MODEL,
                contents=text
            )
            # Handle SDK response attributes
            if hasattr(response, "embedding"):
                emb = response.embedding
                values = emb.values if hasattr(emb, "values") else emb
                return list(values)
            elif hasattr(response, "embeddings") and len(response.embeddings) > 0:
                emb = response.embeddings[0]
                values = emb.values if hasattr(emb, "values") else emb
                return list(values)
        except Exception as e:
            print(f"[Embedding Error] Gemini API call failed: {e}. Falling back to deterministic dense vector.")

    return _local_dense_vector(text)


def generate_batch_embeddings(texts: List[str], batch_size: int = 16) -> List[List[float]]:
    """
    Generates embeddings for a list of texts in batches.
    """
    if not texts:
        return []

    client = get_genai_client()
    results = []

    if client:
        try:
            # Process in batches
            for i in range(0, len(texts), batch_size):
                batch = texts[i:i + batch_size]
                # Embed individually or in batch
                batch_vectors = []
                for item in batch:
                    vec = generate_embedding(item)
                    batch_vectors.append(vec)
                results.extend(batch_vectors)
            return results
        except Exception as e:
            print(f"[Embedding Batch Error] {e}. Falling back to deterministic dense vectors.")

    # Fallback
    return [_local_dense_vector(t) for t in texts]
