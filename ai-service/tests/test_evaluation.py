import pytest
from app.evaluation.evaluator import RAGEvaluator

@pytest.mark.asyncio
async def test_rag_evaluation_benchmark():
    evaluator = RAGEvaluator()
    summary = await evaluator.run_evaluation()

    assert "total_evals" in summary
    assert summary["total_evals"] >= 5
    assert summary["intent_accuracy_pct"] >= 80.0
    assert summary["overall_pass_rate_pct"] >= 80.0
