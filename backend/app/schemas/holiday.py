from pydantic import BaseModel, ConfigDict
from datetime import date
from typing import Optional, List
from ..models.holiday import HolidayType, RecurrencePattern

class CategoryBase(BaseModel):
    name: str
    description: Optional[str] = None

class CategoryCreate(CategoryBase):
    pass

class Category(CategoryBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

class HolidayBase(BaseModel):
    name: str
    local_name: Optional[str] = None
    description: Optional[str] = None
    date: date
    type: HolidayType
    recurrence: RecurrencePattern
    is_public_holiday: bool = True
    category_id: Optional[int] = None

class HolidayCreate(HolidayBase):
    pass

class Holiday(HolidayBase):
    id: int
    category: Optional[Category] = None
    model_config = ConfigDict(from_attributes=True)

class HolidayList(BaseModel):
    items: List[Holiday]
    total: int
    page: int
    size: int
