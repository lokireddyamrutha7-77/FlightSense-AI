import os
from pathlib import Path

# Base Paths
BASE_DIR = Path(__file__).resolve().parent.parent.parent
DATA_DIR = BASE_DIR / "data"
MODELS_DIR = BASE_DIR / "models"

# Dataset Specs
DEFAULT_DATA_PATH = DATA_DIR / "flights.csv"
SAMPLE_DATA_PATH = DATA_DIR / "sample_flights.csv"
ANALYTICS_CACHE_PATH = DATA_DIR / "analytics_cache.json"

# Feature Definitions (PRE-FLIGHT ONLY — STRICTLY NO LEAKAGE)
CATEGORICAL_FEATURES = ["carrier", "origin", "destination", "time_of_day"]
NUMERICAL_FEATURES = [
    "dep_hour",
    "dep_minute",
    "arr_hour",
    "arr_minute",
    "month",
    "day_of_week",
    "distance",
    "is_weekend",
    "scheduled_duration",
]

TARGET_COL = "is_delayed"

# Hyperparameters for ML Models (Addressing Class Imbalance)
XGB_PARAMS = {
    "n_estimators": 150,
    "max_depth": 6,
    "learning_rate": 0.08,
    "subsample": 0.8,
    "colsample_bytree": 0.8,
    "scale_pos_weight": 4.58,  # (Negative / Positive class ratio)
    "random_state": 42,
    "eval_metric": "logloss",
    "n_jobs": -1,
}

RF_PARAMS = {
    "n_estimators": 100,
    "max_depth": 12,
    "class_weight": "balanced",
    "random_state": 42,
    "n_jobs": -1,
}

DT_PARAMS = {
    "max_depth": 10,
    "class_weight": "balanced",
    "random_state": 42,
}

LR_PARAMS = {
    "max_iter": 1000,
    "class_weight": "balanced",
    "random_state": 42,
    "C": 1.0,
}

# Artifact Filenames
PRODUCTION_MODEL_FILENAME = "xgboost_flight_delay_latest.joblib"
PREPROCESSOR_FILENAME = "preprocessor_latest.joblib"
FEATURE_METADATA_FILENAME = "feature_metadata.json"
FEATURE_ORDERING_FILENAME = "feature_ordering.json"
MODEL_METRICS_FILENAME = "model_metrics.json"
TRAINING_METADATA_FILENAME = "training_metadata.json"
MODEL_VERSION_FILENAME = "model_version.json"
