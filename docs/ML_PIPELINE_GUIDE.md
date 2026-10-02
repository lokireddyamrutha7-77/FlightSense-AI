# FlightSense AI — Machine Learning Pipeline Guide

This document outlines the machine learning architecture, feature engineering pipeline, model training process, SHAP explainability generation, and model artifact persistence for **FlightSense AI**.

---

## 🎯 Problem Formulation

- **Primary Classification Target**: Binary flag `is_delayed` (1 if Arrival/Departure delay >= 15 minutes, 0 otherwise).
- **Secondary Regression Target**: Continuous value `predicted_delay_minutes` (estimated duration of delay).
- **Model Architecture**: Gradient Boosted Decision Trees (**XGBoost Classifier & Regressor**) trained on historical BTS (Bureau of Transportation Statistics) flight data and NOAA weather metrics.

---

## 🧪 Feature Engineering Pipeline

### 1. Categorical Features
- `carrier` (Airline IATA code e.g. AA, DL, UA, WN)
- `origin` (Origin Airport IATA code e.g. JFK, ORD, ATL)
- `destination` (Destination Airport IATA code e.g. LAX, SFO, MIA)
- `aircraft_type` (e.g. Boeing 737-800, Airbus A320)

*Encoding Technique*: Target Encoding & One-Hot Encoding saved via `Joblib` encoders.

### 2. Temporal Features
- `dep_hour` (Departure hour 0–23)
- `day_of_week` (Day of week 0–6)
- `month` (Month 1–12)
- `is_weekend` (Binary 0/1)
- `is_holiday_season` (Binary 0/1)

### 3. Weather & Environmental Features
- `temp_celsius` (Temperature in Celsius)
- `wind_speed_knots` (Wind speed in knots)
- `precipitation_mm` (Rainfall/Snowfall in mm)
- `visibility_miles` (Visibility distance in miles)

### 4. Route & Congestion Features
- `distance_miles` (Flight distance in miles)
- `origin_hourly_congestion` (Number of scheduled departures at origin in the same hour window)

---

## 📦 Model Artifacts & Persistence Format

All trained artifacts are serialized with `joblib` into the `/models/` directory:

| Filename | Description |
| :--- | :--- |
| `xgboost_flight_delay_latest.joblib` | Trained XGBoost Classification model |
| `feature_encoders_latest.joblib` | Label/Target Encoders for categorical features |
| `feature_scaler_latest.joblib` | StandardScaler for numerical features |
| `shap_explainer_latest.joblib` | SHAP TreeExplainer object for fast explainability calculation |

---

## 🔍 SHAP Explainability Integration

The `explain.py` module uses `shap.TreeExplainer` on the trained XGBoost model to compute local feature attributions:

```python
import shap
import joblib

model = joblib.load("models/xgboost_flight_delay_latest.joblib")
explainer = shap.TreeExplainer(model)

# For a single prediction input array X_input:
shap_values = explainer.shap_values(X_input)
```

The top positive (delay risk drivers) and top negative (delay mitigators) features are extracted and returned in the REST API payload for UI visualization.

---

## 🏃 Running Training Script

```bash
cd ml
pip install -r requirements.txt
python src/train.py --data ../data/sample_flights.csv --out-dir ../models/
```
