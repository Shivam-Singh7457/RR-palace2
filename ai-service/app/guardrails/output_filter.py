import re
import logging
from typing import Dict, Any

logger = logging.getLogger(__name__)

# Sensitive leakage patterns
SENSITIVE_LEAK_PATTERNS = [
    (r"mongodb\+srv://[^\s]+", "[REDACTED_MONGODB_URI]"),
    (r"AIzaSy[A-Za-z0-9_-]{10,}", "[REDACTED_GEMINI_KEY]"),
    (r"sk-[A-Za-z0-9_-]{20,}", "[REDACTED_OPENAI_KEY]"),
    (r"GOCSPX-[A-Za-z0-9_-]{20,}", "[REDACTED_CLIENT_SECRET]")
]


class OutputGuardrail:
    """
    Sanitizes LLM outputs to prevent secret leakage or malformed system responses.
    """

    def validate_and_sanitize(self, response_text: str) -> Dict[str, Any]:
        if not response_text:
            return {"is_safe": True, "sanitized_text": "I'm sorry, I couldn't process your request."}

        sanitized = response_text
        is_modified = False

        for pattern, replacement in SENSITIVE_LEAK_PATTERNS:
            if re.search(pattern, sanitized):
                logger.warning(f"Sensitive information leak prevented in response using pattern: '{pattern}'")
                sanitized = re.sub(pattern, replacement, sanitized)
                is_modified = True

        return {
            "is_safe": True,
            "was_sanitized": is_modified,
            "sanitized_text": sanitized
        }

output_guardrail = OutputGuardrail()
