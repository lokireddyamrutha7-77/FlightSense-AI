import joblib
import json
import os
import uuid
import logging
from pathlib import Path
from typing import Dict, Any, List, Optional
from datetime import datetime
import pandas as pd
import numpy as np

from backend.app.core.config import settings
from backend.app.schemas.prediction import (
    FlightPredictionRequest,
    FlightPredictionResponse,
    SHAPFeatureAttribution,
    WhatIfSimulationRequest,
)
from ml.src.explain import ModelExplainer, get_risk_category
from backend.app.db.crud import create_prediction_log

logger = logging.getLogger("MLService")


class MLService:
    def __init__(self):
        self.model = None
        self.preprocessor = None
        self.explainer = None
        self.feature_names = []
        self.decision_threshold = 0.50
        self.is_loaded = False
        self.model_version = "flightsense-v2.1-real"
        self._try_load_model()

    def _try_load_model(self):
        model_path = Path(settings.MODEL_PATH)
        preprocessor_path = Path(settings.PREPROCESSOR_PATH)
        
        # Fallback relative path check
        if not model_path.exists():
            base_models = Path(__file__).resolve().parent.parent.parent.parent / "models"
            alt_model_path = base_models / "xgboost_flight_delay_latest.joblib"
            alt_preproc_path = base_models / "preprocessor_latest.joblib"
            if alt_model_path.exists():
                model_path = alt_model_path
                preprocessor_path = alt_preproc_path

        if model_path.exists() and preprocessor_path.exists():
            try:
                self.model = joblib.load(model_path)
                self.preprocessor = joblib.load(preprocessor_path)
                
                if hasattr(self.preprocessor, "get_feature_names"):
                    self.feature_names = self.preprocessor.get_feature_names()

                # Load saved decision threshold from metadata if present
                meta_path = model_path.parent / "feature_metadata.json"
                if meta_path.exists():
                    try:
                        with open(meta_path, "r") as f:
                            meta = json.load(f)
                            self.decision_threshold = float(meta.get("decision_threshold", 0.50))
                            logger.info(f"Loaded production decision threshold: {self.decision_threshold:.4f}")
                    except Exception as e:
                        logger.warning(f"Could not parse decision threshold from metadata: {e}")
                
                self.explainer = ModelExplainer(model=self.model, preprocessor=self.preprocessor)
                self.is_loaded = True
                logger.info(f"Loaded REAL ML model successfully from {model_path} with threshold {self.decision_threshold:.4f}")
            except Exception as e:
                logger.error(f"Failed loading ML model from {model_path}: {e}")
                self.is_loaded = False
        else:
            logger.warning(f"ML model binaries not found at {model_path}. Train model via 'python -m ml.src.train'.")

    def _extract_datetime_features(self, scheduled_dep_str: str) -> Dict[str, Any]:
        """Extracts pre-flight temporal features from ISO timestamp string."""
        try:
            dt = pd.to_datetime(scheduled_dep_str)
            dep_hour = int(dt.hour)
            dep_minute = int(dt.minute)
            day_of_week = int(dt.dayofweek) + 1  # 1=Monday to 7=Sunday
            month = int(dt.month)
            is_weekend = 1 if day_of_week >= 6 else 0
        except Exception:
            dep_hour = 14
            dep_minute = 30
            day_of_week = 3
            month = 9
            is_weekend = 0

        arr_hour = (dep_hour + 2) % 24
        arr_minute = dep_minute

        if 0 <= dep_hour < 6:
            time_of_day = "Night"
        elif 6 <= dep_hour < 12:
            time_of_day = "Morning"
        elif 12 <= dep_hour < 18:
            time_of_day = "Afternoon"
        else:
            time_of_day = "Evening"

        return {
            "dep_hour": dep_hour,
            "dep_minute": dep_minute,
            "arr_hour": arr_hour,
            "arr_minute": arr_minute,
            "month": month,
            "day_of_week": day_of_week,
            "is_weekend": is_weekend,
            "time_of_day": time_of_day,
        }

    def predict_delay(self, req: FlightPredictionRequest, db_session=None) -> FlightPredictionResponse:
        pred_id = f"pred_{uuid.uuid4().hex[:12]}"
        temporal = self._extract_datetime_features(req.scheduled_departure)

        input_row = {
            "carrier": str(req.carrier).upper(),
            "origin": str(req.origin).upper(),
            "destination": str(req.destination).upper(),
            "time_of_day": temporal["time_of_day"],
            "dep_hour": temporal["dep_hour"],
            "dep_minute": temporal["dep_minute"],
            "arr_hour": temporal["arr_hour"],
            "arr_minute": temporal["arr_minute"],
            "month": temporal["month"],
            "day_of_week": temporal["day_of_week"],
            "distance": float(req.distance_miles),
            "is_weekend": temporal["is_weekend"],
            "scheduled_duration": max(30.0, float(req.distance_miles) / 7.5),
        }

        input_df = pd.DataFrame([input_row])

        if not self.is_loaded:
            self._try_load_model()

        if self.is_loaded and self.preprocessor is not None and self.model is not None:
            processed_matrix = self.preprocessor.transform(input_df)
            probs = self.model.predict_proba(processed_matrix)[0]
            delay_prob = round(float(probs[1]), 4)
            is_mock = False
        else:
            delay_prob = 0.184
            is_mock = True

        # Classify delayed using saved production threshold
        is_delayed = delay_prob >= self.decision_threshold
        predicted_class = "DELAYED" if is_delayed else "ON TIME"
        risk_level = get_risk_category(delay_prob)

        # SHAP Explainability calculation
        shap_summary = []
        if self.explainer and self.is_loaded:
            feat_attributions = self.explainer.explain_instance(
                processed_matrix, self.feature_names, raw_features_dict=input_row
            )
            shap_summary = [
                SHAPFeatureAttribution(
                    feature=item["feature"],
                    shap_value=item["shap_value"],
                    impact=item["impact"],
                    feature_value=item.get("feature_value", "")
                )
                for item in feat_attributions
            ]

        response = FlightPredictionResponse(
            prediction_id=pred_id,
            flight_number=req.flight_number,
            carrier=req.carrier,
            origin=req.origin,
            destination=req.destination,
            delay_probability=delay_prob,
            predicted_class=predicted_class,
            risk_level=risk_level,
            is_delayed=is_delayed,
            is_mock_data=is_mock,
            shap_summary=shap_summary,
            created_at=datetime.utcnow()
        )

        if db_session:
            try:
                log_data = response.model_dump()
                log_data["scheduled_departure"] = req.scheduled_departure
                log_data["distance_miles"] = req.distance_miles
                log_data["input_features"] = input_row
                log_data["shap_summary"] = [s.model_dump() for s in shap_summary]
                create_prediction_log(db_session, log_data)
            except Exception as e:
                logger.warning(f"Could not persist prediction log to DB: {e}")

        return response

    def simulate_what_if(self, req: WhatIfSimulationRequest, db_session=None) -> Dict[str, Any]:
        """Runs baseline vs simulated parameter prediction using real model and production threshold."""
        baseline_resp = self.predict_delay(req, db_session=None)

        sim_req_dict = req.model_dump()
        
        if req.simulated_carrier:
            sim_req_dict["carrier"] = req.simulated_carrier
        if req.simulated_origin:
            sim_req_dict["origin"] = req.simulated_origin
        if req.simulated_destination:
            sim_req_dict["destination"] = req.simulated_destination
        if req.simulated_scheduled_departure:
            sim_req_dict["scheduled_departure"] = req.simulated_scheduled_departure
        if req.simulated_distance_miles:
            sim_req_dict["distance_miles"] = req.simulated_distance_miles

        sim_req = FlightPredictionRequest(**sim_req_dict)
        simulated_resp = self.predict_delay(sim_req, db_session=None)

        prob_delta = round(simulated_resp.delay_probability - baseline_resp.delay_probability, 4)

        summary_msg = (
            f"Changing flight parameters shifted delay risk from {baseline_resp.delay_probability:.1%} ({baseline_resp.predicted_class}) "
            f"to {simulated_resp.delay_probability:.1%} ({simulated_resp.predicted_class}) "
            f"({prob_delta:+.1%} change, risk category: {simulated_resp.risk_level})."
        )

        return {
            "baseline": baseline_resp.model_dump(),
            "simulated": simulated_resp.model_dump(),
            "comparison": {
                "probability_delta": prob_delta,
                "class_changed": baseline_resp.predicted_class != simulated_resp.predicted_class,
                "risk_shifted": baseline_resp.risk_level != simulated_resp.risk_level,
                "summary": summary_msg
            },
            "is_mock_data": simulated_resp.is_mock_data
        }


ml_service = MLService()
