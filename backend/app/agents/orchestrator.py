"""
Lumina AI - Multi-Agent Orchestrator (Milestone 2.4)
===================================================
Coordinates the 5 specialized AI agents into an automated query resolution pipeline:
  User Query
      ↓
  Conversation Memory Agent (Entity / Pronoun Resolution)
      ↓
  Query Understanding Agent (Intent Classification & Routing)
      ↓
  [If Ambiguous] → Clarification Agent → User Prompt
  [If General]   → Response Generation Agent (General AI Mode)
  [If Grounded]  → Retrieval Agent (Top-K Semantic Vector Search)
                        ↓
                 Response Generation Agent (Strict Evidence Grounding & Citations)
      ↓
  Persistence & Analytics Logging
"""

import time
import uuid
from typing import Dict, Any, Optional

from app.schemas.models import QueryRequest, QueryResponse, RetrievedChunk
from app.agents.query_understanding import understand_query
from app.agents.retrieval_agent import retrieve_relevant_chunks
from app.agents.response_generation import generate_grounded_response
from app.agents.clarification_agent import generate_clarification_prompt, combine_query_and_clarification
from app.agents.memory_agent import resolve_followup_query, record_turn
from app.models.db import log_query, log_response, get_settings
from app.config import EMBEDDING_MODEL, LLM_MODEL


def process_query_pipeline(request: QueryRequest) -> QueryResponse:
    start_time = time.time()
    query_id = f"qry_{uuid.uuid4().hex[:12]}"
    conv_id = request.conversation_id or f"conv_{uuid.uuid4().hex[:12]}"

    raw_query = request.query.strip()
    active_query = raw_query

    # Step 0: Check if this is a response to a prior clarification
    if request.clarification_response:
        active_query = combine_query_and_clarification(raw_query, request.clarification_response)
        print(f"[Orchestrator] Merged clarification: '{active_query}'")

    # Step 1: Conversation Memory Agent (Contextual pronoun resolution)
    resolved_query = resolve_followup_query(active_query, conv_id)
    if resolved_query != active_query:
        print(f"[Orchestrator] Memory Agent resolved follow-up to: '{resolved_query}'")
        active_query = resolved_query

    # Step 2: Query Understanding Agent
    understanding = understand_query(active_query)
    print(f"[Orchestrator] Understanding: type='{understanding.query_type}', routing='{understanding.routing}', conf={understanding.confidence}")

    # Settings overrides if not provided
    settings = get_settings()
    top_k = request.top_k or settings.get("top_k", 3)
    threshold = request.similarity_threshold or settings.get("similarity_threshold", 0.60)
    domain = request.domain or "all"

    # Step 3: Routing Decision
    # --- Branch 1: Ambiguous -> Clarification Agent ---
    if understanding.routing == "clarification":
        clarification_msg = generate_clarification_prompt(active_query, understanding.reasoning)
        latency = (time.time() - start_time) * 1000.0

        # Log query & memory
        log_query(
            query_id=query_id,
            query_text=active_query,
            query_type="ambiguous",
            classification_confidence=understanding.confidence,
            conversation_id=conv_id,
            domain=domain,
            latency_ms=latency,
            top_k=top_k,
            threshold=threshold
        )
        log_response(
            query_id=query_id,
            answer=clarification_msg,
            confidence=0.0,
            confidence_label="unavailable",
            sources=[]
        )
        record_turn(conv_id, "user", raw_query, query_type="ambiguous")
        record_turn(conv_id, "assistant", clarification_msg, query_type="ambiguous")

        return QueryResponse(
            query_id=query_id,
            query=raw_query,
            answer=clarification_msg,
            confidence=0.0,
            confidence_label="unavailable",
            query_type="ambiguous",
            classification_confidence=understanding.confidence,
            routing="clarification",
            sources=[],
            conversation_id=conv_id,
            requires_clarification=True,
            clarification_prompt=clarification_msg,
            latency_ms=round(latency, 2),
            embedding_model=EMBEDDING_MODEL,
            llm_model=LLM_MODEL
        )

    # --- Branch 2: General Conversation -> Direct General AI ---
    if understanding.routing == "general_knowledge":
        answer, conf, label = generate_grounded_response(active_query, [], is_general=True)
        latency = (time.time() - start_time) * 1000.0

        log_query(
            query_id=query_id,
            query_text=active_query,
            query_type="general",
            classification_confidence=understanding.confidence,
            conversation_id=conv_id,
            domain=domain,
            latency_ms=latency,
            top_k=top_k,
            threshold=threshold
        )
        log_response(
            query_id=query_id,
            answer=answer,
            confidence=conf,
            confidence_label=label,
            sources=[]
        )
        record_turn(conv_id, "user", raw_query, query_type="general")
        record_turn(conv_id, "assistant", answer, query_type="general")

        return QueryResponse(
            query_id=query_id,
            query=raw_query,
            answer=answer,
            confidence=conf,
            confidence_label=label,
            query_type="general",
            classification_confidence=understanding.confidence,
            routing="general_knowledge",
            sources=[],
            conversation_id=conv_id,
            is_general_knowledge=True,
            latency_ms=round(latency, 2),
            embedding_model=EMBEDDING_MODEL,
            llm_model=LLM_MODEL
        )

    # --- Branch 3: Document Retrieval & Grounded Generation ---
    # Step 4: Retrieval Agent
    retrieved_chunks = retrieve_relevant_chunks(
        query=understanding.refined_query or active_query,
        top_k=top_k,
        threshold=threshold,
        domain=domain
    )
    print(f"[Orchestrator] Retrieved {len(retrieved_chunks)} chunks above threshold {threshold}")

    # Step 5: Response Generation Agent
    answer, conf, label = generate_grounded_response(
        query=active_query,
        retrieved_chunks=retrieved_chunks,
        is_general=False
    )
    latency = (time.time() - start_time) * 1000.0

    # Step 6: Log analytics & conversation memory
    sources_data = [c.model_dump() for c in retrieved_chunks]
    log_query(
        query_id=query_id,
        query_text=active_query,
        query_type=understanding.query_type,
        classification_confidence=understanding.confidence,
        conversation_id=conv_id,
        domain=domain,
        latency_ms=latency,
        top_k=top_k,
        threshold=threshold
    )
    log_response(
        query_id=query_id,
        answer=answer,
        confidence=conf,
        confidence_label=label,
        sources=sources_data
    )
    record_turn(conv_id, "user", raw_query, query_type=understanding.query_type)
    record_turn(conv_id, "assistant", answer, query_type=understanding.query_type, sources=sources_data)

    return QueryResponse(
        query_id=query_id,
        query=raw_query,
        answer=answer,
        confidence=conf,
        confidence_label=label,
        query_type=understanding.query_type,
        classification_confidence=understanding.confidence,
        routing="retrieval",
        sources=retrieved_chunks,
        conversation_id=conv_id,
        is_general_knowledge=False,
        latency_ms=round(latency, 2),
        embedding_model=EMBEDDING_MODEL,
        llm_model=LLM_MODEL
    )
