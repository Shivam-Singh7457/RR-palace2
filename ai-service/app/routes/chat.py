import json
import logging
from fastapi import APIRouter, HTTPException, status
from fastapi.responses import StreamingResponse
from app.models.schemas import ChatRequest, ChatResponse, ChatMessage, ErrorResponse
from app.agent.orchestrator import default_orchestrator

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Chat"])

@router.post(
    "/chat",
    response_model=ChatResponse,
    responses={500: {"model": ErrorResponse}}
)
async def chat_endpoint(request: ChatRequest):
    """
    Chat endpoint to send messages to the AI assistant using Agentic Intent Routing, Tool Calls, and RAG.
    """
    if not request.messages:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Messages list cannot be empty."
        )

    try:
        result = await default_orchestrator.process_chat(
            messages=request.messages,
            temperature=request.temperature,
            max_tokens=request.max_tokens,
            session_id=request.session_id,
            user=request.user
        )

        return ChatResponse(
            success=True,
            message=ChatMessage(role="assistant", content=result["response"]),
            model=result.get("model", "agent-orchestrator"),
            session_id=request.session_id,
            action=result.get("action")
        )
    except Exception as err:
        logger.error(f"Error in chat_endpoint: {str(err)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"AI service error: {str(err)}"
        )


@router.post("/chat/stream", summary="Stream Chat Response via Server-Sent Events (SSE)")
async def chat_stream_endpoint(request: ChatRequest):
    """
    Streaming chat endpoint that yields response text token-by-token over text/event-stream.
    """
    if not request.messages:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Messages list cannot be empty."
        )

    async def event_generator():
        try:
            result = await default_orchestrator.process_chat(
                messages=request.messages,
                temperature=request.temperature,
                max_tokens=request.max_tokens,
                session_id=request.session_id,
                user=request.user
            )
            full_text = result["response"]
            action = result.get("action")

            # Stream chunks
            chunks = full_text.split(" ")
            for i, chunk in enumerate(chunks):
                word = chunk + (" " if i < len(chunks) - 1 else "")
                data_payload = json.dumps({"token": word})
                yield f"data: {data_payload}\n\n"

            # Stream final metadata event with action
            meta_payload = json.dumps({
                "done": True,
                "model": result.get("model", "agent-orchestrator"),
                "action": action
            })
            yield f"data: {meta_payload}\n\n"
        except Exception as err:
            logger.error(f"Error in streaming chat: {err}")
            err_payload = json.dumps({"error": str(err)})
            yield f"data: {err_payload}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")


