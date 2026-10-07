import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.memory.session_store import session_store
from app.memory.slot_manager import merge_slots, get_slot
from app.memory.compressor import prune_and_summarize_history, truncate_rag_context
from app.agent.orchestrator import default_orchestrator

client = TestClient(app)

def test_session_store_fallback():
    session_id = "test_mem_001"
    history = [{"role": "user", "content": "Hello"}]
    slots = {"check_in_date": "2026-10-01"}
    
    saved = session_store.save_session(session_id, history, slots, summary="Test summary")
    assert saved is True

    fetched = session_store.get_session(session_id)
    assert fetched["slots"].get("check_in_date") == "2026-10-01"
    assert fetched["summary"] == "Test summary"


def test_slot_manager_merging():
    existing = {"check_in_date": "2026-10-01"}
    new_params = {"check_out_date": "2026-10-05", "room_type": "Suite"}
    
    merged = merge_slots(existing, new_params)
    assert merged["check_in_date"] == "2026-10-01"
    assert merged["check_out_date"] == "2026-10-05"
    assert merged["room_type"] == "Suite"


def test_history_pruning_and_summarization():
    history = [{"role": "user" if i%2==0 else "assistant", "content": f"Message {i}"} for i in range(15)]
    pruned, summary = prune_and_summarize_history(history, max_history_length=10)
    
    assert len(pruned) == 10
    assert "Prior Conversation Summary:" in summary
    assert "Message 0" in summary


def test_rag_context_truncation():
    chunks = [
        {"text": "A" * 800, "source": "s1.md"},
        {"text": "B" * 800, "source": "s2.md"}
    ]
    truncated = truncate_rag_context(chunks, max_total_chars=1200)
    assert len(truncated) == 2
    assert len(truncated[0]["text"]) == 800
    assert len(truncated[1]["text"]) < 800
    assert truncated[1]["text"].endswith("...")


@pytest.mark.asyncio
async def test_multiturn_slot_retention_orchestrator():
    session_id = "multiturn_session_999"

    # Turn 1: User provides check-in and check-out dates
    res1 = await default_orchestrator.process_chat(
        messages=[{"role": "user", "content": "I want to stay from 2026-10-01 to 2026-10-05"}],
        session_id=session_id
    )
    assert res1["slots"].get("check_in_date") == "2026-10-01"
    assert res1["slots"].get("check_out_date") == "2026-10-05"

    # Turn 2: User asks if rooms are available (without repeating dates)
    res2 = await default_orchestrator.process_chat(
        messages=[{"role": "user", "content": "Are Deluxe rooms available?"}],
        session_id=session_id
    )
    # Orchestrator uses preserved dates from session memory!
    assert ("2026-10-01" in res2["response"]) or ("October 1" in res2["response"])
    assert ("2026-10-05" in res2["response"]) or ("October 5" in res2["response"])


def test_multiturn_chat_endpoint_integration():
    session_id = "multiturn_endpoint_777"

    payload1 = {
        "messages": [{"role": "user", "content": "I plan to check in on 2026-11-10 and check out on 2026-11-15"}],
        "session_id": session_id
    }
    res1 = client.post("/chat", json=payload1)
    assert res1.status_code == 200

    payload2 = {
        "messages": [{"role": "user", "content": "Can you check room availability for me?"}],
        "session_id": session_id
    }
    res2 = client.post("/chat", json=payload2)
    assert res2.status_code == 200
    content = res2.json()["message"]["content"]
    assert ("2026-11-10" in content) or ("November 10" in content) or ("Nov 10" in content)
    assert ("2026-11-15" in content) or ("November 15" in content) or ("Nov 15" in content)

