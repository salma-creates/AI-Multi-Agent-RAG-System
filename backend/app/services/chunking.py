"""
Lumina AI - Chunking Service (Milestone 1.3)
============================================
Splits cleaned text units into semantic chunks while maintaining metadata
(document ID, name, section/page, chunk position, overlap).
"""

import uuid
import re
from typing import List, Dict, Any, Tuple


def chunk_document_units(
    units: List[Tuple[str, str]],
    document_id: str,
    document_name: str,
    chunk_size: int = 800,
    chunk_overlap: int = 150
) -> List[Dict[str, Any]]:
    """
    Splits text units into overlapping chunks.
    Respects sentence and paragraph boundaries to maintain semantic integrity.
    """
    if chunk_overlap >= chunk_size:
        chunk_overlap = chunk_size // 4

    chunks = []
    chunk_counter = 0

    for unit_text, unit_label in units:
        unit_text = unit_text.strip()
        if not unit_text:
            continue

        # If unit is already smaller than or equal to chunk size, keep it whole
        if len(unit_text) <= chunk_size:
            chunk_counter += 1
            chunks.append({
                "chunk_id": f"chk_{uuid.uuid4().hex[:12]}",
                "document_id": document_id,
                "document_name": document_name,
                "page_or_section": unit_label,
                "chunk_position": chunk_counter,
                "text": unit_text,
                "char_count": len(unit_text)
            })
            continue

        # Split larger text into paragraphs
        paragraphs = unit_text.split("\n\n")
        current_chunk_parts = []
        current_len = 0

        for para in paragraphs:
            para = para.strip()
            if not para:
                continue

            para_len = len(para)

            # If a single paragraph exceeds chunk size, split it into sentences
            if para_len > chunk_size:
                sentences = re.split(r"(?<=[.!?])\s+", para)
                for sentence in sentences:
                    sentence = sentence.strip()
                    if not sentence:
                        continue
                    if current_len + len(sentence) + 1 > chunk_size and current_chunk_parts:
                        # Finalize chunk
                        chunk_text = " ".join(current_chunk_parts)
                        chunk_counter += 1
                        chunks.append({
                            "chunk_id": f"chk_{uuid.uuid4().hex[:12]}",
                            "document_id": document_id,
                            "document_name": document_name,
                            "page_or_section": unit_label,
                            "chunk_position": chunk_counter,
                            "text": chunk_text,
                            "char_count": len(chunk_text)
                        })
                        # Keep overlap from the end
                        overlap_target = chunk_overlap
                        overlap_parts = []
                        overlap_len = 0
                        for part in reversed(current_chunk_parts):
                            overlap_parts.insert(0, part)
                            overlap_len += len(part) + 1
                            if overlap_len >= overlap_target:
                                break
                        current_chunk_parts = overlap_parts
                        current_len = sum(len(p) + 1 for p in current_chunk_parts)

                    current_chunk_parts.append(sentence)
                    current_len += len(sentence) + 1
            else:
                if current_len + para_len + 2 > chunk_size and current_chunk_parts:
                    # Finalize chunk
                    chunk_text = "\n\n".join(current_chunk_parts)
                    chunk_counter += 1
                    chunks.append({
                        "chunk_id": f"chk_{uuid.uuid4().hex[:12]}",
                        "document_id": document_id,
                        "document_name": document_name,
                        "page_or_section": unit_label,
                        "chunk_position": chunk_counter,
                        "text": chunk_text,
                        "char_count": len(chunk_text)
                    })
                    # Overlap handling
                    overlap_target = chunk_overlap
                    overlap_parts = []
                    overlap_len = 0
                    for part in reversed(current_chunk_parts):
                        overlap_parts.insert(0, part)
                        overlap_len += len(part) + 2
                        if overlap_len >= overlap_target:
                            break
                    current_chunk_parts = overlap_parts
                    current_len = sum(len(p) + 2 for p in current_chunk_parts)

                current_chunk_parts.append(para)
                current_len += para_len + 2

        # Add remaining text as the last chunk of this unit
        if current_chunk_parts:
            chunk_text = "\n\n".join(current_chunk_parts)
            chunk_counter += 1
            chunks.append({
                "chunk_id": f"chk_{uuid.uuid4().hex[:12]}",
                "document_id": document_id,
                "document_name": document_name,
                "page_or_section": unit_label,
                "chunk_position": chunk_counter,
                "text": chunk_text,
                "char_count": len(chunk_text)
            })

    return chunks
