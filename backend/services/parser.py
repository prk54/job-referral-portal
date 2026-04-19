import re

import fitz  # PyMuPDF

from skills_dictionary import SKILLS_DICT


def extract_text_from_pdf(pdf_bytes: bytes) -> str:
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    pages_text = [page.get_text() for page in doc]
    doc.close()
    return " ".join(pages_text)


def extract_skills(text: str) -> list[str]:
    found: list[str] = []
    lower_text = text.lower()
    for canonical, variants in SKILLS_DICT.items():
        pattern = r"(?:" + "|".join(variants) + r")"
        if re.search(pattern, lower_text, re.IGNORECASE):
            found.append(canonical)
    return found


def parse_resume(pdf_bytes: bytes) -> list[str]:
    text = extract_text_from_pdf(pdf_bytes)
    return extract_skills(text)
