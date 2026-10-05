"""
Lumina AI - Response Generation Agent (Milestone 2.3)
=====================================================
Generates strictly grounded answers using retrieved document chunks and Gemini LLM.
Enforces anti-hallucination rules, source citations, confidence calibration,
and transparent distinction between Document Knowledge and General AI Knowledge.
"""

from typing import List, Dict, Any, Tuple
from app.config import LLM_MODEL
from app.schemas.models import RetrievedChunk
from app.services.embedding import get_genai_client


def generate_grounded_response(
    query: str,
    retrieved_chunks: List[RetrievedChunk],
    is_general: bool = False
) -> Tuple[str, float, str]:
    """
    Generates response from retrieved chunks or general knowledge.
    Returns: (answer_text, confidence_score, confidence_label)
    """
    client = get_genai_client()

    # --- Scenario A: General Knowledge / Conversational ---
    if is_general:
        if not client:
            return (
                "Hello! I am Lumina AI, your multi-agent knowledge retrieval assistant. "
                "You can upload documents (PDF, DOCX, TXT, CSV) and ask questions grounded in your private knowledge base.",
                1.0,
                "high"
            )

        prompt = f"""You are Lumina AI Assistant.
The user asked a general conversation question or greeting:
"{query}"

Respond concisely, politely, and helpfully.
Note: You are responding from General AI Knowledge, not from uploaded private documents.
Keep the response within 2-3 sentences."""
        for m in [LLM_MODEL, "gemini-3.5-flash-lite"]:
            try:
                resp = client.models.generate_content(
                    model=m,
                    contents=prompt
                )
                return (resp.text.strip(), 0.95, "high")
            except Exception:
                continue
        return ("Hello! I am Lumina AI Assistant. How can I assist you with your knowledge base today?", 0.90, "high")

    # --- Scenario B: Document-grounded query with NO matching chunks ---
    if not retrieved_chunks:
        return (
            "I could not find relevant information in your uploaded documents to answer this question. "
            "Please ensure the document containing this information is uploaded and processed.",
            0.0,
            "unavailable"
        )

    # --- Scenario C: Document-grounded query with retrieved chunks ---
    context_blocks = []
    for idx, c in enumerate(retrieved_chunks, start=1):
        context_blocks.append(
            f"--- SOURCE [{idx}] ---\n"
            f"Document: {c.document_name} | {c.page}\n"
            f"Content:\n{c.text}\n"
        )
    context_str = "\n".join(context_blocks)

    system_prompt = f"""You are the Response Generation Agent for Lumina AI — Multi-Agent Knowledge Retrieval System.

YOUR TASK:
Answer the user question using ONLY the provided RETRIEVED SOURCES.

USER QUESTION:
"{query}"

RETRIEVED SOURCES:
{context_str}

CRITICAL ANTI-HALLUCINATION RULES:
1. ONLY state facts that are explicitly mentioned in the RETRIEVED SOURCES.
2. DO NOT assume, extrapolate, or invent names, dates, numbers, or facts.
3. If the retrieved sources DO NOT contain the answer (e.g. if the question asks for a creator, author, date, or detail not in the text), state clearly:
   "The available knowledge documents do not contain information regarding this topic."
4. DO NOT invent person names or attributes under any circumstances.
5. In your answer, cite sources naturally (e.g., "According to [Document Name, Page X]...").
6. Keep the answer clear, professional, and well-structured with markdown where helpful.

Answer:"""

    answer_text = ""
    if client:
        for m in [LLM_MODEL, "gemini-3.5-flash-lite"]:
            try:
                resp = client.models.generate_content(
                    model=m,
                    contents=system_prompt
                )
                answer_text = resp.text.strip()
                if answer_text:
                    break
            except Exception as e:
                print(f"[Response Gen Warning] Model {m} failed: {e}. Trying fallback.")

    if not answer_text:
        # Fallback if no LLM: extractive grounded answer
        top = retrieved_chunks[0]
        answer_text = (
            f"According to {top.document_name} ({top.page}):\n\n"
            f"{top.text[:350]}..."
        )

    # Calibrate confidence score based on the highest chunk relevance score
    best_score = max(c.relevance_score for c in retrieved_chunks)

    # Check if the LLM declared information unavailable
    lower_ans = answer_text.lower()
    if (
        "do not contain" in lower_ans
        or "does not contain" in lower_ans
        or "not available in the" in lower_ans
        or "could not find" in lower_ans
        or "does not specify" in lower_ans
        or "not mentioned" in lower_ans
    ):
        confidence = 0.0
        confidence_label = "unavailable"
    elif best_score >= 0.70:
        confidence = round(min(0.98, best_score * 1.05), 3)
        confidence_label = "high"
    elif best_score >= 0.50:
        confidence = round(best_score, 3)
        confidence_label = "medium"
    else:
        confidence = round(best_score * 0.85, 3)
        confidence_label = "low"

    return (answer_text, confidence, confidence_label)
