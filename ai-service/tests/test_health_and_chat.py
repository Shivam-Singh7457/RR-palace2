import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_check_endpoint():
    """Test GET /health returns 200 OK and valid schema."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "service" in data
    assert "version" in data
    assert "timestamp" in data

def test_chat_endpoint_success():
    """Test POST /chat returns valid response structure using Mock LLM."""
    payload = {
        "messages": [
            {"role": "user", "content": "What rooms are available tonight?"}
        ],
        "temperature": 0.7
    }
    response = client.post("/chat", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["message"]["role"] == "assistant"
    assert "Royal Rudraksh Palace" in data["message"]["content"]
    assert "model" in data

def test_chat_endpoint_empty_messages():
    """Test POST /chat returns 400 when messages array is empty."""
    payload = {"messages": []}
    response = client.post("/chat", json=payload)
    assert response.status_code == 400
