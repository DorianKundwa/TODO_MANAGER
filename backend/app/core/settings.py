from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional, List
import os

class BaseAppSettings(BaseSettings):
    PROJECT_NAME: str = "Rwanda Holidays API"
    API_V1_STR: str = "/api/v1"
    DATABASE_URL: str = "sqlite:///./rwanda_holidays.db"
    DEBUG: bool = True
    CACHE_TTL: int = 3600 # 1 hour
    
    # Environment
    ENV: str = "dev"
    
    model_config = SettingsConfigDict(
        env_file=os.getenv("ENV_FILE", ".env"),
        case_sensitive=True
    )

class DevSettings(BaseAppSettings):
    ENV: str = "dev"
    DEBUG: bool = True

class StagingSettings(BaseAppSettings):
    ENV: str = "staging"
    DEBUG: bool = False

class ProdSettings(BaseAppSettings):
    ENV: str = "prod"
    DEBUG: bool = False

def get_settings() -> BaseAppSettings:
    env = os.getenv("ENV", "dev").lower()
    if env == "prod":
        return ProdSettings()
    elif env == "staging":
        return StagingSettings()
    return DevSettings()

settings = get_settings()
