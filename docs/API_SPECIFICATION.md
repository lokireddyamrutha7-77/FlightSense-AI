# FlightSense AI — REST API Specification v1.0

Base URL: `http://localhost:8000/api/v1`

---

## 🛰️ 1. Health & System Status

### `GET /health`
Returns backend operational status, database connectivity, and ML model loaded status.

#### Response `200 OK`
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "environment": "development",
  "database": "connected (mock)",
  "ml_model_status": "loaded (stub)",
  "timestamp": "2026-09-24T18:46:30Z"
}
```

---

## ✈️ 2. Flight Delay Prediction & What-If Analysis

### `POST /predict`
Submits flight parameters and receives instant delay probability, risk classification, expected delay duration, and SHAP key factor attributions.

#### Request Body
```json
{
  "flight_number": "AA-1042",
  "carrier": "AA",
  "origin": "JFK",
  "destination": "LAX",
  "scheduled_departure": "2026-09-25T14:30:00Z",
  "distance_miles": 2475,
  "aircraft_type": "Boeing 737-800",
  "temp_celsius": 18.5,
  "wind_speed_knots": 14.2,
  "precipitation_mm": 0.0,
  "visibility_miles": 10.0
}
```

#### Response `200 OK`
```json
{
  "prediction_id": "pred_9847291a",
  "flight_number": "AA-1042",
  "delay_probability": 0.384,
  "risk_level": "Moderate Risk",
  "predicted_delay_minutes": 18.5,
  "is_delayed": false,
  "is_mock_data": true,
  "shap_summary": [
    { "feature": "Wind Speed (knots)", "shap_value": 0.12, "feature_value": "14.2" },
    { "feature": "Departure Time (Hour)", "shap_value": 0.08, "feature_value": "14" },
    { "feature": "Distance (miles)", "shap_value": -0.05, "feature_value": "2475" }
  ],
  "created_at": "2026-09-24T18:46:30Z"
}
```

### `POST /predict/what-if`
Simulates parameter variations (e.g. higher wind speed, shifted departure time) to observe impact on delay probability.

---

## 🗺️ 3. Intelligence Endpoints

### `GET /routes/intelligence`
Returns route-level performance, delay heatmaps, and bottleneck flight corridors.

### `GET /airports/intelligence`
Returns airport-level congestion metrics, mean departure/arrival delays, and weather sensitivity scores.

### `GET /airlines/intelligence`
Returns airline on-time performance (OTP) rankings and delay breakdowns by cause (Carrier, Weather, NAS, Security, Late Aircraft).

---

## 📊 4. Analytics & Model Performance

### `GET /analytics/overview`
Returns summary EDA metrics, monthly/hourly delay distributions, and cause proportions.

### `GET /model/performance`
Returns ML evaluation metrics (ROC-AUC, Precision, Recall, F1-Score, Confusion Matrix, and Feature Importance).

### `GET /history`
Returns historical logged predictions with filtering options (risk level, carrier, search query).

### `GET /explain/{prediction_id}`
Returns detailed SHAP waterfall/force plot data for a specific prediction ID.
