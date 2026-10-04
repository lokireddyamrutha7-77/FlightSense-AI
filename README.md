# ✈️ FlightSense AI — Intelligent Flight Delay Prediction & Aviation Analytics Platform

[![Python](https://img.shields.io/badge/Python-3.11%2B-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.109.0-green.svg)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-19.x-cyan.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.x-purple.svg)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.x-sky.svg)](https://tailwindcss.com/)
[![XGBoost](https://img.shields.io/badge/XGBoost-2.0.0-orange.svg)](https://xgboost.readthedocs.io/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-blue.svg)](https://www.mysql.com/)

**FlightSense AI** is a full-stack, enterprise-grade customer-facing flight delay prediction and aviation intelligence platform. Built on a dataset of over **5.71 million historical flight records**, the platform features a public landing page, multi-channel authentication (Email or Phone number with secure 6-digit OTP verification), customer account profiles, saved flight management, and an executive analytics dashboard centered around a real **XGBoost Classifier** (with holdout test accuracy of **64.36%** and an optimized decision threshold of **0.53**).

---

## 🌟 Key Platform Features

1. **Public Landing Page**: Professional SaaS landing page presenting the core value proposition: *"Predict Flight Delays Before They Happen"*, model performance transparency, and feature highlights.
2. **Multi-Option Auth & OTP Flow**:
   - **Signup via Email OR Phone**: Select preferred channel without requiring both.
   - **6-Digit Backend OTP Verification**: Cryptographically generated single-use OTPs with expiration timers, attempt limits, resend cooldowns, and secure hash storage.
   - **Email/Phone Login**: Secure authentication with PBKDF2 HMAC SHA-256 password hashing & JWT tokens.
   - **Password Reset**: Self-service forgot password flow via 6-digit OTP code verification.
3. **Customer Profile & Personal Stats**: Account management with avatar, verification status badges, editable profile information, password updates, and dynamic prediction statistics (total predictions, delayed risk count, top airline, top route, top airport).
4. **Saved Flights**: Customer feature to store frequently checked flights and trigger instant delay predictions with one click.
5. **Flight Delay Prediction (Primary Feature)**:
   - Inputs strictly mapped to pre-flight parameters: Flight Number, Airline/Carrier, Origin Airport, Destination Airport, Scheduled Departure Time, Distance (miles).
   - Real-time XGBoost probability calculation, risk classification (`Low Risk`, `Moderate Risk`, `High Risk`, `Severe Risk`), and SHAP feature attribution waterfall.
6. **Supporting Intelligence Modules**:
   - SHAP Model Explainability
   - What-If Scenario Simulation
   - Route Intelligence & Bottlenecks
   - Airport Congestion & Airline Reliability
   - Exploratory Data Analysis (EDA) & Model Performance Benchmarks
   - User-isolated Prediction Audit History

---

## 🏛️ Architecture & Database Structure

```
FlightSense-AI/
├── frontend/             # React 19 + Vite + TypeScript + Tailwind CSS UI
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/   # Header, Sidebar, LandingPage, AuthModal
│   │   │   ├── modules/  # DelayPrediction, Profile, SavedFlights, Dashboard, etc.
│   │   │   └── ui/       # Card, Badge, Button, LoadingSkeleton
│   │   ├── services/     # Axios API client & JWT request interceptors
│   │   └── types/        # TypeScript interfaces
├── backend/              # Python FastAPI REST API Backend
│   ├── app/
│   │   ├── api/v1/       # REST Endpoints (Auth, Profile, SavedFlights, Predict, History, etc.)
│   │   ├── core/         # MySQL / SQLite DB config & environment loaders
│   │   ├── db/           # SQLAlchemy ORM (users, user_profiles, otp_verifications, saved_flights, prediction_history)
│   │   ├── schemas/      # Pydantic v2 schemas
│   │   └── services/     # ML Service (XGBoost/SHAP) & OTP Provider Service
│   └── main.py           # FastAPI entrypoint
├── ml/                   # Machine Learning Pipeline Engine
├── models/               # Model Artifacts (XGBoost .joblib binary, preprocessor .joblib)
├── tests/                # Pytest suite (21 passing tests)
└── README.md             # Project Documentation
```

### Database Tables
- `users`: User credentials (email or phone, hashed password, verification status).
- `user_profiles`: User preferences (avatar, preferred airports, preferred routes).
- `otp_verifications`: Single-use 6-digit OTP codes, target, purpose, expiration, and attempt counts.
- `saved_flights`: User-saved flight numbers, carriers, origins, and destinations.
- `prediction_history`: Authenticated user prediction audit log with input features & SHAP summaries.
- `model_versions`: Candidate model versions & benchmark metrics.

### MySQL & SQLite Fallback
The database engine automatically connects to MySQL if configured in environment variables (`DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`). If MySQL credentials are not provided or connection fails, it seamlessly falls back to local SQLite (`flightsense.db`) without breaking application startup or tests.

---

## 🤖 ML Model Benchmark Metrics

Evaluated on a 99,220 sample holdout test set from 5.71M historical US domestic flight records:

- **Production Model**: XGBoost Classifier
- **Decision Threshold**: **0.53**
- **Accuracy**: **64.36%**
- **Precision**: **21.12%**
- **Recall**: **48.63%**
- **F1 Score**: **29.45%**
- **ROC-AUC**: **61.82%**
- **PR-AUC**: **21.46%**

---

## 🔌 Key API Endpoints

| Endpoint | Method | Description |
| :--- | :---: | :--- |
| `POST /api/v1/auth/signup/request-otp` | POST | Request 6-digit OTP code for Email or Phone registration |
| `POST /api/v1/auth/signup/verify-otp` | POST | Verify OTP code and complete user registration |
| `POST /api/v1/auth/login` | POST | Authenticate user using email OR phone number + password |
| `POST /api/v1/auth/forgot-password` | POST | Request password reset OTP code |
| `POST /api/v1/auth/reset-password` | POST | Verify OTP and update user password |
| `GET /api/v1/auth/me` | GET | Retrieve current user session details |
| `GET /api/v1/profile` | GET | Retrieve customer account profile & computed statistics |
| `PUT /api/v1/profile` | PUT | Update profile details (full name, preferred airports) |
| `POST /api/v1/profile/change-password` | POST | Change user password |
| `GET /api/v1/saved-flights` | GET | Retrieve user's saved flights |
| `POST /api/v1/saved-flights` | POST | Save a flight to user account |
| `DELETE /api/v1/saved-flights/{id}` | DELETE | Remove a saved flight |
| `POST /api/v1/predict` | POST | Predict flight delay probability using real XGBoost model |
| `POST /api/v1/predict/what-if` | POST | Simulate parameter shifts (carrier, time, route) |
| `GET /api/v1/history` | GET | Retrieve user's prediction history logs |

---

## 🚀 Local Development Setup

### 1. Backend Setup & Test Run
```powershell
# Install dependencies
pip install -r backend/requirements.txt

# Run full pytest suite (21 tests)
powershell -Command "$env:PYTHONPATH='.'; python -m pytest"

# Launch FastAPI server
python backend/main.py
```
FastAPI server active at `http://localhost:8000`. OpenAPI docs at `http://localhost:8000/docs`.

### 2. Frontend Setup & Build
```powershell
cd frontend
npm install
npm run build
npm run dev
```
Web app active at `http://localhost:5173`.

---

## 📄 License
Licensed under the [MIT License](LICENSE).
