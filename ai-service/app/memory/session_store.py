import logging
from datetime import datetime
from typing import Dict, Any, List, Optional
from pymongo import MongoClient

from app.config.settings import settings

logger = logging.getLogger(__name__)

COLLECTION_NAME = "ai_chat_sessions"

class SessionStore:
    def __init__(self):
        self.db_uri = settings.MONGODB_URI
        self.db_name = settings.MONGODB_DB_NAME
        self.collection_name = COLLECTION_NAME
        self._in_memory_sessions: Dict[str, Dict[str, Any]] = {}

    def get_session(self, session_id: str) -> Dict[str, Any]:
        """
        Retrieves session document by session_id.
        """
        if not session_id:
            return {"history": [], "slots": {}, "summary": ""}

        # Attempt MongoDB fetch
        if self.db_uri:
            try:
                client = MongoClient(self.db_uri, serverSelectionTimeoutMS=2000)
                db = client[self.db_name]
                doc = db[self.collection_name].find_one({"session_id": session_id}, {"_id": 0})
                client.close()
                if doc:
                    return {
                        "history": doc.get("history", []),
                        "slots": doc.get("slots", {}),
                        "summary": doc.get("summary", "")
                    }
            except Exception as e:
                logger.debug(f"MongoDB session fetch failed ({e}). Falling back to memory store.")

        # Fallback in-memory fetch
        if session_id in self._in_memory_sessions:
            return self._in_memory_sessions[session_id]

        new_session = {"history": [], "slots": {}, "summary": ""}
        self._in_memory_sessions[session_id] = new_session
        return new_session

    def save_session(
        self,
        session_id: str,
        history: List[Dict[str, str]],
        slots: Dict[str, Any],
        summary: str = ""
    ) -> bool:
        """
        Saves or updates session document.
        """
        if not session_id:
            return False

        session_data = {
            "session_id": session_id,
            "history": history,
            "slots": slots,
            "summary": summary,
            "updated_at": datetime.utcnow().isoformat()
        }

        # Update in-memory fallback store
        self._in_memory_sessions[session_id] = {
            "history": history,
            "slots": slots,
            "summary": summary
        }

        # Save to MongoDB
        if self.db_uri:
            try:
                client = MongoClient(self.db_uri, serverSelectionTimeoutMS=2000)
                db = client[self.db_name]
                db[self.collection_name].update_one(
                    {"session_id": session_id},
                    {"$set": session_data},
                    upsert=True
                )
                client.close()
                return True
            except Exception as e:
                logger.debug(f"MongoDB session save failed ({e}). Session saved in memory.")

        return True

session_store = SessionStore()
