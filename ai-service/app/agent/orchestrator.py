import time
import logging
from datetime import datetime
from typing import List, Dict, Any, Optional
from app.models.schemas import ChatMessage
from app.agent.router import classify_intent, IntentType
from app.tools.registry import tool_registry
from app.rag.retriever import default_retriever
from app.llm import get_llm_provider
from app.memory.session_store import session_store
from app.memory.slot_manager import merge_slots
from app.memory.compressor import prune_and_summarize_history, truncate_rag_context
from app.guardrails.input_filter import input_guardrail
from app.guardrails.output_filter import output_guardrail
from app.cache.semantic_cache import semantic_cache
from app.monitoring.logger import metrics_tracker

logger = logging.getLogger(__name__)

class AgentOrchestrator:
    """
    Coordinates multi-step agent workflow:
    1. Input Guardrail Safety Check
    2. Semantic Cache Lookup (Fast <50ms response for FAQ/Policy)
    3. Session Memory Load & Slot Extraction
    4. Intent Classification
    5. Tool Execution (Backend HTTP calls)
    6. RAG Retrieval (MongoDB Vector Search & Context Compression)
    7. Output Guardrail Secret Sanitization & Persistence
    8. Telemetry Metrics Recording & Cache Storage
    """

    async def process_chat(
        self,
        messages: Any,
        temperature: float = 0.7,
        max_tokens: int = 1024,
        session_id: Optional[str] = None,
        user: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        start_time = time.time()
        last_user_msg = ""
        for m in reversed(messages):
            role = m.role if hasattr(m, "role") else m.get("role")
            content = m.content if hasattr(m, "content") else m.get("content")
            if role == "user" and content:
                last_user_msg = content
                break

        if not last_user_msg:
            return {"response": "Hi, I am Vedika! How can I assist you with hotel booking at Royal Rudraksh Palace today?", "model": "agent-orchestrator"}

        # 0. Input Guardrail Safety Check
        guardrail_res = input_guardrail.validate(last_user_msg)
        if not guardrail_res.get("is_safe", True):
            logger.warning(f"Input blocked by InputGuardrail: {guardrail_res.get('reason')}")
            latency_ms = (time.time() - start_time) * 1000
            metrics_tracker.record_request(latency_ms, "BLOCKED_PROMPT_INJECTION", False, "input-guardrail", last_user_msg)
            return {
                "response": guardrail_res.get("fallback_response"),
                "model": "input-guardrail",
                "intent": "BLOCKED_PROMPT_INJECTION"
            }

        # 0.5 Semantic Cache Lookup (Check before intent classification for fast response)
        # Avoid caching query if it contains date patterns or room availability requests
        if not any(char.isdigit() for char in last_user_msg) and "available" not in last_user_msg.lower():
            cached_res = semantic_cache.get(last_user_msg)
            if cached_res:
                latency_ms = (time.time() - start_time) * 1000
                metrics_tracker.record_request(
                    latency_ms,
                    cached_res["intent"],
                    True,
                    cached_res["model"],
                    last_user_msg
                )
                return {
                    "response": cached_res["response"],
                    "model": cached_res["model"],
                    "intent": cached_res["intent"],
                    "is_cached": True
                }

        # 1. Load Session State from Memory
        session_data = session_store.get_session(session_id) if session_id else {"history": [], "slots": {}, "summary": ""}
        existing_slots = session_data.get("slots", {})
        existing_history = session_data.get("history", [])
        existing_summary = session_data.get("summary", "")

        # 2. Intent Classification & Parameter Extraction
        intent_result = classify_intent(last_user_msg)
        intent = intent_result["intent"]
        params = intent_result["params"]

        # 3. Merge Slots across turns
        merged_slots = merge_slots(existing_slots, params)
        logger.info(f"Agent Orchestrator (Session: {session_id}) Intent: {intent} | Merged Slots: {merged_slots}")

        llm = get_llm_provider()
        tool_context_str = ""

        # Branch 1: Room Availability Intent
        if intent == IntentType.ROOM_AVAILABILITY:
            check_in = merged_slots.get("check_in_date")
            check_out = merged_slots.get("check_out_date")
            room_type = merged_slots.get("room_type")

            if not check_in or not check_out:
                response_text = (
                    "Welcome to Royal Rudraksh Palace! I would be happy to check room availability for you. "
                    "Could you please specify your preferred check-in and check-out dates (e.g., YYYY-MM-DD or relative like 'tomorrow for 3 days')?"
                )
            else:
                tool_res = await tool_registry.execute_tool("check_room_availability", {
                    "check_in_date": check_in,
                    "check_out_date": check_out,
                    "room_type": room_type
                })

                # Format human-readable IST confirmation string
                try:
                    cin_dt = datetime.strptime(check_in, "%Y-%m-%d")
                    cout_dt = datetime.strptime(check_out, "%Y-%m-%d")
                    nights = max(1, (cout_dt - cin_dt).days)
                    cin_str = cin_dt.strftime("%A, %b %d, %Y")
                    cout_str = cout_dt.strftime("%A, %b %d, %Y")
                    ist_confirm_str = f"📅 **Check-in**: {cin_str}\n📅 **Check-out**: {cout_str} ({nights} night{'s' if nights != 1 else ''}, Indian Standard Time - IST)"
                except Exception:
                    ist_confirm_str = f"Dates: {check_in} to {check_out} (IST)"

                if hasattr(llm, "model_name") and "mock" in llm.model_name.lower():
                    if tool_res.get("is_available"):
                        response_text = (
                            f"Good news! Rooms are available for your requested stay in Indian Standard Time (IST):\n\n"
                            f"{ist_confirm_str}\n\n"
                            f"Would you like me to share room types and pricing details or proceed with reservation?"
                        )
                    else:
                        response_text = (
                            f"We're sorry, but all rooms are fully booked for the requested dates:\n\n"
                            f"{ist_confirm_str}\n\n"
                            f"Please try selecting alternative dates or contact our front desk."
                        )
                else:
                    avail_rooms_list = tool_res.get("available_rooms", [])
                    booked_rooms_list = tool_res.get("booked_rooms", [])

                    avail_str = "\n".join([f"  • {r.get('room_type')} (Price: ₹{r.get('price_per_night')}/night, Amenities: {', '.join(r.get('amenities', []))})" for r in avail_rooms_list]) if avail_rooms_list else "  None"
                    booked_str = "\n".join([f"  • {r.get('room_type')} (Price: ₹{r.get('price_per_night')}/night)" for r in booked_rooms_list]) if booked_rooms_list else "  None"

                    tool_context_str = (
                        f"LIVE RESERVATION SYSTEM STATUS:\n"
                        f"- Check-in Date (IST): {check_in}\n"
                        f"- Check-out Date (IST): {check_out}\n"
                        f"- Stay Confirmation Summary (IST):\n{ist_confirm_str}\n"
                        f"- Requested Room Type Filter: {room_type or 'All'}\n"
                        f"- Overall Category Status: {'AVAILABLE' if tool_res.get('is_available') else 'FULLY BOOKED'}\n"
                        f"- Available Room Units / Variants:\n{avail_str}\n"
                        f"- Fully Booked Room Units / Variants for these dates:\n{booked_str}\n"
                        f"MANDATORY INSTRUCTIONS FOR ASSISTANT:\n"
                        f"1. Clearly explain to the guest which specific room variants (e.g. 'Twin Double Bed with AC' vs standard 'Twin Double Bed', AC vs Non-AC) are available and which ones are already booked.\n"
                        f"2. Be precise so the guest knows exactly what type of room they are reserving.\n"
                    )

        # Branch 2: Room Catalog & Pricing Intent
        elif intent == IntentType.ROOM_CATALOG:
            room_type = merged_slots.get("room_type")
            tool_res = await tool_registry.execute_tool("get_room_catalog", {
                "room_type": room_type
            })

            rooms = tool_res.get("rooms", [])
            if hasattr(llm, "model_name") and "mock" in llm.model_name.lower():
                if rooms:
                    room_lines = [f"• **{r['room_type']}**: ₹{r['price_per_night']:,} per night ({', '.join(r.get('amenities', []))})" for r in rooms]
                    response_text = "Here are the available room options at Royal Rudraksh Palace:\n\n" + "\n".join(room_lines) + "\n\nWould you like to check availability for specific dates?"
                else:
                    response_text = "We currently have no rooms listed in that category. Please contact front desk for custom reservations."
            else:
                room_lines = [f"- {r['room_type']}: ₹{r['price_per_night']:,}/night (Amenities: {', '.join(r.get('amenities', []))})" for r in rooms]
                tool_context_str = (
                    f"LIVE ROOM CATALOG:\n" +
                    ("\n".join(room_lines) if room_lines else "No rooms found.") + "\n"
                )

        # If LLM execution is active and tool_context_str or RAG context is built
        if not ('response_text' in locals()):
            raw_context = default_retriever.retrieve(last_user_msg, top_k=3)
            context_chunks = truncate_rag_context(raw_context, max_total_chars=1200)

            system_prompt = (
                "You are Vedika, the official AI Guest Assistant for Royal Rudraksh Palace, a luxury hotel in Varanasi.\n"
                "IMPORTANT ASSISTANT DIRECTIVES:\n"
                "1. You ARE directly integrated with the live reservation database and room system for Royal Rudraksh Palace.\n"
                "2. NEVER state or claim that your live booking system integration is temporarily offline or unavailable.\n"
                "3. If a guest asks for a twin room to accommodate 4 guests, explain clearly that standard twin rooms accommodate up to 2 guests, and recommend reserving 2 twin rooms or an Executive/Presidential Suite for their group.\n"
                "4. Be polite, warm, professional, and concise.\n"
            )

            if tool_context_str:
                system_prompt += f"\n--- LIVE BACKEND SYSTEM DATA ---\n{tool_context_str}--------------------------------\n"

            if existing_summary:
                system_prompt += f"\n--- PREVIOUS CONVERSATION SUMMARY ---\n{existing_summary}\n----------------------------------\n"

            if context_chunks:
                context_str = "\n\n".join([f"[Source: {c['source']}]\n{c['text']}" for c in context_chunks])
                system_prompt += f"\n--- HOTEL KNOWLEDGE BASE CONTEXT ---\n{context_str}\n------------------------------------\n"

            system_prompt += (
                "\nINSTRUCTIONS:\n"
                "1. If live backend system data or hotel knowledge base context is provided, use it to answer the guest's question.\n"
                "2. If the guest asks specific follow-up questions (e.g. asking which rooms are not available, or asking for specific details), address their exact question directly based on the live data.\n"
                "3. Never repeat static template responses over and over again."
            )

            response_text = await llm.generate_response(
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens,
                system_prompt=system_prompt
            )

        # Output Guardrail Sanitization
        output_res = output_guardrail.validate_and_sanitize(response_text)
        final_response_text = output_res["sanitized_text"]

        # 4. Construct Automated Booking Action Payload & Summary Breakdown
        booking_action = None
        if intent == IntentType.ROOM_AVAILABILITY:
            check_in = merged_slots.get("check_in_date")
            check_out = merged_slots.get("check_out_date")
            room_type = merged_slots.get("room_type") or "Deluxe King Room"

            # Check if availability tool reported room is available
            is_available = True
            if 'tool_res' in locals() and isinstance(tool_res, dict):
                is_available = tool_res.get("is_available", True)

            if check_in and check_out and is_available:
                if not user or not user.get("email"):
                    # User NOT logged in -> Require Login
                    booking_action = {
                        "type": "NAVIGATE_TO_LOGIN",
                        "title": "Log In to Complete Booking",
                        "params": {
                            "room_type": room_type,
                            "check_in_date": check_in,
                            "check_out_date": check_out
                        }
                    }
                    if "Log In" not in final_response_text and "log in" not in final_response_text.lower():
                        final_response_text += (
                            "\n\n🔐 **Authentication Required for Booking**:\n"
                            "To process your reservation and send confirmation details to your verified email address, "
                            "please **Log In** to your account first. Click **Log In to Complete Booking** below!"
                        )
                else:
                    # User IS logged in -> Show complete breakdown
                    user_email = user.get("email") or user.get("username", "Guest")
                    # Determine exact price_per_night from tool execution (live DB data)
                    price_per_night = 1800
                    if 'tool_res' in locals() and isinstance(tool_res, dict):
                        avail_list = tool_res.get("available_rooms", [])
                        matching_room = None
                        if room_type:
                            matching_room = next((r for r in avail_list if room_type.lower() in r.get("room_type", "").lower()), None)
                        if not matching_room and avail_list:
                            matching_room = avail_list[0]
                        if matching_room and matching_room.get("price_per_night"):
                            price_per_night = matching_room.get("price_per_night")
                            if matching_room.get("room_type"):
                                room_type = matching_room.get("room_type")

                    try:
                        cin_dt = datetime.strptime(check_in, "%Y-%m-%d")
                        cout_dt = datetime.strptime(check_out, "%Y-%m-%d")
                        nights = max(1, (cout_dt - cin_dt).days)
                    except Exception:
                        nights = 1

                    total_amount = price_per_night * nights

                    booking_action = {
                        "type": "NAVIGATE_TO_BOOKING",
                        "title": f"Reserve {room_type} (₹{total_amount:,})",
                        "params": {
                            "room_type": room_type,
                            "check_in_date": check_in,
                            "check_out_date": check_out,
                            "email": user_email,
                            "total_amount": total_amount
                        }
                    }

                    summary_box = (
                        f"\n\n📋 **Booking Breakdown & Confirmation**:\n"
                        f"• 👤 **Guest Email**: {user_email}\n"
                        f"• 🏨 **Room Type**: {room_type}\n"
                        f"• 📅 **Check-In**: {check_in} (IST)\n"
                        f"• 📅 **Check-Out**: {check_out} ({nights} night{'s' if nights != 1 else ''})\n"
                        f"• 💰 **Total Booking Amount**: ₹{total_amount:,}\n\n"
                        f"Click **Reserve Room Now ➔** below to complete your reservation!"
                    )
                    if user_email not in final_response_text:
                        final_response_text += summary_box

        # 5. Record Execution Telemetry Metrics
        latency_ms = (time.time() - start_time) * 1000
        metrics_tracker.record_request(
            latency_ms=latency_ms,
            intent=intent,
            is_cached=False,
            model=llm.model_name,
            user_query=last_user_msg
        )

        # 6. Save updated history and slots to session store
        if session_id:
            updated_history = list(existing_history)
            updated_history.append({"role": "user", "content": last_user_msg})
            updated_history.append({"role": "assistant", "content": final_response_text})
            
            pruned_history, new_summary = prune_and_summarize_history(
                updated_history,
                existing_summary=existing_summary,
                max_history_length=10
            )
            session_store.save_session(session_id, pruned_history, merged_slots, new_summary)

        return {
            "response": final_response_text,
            "model": llm.model_name,
            "intent": intent,
            "slots": merged_slots,
            "action": booking_action
        }

default_orchestrator = AgentOrchestrator()


