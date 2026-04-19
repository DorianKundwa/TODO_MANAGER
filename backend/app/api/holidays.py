from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date
from ..models.database import get_db
from ..models.holiday import Holiday as HolidayModel
from ..schemas.holiday import Holiday, HolidayList
from ..services.holiday_service import RwandaHolidayService

router = APIRouter()
holiday_service = RwandaHolidayService()

@router.get("/", response_model=HolidayList)
def get_holidays(
    db: Session = Depends(get_db),
    year: Optional[int] = Query(None, ge=2000, le=2100),
    month: Optional[int] = Query(None, ge=1, le=12),
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100)
):
    query = db.query(HolidayModel)
    
    if year:
        query = query.filter(HolidayModel.date >= date(year, 1, 1), 
                             HolidayModel.date <= date(year, 12, 31))
    if month and year:
        # Simplified month logic
        import calendar
        _, last_day = calendar.monthrange(year, month)
        query = query.filter(HolidayModel.date >= date(year, month, 1),
                             HolidayModel.date <= date(year, month, last_day))
    
    if start_date:
        query = query.filter(HolidayModel.date >= start_date)
    if end_date:
        query = query.filter(HolidayModel.date <= end_date)
        
    total = query.count()
    items = query.offset((page - 1) * size).limit(size).all()
    
    return {
        "items": items,
        "total": total,
        "page": page,
        "size": size
    }

@router.post("/seed/{year}")
def seed_holidays(year: int, db: Session = Depends(get_db)):
    """Helper endpoint to seed holidays for a specific year."""
    existing = db.query(HolidayModel).filter(
        HolidayModel.date >= date(year, 1, 1),
        HolidayModel.date <= date(year, 12, 31)
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail=f"Holidays for {year} already seeded")
        
    holidays_data = holiday_service.get_all_holidays(year)
    for h_data in holidays_data:
        db_holiday = HolidayModel(
            name=h_data["name"],
            local_name=h_data.get("local_name"),
            date=h_data["date"],
            type="national",
            recurrence="fixed" if "name" in ["New Year", "Christmas"] else "movable_christian"
        )
        db.add(db_holiday)
    
    db.commit()
    return {"message": f"Seeded {len(holidays_data)} holidays for {year}"}
