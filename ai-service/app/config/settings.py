import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    ENV: str = "development"
    LOG_LEVEL: str = "INFO"
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    SERVICE_NAME: str = "Royal Rudraksh Palace AI Service"
    VERSION: str = "1.0.0"

    # LLM Settings
    LLM_PROVIDER: str = "gemini"  # "mock", "gemini", "openai"
    LLM_MODEL: str = "gemini-2.5-flash-lite"
    GEMINI_API_KEY: Optional[str] = None


    OPENAI_API_KEY: Optional[str] = None

    # MongoDB Settings for RAG Vector Search & Data
    MONGODB_URI: Optional[str] = None
    MONGODB_DB_NAME: str = "rr_palace"

    # MERN Backend Service Connection
    NODE_BACKEND_URL: str = "http://localhost:5000"

    # LangSmith Tracing & Evaluation Settings
    LANGSMITH_ENABLED: bool = True
    LANGCHAIN_TRACING_V2: str = "true"
    LANGCHAIN_ENDPOINT: str = "https://api.smith.langchain.com"
    LANGCHAIN_API_KEY: Optional[str] = None
    LANGCHAIN_PROJECT: str = "rr-palace-ai-service"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()

