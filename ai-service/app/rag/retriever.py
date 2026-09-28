import logging
import math
from typing import List, Dict, Any
from pymongo import MongoClient

from app.config.settings import settings
from app.rag.embeddings import embed_text
from app.rag.ingestion import COLLECTION_NAME, ingest_knowledge_base
from app.monitoring.tracing import traceable

logger = logging.getLogger(__name__)

def cosine_similarity(v1: List[float], v2: List[float]) -> float:
    """
    Computes cosine similarity between two float vectors.
    """
    if len(v1) != len(v2) or not v1:
        return 0.0
    dot = sum(a * b for a, b in zip(v1, v2))
    norm1 = math.sqrt(sum(a * a for a in v1))
    norm2 = math.sqrt(sum(b * b for b in v2))
    if norm1 == 0.0 or norm2 == 0.0:
        return 0.0
    return dot / (norm1 * norm2)


class RAGRetriever:
    def __init__(self):
        self.db_uri = settings.MONGODB_URI
        self.db_name = settings.MONGODB_DB_NAME
        self.collection_name = COLLECTION_NAME

    @traceable(name="RAGRetriever.retrieve", run_type="retriever")
    def retrieve(self, query: str, top_k: int = 3) -> List[Dict[str, Any]]:
        """
        Retrieves top K most relevant text chunks for a given query.
        """
        if not query or not query.strip():
            return []

        query_embedding = embed_text(query)
        if not query_embedding:
            return []

        if not self.db_uri:
            logger.warning("MONGODB_URI not configured. Cannot perform vector retrieval.")
            return []

        try:
            client = MongoClient(self.db_uri)
            db = client[self.db_name]
            collection = db[self.collection_name]

            # Check if collection is empty; if so, attempt ingestion once
            if collection.count_documents({}) == 0:
                logger.info("Knowledge collection is empty. Auto-triggering ingestion...")
                ingest_knowledge_base()

            # Strategy 1: Attempt Atlas $vectorSearch aggregation
            results = self._try_atlas_vector_search(collection, query_embedding, top_k)
            if results:
                client.close()
                return results

            # Strategy 2: Fallback cosine similarity search across stored vectors
            logger.info("Atlas $vectorSearch unavailable or unindexed. Using fallback similarity search.")
            results = self._fallback_similarity_search(collection, query_embedding, top_k, query=query)

            client.close()
            return results
        except Exception as e:
            logger.error(f"Error during RAG retrieval: {e}")
            return []

    def _try_atlas_vector_search(self, collection, query_embedding: List[float], top_k: int) -> List[Dict[str, Any]]:
        """
        Runs native MongoDB Atlas $vectorSearch stage.
        """
        pipeline = [
            {
                "$vectorSearch": {
                    "index": "vector_index",
                    "path": "embedding",
                    "queryVector": query_embedding,
                    "numCandidates": top_k * 10,
                    "limit": top_k
                }
            },
            {
                "$project": {
                    "_id": 0,
                    "text": 1,
                    "source": 1,
                    "score": {"$meta": "vectorSearchScore"}
                }
            }
        ]
        try:
            cursor = collection.aggregate(pipeline)
            results = list(cursor)
            if results:
                return results
        except Exception as e:
            logger.debug(f"Atlas $vectorSearch pipeline failed (expected if index is not created in Atlas UI): {e}")
        return []

    def _fallback_similarity_search(self, collection, query_embedding: List[float], top_k: int, query: str = "") -> List[Dict[str, Any]]:
        """
        Calculates hybrid similarity (cosine similarity + keyword match overlap) over stored vector documents.
        """
        docs = list(collection.find({}, {"_id": 0, "text": 1, "source": 1, "embedding": 1}))
        scored_docs = []
        query_words = set(w.strip("?,.:;!()").lower() for w in query.split() if len(w) > 2)

        for doc in docs:
            text = doc.get("text", "")
            emb = doc.get("embedding")
            c_score = cosine_similarity(query_embedding, emb) if emb else 0.0

            # Keyword match bonus for fallback mode
            doc_words = set(w.strip("?,.:;!()").lower() for w in text.split())
            k_score = len(query_words.intersection(doc_words)) / max(len(query_words), 1) if query_words else 0.0

            final_score = (c_score * 0.4) + (k_score * 0.6)

            scored_docs.append({
                "text": text,
                "source": doc.get("source", ""),
                "score": round(final_score, 4)
            })

        scored_docs.sort(key=lambda x: x["score"], reverse=True)
        return scored_docs[:top_k]



default_retriever = RAGRetriever()
