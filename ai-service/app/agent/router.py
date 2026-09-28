import re
import logging
from typing import Dict, Any, Optional
from datetime import datetime, timedelta, timezone

logger = logging.getLogger(__name__)

# Indian Standard Time (IST): UTC+5:30
IST_TIMEZONE = timezone(timedelta(hours=5, minutes=30))

class IntentType:
    ROOM_AVAILABILITY = "ROOM_AVAILABILITY"
    ROOM_CATALOG = "ROOM_CATALOG"
    POLICY_FAQ = "POLICY_FAQ"
    BOOKING_CANCELLATION = "BOOKING_CANCELLATION"
    GENERAL_CONVERSATION = "GENERAL_CONVERSATION"



def get_ist_today() -> datetime.date:
    """Returns today's date in Indian Standard Time (IST)."""
    return datetime.now(IST_TIMEZONE).date()


def extract_dates(text: str) -> Dict[str, str]:
    """
    Extracts check-in and check-out dates from user text.
    Supports:
    1. Direct YYYY-MM-DD and DD/MM/YYYY formats (e.g. 2026-09-25 to 2026-09-28, 27/09/2026 till 30/09/2026)
    2. Natural Month Name Parsing (Day-first & Month-first: "27th september till 30th sept", "September 26th to 28th", "27 to 30 sept")
    3. Relative natural phrases in IST (e.g. "tomorrow to next 3 days", "today for 2 nights")
    """
    text_lower = text.lower().strip()
    result = {}
    current_year = get_ist_today().year

    # 1. Direct YYYY-MM-DD pattern matching
    date_patterns_iso = re.findall(r"\b\d{4}-\d{2}-\d{2}\b", text)
    if len(date_patterns_iso) >= 2:
        result["check_in_date"] = date_patterns_iso[0]
        result["check_out_date"] = date_patterns_iso[1]
    elif len(date_patterns_iso) == 1:
        result["check_in_date"] = date_patterns_iso[0]

    # 1.1 Direct DD/MM/YYYY or DD-MM-YYYY format matching
    if "check_in_date" not in result:
        dmy_matches = re.findall(r"\b(\d{1,2})[-/](\d{1,2})[-/](\d{4})\b", text)
        if len(dmy_matches) >= 2:
            d1, m1, y1 = dmy_matches[0]
            d2, m2, y2 = dmy_matches[1]
            result["check_in_date"] = f"{int(y1):04d}-{int(m1):02d}-{int(d1):02d}"
            result["check_out_date"] = f"{int(y2):04d}-{int(m2):02d}-{int(d2):02d}"
        elif len(dmy_matches) == 1:
            d1, m1, y1 = dmy_matches[0]
            result["check_in_date"] = f"{int(y1):04d}-{int(m1):02d}-{int(d1):02d}"

    # 1.5 Natural Month Name Parsing (Day-first & Month-first)
    if "check_in_date" not in result:
        months_map = {
            "jan": 1, "january": 1, "feb": 2, "february": 2, "mar": 3, "march": 3,
            "apr": 4, "april": 4, "may": 5, "jun": 6, "june": 6, "jul": 7, "july": 7,
            "aug": 8, "august": 8, "sep": 9, "sept": 9, "september": 9, "oct": 10,
            "october": 10, "nov": 11, "november": 11, "dec": 12, "december": 12
        }
        month_pat = r"(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)"

        # Pattern A: Shared month range with leading or trailing month, e.g. "27th till 30th september", "september 27th to 30th"
        range_trailing_month = re.search(r"\b(\d{1,2})(?:st|nd|rd|th)?\s*(?:to|till|until|-|and)\s*(\d{1,2})(?:st|nd|rd|th)?\s+(" + month_pat + r")\b", text_lower)
        range_leading_month = re.search(r"\b(" + month_pat + r")\s+(\d{1,2})(?:st|nd|rd|th)?\s*(?:to|till|until|-|and)\s*(\d{1,2})(?:st|nd|rd|th)?\b", text_lower)

        if range_trailing_month:
            d1, d2, m = range_trailing_month.groups()
            m_num = months_map.get(m, 9)
            result["check_in_date"] = f"{current_year:04d}-{m_num:02d}-{int(d1):02d}"
            result["check_out_date"] = f"{current_year:04d}-{m_num:02d}-{int(d2):02d}"
        elif range_leading_month:
            m, d1, d2 = range_leading_month.groups()
            m_num = months_map.get(m, 9)
            result["check_in_date"] = f"{current_year:04d}-{m_num:02d}-{int(d1):02d}"
            result["check_out_date"] = f"{current_year:04d}-{m_num:02d}-{int(d2):02d}"
        else:
            # Pattern B: Individual Day-First or Month-First dates (e.g. "27th september till 30th sept" or "september 27 to september 30")
            day_first_regex = r"\b(\d{1,2})(?:st|nd|rd|th)?\s+(" + month_pat + r")\b"
            month_first_regex = r"\b(" + month_pat + r")\s+(\d{1,2})(?:st|nd|rd|th)?\b"

            day_first_matches = re.findall(day_first_regex, text_lower)
            month_first_matches = re.findall(month_first_regex, text_lower)

            if len(day_first_matches) >= 2:
                d1, m1 = day_first_matches[0]
                d2, m2 = day_first_matches[1]
                result["check_in_date"] = f"{current_year:04d}-{months_map.get(m1, 9):02d}-{int(d1):02d}"
                result["check_out_date"] = f"{current_year:04d}-{months_map.get(m2, 9):02d}-{int(d2):02d}"
            elif len(month_first_matches) >= 2:
                m1, d1 = month_first_matches[0]
                m2, d2 = month_first_matches[1]
                result["check_in_date"] = f"{current_year:04d}-{months_map.get(m1, 9):02d}-{int(d1):02d}"
                result["check_out_date"] = f"{current_year:04d}-{months_map.get(m2, 9):02d}-{int(d2):02d}"
            elif len(day_first_matches) == 1 and len(month_first_matches) == 1:
                # One of each format in text
                d1, m1 = day_first_matches[0]
                m2, d2 = month_first_matches[0]
                # Determine order based on string index
                idx_df = text_lower.find(d1)
                idx_mf = text_lower.find(m2)
                if idx_df < idx_mf:
                    result["check_in_date"] = f"{current_year:04d}-{months_map.get(m1, 9):02d}-{int(d1):02d}"
                    result["check_out_date"] = f"{current_year:04d}-{months_map.get(m2, 9):02d}-{int(d2):02d}"
                else:
                    result["check_in_date"] = f"{current_year:04d}-{months_map.get(m2, 9):02d}-{int(d2):02d}"
                    result["check_out_date"] = f"{current_year:04d}-{months_map.get(m1, 9):02d}-{int(d1):02d}"
            elif len(day_first_matches) == 1:
                d1, m1 = day_first_matches[0]
                result["check_in_date"] = f"{current_year:04d}-{months_map.get(m1, 9):02d}-{int(d1):02d}"
            elif len(month_first_matches) == 1:
                m1, d1 = month_first_matches[0]
                result["check_in_date"] = f"{current_year:04d}-{months_map.get(m1, 9):02d}-{int(d1):02d}"

    # 2. Check for stay duration in days/nights (e.g. "next 3 days", "for 3 days", "3 nights")
    duration_days = None
    duration_match = re.search(r"(?:for|next|to next|stay of)\s*(\d+)\s*(?:days?|nights?)|(\d+)\s*(?:days?|nights?)", text_lower)
    if duration_match:
        val = duration_match.group(1) or duration_match.group(2)
        if val and val.isdigit():
            duration_days = int(val)

    # 3. Relative Check-in date anchors ("tomorrow", "day after tomorrow", "today", "tonight")
    today = get_ist_today()
    check_in_dt = None

    if "day after tomorrow" in text_lower:
        check_in_dt = today + timedelta(days=2)
    elif "tomorrow" in text_lower:
        check_in_dt = today + timedelta(days=1)
    elif "today" in text_lower or "tonight" in text_lower:
        check_in_dt = today

    # If relative check-in date is found and no explicit check-in date was found:
    if check_in_dt and "check_in_date" not in result:
        result["check_in_date"] = check_in_dt.strftime("%Y-%m-%d")

    # If check-in date is available but check-out is missing:
    if "check_in_date" in result and "check_out_date" not in result:
        base_dt = datetime.strptime(result["check_in_date"], "%Y-%m-%d").date()
        if duration_days and duration_days > 0:
            check_out_dt = base_dt + timedelta(days=duration_days)
            result["check_out_date"] = check_out_dt.strftime("%Y-%m-%d")

    return result


def classify_intent(user_message: str) -> Dict[str, Any]:
    """
    Classifies user message intent into standard categories and extracts relevant parameters.
    """
    text_lower = user_message.lower().strip()
    extracted_params = {}
    date_matches = extract_dates(user_message)
    if date_matches:
        extracted_params.update(date_matches)

    def extract_room_type(text: str) -> Optional[str]:
        has_ac = "ac" in text or "air" in text or "cooling" in text
        if "twin" in text:
            return "Twin Double Bed with AC" if has_ac else "Twin Double Bed"
        elif "double" in text:
            return "Double Bed with AC" if has_ac else "Double Bed"
        elif "executive" in text:
            return "Executive Suite"
        elif "presidential" in text or "royal" in text:
            return "Presidential Suite"
        elif "suite" in text:
            return "Suite"
        elif "deluxe" in text or "king" in text:
            return "Deluxe King Room"
        return None

    room_type = extract_room_type(text_lower)
    if room_type:
        extracted_params["room_type"] = room_type

    # Extract booking ID or reference string if present (e.g. 24-char ObjectId or booking id pattern)
    booking_id_match = re.search(r"\b([0-9a-fA-F]{24})\b", user_message)
    if not booking_id_match:
        booking_id_match = re.search(r"(?:booking|ref|id|reservation)\s*#?\s*([a-zA-Z0-9_-]{5,30})", text_lower)
    if booking_id_match:
        extracted_params["booking_id"] = booking_id_match.group(1)

    # 0. Check for explicit Booking Cancellation action intent first
    cancel_action_phrases = [
        "cancel my", "cancel booking", "cancel room", "cancel reservation", "cancel stay",
        "i want to cancel", "please cancel", "cancellation of my", "cancellation of booking",
        "want to cancel my", "like to cancel", "cancellation request"
    ]
    is_policy_inquiry = "policy" in text_lower or "rules" in text_lower or "how to cancel" in text_lower or "cancellation policy" in text_lower or "can i cancel" in text_lower
    
    if (any(p in text_lower for p in cancel_action_phrases) or ("cancel" in text_lower and "booking_id" in extracted_params)) and not is_policy_inquiry:
        return {
            "intent": IntentType.BOOKING_CANCELLATION,
            "params": extracted_params,
            "confidence": 0.98
        }

    # 1. Knowledge Base / Policy / FAQ Intent (Check policy keywords first to prevent overlap)
    policy_keywords = [
        "check-in time", "check in time", "checkout time", "check out time", "policy", "policies", "rules", "owner",
        "who owns", "who is the owner", "cancellation policy", "refund policy", "pet", "smoke", "smoking",
        "wifi", "internet", "parking", "address", "location", "spa", "pool", "food", "dining"
    ]
    if any(k in text_lower for k in policy_keywords):
        return {
            "intent": IntentType.POLICY_FAQ,
            "params": extracted_params,
            "confidence": 0.95
        }


    # 2. Room Catalog / Price Query Intent
    catalog_keywords = ["prices", "price", "cost", "rates", "how much", "room types", "room type", "catalog", "options"]
    if any(k in text_lower for k in catalog_keywords):
        return {
            "intent": IntentType.ROOM_CATALOG,
            "params": extracted_params,
            "confidence": 0.92
        }

    # 3. Room Availability Intent
    availability_trigger_words = [
        "available", "availability", "vacant", "book", "stay", "reserve", "tonight", "tomorrow",
        "check-in", "check in", "check out", "check-out", "checkin", "checkout", "free"
    ]
    if any(k in text_lower for k in availability_trigger_words) or date_matches:
        return {
            "intent": IntentType.ROOM_AVAILABILITY,
            "params": extracted_params,
            "confidence": 0.95
        }

    # 4. Default to General Conversation / Policy RAG fallback
    return {
        "intent": IntentType.GENERAL_CONVERSATION,
        "params": {},
        "confidence": 0.70
    }
