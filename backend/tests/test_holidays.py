from app.services.holiday_service import RwandaHolidayService
from datetime import date

def test_fixed_holidays_2024():
    service = RwandaHolidayService()
    holidays = service.get_fixed_holidays(2024)
    
    # Check if New Year's Day is present
    new_year = next(h for h in holidays if h["name"] == "New Year's Day")
    assert new_year["date"] == date(2024, 1, 1)
    
    # Check if Liberation Day is present
    liberation = next(h for h in holidays if h["name"] == "Liberation Day")
    assert liberation["date"] == date(2024, 7, 4)

def test_umuganura_day_2024():
    service = RwandaHolidayService()
    # First Friday of August 2024 is Aug 2
    assert service.get_umuganura_day(2024) == date(2024, 8, 2)

def test_easter_monday_2024():
    service = RwandaHolidayService()
    # Easter Sunday 2024 is March 31, so Monday is April 1
    christian_holidays = service.get_movable_christian_holidays(2024)
    easter_monday = next(h for h in christian_holidays if h["name"] == "Easter Monday")
    assert easter_monday["date"] == date(2024, 4, 1)
