#!/usr/bin/env python3
"""Read one application on stdin and return the team's JSON response."""
import json
import sys
from pathlib import Path

MODEL_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(MODEL_DIR.parents[2]))
from credit_scoring import load_pipeline, score_application


def predict(input_data):
    try:
        model, metadata = load_pipeline(MODEL_DIR)
        probability, label = score_application(input_data, model, metadata)
        metrics = metadata["test_metrics_at_recommended_threshold"]
        return {
            "success": True,
            "riskProbability": probability,
            "riskLabel": label,
            "modelMetrics": {
                "rocAuc": metrics["roc_auc"], "f1": metrics["f1"],
                "accuracy": metrics["accuracy"], "precision": metrics["precision"],
                "recall": metrics["recall"],
            },
        }
    except Exception as error:
        return {"success": False, "error": str(error)}


if __name__ == "__main__":
    print(json.dumps(predict(json.load(sys.stdin))))
