"""
Log Processor Module
Handles preprocessing, chunking, and synthesis of large log files.
Supports all log types: kernel, deployment, application, Docker, systemd, etc.
"""

import re
from collections import Counter
from dataclasses import dataclass, field


@dataclass
class ProcessedLog:
    """Result of preprocessing a raw log file."""
    original_line_count: int = 0
    processed_text: str = ""
    categories: dict = field(default_factory=dict)
    summary_stats: dict = field(default_factory=dict)
