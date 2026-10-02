import pytest
import pandas as pd
import numpy as np

from ml.src.preprocessor import create_preprocessing_pipeline
from ml.src.evaluate import evaluate_model_performance, find_optimal_threshold
from ml.src.explain import ModelExplainer, get_risk_category

def test_preprocessor_pipeline():
    """Test fitting and transforming preprocessor pipeline."""
    sample_df = pd.DataFrame({
        "carrier": ["AA", "DL", "UA"],
        "origin": ["JFK", "ATL", "SFO"],
        "destination": ["LAX", "ORD", "EWR"],
        "time_of_day": ["Morning", "Afternoon", "Evening"],
        "dep_hour": [8, 14, 19],
        "dep_minute": [15, 30, 45],
        "arr_hour": [11, 17, 22],
        "arr_minute": [45, 0, 15],
        "month": [1, 5, 9],
        "day_of_week": [1, 3, 5],
        "distance": [2475.0, 600.0, 2565.0],
        "is_weekend": [0, 0, 0],
        "scheduled_duration": [330.0, 150.0, 330.0],
    })

    preprocessor = create_preprocessing_pipeline()
    transformed = preprocessor.fit_transform(sample_df)
    
    assert isinstance(transformed, np.ndarray)
    assert transformed.shape[0] == 3
    feature_names = preprocessor.get_feature_names()
    assert len(feature_names) == transformed.shape[1]

def test_model_evaluation_metrics():
    """Test evaluation calculation metrics with custom threshold."""
    y_true = np.array([0, 0, 1, 1, 0, 1])
    y_prob = np.array([0.1, 0.2, 0.85, 0.45, 0.15, 0.90])

    metrics = evaluate_model_performance(y_true, y_prob, threshold=0.40, model_name="TestXGB")
    
    assert "accuracy" in metrics
    assert "precision" in metrics
    assert "recall" in metrics
    assert "f1_score" in metrics
    assert "roc_auc" in metrics
    assert "pr_auc" in metrics
    assert "confusion_matrix" in metrics
    assert metrics["confusion_matrix"]["true_positives"] == 3

def test_optimal_threshold_finder():
    """Test finding optimal threshold on validation set."""
    y_true_val = np.array([0, 0, 0, 1, 1, 1])
    y_prob_val = np.array([0.1, 0.2, 0.3, 0.4, 0.8, 0.9])
    
    best_thresh, best_f1 = find_optimal_threshold(y_true_val, y_prob_val, metric="f1")
    assert 0.10 <= best_thresh <= 0.60
    assert best_f1 > 0.0

def test_risk_categorization():
    """Test risk category buckets."""
    assert get_risk_category(0.10) == "Low Risk"
    assert get_risk_category(0.35) == "Moderate Risk"
    assert get_risk_category(0.60) == "High Risk"
    assert get_risk_category(0.85) == "Severe Risk"
