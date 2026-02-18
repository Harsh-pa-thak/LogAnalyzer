"""
Log Processor Module
Handles preprocessing, chunking, and synthesis of large log files.
Supports all log types: kernel, deployment, application, Docker, systemd, etc.
"""

import re
from collections import Counter
from dataclasses import dataclass, field


# Generic patterns that match across all log types
LOG_PATTERNS = {
    "error": re.compile(
        r"(error|fail|fatal|panic|exception|traceback|crashed|abort|segfault"
        r"|ENOMEM|not enough memory|oom[_-]|kill process|out of memory)",
        re.IGNORECASE,
    ),
    "warning": re.compile(
        r"(warn|deprecated|timeout|retry|refused|denied|unreachable"
        r"|degraded|slow|latency|overload|backoff)",
        re.IGNORECASE,
    ),
    "critical": re.compile(
        r"(critical|emergency|alert|kernel.*bug|hardware error"
        r"|data loss|corruption|unrecoverable)",
        re.IGNORECASE,
    ),
}


@dataclass
class ProcessedLog:
    """Result of preprocessing a raw log file."""
    original_line_count: int = 0
    processed_text: str = ""
    categories: dict = field(default_factory=dict)
    summary_stats: dict = field(default_factory=dict)


def _categorize_line(line: str) -> str:
    """Classify a single log line by severity. Works for all log types."""
    for category, pattern in LOG_PATTERNS.items():
        if pattern.search(line):
            return category
    return "info"


def _compress_repetitive(lines: list[str], threshold: int = 5) -> list[str]:
    """
    Collapse consecutive similar lines into summaries.
    Generic — works for any log type with repeated patterns.
    """
    if not lines:
        return lines

    compressed = []
    i = 0
    while i < len(lines):
        # Normalize: strip timestamps and hex identifiers for comparison
        normalized = re.sub(r"[\da-f]{6,}", "XXX", lines[i], flags=re.IGNORECASE)
        normalized = re.sub(r"\[[\d.]+\]\s*", "", normalized)

        # Count consecutive similar lines
        run_length = 1
        while i + run_length < len(lines):
            next_norm = re.sub(r"[\da-f]{6,}", "XXX", lines[i + run_length], flags=re.IGNORECASE)
            next_norm = re.sub(r"\[[\d.]+\]\s*", "", next_norm)
            if next_norm == normalized:
                run_length += 1
            else:
                break

        if run_length >= threshold:
            compressed.append(lines[i])
            compressed.append(f"  [... {run_length - 2} similar lines omitted ...]")
            compressed.append(lines[i + run_length - 1])
        else:
            compressed.extend(lines[i:i + run_length])

        i += run_length

    return compressed


def preprocess_log(raw_text: str) -> ProcessedLog:
    """
    Preprocess a raw log file for LLM analysis.
    Works with any log format: kernel, app, deployment, syslog, etc.
    """
    lines = raw_text.strip().splitlines()
    original_count = len(lines)

    # Categorize every line
    categorized: dict[str, list[str]] = {
        "critical": [], "error": [], "warning": [], "info": [],
    }
    for line in lines:
        cat = _categorize_line(line)
        categorized[cat].append(line)

    # Build stats
    stats = {
        "total_lines": original_count,
        "critical": len(categorized["critical"]),
        "errors": len(categorized["error"]),
        "warnings": len(categorized["warning"]),
        "info": len(categorized["info"]),
    }

    # Assemble output: errors/warnings first (full), then compressed info
    output_parts = []
    output_parts.append(f"=== LOG SUMMARY: {original_count} lines ===")
    output_parts.append(
        f"Critical: {stats['critical']} | Errors: {stats['errors']} "
        f"| Warnings: {stats['warnings']} | Info: {stats['info']}"
    )
    output_parts.append("")

    # Critical & errors — always include fully
    for cat in ("critical", "error", "warning"):
        if categorized[cat]:
            output_parts.append(f"--- {cat.upper()} LINES ({len(categorized[cat])}) ---")
            output_parts.extend(categorized[cat])
            output_parts.append("")

    # Info — compress repetitive patterns
    compressed_info = _compress_repetitive(categorized["info"])
    output_parts.append(f"--- INFO LINES (compressed from {len(categorized['info'])} to {len(compressed_info)}) ---")
    output_parts.extend(compressed_info)

    processed_text = "\n".join(output_parts)

    return ProcessedLog(
        original_line_count=original_count,
        processed_text=processed_text,
        categories={k: len(v) for k, v in categorized.items()},
        summary_stats=stats,
    )


def split_into_chunks(text: str, chunk_size: int = 60000, overlap: int = 500) -> list[str]:
    """
    Split preprocessed log text into LLM-friendly chunks.
    Uses LangChain text splitter. Auto-adjusts to cap at MAX_CHUNKS.
    """
    from langchain_text_splitters import RecursiveCharacterTextSplitter

    MAX_CHUNKS = 8  # Cap to avoid excessive API calls

    # Auto-increase chunk_size if text would produce too many chunks
    text_len = len(text)
    if text_len / chunk_size > MAX_CHUNKS:
        chunk_size = (text_len // MAX_CHUNKS) + 1000

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=overlap,
        separators=["\n---", "\n\n", "\n", " "],
    )
    return splitter.split_text(text)


# Prompt for analyzing each chunk
CHUNK_PROMPT = """You are a senior site reliability engineer.

Analyze this section of application logs (chunk {chunk_index} of {total_chunks}).

Focus on:
1. Errors, failures, or anomalies in this section
2. Patterns that indicate systemic issues
3. Any security or performance concerns

Log Section:
{chunk_text}

Provide a concise analysis of THIS section only. Use markdown formatting."""


# Prompt for synthesizing all chunk analyses into a final report
SYNTHESIS_PROMPT = """You are a senior site reliability engineer.

You have analyzed a large log file ({total_lines} lines) in {total_chunks} sections.
Here are the individual section analyses:

{chunk_analyses}

Log Statistics:
{stats}

Now create a UNIFIED analysis report that:
1. Identifies the main errors or failures across all sections
2. Explains the likely root cause in simple terms
3. Suggests practical next steps to fix or investigate
4. Mentions any suspicious patterns or repeated issues
5. Provides a severity assessment (Critical / Warning / Informational)

Write a comprehensive, well-structured report using markdown.
Use headers, bullet points, and code blocks where appropriate."""
