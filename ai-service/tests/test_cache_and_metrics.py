import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.cache.semantic_cache import semantic_cache, SemanticCacheManager
from app.monitoring.logger import metrics_tracker

client = TestClient(app)

def setup_function():
    semantic_cache.clear()
    metrics_tracker.reset()

def test_semantic_cache_basic_put_and_get():
    query = "What is the cancellation policy?"
    response = "Cancellations made 48 hours prior to check-in receive a 100% full refund."
    
    semantic_cache.put(query, response, "POLICY_FAQ", "mock-model")
    assert semantic_cache.size == 1

    # Exact match hit
    hit = semantic_cache.get(query)
    assert hit is not None
    assert hit["is_cached"] is True
    assert hit["response"] == response
    assert hit["intent"] == "POLICY_FAQ"

def test_semantic_cache_paraphrased_query():
    cache = SemanticCacheManager(similarity_threshold=0.50)
    query_orig = "What is the cancellation policy for hotel bookings?"
    query_para = "Can you tell me the cancellation policy of your hotel?"
    response = "Cancellations made 48 hours prior to check-in receive a 100% refund."

    cache.put(query_orig, response, "POLICY_FAQ", "mock-model")
    
    hit = cache.get(query_para)
    assert hit is not None
    assert hit["is_cached"] is True
    assert hit["response"] == response

def test_metrics_tracker_recording():
    metrics_tracker.record_request(latency_ms=45.2, intent="POLICY_FAQ", is_cached=True, model="semantic-cache", user_query="What is the check-in time?")
    metrics_tracker.record_request(latency_ms=450.0, intent="ROOM_CATALOG", is_cached=False, model="gemini-2.5-flash-lite", user_query="Show room rates")

    data = metrics_tracker.get_metrics()
    assert data["total_requests"] == 2
    assert data["cache_hits"] == 1
    assert data["cache_misses"] == 1
    assert data["cache_hit_ratio_percent"] == 50.0
    assert data["intent_distribution"]["POLICY_FAQ"] == 1
    assert data["intent_distribution"]["ROOM_CATALOG"] == 1

def test_metrics_api_endpoint():
    # Make a chat request to trigger metrics
    payload = {
        "messages": [
            {"role": "user", "content": "Who is the owner of Royal Rudraksh Palace?"}
        ]
    }
    res = client.post("/chat", json=payload)
    assert res.status_code == 200

    # Query GET /metrics
    metrics_res = client.get("/metrics")
    assert metrics_res.status_code == 200
    metrics_data = metrics_res.json()
    
    assert metrics_data["status"] == "healthy"
    assert metrics_data["total_requests"] >= 1
    assert "average_latency_ms" in metrics_data
    assert "cache_hit_ratio_percent" in metrics_data
    assert "semantic_cache_entries_count" in metrics_data

def test_metrics_reset_endpoint():
    # Record dummy data
    metrics_tracker.record_request(10.0, "POLICY_FAQ", True, "cache", "query")
    semantic_cache.put("sample query", "sample response", "POLICY_FAQ", "mock")

    assert metrics_tracker.total_requests == 1
    assert semantic_cache.size == 1

    # Call DELETE /metrics
    del_res = client.delete("/metrics")
    assert del_res.status_code == 200
    assert del_res.json()["success"] is True

    assert metrics_tracker.total_requests == 0
    assert semantic_cache.size == 0
