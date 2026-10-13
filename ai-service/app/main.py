import logging
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.config.settings import settings
from app.routes.health import router as health_router
from app.routes.chat import router as chat_router
from app.routes.metrics import router as metrics_router

# Configure Structured Logging
logging.basicConfig(
    level=settings.LOG_LEVEL,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("ai_service")

from contextlib import asynccontextmanager
from app.monitoring.tracing import setup_langsmith_env

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(f"Starting {settings.SERVICE_NAME} v{settings.VERSION} [ENV={settings.ENV}]")
    logger.info(f"Active LLM Provider mode: {settings.LLM_PROVIDER}")
    if setup_langsmith_env():
        logger.info(f"[LangSmith] Active Tracing enabled for project '{settings.LANGCHAIN_PROJECT}'")
    else:
        logger.warning("[LangSmith] Tracing INACTIVE: LANGCHAIN_API_KEY is not set or empty in .env")
    yield

# Initialize FastAPI App
app = FastAPI(
    title=settings.SERVICE_NAME,
    version=settings.VERSION,
    description="Python FastAPI Microservice for Royal Rudraksh Palace AI & RAG Capabilities",
    docs_url=None,
    redoc_url=None,
    lifespan=lifespan
)

# Middleware to limit JSON response size (e.g., truncate large responses)
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

class ResponseSizeLimiter(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        response = await call_next(request)
        # If response is JSON and larger than 1MB, truncate it
        if isinstance(response, JSONResponse):
            body = b"".join([chunk async for chunk in response.body_iterator])
            max_bytes = 1_000_000  # 1 MB
            if len(body) > max_bytes:
                return JSONResponse(content={"detail": "Response truncated due to size limit."}, status_code=413)
        return response

app.add_middleware(ResponseSizeLimiter)

# CORS Middleware Setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Exception Handlers
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled Global Error: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "message": "An unexpected error occurred in the AI service.",
            "error_code": "INTERNAL_SERVER_ERROR"
        }
    )

# Include API Routers
app.include_router(health_router)
app.include_router(chat_router)
app.include_router(metrics_router, prefix="/metrics")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=True if settings.ENV == "development" else False
    )
