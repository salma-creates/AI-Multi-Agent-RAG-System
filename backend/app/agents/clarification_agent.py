"""
Lumina AI - Clarification Agent (Milestone 3.1)
===============================================
Generates focused clarification questions when a query is ambiguous,
incomplete, or missing context. Refines ambiguous queries when the user responds.
"""

from typing import Optional, Dict, Any
from app.config import LLM_MODEL
from app.services.embedding import get_genai_client


def generate_clarification_prompt(ambiguous_query: str, reason: Optional[str] = None) -> str:
    """
    Generates a targeted, helpful clarification request rather than a generic prompt.
    """
    client = get_genai_client()
    if client:
        prompt = f"""You are the Clarification Agent for Lumina AI knowledge retrieval platform.
The user asked an ambiguous or incomplete question:
"{ambiguous_query}"

Issue: {reason or 'The query lacks a specific subject, entity, or action.'}

Generate a friendly, concise clarification question (1-2 sentences maximum) asking the user specifically what topic, agent, or document section they would like to know about.
Do not provide answers or guess wildly. Just ask for the missing detail clearly."""
        try:
            resp = client.models.generate_content(
                model=LLM_MODEL,
                contents=prompt
            )
            text = resp.text.strip()
            if text:
                return text
        except Exception as e:
            print(f"[Clarification Agent] LLM prompt error: {e}")

    # Fallback clarification questions based on keywords
    lower = ambiguous_query.lower()
    if "it" in lower:
        return "Could you clarify what specific feature, agent, or document you are referring to by 'it'?"
    return f"Could you provide a bit more detail about what you'd like to know regarding '{ambiguous_query}'?"


def combine_query_and_clarification(original_query: str, clarification_answer: str) -> str:
    """
    Merges an ambiguous query with the user's clarification into a unified, actionable query.
    """
    client = get_genai_client()
    if client:
        prompt = f"""Combine the following ambiguous query and user clarification into a single clear, search-ready question.

Original query: "{original_query}"
User clarification: "{clarification_answer}"

Output ONLY the revised, consolidated question without any surrounding quotes or explanations."""
        try:
            resp = client.models.generate_content(
                model=LLM_MODEL,
                contents=prompt
            )
            text = resp.text.strip().strip('"').strip("'")
            if text:
                return text
        except Exception as e:
            print(f"[Clarification Merge] Error: {e}")

    # Heuristic merge
    return f"{original_query.rstrip('?')} regarding {clarification_answer}?"
