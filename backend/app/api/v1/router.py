from fastapi import APIRouter
from backend.app.api.v1.endpoints import (
    health,
    predict,
    route_intel,
    airport_intel,
    airline_intel,
    analytics,
    model_perf,
    history,
    explainability,
    auth,
    profile,
    saved_flights,
)

api_router = APIRouter()

api_router.include_router(health.router, tags=["Health"])
api_router.include_router(auth.router, tags=["Authentication"])
api_router.include_router(profile.router, tags=["Customer Profile"])
api_router.include_router(saved_flights.router, tags=["Saved Flights"])
api_router.include_router(predict.router, tags=["Prediction & What-If"])
api_router.include_router(route_intel.router, tags=["Route Intelligence"])
api_router.include_router(airport_intel.router, tags=["Airport Intelligence"])
api_router.include_router(airline_intel.router, tags=["Airline Intelligence"])
api_router.include_router(analytics.router, tags=["Analytics & EDA"])
api_router.include_router(model_perf.router, tags=["Model Performance"])
api_router.include_router(history.router, tags=["Prediction History"])
api_router.include_router(explainability.router, tags=["Explainability (SHAP)"])


