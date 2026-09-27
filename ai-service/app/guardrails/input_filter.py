import re
import logging
from typing import Dict, Any

logger = logging.getLogger(__name__)

# Injection and malicious query patterns
PROMPT_INJECTION_PATTERNS = [
    r"ignore\s+(all\s+)?(previous|prior|above|system)\s+instructions",
    r"override\s+(system|safety|guardrail)\s+rules",
    r"(reveal|print|show|output|tell\s+me)\s+.*(api\s*key|secret|env|password|token)",
    r"you\s+are\s+now\s+(a|an)\s+(unrestricted|DAN|jailbreak|root)",
    r"disregard\s+system\s+prompt"
]

MAX_INPUT_LENGTH = 3000

class InputGuardrail:
    """
    Validates user input for prompt injection and malicious content before passing to AI components.
    """

    def validate(self, user_message: str) -> Dict[str, Any]:
        if not user_message or not isinstance(user_message, str):
            return {
                "is_safe": False,
                "reason": "Input message must be a non-empty string.",
                "fallback_response": "Please provide a valid question or message."
            }

        if len(user_message) > MAX_INPUT_LENGTH:
            logger.warning(f"Input message exceeded length limit ({len(user_message)} chars).")
            return {
                "is_safe": False,
                "reason": "Message is too long.",
                "fallback_response": "Your message is too long. Please shorten your query and try again."
            }

        # Check against injection regex patterns
        text_lower = user_message.lower()
        for pattern in PROMPT_INJECTION_PATTERNS:
            if re.search(pattern, text_lower, re.IGNORECASE):
                logger.warning(f"Prompt injection pattern detected: '{pattern}' in input.")
                return {
                    "is_safe": False,
                    "reason": "Prompt injection pattern detected.",
                    "fallback_response": "I cannot fulfill this request as it violates safety guidelines. How can I assist you with your hotel reservation?"
                }

        return {
            "is_safe": True,
            "reason": "Clean input",
            "sanitized_message": user_message.strip()
        }

input_guardrail = InputGuardrail()
