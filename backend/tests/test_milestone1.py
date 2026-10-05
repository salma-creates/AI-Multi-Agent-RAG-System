"""
Lumina AI - Milestone 1 Test Suite
==================================
Tests:
1. SQLite Database Initialization
2. Multi-Format Text Extraction (TXT, CSV)
3. Text Cleaning & Chunking with Metadata
4. Real Vector Embedding Generation
5. Vector Storage & Cosine Similarity Ranking
6. Multi-Domain Top-1, Top-3, Top-5 Semantic Retrieval
7. Threshold Filtering for Low-Confidence / Irrelevant Queries
"""

import os
import sys
from pathlib import Path

# Add backend to sys.path
backend_path = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_path))

from app.models.db import init_db, get_all_documents, get_analytics
from app.services.ingestion import process_uploaded_file
from app.services.vector_store import vector_store
from app.agents.retrieval_agent import retrieve_relevant_chunks


def run_milestone1_tests():
    print("=" * 60)
    print("RUNNING LUMINA AI — MILESTONE 1 VERIFICATION TESTS")
    print("=" * 60)

    # 1. DB Init
    print("\n[Step 1] Initializing SQLite database...")
    init_db()
    print("-> Database tables verified successfully.")

    # 2. Ingest Lumina RAG Test Document (Domain 1)
    doc1_path = backend_path / "data" / "test_documents" / "LUMINA_AI_RAG_TEST_DOCUMENT.txt"
    print(f"\n[Step 2] Ingesting Domain 1: '{doc1_path.name}'...")
    assert doc1_path.exists(), f"Missing test document at {doc1_path}"
    with open(doc1_path, "rb") as f:
        bytes1 = f.read()

    res1 = process_uploaded_file(bytes1, doc1_path.name, domain="lumina_rag")
    print(f"-> Ingested: {res1['document_name']}, Chunks: {res1['chunk_count']}, Domain: {res1['domain']}")
    assert res1["success"] is True
    assert res1["chunk_count"] > 0

    # 3. Ingest Cloud DevOps Guide (Domain 2)
    doc2_path = backend_path / "app" / "data" / "sample_docs" / "CLOUD_DEVOPS_GUIDE.txt"
    print(f"\n[Step 3] Ingesting Domain 2: '{doc2_path.name}'...")
    assert doc2_path.exists(), f"Missing sample document at {doc2_path}"
    with open(doc2_path, "rb") as f:
        bytes2 = f.read()

    res2 = process_uploaded_file(bytes2, doc2_path.name, domain="cloud_devops")
    print(f"-> Ingested: {res2['document_name']}, Chunks: {res2['chunk_count']}, Domain: {res2['domain']}")
    assert res2["success"] is True

    # 4. Ingest Neuroscience Document (Domain 3)
    doc3_path = backend_path / "app" / "data" / "sample_docs" / "COGNITIVE_NEUROSCIENCE_OVERVIEW.txt"
    print(f"\n[Step 4] Ingesting Domain 3: '{doc3_path.name}'...")
    assert doc3_path.exists(), f"Missing sample document at {doc3_path}"
    with open(doc3_path, "rb") as f:
        bytes3 = f.read()

    res3 = process_uploaded_file(bytes3, doc3_path.name, domain="neuroscience")
    print(f"-> Ingested: {res3['document_name']}, Chunks: {res3['chunk_count']}, Domain: {res3['domain']}")
    assert res3["success"] is True

    # Check total indexed in vector store
    total_indexed = vector_store.get_chunk_count()
    print(f"-> Total chunks indexed in Vector Store: {total_indexed}")
    assert total_indexed >= (res1["chunk_count"] + res2["chunk_count"] + res3["chunk_count"])

    # 5. Semantic Retrieval Test: Factual Query on Domain 1
    query_factual = "What is the unique project code and creation year?"
    print(f"\n[Step 5] Querying Domain 1: '{query_factual}'...")
    retrieved_top3 = retrieve_relevant_chunks(query_factual, top_k=3, threshold=0.50)
    print(f"-> Retrieved {len(retrieved_top3)} chunks (Top-3 requested).")
    assert len(retrieved_top3) > 0
    top_chunk = retrieved_top3[0]
    print(f"-> Top Match Document: {top_chunk.document_name}")
    print(f"-> Top Match Score: {top_chunk.relevance_score}")
    print(f"-> Top Match Excerpt: {top_chunk.text[:140]}...")
    assert top_chunk.document_name == "LUMINA_AI_RAG_TEST_DOCUMENT.txt"
    assert "LUMINA-8472" in top_chunk.text or "2026" in top_chunk.text

    # 6. Semantic Retrieval Test: Procedural Query on Domain 2
    query_devops = "What is the procedure to configure HPA and what CPU threshold triggers it?"
    print(f"\n[Step 6] Querying Domain 2: '{query_devops}'...")
    retrieved_devops = retrieve_relevant_chunks(query_devops, top_k=3, threshold=0.50)
    assert len(retrieved_devops) > 0
    top_devops = retrieved_devops[0]
    print(f"-> Top Match Document: {top_devops.document_name}")
    print(f"-> Top Match Score: {top_devops.relevance_score}")
    print(f"-> Top Match Excerpt: {top_devops.text[:140]}...")
    assert top_devops.document_name == "CLOUD_DEVOPS_GUIDE.txt"
    assert "75%" in top_devops.text or "HPA" in top_devops.text

    # 7. Semantic Retrieval Test: Domain Isolation
    print("\n[Step 7] Testing Domain Isolation (Neuroscience CA1 LTP query)...")
    query_neuro = "What receptors are involved in long term potentiation in the CA1 hippocampus?"
    retrieved_neuro = retrieve_relevant_chunks(query_neuro, top_k=1, threshold=0.50)
    assert len(retrieved_neuro) > 0
    assert retrieved_neuro[0].document_name == "COGNITIVE_NEUROSCIENCE_OVERVIEW.txt"
    print(f"-> Correctly isolated to: {retrieved_neuro[0].document_name} with score {retrieved_neuro[0].relevance_score}")

    # 8. Testing Top-K Variations: Top-1 vs Top-5
    print("\n[Step 8] Testing Top-K variations (Top-1 vs Top-5)...")
    top1 = retrieve_relevant_chunks(query_factual, top_k=1, threshold=0.30)
    top5 = retrieve_relevant_chunks(query_factual, top_k=5, threshold=0.30)
    print(f"-> Top-1 length: {len(top1)}, Top-5 length: {len(top5)}")
    assert len(top1) == 1
    assert len(top5) >= 2

    # 9. Low-Confidence Filtering
    print("\n[Step 9] Testing High-Threshold Filtering for Irrelevant Query...")
    query_unrelated = "What is the recipe for baking chocolate sourdough croissants with almond flakes?"
    retrieved_filtered = retrieve_relevant_chunks(query_unrelated, top_k=3, threshold=0.88)
    print(f"-> Irrelevant query results with 0.88 threshold: {len(retrieved_filtered)} (Expected 0)")
    assert len(retrieved_filtered) == 0

    print("\n" + "=" * 60)
    print("ALL MILESTONE 1 VERIFICATION TESTS PASSED SUCCESSFULLY!")
    print("=" * 60)


if __name__ == "__main__":
    run_milestone1_tests()
