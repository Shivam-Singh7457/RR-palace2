from fastapi import APIRouter
from app.monitoring.logger import metrics_tracker
from app.cache.semantic_cache import semantic_cache

router = APIRouter()

@router.get("", summary="Get System Performance & Telemetry Metrics")
async def get_metrics():
    """
    Returns real-time analytics including average response latency,
    cache hit ratio, intent distribution, and recent request logs.
    """
    metrics = metrics_tracker.get_metrics()
    metrics["semantic_cache_entries_count"] = semantic_cache.size
    return metrics

@router.delete("", summary="Reset System Telemetry Metrics & Semantic Cache")
async def reset_metrics():
    """
    Resets metrics tracker counters and clears the semantic cache.
    """
    metrics_tracker.reset()
    semantic_cache.clear()
    return {"success": True, "message": "Metrics and semantic cache reset successfully."}
