import os
import logging
from typing import Callable, Any
from app.config.settings import settings

logger = logging.getLogger(__name__)

def setup_langsmith_env():
    """Ensure LangSmith environment variables are injected into os.environ."""
    if settings.LANGSMITH_ENABLED and settings.LANGCHAIN_API_KEY and settings.LANGCHAIN_API_KEY.strip():
        os.environ["LANGCHAIN_TRACING_V2"] = "true"
        os.environ["LANGCHAIN_ENDPOINT"] = settings.LANGCHAIN_ENDPOINT
        os.environ["LANGCHAIN_API_KEY"] = settings.LANGCHAIN_API_KEY.strip()
        os.environ["LANGCHAIN_PROJECT"] = settings.LANGCHAIN_PROJECT
        return True
    return False

def _init_langsmith():
    is_active = setup_langsmith_env()
    if is_active:
        try:
            from langsmith import traceable
            logger.info(f"[LangSmith] Tracing initialized successfully for project '{settings.LANGCHAIN_PROJECT}'")
            return traceable
        except ImportError:
            logger.warning("[LangSmith] 'langsmith' package not found. Install via 'pip install langsmith'. Tracing disabled.")
    else:
        if not settings.LANGSMITH_ENABLED:
            logger.info("[LangSmith] Tracing is disabled in configuration (LANGSMITH_ENABLED=false).")
        elif not settings.LANGCHAIN_API_KEY or not settings.LANGCHAIN_API_KEY.strip():
            logger.warning("[LangSmith] LANGCHAIN_API_KEY is missing or empty in .env. Tracing disabled.")

    # Safe no-op decorator if key is not configured or feature disabled
    def noop_traceable(*args, **kwargs):
        def decorator(func: Callable[..., Any]) -> Callable[..., Any]:
            return func
        if len(args) == 1 and callable(args[0]):
            return args[0]
        return decorator

    return noop_traceable

traceable = _init_langsmith()

