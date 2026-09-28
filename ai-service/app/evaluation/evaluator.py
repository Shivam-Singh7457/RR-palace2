import os
import json
import asyncio
import logging
from typing import Dict, Any, List
from app.agent.orchestrator import default_orchestrator
from app.monitoring.tracing import traceable

logger = logging.getLogger(__name__)

EVAL_DATASET_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
    "data",
    "eval_dataset.json"
)

class RAGEvaluator:
    """
    Automated evaluation framework for measuring intent accuracy and RAG grounding faithfulness.
    """

    def load_dataset(self) -> List[Dict[str, Any]]:
        if not os.path.exists(EVAL_DATASET_PATH):
            logger.error(f"Eval dataset path {EVAL_DATASET_PATH} not found.")
            return []
        with open(EVAL_DATASET_PATH, "r", encoding="utf-8") as f:
            return json.load(f)

    @traceable(name="RAGEvaluator.run_evaluation", run_type="chain")
    async def run_evaluation(self) -> Dict[str, Any]:

        dataset = self.load_dataset()
        if not dataset:
            return {"error": "Dataset empty or missing."}

        total = len(dataset)
        intent_matches = 0
        grounding_matches = 0
        results = []

        for item in dataset:
            q_id = item["id"]
            query = item["query"]
            exp_intent = item.get("expected_intent")
            exp_keywords = item.get("expected_keywords", [])

            chat_res = await default_orchestrator.process_chat([{"role": "user", "content": query}])
            actual_intent = chat_res.get("intent")
            actual_response = chat_res.get("response", "")

            # Verify Intent
            intent_pass = (actual_intent == exp_intent)
            if intent_pass:
                intent_matches += 1

            # Verify Grounding Keywords
            grounding_pass = any(kw.lower() in actual_response.lower() for kw in exp_keywords)
            if grounding_pass:
                grounding_matches += 1

            item_passed = intent_pass and grounding_pass
            results.append({
                "id": q_id,
                "query": query,
                "passed": item_passed,
                "intent_matched": intent_pass,
                "grounding_matched": grounding_pass,
                "actual_intent": actual_intent,
                "response_sample": actual_response[:120]
            })

        intent_acc = round((intent_matches / total) * 100, 2)
        grounding_acc = round((grounding_matches / total) * 100, 2)

        summary = {
            "total_evals": total,
            "intent_accuracy_pct": intent_acc,
            "grounding_accuracy_pct": grounding_acc,
            "overall_pass_rate_pct": round(sum(1 for r in results if r["passed"]) / total * 100, 2),
            "results": results
        }
        return summary


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    evaluator = RAGEvaluator()
    metrics = asyncio.run(evaluator.run_evaluation())
    print("\n--- BENCHMARK EVALUATION RESULTS ---")
    print(json.dumps(metrics, indent=2))
