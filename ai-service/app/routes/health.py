from fastapi import APIRouter
from datetime import datetime, timezone
from app.models.schemas import HealthResponse
from app.config.settings import settings

router = APIRouter(tags=["Health"])

@router.get("/health", response_model=HealthResponse)
async def health_check():
    """
    Health check endpoint to verify service availability and status.
    """
    return HealthResponse(
        status="ok",
        service=settings.SERVICE_NAME,
        version=settings.VERSION,
        timestamp=datetime.now(timezone.utc).isoformat(),
        environment=settings.ENV
    )
