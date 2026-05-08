from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    MONGODB_URL: str = "mongodb+srv://user:pass@cluster.mongodb.net"
    DB_NAME: str = "attendance_system"
    SECRET_KEY: str = "your-super-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours
    GEMINI_API_KEY: str = ""
    OPENROUTER_API_KEY: str = ""
    GEOFENCE_RADIUS_METERS: int = 500

    class Config:
        env_file = ".env"

settings = Settings()