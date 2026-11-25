#!/usr/bin/env python3
"""
ML Model Prediction Service
Loads the XGBoost model and preprocessing pipeline, performs predictions
"""

import json
import pickle
import sys
from pathlib import Path
import pandas as pd

def load_model_and_metrics():
    """Load the trained model and metrics"""
    model_dir = Path(__file__).parent
    
    # Load the complete pipeline (includes preprocessing + classifier)
    with open(model_dir / 'best_model.pkl', 'rb') as f:
        model = pickle.load(f)
    
    # Load metrics for model info
    with open(model_dir / 'model_metrics.json', 'r') as f:
        metrics = json.load(f)
    
    return model, metrics

def predict(input_data):
    """
    Make prediction on input data
    
    Args:
        input_data: dict with 24 features
    
    Returns:
        dict with prediction results
    """
    try:
        model, metrics = load_model_and_metrics()
        
        # Get feature columns specifically for SHAP top-12 model from metadata
        shap_num = metrics['_meta'].get('shap_selected_numeric_cols', [])
        shap_cat = metrics['_meta'].get('shap_selected_categorical_cols', [])
        feature_cols = shap_num + shap_cat
        
        # Fallback to all features if SHAP features are not found
        if not feature_cols:
            feature_cols = metrics['_meta']['feature_cols']
        
        # Prepare input as DataFrame with all 24 columns
        df = pd.DataFrame([input_data])
        
        # Ensure all required columns are present
        for col in feature_cols:
            if col not in df.columns:
                raise ValueError(f"Missing required feature: {col}")
        
        # Select all columns in the correct order
        df = df[feature_cols]
        
        # Use the complete pipeline (preprocessing + prediction)
        # The model is a Pipeline with 'preprocessor' and 'clf' steps
        # predict_proba will automatically apply preprocessing
        proba = model.predict_proba(df)[0]
        risk_probability = float(proba[1])  # Probability of Bad (class 1)
        
        # Get prediction label
        prediction = model.predict(df)[0]
        risk_label = "Bad" if prediction == 1 else "Good"
        
        return {
            "success": True,
            "riskProbability": risk_probability,
            "riskLabel": risk_label,
            "modelMetrics": {
                "rocAuc": metrics['_meta']['test_metrics_at_recommended_threshold']['roc_auc'],
                "f1": metrics['_meta']['test_metrics_at_recommended_threshold']['f1'],
                "accuracy": metrics['_meta']['test_metrics_at_recommended_threshold']['accuracy'],
                "precision": metrics['_meta']['test_metrics_at_recommended_threshold']['precision'],
                "recall": metrics['_meta']['test_metrics_at_recommended_threshold']['recall'],
            }
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

if __name__ == "__main__":
    # Read input from stdin
    input_json = sys.stdin.read()
    input_data = json.loads(input_json)
    
    # Make prediction
    result = predict(input_data)
    
    # Output result as JSON
    print(json.dumps(result))
