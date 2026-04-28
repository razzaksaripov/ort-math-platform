"""
Application settings — reads from .env file.
PostgreSQL = localhost (Mac local), Redis = localhost (Docker container).
"""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    # ─── Project ───
    PROJECT_NAME: str = "ORT Math Platform"
    API_V1_PREFIX: str = "/api/v1"
    DEBUG: bool = False

    # ─── PostgreSQL (local) ───
    DATABASE_URL: str = "postgresql+asyncpg://ort_user:ort_pass@localhost:5432/ort_math_db"

    # ─── Redis (Docker) ───
    REDIS_URL: str = "redis://localhost:6379/0"
    REDIS_CACHE_TTL: int = 300  # 5 minutes

    # ─── JWT ───
    SECRET_KEY: str = "change-this-to-a-random-64-char-string-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # ─── Business logic ───
    TIME_SINK_THRESHOLD: int = 90       # seconds
    MASTERY_CORRECT_COUNT: int = 3      # correct retries to master
    XP_PER_CORRECT: int = 10
    XP_PER_STREAK_DAY: int = 5
    XP_DAILY_GOAL_BONUS: int = 50
    DAILY_GOAL_COUNT: int = 15

    # ─── AI Integrations ───
    GEMINI_API_KEY: str | None = None


settings = Settings()