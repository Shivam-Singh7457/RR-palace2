from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

class HealthResponse(BaseModel):
    status: str = Field(..., json_schema_extra={"example": "ok"})
    service: str = Field(..., json_schema_extra={"example": "Royal Rudraksh Palace AI Service"})
    version: str = Field(..., json_schema_extra={"example": "1.0.0"})
    timestamp: str = Field(..., json_schema_extra={"example": "2026-09-19T12:00:00Z"})
    environment: str = Field(..., json_schema_extra={"example": "development"})

class ChatMessage(BaseModel):
    role: str = Field(..., json_schema_extra={"example": "user"}, description="Role of message sender: 'user', 'assistant', or 'system'")
    content: str = Field(..., json_schema_extra={"example": "What are the check-in times?"}, description="Content of the message")

class ChatRequest(BaseModel):
    messages: List[ChatMessage] = Field(..., description="Chronological conversation message history")
    session_id: Optional[str] = Field(default=None, description="Optional session/conversation ID")
    temperature: Optional[float] = Field(default=0.7, ge=0.0, le=1.0)
    max_tokens: Optional[int] = Field(default=1024, ge=1, le=4096)
    user: Optional[Dict[str, Any]] = Field(default=None, description="Optional authenticated user context (email, username, id)")

class ChatResponse(BaseModel):
    success: bool = Field(default=True)
    message: ChatMessage
    model: str
    session_id: Optional[str] = None
    action: Optional[Dict[str, Any]] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class ErrorResponse(BaseModel):
    success: bool = Field(default=False)
    message: str
    error_code: str = "INTERNAL_ERROR"
    timestamp: datetime = Field(default_factory=datetime.utcnow)
