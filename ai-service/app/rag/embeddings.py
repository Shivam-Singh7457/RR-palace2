import logging
import hashlib
from typing import List, Optional
from app.config.settings import settings

logger = logging.getLogger(__name__)

# Cache Gemini client instance
_genai_client = None

def get_genai_client():
    global _genai_client
    if _genai_client is None:
        if settings.GEMINI_API_KEY:
            try:
                from google import genai
                _genai_client = genai.Client(api_key=settings.GEMINI_API_KEY)
            except Exception as e:
                logger.error(f"Failed to initialize Gemini GenAI client: {e}")
    return _genai_client


def _mock_embedding(text: str, dim: int = 768) -> List[float]:
    """
    Generates a deterministic pseudo-embedding vector for offline / mock testing.
    """
    sha = hashlib.sha256(text.encode("utf-8")).digest()
    vec = []
    for i in range(dim):
        b = sha[i % len(sha)]
        val = ((b / 255.0) * 2.0) - 1.0
        vec.append(round(val, 6))
    # Normalize vector length
    norm = sum(x*x for x in vec) ** 0.5 or 1.0
    return [round(x / norm, 6) for x in vec]


def embed_text(text: str, model_name: str = "gemini-embedding-001") -> List[float]:
    """
    Generates vector embedding for a single string.
    """
    client = get_genai_client()
    if client and settings.GEMINI_API_KEY:
        try:
            target_model = "gemini-embedding-001" if "004" in model_name else model_name
            response = client.models.embed_content(
                model=target_model,
                contents=text
            )
            if response.embeddings and len(response.embeddings) > 0:
                return response.embeddings[0].values
        except Exception as e:
            logger.warning(f"Gemini embedding API call failed: {e}. Falling back to deterministic embedding.")
    
    return _mock_embedding(text)


def embed_texts(texts: List[str], model_name: str = "gemini-embedding-001") -> List[List[float]]:
    """
    Generates vector embeddings for a list of strings.
    """
    client = get_genai_client()
    if client and settings.GEMINI_API_KEY:
        try:
            target_model = "gemini-embedding-001" if "004" in model_name else model_name
            response = client.models.embed_content(
                model=target_model,
                contents=texts
            )
            if response.embeddings:
                return [emb.values for emb in response.embeddings]
        except Exception as e:
            logger.warning(f"Gemini batch embedding API call failed: {e}. Falling back to deterministic embeddings.")

    return [_mock_embedding(t) for t in texts]

