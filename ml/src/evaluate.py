import numpy as np
import pandas as pd
from typing import Dict, Any, List, Optional, Tuple
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    average_precision_score,
    confusion_matrix,
    roc_curve,
    precision_recall_curve,
)

def evaluate_model_performance(
    y_true: np.ndarray,
    y_prob: np.ndarray,
    threshold: float = 0.50,
    model_name: str = "Model",
    feature_names: List[str] = None,
    model_obj = None
) -> Dict[str, Any]:
    """
    Calculates comprehensive REAL test-set evaluation metrics using a specific decision threshold:
    Accuracy, Precision, Recall, F1-score, ROC-AUC, PR-AUC,
    Confusion Matrix, ROC Curve points, PR Curve points, and Feature Importances.
    """
    y_pred = (y_prob >= threshold).astype(int)
    cm = confusion_matrix(y_true, y_pred)
    tn, fp, fn, tp = cm.ravel() if cm.size == 4 else (0, 0, 0, 0)

    acc = float(accuracy_score(y_true, y_pred))
    prec = float(precision_score(y_true, y_pred, zero_division=0))
    rec = float(recall_score(y_true, y_pred, zero_division=0))
    f1 = float(f1_score(y_true, y_pred, zero_division=0))

    try:
        roc_auc = float(roc_auc_score(y_true, y_prob))
    except Exception:
        roc_auc = 0.5

    try:
        pr_auc = float(average_precision_score(y_true, y_prob))
    except Exception:
        pr_auc = float(rec)

    # Compute ROC Curve (downsampled for JSON storage efficiency)
    try:
        fpr, tpr, _ = roc_curve(y_true, y_prob)
        indices = np.linspace(0, len(fpr) - 1, min(25, len(fpr)), dtype=int)
        roc_curve_data = [
            {"fpr": round(float(fpr[i]), 4), "tpr": round(float(tpr[i]), 4)}
            for i in indices
        ]
    except Exception:
        roc_curve_data = []

    # Compute PR Curve
    try:
        precisions, recalls, _ = precision_recall_curve(y_true, y_prob)
        indices = np.linspace(0, len(precisions) - 1, min(25, len(precisions)), dtype=int)
        pr_curve_data = [
            {"precision": round(float(precisions[i]), 4), "recall": round(float(recalls[i]), 4)}
            for i in indices
        ]
    except Exception:
        pr_curve_data = []

    # Extract Feature Importances
    importances = []
    if model_obj is not None and feature_names is not None:
        if hasattr(model_obj, "feature_importances_"):
            raw_imp = model_obj.feature_importances_
        elif hasattr(model_obj, "coef_"):
            raw_imp = np.abs(model_obj.coef_[0])
        else:
            raw_imp = None

        if raw_imp is not None:
            raw_imp = np.array(raw_imp)
            if raw_imp.sum() > 0:
                raw_imp = raw_imp / raw_imp.sum()
            
            imp_list = [
                {"feature": f_name, "importance": round(float(val), 4)}
                for f_name, val in zip(feature_names, raw_imp)
            ]
            imp_list.sort(key=lambda x: x["importance"], reverse=True)
            importances = imp_list[:15]

    metrics = {
        "model_name": model_name,
        "decision_threshold": round(float(threshold), 4),
        "accuracy": round(acc, 4),
        "precision": round(prec, 4),
        "recall": round(rec, 4),
        "f1_score": round(f1, 4),
        "roc_auc": round(roc_auc, 4),
        "pr_auc": round(pr_auc, 4),
        "confusion_matrix": {
            "true_negatives": int(tn),
            "false_positives": int(fp),
            "false_negatives": int(fn),
            "true_positives": int(tp),
        },
        "roc_curve": roc_curve_data,
        "pr_curve": pr_curve_data,
        "feature_importances": importances,
    }

    return metrics


def find_optimal_threshold(y_true_val: np.ndarray, y_prob_val: np.ndarray, metric: str = "f1") -> Tuple[float, float]:
    """
    Searches candidate thresholds on VALIDATION set to maximize F1-score.
    Returns (optimal_threshold, best_val_f1).
    """
    best_thresh = 0.50
    best_score = -1.0

    thresholds = np.linspace(0.10, 0.70, 61)
    for t in thresholds:
        preds = (y_prob_val >= t).astype(int)
        if metric == "f1":
            score = f1_score(y_true_val, preds, zero_division=0)
        elif metric == "precision_recall_balance":
            p = precision_score(y_true_val, preds, zero_division=0)
            r = recall_score(y_true_val, preds, zero_division=0)
            score = (2 * p * r) / (p + r + 1e-8)
        else:
            score = f1_score(y_true_val, preds, zero_division=0)

        if score > best_score:
            best_score = score
            best_thresh = t

    return float(best_thresh), float(best_score)
