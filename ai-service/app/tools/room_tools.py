import logging
import httpx
from typing import Dict, Any, Optional
from app.tools.base import BaseTool
from app.config.settings import settings

logger = logging.getLogger(__name__)

class GetRoomCatalogTool(BaseTool):
    """
    Tool to fetch the current hotel room catalog, pricing, amenities, and capacity.
    """
    @property
    def name(self) -> str:
        return "get_room_catalog"

    @property
    def description(self) -> str:
        return (
            "Retrieves the live catalog of hotel rooms including room types, prices per night, "
            "available amenities, and guest capacities."
        )

    @property
    def parameters(self) -> Dict[str, Any]:
        return {
            "type": "object",
            "properties": {
                "room_type": {
                    "type": "string",
                    "description": "Optional room type filter (e.g., Deluxe, Suite, Executive)."
                }
            },
            "required": []
        }

    async def execute(self, room_type: Optional[str] = None, **kwargs) -> Dict[str, Any]:
        url = f"{settings.NODE_BACKEND_URL}/api/rooms"
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                res = await client.get(url)
                if res.status_code == 200:
                    data = res.json()
                    rooms = data.get("rooms", [])
                    if room_type:
                        rooms = [r for r in rooms if room_type.lower() in r.get("roomType", "").lower()]
                    
                    simplified_rooms = []
                    for r in rooms:
                        simplified_rooms.append({
                            "room_id": str(r.get("_id", "")),
                            "room_type": r.get("roomType", "Standard"),
                            "price_per_night": r.get("pricePerNight", 0),
                            "amenities": r.get("amenities", []),
                            "is_available": r.get("isAvailable", True)
                        })
                    return {"success": True, "rooms": simplified_rooms, "total": len(simplified_rooms)}
                else:
                    logger.warning(f"Backend returned HTTP {res.status_code} for room catalog.")
        except Exception as e:
            logger.warning(f"Failed to fetch live room catalog from backend: {e}. Using cached catalog.")

        # Fallback catalog if Node backend is offline/unreachable
        default_rooms = [
            {"room_id": "r1", "room_type": "Deluxe King Room", "price_per_night": 4500, "amenities": ["Wi-Fi", "AC", "King Bed", "City View"], "is_available": True},
            {"room_id": "r2", "room_type": "Executive Suite", "price_per_night": 7500, "amenities": ["Wi-Fi", "AC", "Living Room", "Jacuzzi", "Garden View"], "is_available": True},
            {"room_id": "r3", "room_type": "Royal Presidential Suite", "price_per_night": 15000, "amenities": ["Wi-Fi", "AC", "Private Butler", "Balcony", "Ganga View"], "is_available": True}
        ]
        if room_type:
            default_rooms = [r for r in default_rooms if room_type.lower() in r["room_type"].lower()]
        return {"success": True, "rooms": default_rooms, "total": len(default_rooms), "is_mock_fallback": True}


class CheckRoomAvailabilityTool(BaseTool):
    """
    Tool to check room availability for specific dates.
    """
    @property
    def name(self) -> str:
        return "check_room_availability"

    @property
    def description(self) -> str:
        return (
            "Checks if rooms are available for booking between specified check-in and check-out dates."
        )

    @property
    def parameters(self) -> Dict[str, Any]:
        return {
            "type": "object",
            "properties": {
                "check_in_date": {
                    "type": "string",
                    "description": "Check-in date in YYYY-MM-DD format."
                },
                "check_out_date": {
                    "type": "string",
                    "description": "Check-out date in YYYY-MM-DD format."
                },
                "room_type": {
                    "type": "string",
                    "description": "Optional room type to filter availability."
                }
            },
            "required": ["check_in_date", "check_out_date"]
        }

    async def execute(self, check_in_date: str, check_out_date: str, room_type: Optional[str] = None, **kwargs) -> Dict[str, Any]:
        url = f"{settings.NODE_BACKEND_URL}/api/bookings/check-availability"
        payload = {
            "checkInDate": check_in_date,
            "checkOutDate": check_out_date,
            "room": room_type or ""
        }
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                res = await client.post(url, json=payload)
                if res.status_code == 200:
                    data = res.json()
                    is_avail = data.get("isAvailable", False)
                    avail_rooms = data.get("availableRooms", [])
                    booked_rooms = data.get("bookedRooms", [])

                    summary_parts = []
                    if avail_rooms:
                        avail_desc = ", ".join([f"{r.get('room_type')} (₹{r.get('price_per_night')}/night)" for r in avail_rooms])
                        summary_parts.append(f"Available variants: {avail_desc}")
                    if booked_rooms:
                        booked_desc = ", ".join([f"{r.get('room_type')} (₹{r.get('price_per_night')}/night)" for r in booked_rooms])
                        summary_parts.append(f"Booked variants: {booked_desc}")

                    msg_text = " | ".join(summary_parts) if summary_parts else ("Rooms are available." if is_avail else "No rooms available for selected dates.")

                    return {
                        "success": True,
                        "check_in_date": check_in_date,
                        "check_out_date": check_out_date,
                        "is_available": is_avail,
                        "available_rooms": avail_rooms,
                        "booked_rooms": booked_rooms,
                        "available_count": data.get("availableCount", len(avail_rooms)),
                        "message": msg_text
                    }
        except Exception as e:
            logger.warning(f"Failed to check availability via backend: {e}. Returning simulated result.")

        # Fallback if Node backend is offline/unreachable
        return {
            "success": False,
            "check_in_date": check_in_date,
            "check_out_date": check_out_date,
            "is_available": False,
            "available_rooms": [],
            "booked_rooms": [],
            "available_count": 0,
            "message": f"Unable to verify live room availability from reservation database.",
            "is_mock_fallback": True
        }
