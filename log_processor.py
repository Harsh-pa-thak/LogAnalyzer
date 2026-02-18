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
