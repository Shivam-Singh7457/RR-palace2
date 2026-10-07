import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.rag.ingestion import load_knowledge_documents, chunk_documents, ingest_knowledge_base
from app.rag.embeddings import embed_text, embed_texts
from app.rag.retriever import default_retriever, cosine_similarity

client = TestClient(app)

def test_load_knowledge_documents():
    docs = load_knowledge_documents()
    assert len(docs) >= 2, "Expected at least 2 knowledge base documents (policies.md, faqs.md)"
    sources = [d["source"] for d in docs]
    assert "policies.md" in sources
    assert "faqs.md" in sources


def test_chunk_documents():
    docs = load_knowledge_documents()
    chunks = chunk_documents(docs, chunk_size=300, chunk_overlap=50)
    assert len(chunks) > 0
    assert "text" in chunks[0]
    assert "source" in chunks[0]


def test_embedding_generation():
    vec = embed_text("Who is the owner of Royal Rudraksh Palace?")
    assert isinstance(vec, list)
    assert len(vec) > 0

    vecs = embed_texts(["Check-in policy", "Cancellation policy"])
    assert len(vecs) == 2
    assert len(vecs[0]) == len(vec)


def test_cosine_similarity():
    v1 = [1.0, 0.0, 0.0]
    v2 = [1.0, 0.0, 0.0]
    v3 = [0.0, 1.0, 0.0]
    assert pytest.approx(cosine_similarity(v1, v2), 0.001) == 1.0
    assert pytest.approx(cosine_similarity(v1, v3), 0.001) == 0.0


def test_ingestion_and_retrieval():
    count = ingest_knowledge_base(force_reindex=True)
    assert count > 0

    # Retrieve owner info
    results = default_retriever.retrieve("Who is the owner of this property?", top_k=2)
    assert len(results) > 0
    texts_combined = " ".join([r["text"] for r in results])
    assert "Shivam Singh" in texts_combined or "Rudraksh" in texts_combined


def test_chat_grounded_owner_query():
    """Test POST /chat with property owner question."""
    payload = {
        "messages": [
            {"role": "user", "content": "Who is the owner of this property?"}
        ]
    }
    response = client.post("/chat", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    content = data["message"]["content"]
    assert ("Shivam Singh" in content) or ("Rudraksh" in content)


def test_chat_grounded_checkin_query():
    """Test POST /chat with check-in time question."""
    payload = {
        "messages": [
            {"role": "user", "content": "What is the check-in time?"}
        ]
    }
    response = client.post("/chat", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    content = data["message"]["content"]
    assert "10:00 AM" in content or "2:00 PM" in content or "14:00" in content

