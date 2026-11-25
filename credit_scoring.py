"""Inference used by the Streamlit demo and the team's JSON scoring endpoint."""
import json
import pickle
from pathlib import Path

import pandas as pd

MODEL_DIR = Path(__file__).resolve().parent / "models"
APPROVE_MAX = 0.30
REJECT_MIN = 0.7248


def load_pipeline(directory=MODEL_DIR):
    with (directory / "model_metrics.json").open(encoding="utf-8") as handle:
        metadata = json.load(handle)["_meta"]
    with (directory / "best_model.pkl").open("rb") as handle:
        model = pickle.load(handle)
    return model, metadata


def score_application(values, model, metadata):
    columns = (metadata.get("shap_selected_numeric_cols", [])
               + metadata.get("shap_selected_categorical_cols", [])) or metadata["feature_cols"]
    for name in columns:
        if name not in values:
            raise ValueError(f"Missing required feature: {name}")
    frame = pd.DataFrame([values], columns=columns)
    probability = float(model.predict_proba(frame)[0, 1])
    label = "Bad" if model.predict(frame)[0] == 1 else "Good"
    return probability, label


def review_route(probability):
    if not 0 <= probability <= 1:
        raise ValueError("Probability must be between 0 and 1.")
    if probability <= APPROVE_MAX:
        return "Auto-approve"
    if probability >= REJECT_MIN:
        return "Recommend rejection"
    return "Manual review"
