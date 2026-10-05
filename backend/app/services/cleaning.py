"""
Lumina AI - Text Cleaning Service (Milestone 1.3)
=================================================
Cleans and normalizes extracted raw text prior to chunking and embedding.
"""

import re


def clean_text(text: str) -> str:
    """
    Cleans raw text while preserving semantic structure:
    - Normalizes Unicode characters and line breaks
    - Removes unprintable binary control characters
    - Collapses excessive whitespace within lines
    - Preserves meaningful paragraphs and markdown formatting
    """
    if not text:
        return ""

    # Replace carriage returns with standard newlines
    text = text.replace("\r\n", "\n").replace("\r", "\n")

    # Remove non-printable control chars except \n and \t
    text = "".join(ch for ch in text if ch == "\n" or ch == "\t" or (ord(ch) >= 32 and ord(ch) != 127))

    # Replace non-breaking spaces with standard space
    text = text.replace("\u00a0", " ").replace("\u200b", "")

    # Collapse multiple horizontal spaces/tabs into a single space
    lines = []
    for line in text.split("\n"):
        cleaned_line = re.sub(r"[ \t]+", " ", line).strip()
        lines.append(cleaned_line)

    # Collapse 3 or more consecutive empty lines down to at most 2
    cleaned_text = "\n".join(lines)
    cleaned_text = re.sub(r"\n{3,}", "\n\n", cleaned_text)

    return cleaned_text.strip()
