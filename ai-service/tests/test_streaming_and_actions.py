import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.agent.orchestrator import default_orchestrator

client = TestClient(app)

@pytest.mark.asyncio
async def test_booking_action_payload_generation():
    # Anonymous user -> requires login
    messages = [{"role": "user", "content": "Are Deluxe rooms available from 2026-10-10 to 2026-10-15?"}]
    res_anon = await default_orchestrator.process_chat(messages)
    
    assert "action" in res_anon
    assert res_anon["action"] is not None
    assert res_anon["action"]["type"] == "NAVIGATE_TO_LOGIN"
    assert res_anon["action"]["params"]["check_in_date"] == "2026-10-10"
    assert res_anon["action"]["params"]["check_out_date"] == "2026-10-15"

    # Authenticated user -> complete booking breakdown
    user_context = {"email": "guest@example.com", "username": "John Doe"}
    res_auth = await default_orchestrator.process_chat(messages, user=user_context)
    assert res_auth["action"]["type"] in ["CONFIRM_BOOKING_PROMPT", "NAVIGATE_TO_BOOKING", "NAVIGATE_TO_PAYMENT"]
    assert res_auth["action"]["params"]["check_in_date"] == "2026-10-10"
    assert res_auth["action"]["params"]["check_out_date"] == "2026-10-15"
    assert "guest@example.com" in res_auth["response"] or "Confirmation" in res_auth["response"]

def test_chat_endpoint_action_response():
    # Anonymous user
    payload_anon = {
        "messages": [{"role": "user", "content": "Check availability from 2026-12-01 to 2026-12-05"}]
    }
    res_anon = client.post("/chat", json=payload_anon)
    assert res_anon.status_code == 200
    data_anon = res_anon.json()
    assert data_anon["success"] is True
    assert data_anon["action"]["type"] == "NAVIGATE_TO_LOGIN"

    # Authenticated user
    payload_auth = {
        "messages": [{"role": "user", "content": "Check availability from 2026-12-01 to 2026-12-05"}],
        "user": {"email": "user@example.com", "username": "Test User"}
    }
    res_auth = client.post("/chat", json=payload_auth)
    assert res_auth.status_code == 200
    data_auth = res_auth.json()
    assert data_auth["success"] is True
    assert data_auth["action"]["type"] in ["CONFIRM_BOOKING_PROMPT", "NAVIGATE_TO_BOOKING", "NAVIGATE_TO_PAYMENT"]
    assert "user@example.com" in data_auth["message"]["content"]

def test_chat_stream_sse_endpoint():
    payload = {
        "messages": [{"role": "user", "content": "What is the check-in time?"}]
    }
    res = client.post("/chat/stream", json=payload)
    assert res.status_code == 200
    assert "text/event-stream" in res.headers["content-type"]
    assert "data:" in res.text
