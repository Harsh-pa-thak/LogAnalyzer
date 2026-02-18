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
