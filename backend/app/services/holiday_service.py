from datetime import date, timedelta
from dateutil.easter import easter
from typing import List, Dict
import math

class RwandaHolidayService:
    @staticmethod
    def get_fixed_holidays(year: int) -> List[Dict]:
        return [
            {"name": "New Year's Day", "local_name": "Ubunani", "date": date(year, 1, 1)},
            {"name": "Day After New Year's Day", "local_name": "Ubunani", "date": date(year, 1, 2)},
            {"name": "Heroes' Day", "local_name": "Umunsi w'Intwari", "date": date(year, 2, 1)},
            {"name": "Tutsi Genocide Memorial Day", "local_name": "Kwibuka", "date": date(year, 4, 7)},
            {"name": "Labor Day", "local_name": "Umunsi w'Abakozi", "date": date(year, 5, 1)},
            {"name": "Independence Day", "local_name": "Umunsi w'Ubwigenge", "date": date(year, 7, 1)},
            {"name": "Liberation Day", "local_name": "Umunsi wo Kwibohora", "date": date(year, 7, 4)},
            {"name": "Assumption Day", "local_name": "Asomusiyo", "date": date(year, 8, 15)},
            {"name": "Christmas Day", "local_name": "Noheli", "date": date(year, 12, 25)},
            {"name": "Boxing Day", "local_name": "Umunsi w'Iminsi Mikuru", "date": date(year, 12, 26)},
        ]

    @staticmethod
    def get_movable_christian_holidays(year: int) -> List[Dict]:
        easter_sunday = easter(year)
        easter_monday = easter_sunday + timedelta(days=1)
        good_friday = easter_sunday - timedelta(days=2)
        
        return [
            {"name": "Good Friday", "local_name": "Kuwa Gatanu Mutagatifu", "date": good_friday},
            {"name": "Easter Monday", "local_name": "Pasika", "date": easter_monday},
        ]

    @staticmethod
    def get_umuganura_day(year: int) -> date:
        # First Friday of August
        first_day = date(year, 8, 1)
        weekday = first_day.weekday() # 0 is Monday
        if weekday <= 4: # Mon-Fri
            days_to_friday = 4 - weekday
        else: # Sat-Sun
            days_to_friday = 11 - weekday
        return first_day + timedelta(days=days_to_friday)

    @staticmethod
    def get_islamic_holidays(year: int) -> List[Dict]:
        # Islamic holidays shift ~11 days earlier each Gregorian year.
        # This is an approximation logic for simulation. 
        # In a real app, use a hijri library or a precomputed table.
        # Reference dates for 2024: Eid al-Fitr ~April 10, Eid al-Adha ~June 16
        
        base_year = 2024
        year_diff = year - base_year
        shift = year_diff * 11
        
        eid_fitr_2024 = date(2024, 4, 10)
        eid_adha_2024 = date(2024, 6, 16)
        
        return [
            {
                "name": "Eid al-Fitr", 
                "local_name": "Iddi El-Fitiri", 
                "date": eid_fitr_2024 - timedelta(days=shift)
            },
            {
                "name": "Eid al-Adha", 
                "local_name": "Iddi El-Adha", 
                "date": eid_adha_2024 - timedelta(days=shift)
            }
        ]

    def get_all_holidays(self, year: int) -> List[Dict]:
        holidays = self.get_fixed_holidays(year)
        holidays.extend(self.get_movable_christian_holidays(year))
        holidays.extend(self.get_islamic_holidays(year))
        holidays.append({
            "name": "Umuganura (Harvest) Day", 
            "local_name": "Umuganura", 
            "date": self.get_umuganura_day(year)
        })
        return holidays
