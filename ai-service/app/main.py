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

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(f"Starting {settings.SERVICE_NAME} v{settings.VERSION} [ENV={settings.ENV}]")
    logger.info(f"Active LLM Provider mode: {settings.LLM_PROVIDER}")
    yield

# Initialize FastAPI App
app = FastAPI(
    title=settings.SERVICE_NAME,
    version=settings.VERSION,
    description="Python FastAPI Microservice for Royal Rudraksh Palace AI & RAG Capabilities",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

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
