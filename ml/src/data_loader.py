import pandas as pd
import numpy as np
from typing import Tuple, Dict, Any
from pathlib import Path
import logging
import json
from ml.src.config import (
    DEFAULT_DATA_PATH,
    CATEGORICAL_FEATURES,
    NUMERICAL_FEATURES,
    TARGET_COL,
    ANALYTICS_CACHE_PATH,
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("DataLoader")

def build_airport_mapping(df_raw: pd.DataFrame) -> Dict[str, str]:
    """
    Builds a bidirectional mapping dictionary between 5-digit DOT airport IDs
    (which occur in October / Month 10 of the BTS 2015 dataset) and 3-letter IATA codes.
    """
    df_raw = df_raw[df_raw['MONTH'].astype(str).isin(['9', '10'])].copy()
    df_raw['MONTH_STR'] = df_raw['MONTH'].astype(str)
    df_raw['ORIGIN_STR'] = df_raw['ORIGIN_AIRPORT'].astype(str)
    df_raw['AIRLINE_STR'] = df_raw['AIRLINE'].astype(str)
    df_raw['FLIGHT_NUM_STR'] = df_raw['FLIGHT_NUMBER'].astype(str)

    m9 = df_raw[df_raw['MONTH_STR'] == '9']
    m10 = df_raw[df_raw['MONTH_STR'] == '10']

    if m10.empty or m9.empty:
        return {}

    merged = pd.merge(
        m10[['AIRLINE_STR', 'FLIGHT_NUM_STR', 'ORIGIN_STR']],
        m9[['AIRLINE_STR', 'FLIGHT_NUM_STR', 'ORIGIN_STR']],
        on=['AIRLINE_STR', 'FLIGHT_NUM_STR']
    )

    mapping = (
        merged.groupby('ORIGIN_STR_x')['ORIGIN_STR_y']
        .agg(lambda x: x.mode().iloc[0] if not x.empty else 'UNKNOWN')
        .to_dict()
    )
    logger.info(f"Built airport code mapping for {len(mapping)} 5-digit DOT IDs to 3-letter IATA codes.")
    return mapping


def load_flight_dataset(
    csv_path: Path = DEFAULT_DATA_PATH,
    sample_size: int = None,
    random_state: int = 42
) -> pd.DataFrame:
    """
    Loads raw flight dataset, validates schema, performs data cleaning,
    maps month 10 5-digit airport codes to 3-letter IATA codes, filters out
    cancelled/diverted flights, and creates pre-flight features without target leakage.
    """
    if not csv_path.exists():
        raise FileNotFoundError(f"Dataset file not found at: {csv_path}")

    logger.info(f"Loading flight dataset from {csv_path}")
    
    target_cols = [
        'YEAR', 'MONTH', 'DAY', 'DAY_OF_WEEK', 'AIRLINE', 'FLIGHT_NUMBER',
        'ORIGIN_AIRPORT', 'DESTINATION_AIRPORT', 'SCHEDULED_DEPARTURE',
        'SCHEDULED_ARRIVAL', 'SCHEDULED_TIME', 'DISTANCE', 'ARRIVAL_DELAY',
        'CANCELLED', 'DIVERTED', 'AIR_SYSTEM_DELAY', 'SECURITY_DELAY',
        'AIRLINE_DELAY', 'LATE_AIRCRAFT_DELAY', 'WEATHER_DELAY'
    ]

    header_cols = pd.read_csv(csv_path, nrows=0).columns.tolist()
    available_usecols = [c for c in target_cols if c in header_cols]

    dtype_spec = {
        'ORIGIN_AIRPORT': str,
        'DESTINATION_AIRPORT': str,
        'AIRLINE': str,
        'FLIGHT_NUMBER': str,
    }

    df_raw = pd.read_csv(csv_path, usecols=available_usecols, dtype=dtype_spec)
    logger.info(f"Dataset read from {csv_path}: {len(df_raw)} rows.")

    initial_count = len(df_raw)

    # 1. Duplicate detection and handling
    duplicates = df_raw.duplicated().sum()
    if duplicates > 0:
        logger.info(f"Found and removed {duplicates} duplicate rows.")
        df_raw = df_raw.drop_duplicates()

    # 2. Filter out Cancelled and Diverted flights
    cancelled_count = df_raw['CANCELLED'].sum() if 'CANCELLED' in df_raw.columns else 0
    diverted_count = df_raw['DIVERTED'].sum() if 'DIVERTED' in df_raw.columns else 0
    
    mask_valid = pd.Series(True, index=df_raw.index)
    if 'CANCELLED' in df_raw.columns:
        mask_valid &= (df_raw['CANCELLED'] == 0)
    if 'DIVERTED' in df_raw.columns:
        mask_valid &= (df_raw['DIVERTED'] == 0)
    
    df = df_raw[mask_valid].copy()

    # 3. Missing-value analysis & handling for core columns
    missing_delay = df['ARRIVAL_DELAY'].isna().sum() if 'ARRIVAL_DELAY' in df.columns else 0
    df = df.dropna(subset=['ARRIVAL_DELAY', 'SCHEDULED_DEPARTURE', 'SCHEDULED_ARRIVAL', 'ORIGIN_AIRPORT', 'DESTINATION_AIRPORT'])

    # 4. Map month 10 5-digit airport codes if present
    airport_map = build_airport_mapping(df_raw)
    if airport_map:
        m10_mask = df['MONTH'].astype(int) == 10
        if m10_mask.any():
            df.loc[m10_mask, 'ORIGIN_AIRPORT'] = df.loc[m10_mask, 'ORIGIN_AIRPORT'].astype(str).map(lambda x: airport_map.get(x, x))
            df.loc[m10_mask, 'DESTINATION_AIRPORT'] = df.loc[m10_mask, 'DESTINATION_AIRPORT'].astype(str).map(lambda x: airport_map.get(x, x))

    df['ORIGIN_AIRPORT'] = df['ORIGIN_AIRPORT'].astype(str).str.strip().str.upper()
    df['DESTINATION_AIRPORT'] = df['DESTINATION_AIRPORT'].astype(str).str.strip().str.upper()

    # 5. Create Target Variable (DELAYED = 1 if ARRIVAL_DELAY > 15 else 0)
    df[TARGET_COL] = (df['ARRIVAL_DELAY'] > 15).astype(int)

    # 6. Feature Engineering (PRE-FLIGHT ONLY — STRICTLY NO LEAKAGE)
    sched_dep = df['SCHEDULED_DEPARTURE'].fillna(0).astype(int)
    df['dep_hour'] = (sched_dep // 100) % 24
    df['dep_minute'] = sched_dep % 100

    sched_arr = df['SCHEDULED_ARRIVAL'].fillna(0).astype(int)
    df['arr_hour'] = (sched_arr // 100) % 24
    df['arr_minute'] = sched_arr % 100

    df['month'] = df['MONTH'].astype(int)
    df['day_of_week'] = df['DAY_OF_WEEK'].astype(int)
    df['distance'] = df['DISTANCE'].fillna(df['DISTANCE'].median()).astype(float)
    df['scheduled_duration'] = df['SCHEDULED_TIME'].fillna(df['SCHEDULED_TIME'].median()).astype(float)

    df['carrier'] = df['AIRLINE'].astype(str)
    df['origin'] = df['ORIGIN_AIRPORT'].astype(str)
    df['destination'] = df['DESTINATION_AIRPORT'].astype(str)
    df['is_weekend'] = (df['day_of_week'] >= 6).astype(int)

    def get_time_of_day(hour):
        if 0 <= hour < 6:
            return "Night"
        elif 6 <= hour < 12:
            return "Morning"
        elif 12 <= hour < 18:
            return "Afternoon"
        else:
            return "Evening"

    df['time_of_day'] = df['dep_hour'].apply(get_time_of_day)

    valid_count = len(df)
    delayed_count = df[TARGET_COL].sum()

    logger.info("=== Dataset Validation & Cleaning Summary ===")
    logger.info(f"Initial raw rows: {initial_count}")
    logger.info(f"Duplicates removed: {duplicates}")
    logger.info(f"Cancelled flights removed: {cancelled_count}")
    logger.info(f"Diverted flights removed: {diverted_count}")
    logger.info(f"Missing arrival delay rows removed: {missing_delay}")
    logger.info(f"Final valid clean rows: {valid_count}")
    logger.info(f"Delayed flights (>15m): {delayed_count} ({delayed_count / valid_count:.2%})")

    if sample_size and sample_size < len(df):
        logger.info(f"Sampling {sample_size} rows stratifying by {TARGET_COL} for training pipeline.")
        df = df.groupby(TARGET_COL, group_keys=False).apply(
            lambda x: x.sample(min(len(x), int(sample_size * len(x) / len(df))), random_state=random_state)
        ).reset_index(drop=True)
        logger.info(f"Sampled dataset shape: {df.shape}")

    return df


def get_train_val_test_splits(
    df: pd.DataFrame,
    split_strategy: str = "time_aware",
    random_state: int = 42
) -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame, pd.Series, pd.Series, pd.Series, Dict[str, Any]]:
    """
    Splits dataset into 3-way Train, Validation, and Test sets:
    - Train: Months 1–8 (Jan–Aug)
    - Validation: Month 9 (Sep) -> strictly used for hyperparameter & decision threshold selection
    - Test: Months 10–12 (Oct–Dec) -> UNTOUCHED test evaluation set
    """
    feature_cols = CATEGORICAL_FEATURES + NUMERICAL_FEATURES
    missing_cols = [col for col in feature_cols if col not in df.columns]
    if missing_cols:
        raise ValueError(f"Missing required columns in dataset: {missing_cols}")

    X = df[feature_cols].copy()
    y = df[TARGET_COL].copy()

    if split_strategy == "time_aware" and "month" in df.columns:
        train_mask = df["month"] <= 8
        val_mask = df["month"] == 9
        test_mask = df["month"] >= 10

        if train_mask.sum() == 0 or val_mask.sum() == 0 or test_mask.sum() == 0:
            # Fallback for small sample datasets
            split_idx_val = int(len(df) * 0.70)
            split_idx_test = int(len(df) * 0.85)
            X_train, y_train = X.iloc[:split_idx_val], y.iloc[:split_idx_val]
            X_val, y_val = X.iloc[split_idx_val:split_idx_test], y.iloc[split_idx_val:split_idx_test]
            X_test, y_test = X.iloc[split_idx_test:], y.iloc[split_idx_test:]
            reasoning = "Time-sequential split based on index position."
        else:
            X_train, y_train = X[train_mask], y[train_mask]
            X_val, y_val = X[val_mask], y[val_mask]
            X_test, y_test = X[test_mask], y[test_mask]
            reasoning = "Time-aware split: Train=Months 1–8, Validation=Month 9, Test=Months 10–12 (UNTOUCHED)."
    else:
        from sklearn.model_selection import train_test_split
        X_temp, X_test, y_temp, y_test = train_test_split(X, y, test_size=0.25, random_state=random_state, stratify=y)
        X_train, X_val, y_train, y_val = train_test_split(X_temp, y_temp, test_size=0.20, random_state=random_state, stratify=y_temp)
        reasoning = "Random stratified 3-way split."

    metadata = {
        "split_strategy": split_strategy,
        "reasoning": reasoning,
        "train_shape": X_train.shape,
        "val_shape": X_val.shape,
        "test_shape": X_test.shape,
        "train_target_distribution": {
            "0": int((y_train == 0).sum()),
            "1": int((y_train == 1).sum()),
            "delay_rate": float(y_train.mean())
        },
        "val_target_distribution": {
            "0": int((y_val == 0).sum()),
            "1": int((y_val == 1).sum()),
            "delay_rate": float(y_val.mean())
        },
        "test_target_distribution": {
            "0": int((y_test == 0).sum()),
            "1": int((y_test == 1).sum()),
            "delay_rate": float(y_test.mean())
        }
    }

    logger.info(f"3-Way Time-Aware Split: Train={len(X_train)} (M1-8), Val={len(X_val)} (M9), Test={len(X_test)} (M10-12).")
    return X_train, X_val, X_test, y_train, y_val, y_test, metadata


def get_train_test_splits(
    df: pd.DataFrame,
    split_strategy: str = "time_aware",
    test_size: float = 0.25,
    random_state: int = 42
) -> Tuple[pd.DataFrame, pd.DataFrame, pd.Series, pd.Series, Dict[str, Any]]:
    """Backward compatibility wrapper returning X_train, X_test, y_train, y_test."""
    X_tr, X_v, X_te, y_tr, y_v, y_te, meta = get_train_val_test_splits(df, split_strategy, random_state)
    # Combine train + val for 2-way compatibility if needed
    return pd.concat([X_tr, X_v]), X_te, pd.concat([y_tr, y_v]), y_te, meta
