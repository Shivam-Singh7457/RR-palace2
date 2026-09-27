import logging
from typing import List, Dict, Any, Tuple

logger = logging.getLogger(__name__)

def prune_and_summarize_history(
    history: List[Dict[str, str]],
    existing_summary: str = "",
    max_history_length: int = 10
) -> Tuple[List[Dict[str, str]], str]:
    """
    Prunes conversation history to maintain max_history_length.
    Compiles pruned messages into a rolling summary string to preserve context.
    """
    if len(history) <= max_history_length:
        return history, existing_summary

    # Divide history into messages to prune and recent messages to keep
    overflow_count = len(history) - max_history_length
    to_prune = history[:overflow_count]
    to_keep = history[overflow_count:]

    # Build summary snippet from pruned messages
    summary_snippets = []
    for msg in to_prune:
        role = msg.get("role", "user").capitalize()
        content = msg.get("content", "")
        summary_snippets.append(f"{role}: {content[:100]}")

    new_summary_text = " | ".join(summary_snippets)
    if existing_summary:
        updated_summary = f"{existing_summary} | {new_summary_text}"
    else:
        updated_summary = f"Prior Conversation Summary: {new_summary_text}"

    logger.info(f"Pruned {overflow_count} old messages. Updated summary length: {len(updated_summary)}")
    return to_keep, updated_summary


def truncate_rag_context(
    context_chunks: List[Dict[str, Any]],
    max_total_chars: int = 1500
) -> List[Dict[str, Any]]:
    """
    Truncates RAG context chunks to fit within total character token budget.
    """
    selected_chunks = []
    total_chars = 0

    for chunk in context_chunks:
        text = chunk.get("text", "")
        if total_chars + len(text) <= max_total_chars:
            selected_chunks.append(chunk)
            total_chars += len(text)
        else:
            remaining_chars = max_total_chars - total_chars
            if remaining_chars > 100:
                truncated_chunk = dict(chunk)
                truncated_chunk["text"] = text[:remaining_chars] + "..."
                selected_chunks.append(truncated_chunk)
            break

    return selected_chunks
