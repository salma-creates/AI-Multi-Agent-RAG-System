"""
Lumina AI - Text Extraction Service (Milestone 1.3)
===================================================
Extracts raw text and page/section metadata from PDF, DOCX, TXT, and CSV.
Raises ExtractionError with clean, user-friendly messages on failures.
"""

import os
import csv
from typing import List, Tuple
from pathlib import Path


class ExtractionError(Exception):
    """Custom exception raised when document extraction fails."""
    pass


def extract_text(file_path: str, file_extension: str) -> List[Tuple[str, str]]:
    """
    Extracts structured units of text from the file.
    Returns: List of (text_content, page_or_section_label)
    """
    ext = file_extension.lower().strip()
    if not ext.startswith("."):
        ext = f".{ext}"

    if ext == ".pdf":
        return _extract_pdf(file_path)
    elif ext == ".docx":
        return _extract_docx(file_path)
    elif ext == ".txt":
        return _extract_txt(file_path)
    elif ext == ".csv":
        return _extract_csv(file_path)
    else:
        raise ExtractionError(f"Unsupported file format '{ext}'. Supported formats: PDF, DOCX, TXT, CSV.")


def _extract_pdf(file_path: str) -> List[Tuple[str, str]]:
    """Extracts text from PDF, first trying pypdf, with pdfplumber fallback."""
    units = []

    # Attempt extraction using pypdf
    try:
        from pypdf import PdfReader
        reader = PdfReader(file_path)
        if len(reader.pages) == 0:
            raise ExtractionError("The uploaded PDF contains no pages.")

        total_chars = 0
        for idx, page in enumerate(reader.pages, start=1):
            page_text = page.extract_text() or ""
            page_text = page_text.strip()
            total_chars += len(page_text)
            if page_text:
                units.append((page_text, f"Page {idx}"))

        if total_chars < 15:
            # Check pdfplumber before declaring scanned
            try:
                import pdfplumber
                with pdfplumber.open(file_path) as pdf:
                    alt_units = []
                    for i, page in enumerate(pdf.pages, start=1):
                        txt = (page.extract_text() or "").strip()
                        if txt:
                            alt_units.append((txt, f"Page {i}"))
                    if alt_units:
                        return alt_units
            except Exception:
                pass

            raise ExtractionError(
                "This PDF appears to be scanned or image-only (no extractable text layer). "
                "Please upload a text-searchable PDF."
            )
        return units

    except ExtractionError:
        raise
    except Exception as e:
        # Fallback to pdfplumber
        try:
            import pdfplumber
            with pdfplumber.open(file_path) as pdf:
                if len(pdf.pages) == 0:
                    raise ExtractionError("The uploaded PDF contains no pages.")
                for i, page in enumerate(pdf.pages, start=1):
                    txt = (page.extract_text() or "").strip()
                    if txt:
                        units.append((txt, f"Page {i}"))
            if units:
                return units
        except Exception:
            pass
        raise ExtractionError(f"Failed to read PDF document: {str(e)}")


def _extract_docx(file_path: str) -> List[Tuple[str, str]]:
    """Extracts paragraphs and tables from DOCX using python-docx."""
    try:
        import docx
    except ImportError:
        raise ExtractionError("DOCX processing library (python-docx) is not installed.")

    try:
        doc = docx.Document(file_path)
    except Exception as e:
        raise ExtractionError(f"Could not read DOCX document (file may be corrupted): {str(e)}")

    sections = []
    current_section = "Introduction"
    current_paragraphs = []

    for p in doc.paragraphs:
        txt = p.text.strip()
        if not txt:
            continue

        # Detect heading styles
        if p.style and "Heading" in p.style.name:
            if current_paragraphs:
                sections.append(("\n".join(current_paragraphs), current_section))
                current_paragraphs = []
            current_section = txt
        else:
            current_paragraphs.append(txt)

    if current_paragraphs:
        sections.append(("\n".join(current_paragraphs), current_section))

    # Also capture table data
    table_lines = []
    for table_idx, table in enumerate(doc.tables, start=1):
        for row in table.rows:
            row_cells = [cell.text.strip() for cell in row.cells if cell.text.strip()]
            if row_cells:
                table_lines.append(" | ".join(row_cells))
        if table_lines:
            sections.append(("\n".join(table_lines), f"Table {table_idx}"))
            table_lines = []

    if not sections:
        raise ExtractionError("The DOCX document does not contain readable text.")

    return sections


def _extract_txt(file_path: str) -> List[Tuple[str, str]]:
    """Extracts text from TXT file with utf-8 / fallback encodings."""
    text = ""
    for encoding in ["utf-8", "utf-8-sig", "latin-1", "cp1252"]:
        try:
            with open(file_path, "r", encoding=encoding) as f:
                text = f.read()
            break
        except UnicodeDecodeError:
            continue

    if not text or not text.strip():
        raise ExtractionError("The uploaded TXT file is empty.")

    # Split into sections if markdown or numbered headers are present
    lines = text.split("\n")
    sections = []
    current_title = "Document Body"
    current_lines = []

    for line in lines:
        stripped = line.strip()
        # Detect common section dividers like # Header, 1. INTRODUCTION, SECTION:
        if stripped.startswith("# ") or stripped.startswith("## ") or (len(stripped) > 3 and stripped[:2].isdigit() and stripped[2] in ".) "):
            if current_lines:
                sections.append(("\n".join(current_lines), current_title))
                current_lines = []
            current_title = stripped.lstrip("#").strip()
        else:
            current_lines.append(line)

    if current_lines:
        sections.append(("\n".join(current_lines), current_title))

    return sections if sections else [(text.strip(), "Document Body")]


def _extract_csv(file_path: str) -> List[Tuple[str, str]]:
    """Extracts structured key-value lines from CSV."""
    rows = []
    for encoding in ["utf-8", "utf-8-sig", "latin-1"]:
        try:
            with open(file_path, "r", encoding=encoding, newline="") as f:
                reader = csv.reader(f)
                rows = list(reader)
            break
        except UnicodeDecodeError:
            continue

    if not rows:
        raise ExtractionError("The CSV file is empty.")

    header = [h.strip() for h in rows[0]]
    data_rows = rows[1:]

    if not data_rows:
        raise ExtractionError("The CSV file has a header but no data rows.")

    units = []
    # Group rows in batches of 15 to maintain coherent semantic chunks
    batch_size = 15
    for start in range(0, len(data_rows), batch_size):
        batch = data_rows[start:start + batch_size]
        lines = []
        for r_idx, row in enumerate(batch, start=start + 2):
            fields = []
            for col_name, val in zip(header, row):
                val_clean = val.strip()
                if val_clean:
                    fields.append(f"{col_name}: {val_clean}")
            if fields:
                lines.append(f"Row {r_idx}: " + "; ".join(fields))

        if lines:
            label = f"Rows {start + 2} to {start + 1 + len(batch)}"
            units.append(("\n".join(lines), label))

    if not units:
        raise ExtractionError("No readable tabular records found in CSV file.")

    return units
