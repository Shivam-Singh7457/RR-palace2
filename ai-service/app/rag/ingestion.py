import os
import glob
import logging
from datetime import datetime
from typing import List, Dict, Any
from pymongo import MongoClient
from langchain_text_splitters import RecursiveCharacterTextSplitter

from app.config.settings import settings
from app.rag.embeddings import embed_texts

logger = logging.getLogger(__name__)

KNOWLEDGE_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "data", "knowledge")
COLLECTION_NAME = "knowledge_vectors"

def load_knowledge_documents() -> List[Dict[str, str]]:
    """
    Reads markdown files from the knowledge directory.
    """
    docs = []
    if not os.path.exists(KNOWLEDGE_DIR):
        logger.warning(f"Knowledge directory {KNOWLEDGE_DIR} does not exist.")
        return docs

    md_files = glob.glob(os.path.join(KNOWLEDGE_DIR, "*.md"))
    for file_path in md_files:
        filename = os.path.basename(file_path)
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                content = f.read()
                docs.append({
                    "source": filename,
                    "content": content
                })
        except Exception as e:
            logger.error(f"Error reading file {file_path}: {e}")
    return docs


def chunk_documents(documents: List[Dict[str, str]], chunk_size: int = 500, chunk_overlap: int = 100) -> List[Dict[str, Any]]:
    """
    Chunks document texts into overlapping passages.
    """
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        separators=["\n## ", "\n### ", "\n\n", "\n", " ", ""]
    )
    
    chunks = []
    chunk_index = 0
    for doc in documents:
        split_texts = splitter.split_text(doc["content"])
        for text in split_texts:
            if text.strip():
                chunks.append({
                    "chunk_id": f"{doc['source']}_{chunk_index}",
                    "source": doc["source"],
                    "text": text.strip()
                })
                chunk_index += 1
    return chunks


def ingest_knowledge_base(force_reindex: bool = True) -> int:
    """
    Main ingestion pipeline: Loads docs -> Chunks -> Embeds -> Saves to MongoDB.
    """
    logger.info("Starting Knowledge Base Ingestion...")
    raw_docs = load_knowledge_documents()
    if not raw_docs:
        logger.warning("No knowledge documents found to ingest.")
        return 0

    chunks = chunk_documents(raw_docs)
    logger.info(f"Generated {len(chunks)} text chunks from {len(raw_docs)} documents.")

    texts = [c["text"] for c in chunks]
    embeddings = embed_texts(texts)

    documents_to_insert = []
    now = datetime.utcnow().isoformat()
    for chunk, emb in zip(chunks, embeddings):
        documents_to_insert.append({
            "chunk_id": chunk["chunk_id"],
            "source": chunk["source"],
            "text": chunk["text"],
            "embedding": emb,
            "created_at": now
        })

    if not settings.MONGODB_URI:
        logger.warning("MONGODB_URI not configured. Skipping database insertion.")
        return len(documents_to_insert)

    try:
        client = MongoClient(settings.MONGODB_URI)
        db = client[settings.MONGODB_DB_NAME]
        collection = db[COLLECTION_NAME]

        if force_reindex:
            collection.delete_many({})

        if documents_to_insert:
            collection.insert_many(documents_to_insert)
            logger.info(f"Successfully inserted {len(documents_to_insert)} vector documents into MongoDB collection '{COLLECTION_NAME}'.")
        
        client.close()
        return len(documents_to_insert)
    except Exception as e:
        logger.error(f"Failed to insert vectors into MongoDB: {e}")
        return 0


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    count = ingest_knowledge_base()
    print(f"Ingestion complete. {count} chunks indexed.")
