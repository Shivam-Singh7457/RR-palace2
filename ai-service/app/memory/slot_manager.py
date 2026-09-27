import logging
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)

SLOT_KEYS = ["check_in_date", "check_out_date", "room_type", "num_guests", "payment_method"]

def merge_slots(existing_slots: Dict[str, Any], new_params: Dict[str, Any]) -> Dict[str, Any]:
    """
    Merges newly extracted intent parameters into existing session slots.
    Existing non-null slots are preserved unless explicitly overridden by new valid parameters.
    """
    updated = dict(existing_slots) if existing_slots else {}
    for key, value in new_params.items():
        if value is not None and str(value).strip() != "":
            updated[key] = value
            logger.info(f"Updated session slot '{key}' -> '{value}'")
    return updated

def get_slot(slots: Dict[str, Any], key: str, default: Optional[Any] = None) -> Optional[Any]:
    """
    Retrieves slot value by key.
    """
    if not slots:
        return default
    return slots.get(key, default)
