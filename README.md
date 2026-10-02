# ✈️ FlightSense AI — Intelligent Flight Delay Prediction & Aviation Analytics Platform

[![Python](https://img.shields.io/badge/Python-3.11%2B-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.109.0-green.svg)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-19.x-cyan.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.x-purple.svg)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.x-sky.svg)](https://tailwindcss.com/)
[![XGBoost](https://img.shields.io/badge/XGBoost-2.0.0-orange.svg)](https://xgboost.readthedocs.io/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-blue.svg)](https://www.mysql.com/)

**FlightSense AI** is a full-stack, enterprise-grade machine learning platform for pre-flight delay risk prediction and aviation operational intelligence. Built on a dataset of over **5.71 million flights**, the platform integrates an optimized **XGBoost Classifier** (with a decision threshold of **0.53**), **SHAP TreeExplainer** feature attribution, a **FastAPI** backend, and a **React + TypeScript + Tailwind CSS** executive analytics dashboard.

---

## 🏛️ System Architecture

```
FlightSense-AI/
├── frontend/             # React 19 + Vite + TypeScript + Tailwind CSS Dashboard UI
│   ├── src/
│   │   ├── components/   # UI Cards, Badges, Layout, Auth Modal & Module views
│   │   ├── services/     # Axios REST API client & JWT token interceptors
│   │   └── types/        # TypeScript interfaces for predictions, EDA, & models
├── backend/              # Python FastAPI REST API Backend
│   ├── app/
│   │   ├── api/v1/       # REST Endpoints (Predict, What-If, Explain, Analytics, History, Auth)
│   │   ├── core/         # Dynamic MySQL / SQLite config & dotenv loaders
│   │   ├── db/           # SQLAlchemy ORM models (users, prediction_history, model_versions), CRUD, Session
│   │   ├── schemas/      # Pydantic v2 request/response validation
│   │   └── services/     # ML Service (Inference & SHAP) & Data Service (Cached EDA Aggregations)
│   └── main.py           # FastAPI entrypoint with CORS & startup hooks
├── ml/                   # Machine Learning Pipeline Engine
│   ├── src/              # Preprocessing, Leakage Prevention, Training, Evaluation, & SHAP scripts
│   └── requirements.txt  # ML training dependencies
├── models/               # Model Artifacts (.joblib binaries, feature orderings, metrics.json)
├── data/                 # Dataset storage & precomputed analytics cache (analytics_cache.json)
├── tests/                # Comprehensive Pytest suite (DB CRUD, API, ML model, MySQL verification)
├── .env.example          # MySQL & API configuration template
└── README.md             # Platform Documentation
```

---

## 💻 Technology Stack

- **Frontend**: React 19, Vite 6, TypeScript 5, Tailwind CSS 4, Recharts 3, Lucide Icons, Axios.
- **Backend API**: Python 3.11/3.13, FastAPI, Pydantic v2, PyJWT, Uvicorn.
- **Machine Learning**: XGBoost 2.0, Scikit-Learn 1.3, SHAP 0.44, Pandas, NumPy, Joblib.
- **Database & Storage**: MySQL 8.0 (PyMySQL + SQLAlchemy 2.0 ORM) with automatic SQLite fallback.

---

## 📊 Dataset & Leakage Prevention

### Dataset Overview
The model is trained and evaluated on the canonical **US Department of Transportation 5.8M Flight Dataset**, comprising over 5,714,008 domestic flight records across 14 major carriers and 300+ airports.

### Target Leakage Prevention
To guarantee real-world pre-flight applicability, all post-takeoff and in-flight leakage features were strictly excluded prior to model training:
- **Excluded Leakage Features**: `ARRIVAL_DELAY`, `DEPARTURE_DELAY`, `AIR_TIME`, `ELAPSED_TIME`, `CANCELLATION_REASON`, `CARRIER_DELAY`, `WEATHER_DELAY`, `NAS_DELAY`, `SECURITY_DELAY`, `LATE_AIRCRAFT_DELAY`.
- **Allowed Pre-Flight Features**: Carrier, Origin Airport, Destination Airport, Scheduled Departure Time (Month, Day of Week, Scheduled Hour, Time of Day), Distance (miles), and pre-flight weather metrics (Temperature, Wind Speed, Precipitation, Visibility).

---

## 🤖 ML Methodology & Model Benchmark

Four candidate machine learning models were trained and benchmarked on a 99,220 sample holdout test set using standardized cross-validation:

| Model Architecture | Optimal Threshold | Accuracy | Precision | Recall | F1 Score | ROC-AUC | PR-AUC | Selection Status |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| **Logistic Regression** | 0.47 | 57.17% | 20.02% | 60.11% | 30.03% | 60.96% | 20.69% | Baseline |
| **Decision Tree** | 0.48 | 54.60% | 19.48% | 62.81% | 29.74% | 60.49% | 20.04% | Candidate |
| **Random Forest** | 0.51 | 61.20% | 20.15% | 52.10% | 28.10% | 61.05% | 20.95% | Candidate |
| **XGBoost Classifier** | **0.53** | **64.36%** | **21.12%** | **48.63%** | **29.45%** | **61.82%** | **21.46%** | **Selected Production Model** |

### Selected Production Model & Threshold
- **Model**: **XGBoost Classifier**
- **Decision Threshold**: **0.53** (Optimized to balance precision/recall under severe class imbalance where ~17.9% of flights experience delays).
- **Confusion Matrix** (99,220 Holdout Test Samples):
  - True Negatives (On Time): **56,474**
  - False Positives: **27,571**
  - False Negatives: **7,795**
  - True Positives (Delayed): **7,380**

---

## 🔌 API Documentation & Key Endpoints

- `GET /api/v1/health`: Returns API operational status, DB connection, and loaded ML model binary status.
- `POST /api/v1/predict`: Calculates delay probability, risk classification (`Low`, `Moderate`, `High`, `Severe`), estimated duration, and SHAP key factor attributions. Logs prediction to DB.
- `POST /api/v1/predict/what-if`: Simulates pre-flight parameter changes (departure hour, carrier, weather) and returns baseline vs simulated probability shift.
- `GET /api/v1/explain/{prediction_id}`: Retrieves exact SHAP feature attributions for any logged prediction ID.
- `GET /api/v1/routes/intelligence`: Returns historical route bottleneck rankings and delay risk scores.
- `GET /api/v1/airports/intelligence`: Returns airport volume, congestion score, and weather impact.
- `GET /api/v1/airlines/intelligence`: Returns carrier-by-carrier reliability metrics.
- `GET /api/v1/analytics/overview`: Serves precomputed EDA trends (monthly, hourly, cause breakdowns).
- `GET /api/v1/model/performance`: Delivers candidate model benchmark metrics, ROC/PR curves, and feature importances.
- `GET /api/v1/history`: Returns paginated and filterable prediction history audit logs.
- `POST /api/v1/auth/register` & `POST /api/v1/auth/login`: User registration, authentication, and JWT token issuance.

---

## 🚀 How to Run Locally

### 1. Environment Configuration
Create a `.env` file in the root workspace directory (copied from `.env.example`):
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=flightsense
DATABASE_URL=mysql+pymysql://root:your_mysql_password@localhost:3306/flightsense
```

### 2. Backend Setup & Run
```powershell
# Install backend requirements
pip install -r backend/requirements.txt

# Execute pytest suite
python -m pytest

# Start FastAPI backend server
python backend/main.py
```
The API server starts at `http://localhost:8000`. OpenAPI docs available at `http://localhost:8000/docs`.

### 3. Frontend Setup & Run
```powershell
cd frontend
npm install
npm run build
npm run dev
```
The Web Dashboard opens at `http://localhost:5173`.

---

## ⚠️ Known Limitations & Future Enhancements

- **Real-Time Weather Integration**: Current weather parameters are input or simulated pre-flight parameters. Integrating live NOAA METAR/TAF weather feeds would further refine predictions.
- **Live Flight Radar Data**: Integrating flight tracking APIs (FlightAware / OpenSky) for active flight status stream.
- **Expanded Airframe Metrics**: Incorporating tail number rotational history to model aircraft cascade delays.

---

## 📄 License
Licensed under the [MIT License](LICENSE).
