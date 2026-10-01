"""PDF handling utilities built on top of PyMuPDF (fitz).

Provides functions to extract text, images, metadata, links, annotations
and pages rendered as images, plus basic document manipulation.
"""

from __future__ import annotations

import hashlib
from pathlib import Path
from typing import Any, BinaryIO

try:
    import pymupdf as fitz  # PyMuPDF
except ImportError as exc:  # pragma: no cover
    raise ImportError(
        "PyMuPDF is required. Install it with: uv add pymupdf"
    ) from exc

PageLike = fitz.Page
DocumentLike = fitz.Document


def open_pdf(source: str | Path | BinaryIO) -> fitz.Document:
    """Open a PDF from a file path or file-like object."""
    if isinstance(source, (str, Path)):
        return fitz.open(str(source))
    if hasattr(source, "read"):  # file-like (file handle, spooled uploads, ...)
        data = source.read()
        if isinstance(data, memoryview):
            data = data.tobytes()
        return fitz.open(stream=data, filetype="pdf")
    return fitz.open(source)


def get_page_count(source: str | Path | BinaryIO) -> int:
    """Return the number of pages in a PDF."""
    doc = open_pdf(source)
    try:
        return doc.page_count
    finally:
        doc.close()


def extract_text(
    source: str | Path | BinaryIO,
    page: int | None = None,
    *, 
    sort: bool = True,
) -> str:
    """Extract text from a PDF.

    Args:
        source: PDF path or file-like object.
        page: Zero-based page index, or None (default) for all pages.
        sort: Sort blocks in reading order.

    Returns:
        Extracted text, pages separated by a form feed character (\\f).
    """
    doc = open_pdf(source)
    try:
        if page is not None:
            return doc[page].get_text(sort=sort)
        return "\f".join(p.get_text(sort=sort) for p in doc)
    finally:
        doc.close()


def extract_words(
    source: str | Path | BinaryIO,
    page: int | None = None,
) -> list[list[dict[str, Any]]]:
    """Extract words with their bounding boxes and positions.

    Returns a list per page (or a single list for one page) of word dicts
    containing keys: text, x0, y0, x1, y1, size, font.
    """
    doc = open_pdf(source)
    try:
        if page is not None:
            return [_wrap_words(doc[page].get_text("words"))]
        return [_wrap_words(p.get_text("words")) for p in doc]
    finally:
        doc.close()


def _wrap_words(words: list[tuple]) -> list[dict[str, Any]]:
    return [
        {
            "text": w[4],
            "x0": w[0],
            "y0": w[1],
            "x1": w[2],
            "y1": w[3],
            "size": w[5],
            "font": w[6],
        }
        for w in words
    ]


def extract_images(
    source: str | Path | BinaryIO,
    output_dir: str | Path,
    page: int | None = None,
    *,
    prefix: str = "image",
) -> list[Path]:
    """Extract embedded images from a PDF and save them to output_dir.

    Args:
        source: PDF path or file-like object.
        output_dir: Directory where images are written (created if missing).
        page: Zero-based page index, or None (default) for all pages.
        prefix: Filename prefix for extracted images.

    Returns:
        List of paths to the written image files.
    """
    out = Path(output_dir)
    out.mkdir(parents=True, exist_ok=True)

    doc = open_pdf(source)
    written: list[Path] = []
    try:
        pages = [doc[page]] if page is not None else list(doc)
        for p in pages:
            for i, img in enumerate(p.get_images(full=True)):
                xref = img[0]
                pix = fitz.Pixmap(doc, xref)
                if pix.n - pix.alpha > 3:  # colorspace conversion needed
                    pix = fitz.Pixmap(fitz.csRGB, pix)
                name = f"{prefix}_p{p.number + 1:03d}_{i:03d}.png"
                fp = out / name
                pix.save(fp)
                written.append(fp)
                pix = None  # free underlying buffer
    finally:
        doc.close()
    return written


def render_page(
    source: str | Path | BinaryIO,
    output_path: str | Path,
    page: int = 0,
    *,
    dpi: int = 200,
) -> Path:
    """Render a single page as a PNG image.

    Args:
        source: PDF path or file-like object.
        output_path: Where to write the rendered PNG.
        page: Zero-based page index.
        dpi: Rendering resolution in dots per inch.

    Returns:
        Path of the written PNG file.
    """
    doc = open_pdf(source)
    try:
        zoom = dpi / 72
        mat = fitz.Matrix(zoom, zoom)
        pix = doc[page].get_pixmap(matrix=mat, alpha=False)
        fp = Path(output_path)
        pix.save(fp)
        return fp
    finally:
        doc.close()


def extract_metadata(source: str | Path | BinaryIO) -> dict[str, Any]:
    """Return PDF document metadata (title, author, ...)."""
    doc = open_pdf(source)
    try:
        return dict(doc.metadata)
    finally:
        doc.close()


def extract_links(
    source: str | Path | BinaryIO,
    page: int | None = None,
) -> list[dict[str, Any]]:
    """Extract the hyperlinks in a PDF, with their anchor text when available."""
    doc = open_pdf(source)
    links: list[dict[str, Any]] = []
    try:
        pages = [doc[page]] if page is not None else list(doc)
        for p in pages:
            for link in p.get_links():
                uri = link.get("uri")
                page_rect = None
                if "from" in link:
                    rect = fitz.Rect(link["from"])
                    page_rect = rect
                    hit = link.get("page")
                label = None
                if page_rect is not None:
                    raw = p.get_textbox(page_rect)
                    label = raw.strip() or None
                links.append(
                    {
                        "page": p.number + 1,
                        "uri": uri,
                        "kind": link.get("kind"),
                        "rect": str(page_rect) if page_rect else None,
                        "dest": page_rect or link.get("page"),
                        "label": label,
                    }
                )
    finally:
        doc.close()
    return links


def extract_annotations(
    source: str | Path | BinaryIO,
) -> list[dict[str, Any]]:
    """Extract annotations (notes, highlights, drawings) from a PDF."""
    doc = open_pdf(source)
    annotations: list[dict[str, Any]] = []
    try:
        for p in doc:
            for annot in p.annots() or []:
                info = annot.info
                annotations.append(
                    {
                        "page": p.number + 1,
                        "type": annot.type[1],
                        "content": info.get("content", ""),
                        "author": info.get("title", ""),
                        "rect": str(annot.rect),
                    }
                )
    finally:
        doc.close()
    return annotations


def text_to_pdf(text: str, output_path: str | Path) -> Path:
    """Create a new PDF containing the given text and save it."""
    doc = fitz.open()  # new empty document
    try:
        page = doc.new_page()
        page.insert_text((72, 72), text, fontsize=12)
        fp = Path(output_path)
        doc.save(fp)
        return fp
    finally:
        doc.close()


def merge_pdfs(
    sources: list[str | Path | BinaryIO],
    output_path: str | Path,
) -> Path:
    """Merge multiple PDFs into one, in the given order."""
    merged = fitz.open()
    try:
        for src in sources:
            with open_pdf(src) as doc:
                merged.insert_pdf(doc)
        fp = Path(output_path)
        merged.save(fp)
        return fp
    finally:
        merged.close()


def split_pdf(
    source: str | Path | BinaryIO,
    output_dir: str | Path,
    *,
    pages: list[int] | None = None,
    prefix: str = "page",
) -> list[Path]:
    """Split a PDF into single-page PDFs.

    Args:
        source: PDF path or file-like object.
        output_dir: Directory where the single-page PDFs are written.
        pages: Zero-based page indices to extract; None (default) for all.
        prefix: Filename prefix for the output files.

    Returns:
        List of paths to the written PDF files.
    """
    out = Path(output_dir)
    out.mkdir(parents=True, exist_ok=True)

    doc = open_pdf(source)
    written: list[Path] = []
    try:
        indices = pages if pages is not None else list(range(doc.page_count))
        for idx in indices:
            single = fitz.open()
            try:
                single.insert_pdf(doc, from_page=idx, to_page=idx)
                fp = out / f"{prefix}_{idx + 1:03d}.pdf"
                single.save(fp)
                written.append(fp)
            finally:
                single.close()
    finally:
        doc.close()
    return written


def pdf_checksum(source: str | Path | BinaryIO) -> str:
    """Return the SHA-256 checksum of the PDF file bytes."""
    doc = open_pdf(source)
    try:
        return hashlib.sha256(doc.tobytes()).hexdigest()
    finally:
        doc.close()