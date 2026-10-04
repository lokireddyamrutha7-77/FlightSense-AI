from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from backend.app.db.session import get_db
from backend.app.db.crud import (
    get_saved_flights_by_user,
    create_saved_flight,
    delete_saved_flight
)
from backend.app.api.v1.endpoints.auth import get_current_user
from backend.app.schemas.saved_flights import SavedFlightCreate, SavedFlightResponse

router = APIRouter()

@router.get("/saved-flights", response_model=List[SavedFlightResponse])
def get_saved_flights(current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    """Retrieves all saved flights for authenticated user."""
    return get_saved_flights_by_user(db, current_user.id)

@router.post("/saved-flights", response_model=SavedFlightResponse)
def add_saved_flight(
    req: SavedFlightCreate,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Saves a flight for authenticated user."""
    if not req.flight_number or not req.carrier or not req.origin or not req.destination:
        raise HTTPException(status_code=400, detail="Flight number, carrier, origin, and destination are required.")
    
    saved = create_saved_flight(
        db,
        user_id=current_user.id,
        flight_number=req.flight_number,
        carrier=req.carrier,
        origin=req.origin,
        destination=req.destination,
        scheduled_departure=req.scheduled_departure
    )
    return saved

@router.delete("/saved-flights/{flight_id}")
def remove_saved_flight(
    flight_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Deletes a saved flight belonging to user."""
    success = delete_saved_flight(db, user_id=current_user.id, flight_id=flight_id)
    if not success:
        raise HTTPException(status_code=404, detail="Saved flight not found or unauthorized.")
    return {"success": True, "message": "Saved flight deleted successfully."}
