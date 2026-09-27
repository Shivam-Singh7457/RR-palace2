import time
import logging
from typing import List, Dict, Any, Optional
from app.rag.embeddings import embed_text

logger = logging.getLogger(__name__)

def cosine_similarity(v1: List[float], v2: List[float]) -> float:
    if not v1 or not v2 or len(v1) != len(v2):
        return 0.0
    dot_product = sum(a * b for a, b in zip(v1, v2))
    norm_v1 = sum(a * a for a in v1) ** 0.5
    norm_v2 = sum(b * b for b in v2) ** 0.5
    if norm_v1 == 0.0 or norm_v2 == 0.0:
        return 0.0
    return dot_product / (norm_v1 * norm_v2)


class SemanticCacheManager:
    """
    In-memory semantic vector cache.
    Stores query vector embeddings and matches semantically similar guest queries.
    """

    def __init__(self, similarity_threshold: float = 0.88, max_entries: int = 500, ttl_seconds: int = 86400):
        self.similarity_threshold = similarity_threshold
        self.max_entries = max_entries
        self.ttl_seconds = ttl_seconds
        self._cache: List[Dict[str, Any]] = []

    def get(self, query_text: str) -> Optional[Dict[str, Any]]:
        """
        Looks up query in semantic cache using cosine similarity against stored embeddings.
        Returns matching response if similarity >= threshold and entry not expired.
        """
        if not query_text or not query_text.strip():
            return None

        # Clean expired entries
        now = time.time()
        self._cache = [e for e in self._cache if now - e["timestamp"] < self.ttl_seconds]

        if not self._cache:
            return None

        query_embedding = embed_text(query_text)
        best_match = None
        best_score = 0.0

        for entry in self._cache:
            score = cosine_similarity(query_embedding, entry["embedding"])
            if score > best_score:
                best_score = score
                best_match = entry

        if best_match and best_score >= self.similarity_threshold:
            logger.info(f"[SemanticCache HIT] Query: '{query_text}' matched '{best_match['query']}' (Similarity: {best_score:.4f})")
            return {
                "response": best_match["response"],
                "intent": best_match["intent"],
                "model": f"{best_match['model']} (semantic-cache)",
                "similarity": round(best_score, 4),
                "is_cached": True
            }

        logger.info(f"[SemanticCache MISS] Query: '{query_text}' (Best similarity: {best_score:.4f} < {self.similarity_threshold})")
        return None

    def put(self, query_text: str, response: str, intent: str, model: str):
        """
        Stores a query, embedding, response, intent, and model into the semantic cache.
        """
        if not query_text or not response:
            return

        # Do not cache error responses or fallback error messages
        if "receiving high guest inquiry volume" in response or "having trouble connecting" in response:
            return

        # Evict oldest entry if max capacity reached
        if len(self._cache) >= self.max_entries:
            self._cache.pop(0)

        query_embedding = embed_text(query_text)
        entry = {
            "query": query_text.strip(),
            "embedding": query_embedding,
            "response": response,
            "intent": intent,
            "model": model,
            "timestamp": time.time()
        }
        self._cache.append(entry)
        logger.info(f"[SemanticCache STORED] Query: '{query_text}' (Cache Size: {len(self._cache)})")

    def clear(self):
        """Clears all cached entries."""
        self._cache.clear()
        logger.info("[SemanticCache CLEARED]")

    @property
    def size(self) -> int:
        return len(self._cache)


semantic_cache = SemanticCacheManager()
