import pytest
from fastapi.testclient import TestClient
from app.main import app
from datetime import timedelta
from app.agent.router import classify_intent, IntentType, get_ist_today
from app.agent.orchestrator import default_orchestrator

client = TestClient(app)

def test_intent_classifier():
    res1 = classify_intent("Are Deluxe rooms available from 2026-10-01 to 2026-10-05?")
    assert res1["intent"] == IntentType.ROOM_AVAILABILITY
    assert res1["params"].get("check_in_date") == "2026-10-01"
    assert res1["params"].get("check_out_date") == "2026-10-05"

    res2 = classify_intent("Show me your room types and prices per night")
    assert res2["intent"] == IntentType.ROOM_CATALOG

    res3 = classify_intent("Who is the owner of Royal Rudraksh Palace?")
    assert res3["intent"] == IntentType.POLICY_FAQ


def test_relative_date_parsing_ist():
    today = get_ist_today()
    expected_cin = (today + timedelta(days=1)).strftime("%Y-%m-%d")
    expected_cout = (today + timedelta(days=4)).strftime("%Y-%m-%d")

    res = classify_intent("Is deluxe room available tomorrow to next 3 days?")
    assert res["intent"] == IntentType.ROOM_AVAILABILITY
    assert res["params"].get("check_in_date") == expected_cin
    assert res["params"].get("check_out_date") == expected_cout

    expected_cin_today = today.strftime("%Y-%m-%d")
    expected_cout_2n = (today + timedelta(days=2)).strftime("%Y-%m-%d")
    res2 = classify_intent("Check availability today for 2 nights")
    assert res2["params"].get("check_in_date") == expected_cin_today
    assert res2["params"].get("check_out_date") == expected_cout_2n


def test_day_first_and_twin_room_parsing():
    res = classify_intent("can you check is the twin double bed room free from 27th september till 30th sept for booking")
    assert res["intent"] == IntentType.ROOM_AVAILABILITY
    assert res["params"].get("check_in_date") == "2026-09-27"
    assert res["params"].get("check_out_date") == "2026-09-30"
    assert res["params"].get("room_type") == "Twin Double Bed"


@pytest.mark.asyncio
async def test_agent_orchestrator_availability_missing_dates():
    messages = [{"role": "user", "content": "I want to check room availability"}]
    res = await default_orchestrator.process_chat(messages)
    assert "check-in and check-out dates" in res["response"]


@pytest.mark.asyncio
async def test_agent_orchestrator_availability_with_dates():
    messages = [{"role": "user", "content": "Are rooms available from 2026-10-01 to 2026-10-05?"}]
    res = await default_orchestrator.process_chat(messages)
    assert any(kw in res["response"].lower() for kw in ["available", "reservation", "booking", "check"])
    assert res["action"] is not None


@pytest.mark.asyncio
async def test_agent_orchestrator_room_catalog():


    messages = [{"role": "user", "content": "What rooms and prices do you have?"}]
    res = await default_orchestrator.process_chat(messages)
    assert any(term in res["response"] for term in ["Twin", "King", "Deluxe", "Suite", "Bed"])
    assert "₹" in res["response"]


def test_chat_endpoint_agent_integration():
    payload = {
        "messages": [
            {"role": "user", "content": "What room types are available and what are their prices?"}
        ]
    }
    response = client.post("/chat", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "₹" in data["message"]["content"]


def test_cancellation_intent():
    res1 = classify_intent("Please cancel my booking")
    assert res1["intent"] == IntentType.BOOKING_CANCELLATION

    res2 = classify_intent("I want to cancel booking 66e812345678901234567890")
    assert res2["intent"] == IntentType.BOOKING_CANCELLATION
    assert res2["params"].get("booking_id") == "66e812345678901234567890"

    # Ensure FAQ inquiries still route to POLICY_FAQ
    res3 = classify_intent("What is the cancellation policy?")
    assert res3["intent"] == IntentType.POLICY_FAQ


@pytest.mark.asyncio
async def test_agent_cancellation_orchestration():
    messages = [{"role": "user", "content": "I want to cancel my booking ID 66e812345678901234567890"}]
    res = await default_orchestrator.process_chat(messages, user={"id": "user123", "email": "test@example.com"})
    assert res["intent"] == IntentType.BOOKING_CANCELLATION
    assert "Cancellation" in res["response"] or "Cancel" in res["response"]

