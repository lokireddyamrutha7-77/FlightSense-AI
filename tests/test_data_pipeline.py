import pytest
import pandas as pd
import numpy as np
from pathlib import Path

from ml.src.config import (
    DEFAULT_DATA_PATH,
    CATEGORICAL_FEATURES,
    NUMERICAL_FEATURES,
    TARGET_COL,
)
from ml.src.data_loader import load_flight_dataset, get_train_test_splits, build_airport_mapping

def test_data_leakage_prevention():
    """Verify strictly pre-flight features are used and post-flight/delay columns are excluded."""
    forbidden_leakage_cols = [
        "ARRIVAL_DELAY", "DEPARTURE_DELAY", "DEPARTURE_TIME", "ARRIVAL_TIME",
        "WEATHER_DELAY", "AIRLINE_DELAY", "SECURITY_DELAY", "AIR_SYSTEM_DELAY",
        "LATE_AIRCRAFT_DELAY", "TAXI_OUT", "TAXI_IN", "WHEELS_OFF", "WHEELS_ON",
        "CANCELLED", "DIVERTED"
    ]
    
    all_features = CATEGORICAL_FEATURES + NUMERICAL_FEATURES
    for col in forbidden_leakage_cols:
        assert col not in all_features, f"Target leakage detected! Column '{col}' is present in feature list."

def test_target_generation(tmp_path):
    """Verify binary target generation rule (DELAYED = 1 if ARRIVAL_DELAY > 15 else 0)."""
    sample_df = pd.DataFrame({
        'YEAR': [2015, 2015, 2015],
        'MONTH': [1, 1, 1],
        'DAY': [1, 1, 1],
        'DAY_OF_WEEK': [4, 4, 4],
        'AIRLINE': ['AA', 'DL', 'UA'],
        'FLIGHT_NUMBER': ['101', '102', '103'],
        'ORIGIN_AIRPORT': ['JFK', 'ATL', 'SFO'],
        'DESTINATION_AIRPORT': ['LAX', 'ORD', 'EWR'],
        'SCHEDULED_DEPARTURE': [800, 1200, 1800],
        'SCHEDULED_ARRIVAL': [1100, 1500, 2100],
        'SCHEDULED_TIME': [300, 180, 300],
        'DISTANCE': [2475, 600, 2500],
        'ARRIVAL_DELAY': [5.0, 18.0, 0.0],
        'CANCELLED': [0, 0, 0],
        'DIVERTED': [0, 0, 0],
        'AIR_SYSTEM_DELAY': [np.nan, 18.0, np.nan],
        'SECURITY_DELAY': [np.nan, 0.0, np.nan],
        'AIRLINE_DELAY': [np.nan, 0.0, np.nan],
        'LATE_AIRCRAFT_DELAY': [np.nan, 0.0, np.nan],
        'WEATHER_DELAY': [np.nan, 0.0, np.nan]
    })
    
    csv_file = tmp_path / "test_flights.csv"
    sample_df.to_csv(csv_file, index=False)
    
    df_clean = load_flight_dataset(csv_file)
    assert TARGET_COL in df_clean.columns
    assert list(df_clean[TARGET_COL]) == [0, 1, 0]

def test_time_aware_split_logic(tmp_path):
    """Verify time-aware train/test split partitions months 1-9 into train and months 10-12 into test."""
    rows = []
    for m in range(1, 13):
        rows.append({
            'YEAR': 2015, 'MONTH': m, 'DAY': 15, 'DAY_OF_WEEK': 2,
            'AIRLINE': 'AA', 'FLIGHT_NUMBER': f'10{m}',
            'ORIGIN_AIRPORT': 'JFK', 'DESTINATION_AIRPORT': 'LAX',
            'SCHEDULED_DEPARTURE': 1200, 'SCHEDULED_ARRIVAL': 1500,
            'SCHEDULED_TIME': 300, 'DISTANCE': 2475,
            'ARRIVAL_DELAY': 20.0 if m % 2 == 0 else 0.0,
            'CANCELLED': 0, 'DIVERTED': 0
        })
    df_sample = pd.DataFrame(rows)
    csv_file = tmp_path / "multi_month_flights.csv"
    df_sample.to_csv(csv_file, index=False)
    
    df_clean = load_flight_dataset(csv_file)
    X_train, X_test, y_train, y_test, meta = get_train_test_splits(df_clean, split_strategy="time_aware")
    
    assert (X_train['month'] <= 9).all()
    assert (X_test['month'] > 9).all()
    assert meta["split_strategy"] == "time_aware"
