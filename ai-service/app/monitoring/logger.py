import time
import logging
from typing import Dict, Any, List

logger = logging.getLogger(__name__)

class MetricsTracker:
    """
    Tracks real-time system performance metrics, request latency, intent counts,
    and semantic cache efficiency.
    """

    def __init__(self, max_recent_logs: int = 100):
        self.max_recent_logs = max_recent_logs
        self.total_requests = 0
        self.cache_hits = 0
        self.cache_misses = 0
        self.total_latency_ms = 0.0
        self.intent_counts: Dict[str, int] = {}
        self.model_counts: Dict[str, int] = {}
        self.recent_logs: List[Dict[str, Any]] = []

    def record_request(
        self,
        latency_ms: float,
        intent: str,
        is_cached: bool,
        model: str,
        user_query: str = ""
    ):
        """
        Records telemetry metrics for a single processed chat request.
        """
        self.total_requests += 1
        self.total_latency_ms += latency_ms

        if is_cached:
            self.cache_hits += 1
        else:
            self.cache_misses += 1

        self.intent_counts[intent] = self.intent_counts.get(intent, 0) + 1
        self.model_counts[model] = self.model_counts.get(model, 0) + 1

        log_entry = {
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S", time.localtime()),
            "query": user_query[:50] + ("..." if len(user_query) > 50 else ""),
            "intent": intent,
            "latency_ms": round(latency_ms, 2),
            "is_cached": is_cached,
            "model": model
        }

        self.recent_logs.append(log_entry)
        if len(self.recent_logs) > self.max_recent_logs:
            self.recent_logs.pop(0)

        logger.info(
            f"[METRICS] Request #{self.total_requests} | Intent: {intent} | "
            f"Latency: {latency_ms:.1f}ms | Cached: {is_cached} | Model: {model}"
        )

    def get_metrics(self) -> Dict[str, Any]:
        """
        Returns aggregated system metrics and performance summary.
        """
        avg_latency = round(self.total_latency_ms / self.total_requests, 2) if self.total_requests > 0 else 0.0
        hit_ratio = round((self.cache_hits / self.total_requests) * 100, 2) if self.total_requests > 0 else 0.0

        return {
            "status": "healthy",
            "total_requests": self.total_requests,
            "cache_hits": self.cache_hits,
            "cache_misses": self.cache_misses,
            "cache_hit_ratio_percent": hit_ratio,
            "average_latency_ms": avg_latency,
            "intent_distribution": self.intent_counts,
            "model_distribution": self.model_counts,
            "recent_requests": list(reversed(self.recent_logs[-10:]))  # Return 10 most recent
        }

    def reset(self):
        """Resets all metrics counters."""
        self.total_requests = 0
        self.cache_hits = 0
        self.cache_misses = 0
        self.total_latency_ms = 0.0
        self.intent_counts.clear()
        self.model_counts.clear()
        self.recent_logs.clear()


metrics_tracker = MetricsTracker()
