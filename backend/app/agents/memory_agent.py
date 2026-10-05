"""
Lumina AI - Conversation Memory Agent (Milestone 3.2)
=====================================================
Maintains persistent multi-turn conversation memory, resolves ambiguous
pronouns ("it", "they", "that agent"), extracts referenced entities,
and provides compact, relevant history without token bloat.
"""

from typing import List, Dict, Any, Optional
from app.config import LLM_MODEL
from app.models.db import get_conversation_history, add_conversation_turn
from app.services.embedding import get_genai_client


def resolve_followup_query(
    current_query: str,
    conversation_id: str
) -> str:
    """
    Inspects recent conversation turns. If the current query contains pronouns
    (e.g., 'it', 'what does it do', 'how do they work'), resolves them using prior context.
    """
    if not conversation_id:
        return current_query

    history = get_conversation_history(conversation_id, limit=4)
    if not history:
        return current_query

    # Quick check if query contains pronoun references
    query_lower = current_query.lower()
    pronouns = [" it", " it?", " its ", " that ", " this ", " they ", " their ", " them "]
    has_pronoun = any(p in query_lower for p in pronouns) or len(current_query.split()) <= 4

    if not has_pronoun:
        return current_query

    # Format compact context summary
    context_lines = []
    for turn in history[-3:]:
        context_lines.append(f"{turn['role'].capitalize()}: {turn['content'][:250]}")
    context_str = "\n".join(context_lines)

    client = get_genai_client()
    if client:
        prompt = f"""You are the Conversation Memory Agent for Lumina AI.
Given the recent conversation history:
{context_str}

And the user's latest follow-up question:
"{current_query}"

Rewrite the follow-up question into a standalone, explicit search query by replacing ambiguous pronouns ('it', 'that', 'they') with the specific entity or topic being discussed.
If the question is already standalone, return it as is.
Return ONLY the rewritten question text."""
        try:
            resp = client.models.generate_content(
                model=LLM_MODEL,
                contents=prompt
            )
            rewritten = resp.text.strip().strip('"').strip("'")
            if rewritten and len(rewritten) > 3:
                return rewritten
        except Exception as e:
            print(f"[Memory Agent Error] Query rewrite failed: {e}")

    return current_query


def record_turn(
    conversation_id: str,
    role: str,
    content: str,
    query_type: Optional[str] = None,
    sources: Optional[List[Dict[str, Any]]] = None
):
    """Saves turn to persistent database memory."""
    if not conversation_id:
        return
    add_conversation_turn(
        conversation_id=conversation_id,
        role=role,
        content=content,
        query_type=query_type,
        sources=sources
    )
