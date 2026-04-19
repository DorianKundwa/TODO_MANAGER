from sqlalchemy import Column, Integer, String, Date, ForeignKey, Enum, Text, Boolean
from sqlalchemy.orm import relationship
from .database import Base
import enum

class HolidayType(str, enum.Enum):
    NATIONAL = "national"
    OBSERVANCE = "observance"
    CULTURAL = "cultural"

class RecurrencePattern(str, enum.Enum):
    FIXED = "fixed"
    MOVABLE_CHRISTIAN = "movable_christian"
    MOVABLE_ISLAMIC = "movable_islamic"
    MOVABLE_RELATIVE = "movable_relative"

class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    description = Column(Text)
    
    holidays = relationship("Holiday", back_populates="category")

class Holiday(Base):
    __tablename__ = "holidays"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    local_name = Column(String)
    description = Column(Text)
    date = Column(Date, index=True, nullable=False)
    type = Column(Enum(HolidayType), default=HolidayType.NATIONAL)
    recurrence = Column(Enum(RecurrencePattern), default=RecurrencePattern.FIXED)
    is_public_holiday = Column(Boolean, default=True)
    
    category_id = Column(Integer, ForeignKey("categories.id"))
    category = relationship("Category", back_populates="holidays")
