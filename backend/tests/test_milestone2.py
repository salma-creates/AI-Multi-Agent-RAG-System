"""
Lumina AI - Milestone 2 Test Suite
==================================
Tests:
1. Query Understanding Agent Classification (Factual, Procedural, Comparative, Ambiguous)
2. Clarification Agent (Targeted prompt generation & clarification merging)
3. Retrieval Agent (Ranked chunk retrieval with metadata)
4. Response Generation Agent with Anti-Hallucination & Unavailable-Information handling
5. Full Multi-Agent Pipeline End-to-End Execution
"""

import sys
from pathlib import Path

backend_path = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_path))

from app.models.db import init_db
from app.services.vector_store import vector_store
from app.schemas.models import QueryRequest
from app.agents.query_understanding import understand_query
from app.agents.clarification_agent import generate_clarification_prompt, combine_query_and_clarification
from app.agents.orchestrator import process_query_pipeline


def run_milestone2_tests():
    print("=" * 60)
    print("RUNNING LUMINA AI — MILESTONE 2 MULTI-AGENT PIPELINE TESTS")
    print("=" * 60)

    # Make sure DB & vector store are loaded
    init_db()
    vector_store.load_from_db()

    # 1. Query Understanding Agent Tests
    print("\n[Step 1] Testing Query Understanding Agent...")

    # Test Factual
    q_fac = "What is the project code?"
    u_fac = understand_query(q_fac)
    print(f"-> Query: '{q_fac}' => type: {u_fac.query_type}, routing: {u_fac.routing}")
    assert u_fac.query_type == "factual"
    assert u_fac.routing == "retrieval"

    # Test Procedural
    q_proc = "How do I configure HPA autoscaling step by step?"
    u_proc = understand_query(q_proc)
    print(f"-> Query: '{q_proc}' => type: {u_proc.query_type}, routing: {u_proc.routing}")
    assert u_proc.query_type == "procedural"
    assert u_proc.routing == "retrieval"

    # Test Comparative
    q_comp = "What is the difference between RTO and RPO?"
    u_comp = understand_query(q_comp)
    print(f"-> Query: '{q_comp}' => type: {u_comp.query_type}, routing: {u_comp.routing}")
    assert u_comp.query_type == "comparative"
    assert u_comp.routing == "retrieval"

    # Test Ambiguous
    q_amb = "Tell me about it."
    u_amb = understand_query(q_amb)
    print(f"-> Query: '{q_amb}' => type: {u_amb.query_type}, routing: {u_amb.routing}")
    assert u_amb.query_type == "ambiguous"
    assert u_amb.routing == "clarification"

    # 2. Clarification Agent Tests
    print("\n[Step 2] Testing Clarification Agent...")
    clarification_prompt = generate_clarification_prompt(q_amb)
    print(f"-> Generated Clarification: '{clarification_prompt}'")
    assert len(clarification_prompt) > 10

    merged = combine_query_and_clarification(q_amb, "I mean the Retrieval Agent")
    print(f"-> Merged Query: '{merged}'")
    assert "Retrieval Agent" in merged

    # 3. Grounded Response Generation (Factual grounded query)
    print("\n[Step 3] Testing Grounded Response on Benchmark Fact...")
    req_fact = QueryRequest(query="What is the unique project code for the Lumina RAG test?", top_k=3)
    resp_fact = process_query_pipeline(req_fact)
    print(f"-> Answer: {resp_fact.answer}")
    print(f"-> Confidence: {resp_fact.confidence} ({resp_fact.confidence_label})")
    print(f"-> Sources: {[s.document_name for s in resp_fact.sources]}")
    assert "LUMINA-8472" in resp_fact.answer
    assert resp_fact.confidence > 0.60
    assert len(resp_fact.sources) > 0

    # 4. Anti-Hallucination & Unavailable Information Test
    print("\n[Step 4] Testing Anti-Hallucination on Unavailable Question...")
    req_unavail = QueryRequest(query="Who created Lumina AI and what is their full name?", top_k=3)
    resp_unavail = process_query_pipeline(req_unavail)
    print(f"-> Answer: {resp_unavail.answer}")
    print(f"-> Confidence: {resp_unavail.confidence} ({resp_unavail.confidence_label})")
    # Verify the model did not invent a person name and correctly declared unavailability
    lower_ans = resp_unavail.answer.lower()
    assert (
        "not contain" in lower_ans
        or "unavailable" in lower_ans
        or "does not specify" in lower_ans
        or "not mentioned" in lower_ans
        or "not available" in lower_ans
        or "do not provide" in lower_ans
    )
    assert resp_unavail.confidence_label == "unavailable" or resp_unavail.confidence < 0.50

    # 5. Full Orchestration on Procedural Query
    print("\n[Step 5] Testing End-to-End Orchestrator on Procedural Query...")
    req_proc = QueryRequest(query="What are the steps to configure the Horizontal Pod Autoscaler?", top_k=3)
    resp_proc = process_query_pipeline(req_proc)
    print(f"-> Query Type: {resp_proc.query_type}")
    print(f"-> Answer: {resp_proc.answer[:180]}...")
    print(f"-> Sources: {[s.document_name for s in resp_proc.sources]}")
    assert resp_proc.query_type == "procedural"
    assert len(resp_proc.sources) > 0
    assert "CLOUD_DEVOPS_GUIDE.txt" in [s.document_name for s in resp_proc.sources]

    print("\n" + "=" * 60)
    print("ALL MILESTONE 2 MULTI-AGENT TESTS PASSED SUCCESSFULLY!")
    print("=" * 60)


if __name__ == "__main__":
    run_milestone2_tests()
