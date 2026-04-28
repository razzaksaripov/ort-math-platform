from .all_models import (
    Base, 
    User, 
    Topic, 
    Question, 
    UserAttempt, 
    SprintSession, 
    Recommendation, 
    ErrorArchive, 
    DailyStreak
)

# Это список того, что будет доступно при импорте "from app.models import *"
__all__ = [
    "Base",
    "User",
    "Topic",
    "Question",
    "UserAttempt",
    "SprintSession",
    "Recommendation",
    "ErrorArchive",
    "DailyStreak",
]