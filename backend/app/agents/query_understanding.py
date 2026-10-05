"""
Lumina AI - Query Understanding Agent (Milestone 2.1)
=====================================================
Analyzes user intent, classifies queries into 4 main categories
(factual, procedural, comparative, ambiguous, or general), detects key entities,
and determines optimal pipeline routing.
"""

import json
import re
import time
from typing import Optional, List

from app.config import LLM_MODEL
from app.schemas.models import QueryUnderstanding
from app.services.embedding import get_genai_client


def understand_query(query: str, conversation_context: Optional[str] = None) -> QueryUnderstanding:
    """
    Classifies the user query using Gemini (with robust heuristic fallback).
    Categories: factual, procedural, comparative, ambiguous, or general.
    """
    clean_q = query.strip()
    norm_q = clean_q.rstrip(".!?").strip().lower()

    # Rule-based check for common ambiguous/vague queries lacking context
    vague_exact = {
        "tell me about it", "what about it", "explain it", "how does it work",
        "what does it do", "what", "why", "how", "tell me more", "expand on that",
        "tell me about this", "what is this", "what is that"
    }
    if not conversation_context and (norm_q in vague_exact or (len(norm_q.split()) <= 4 and norm_q.endswith(" it"))):
        return QueryUnderstanding(
            query_type="ambiguous",
            confidence=0.95,
            routing="clarification",
            refined_query=clean_q,
            reasoning="Query lacks a specific subject or entity context."
        )

    client = get_genai_client()
    if client:
        prompt = f"""You are the Query Understanding Agent for Lumina AI knowledge retrieval system.

Analyze this user query:
"{clean_q}"

Context from previous conversation (if any):
"{conversation_context or 'None'}"

Classify into exactly ONE query_type:
- "factual": Specific fact, number, date, code, definition, or document data (e.g. "What is the project code?").
- "procedural": How-to, configuration steps, workflow, or installation (e.g. "How do I configure the system?").
- "comparative": Comparison or differences between two or more concepts (e.g. "What is the difference between X and Y?").
- "ambiguous": Unclear, vague, missing subject, or underspecified (e.g. "Tell me about it.").
- "general": General world knowledge, greetings, or creative requests not specific to private documents (e.g. "Hi", "What is photosynthesis?").

Determine routing:
- If ambiguous and lacks context: "clarification"
- If general conversation/greeting: "general_knowledge"
- Otherwise (factual, procedural, comparative): "retrieval"

Return ONLY valid JSON matching this schema:
{{
  "query_type": "factual",
  "confidence": 0.95,
  "routing": "retrieval",
  "refined_query": "{clean_q}",
  "detected_entities": [],
  "reasoning": "brief explanation"
}}"""
        # Try primary model and fallback to gemini-3.5-flash-lite on 503
        for model_name in [LLM_MODEL, "gemini-3.5-flash-lite"]:
            try:
                response = client.models.generate_content(
                    model=model_name,
                    contents=prompt
                )
                raw_text = response.text.strip()
                if raw_text.startswith("```json"):
                    raw_text = raw_text[7:]
                if raw_text.startswith("```"):
                    raw_text = raw_text[3:]
                if raw_text.endswith("```"):
                    raw_text = raw_text[:-3]

                data = json.loads(raw_text.strip())
                return QueryUnderstanding(
                    query_type=data.get("query_type", "factual"),
                    confidence=float(data.get("confidence", 0.9)),
                    routing=data.get("routing", "retrieval"),
                    refined_query=data.get("refined_query", clean_q),
                    detected_entities=data.get("detected_entities", []),
                    reasoning=data.get("reasoning", "")
                )
            except Exception as e:
                # If temporary spike, try next model or continue
                pass

    # Heuristic fallback
    lower_q = norm_q
    if any(lower_q.startswith(w) for w in ["hi", "hello", "hey", "good morning", "who are you"]):
        return QueryUnderstanding(
            query_type="general",
            confidence=0.9,
            routing="general_knowledge",
            refined_query=clean_q,
            reasoning="Greeting or conversational opening."
        )

    if any(w in lower_q for w in ["compare", "difference between", "versus", "vs", "similarities", "diff"]):
        q_type = "comparative"
    elif any(w in lower_q for w in ["how to", "how do i", "steps to", "procedure", "guide", "configure"]):
        q_type = "procedural"
    elif lower_q in vague_exact or len(lower_q.split()) <= 2:
        q_type = "ambiguous"
    else:
        q_type = "factual"

    routing = "clarification" if q_type == "ambiguous" else "retrieval"
    return QueryUnderstanding(
        query_type=q_type,
        confidence=0.85,
        routing=routing,
        refined_query=clean_q,
        detected_entities=[],
        reasoning="Classified via heuristic intent patterns."
    )
