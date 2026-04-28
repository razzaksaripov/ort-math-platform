from pydantic import BaseModel, ConfigDict
from uuid import UUID
from datetime import datetime
from typing import List
# Импортируем наш Enum прямо из файла моделей
from app.models.all_models import SprintType 

# Схема для POST запроса (что присылает фронтенд)
class SprintSessionCreate(BaseModel):
    sprint_type: SprintType
    total_questions: int
    correct_answers: int
    time_spent_seconds: int

# Схема для ответа (что возвращает бэкенд)
class SprintSessionRead(SprintSessionCreate):
    id: UUID
    user_id: UUID
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

# Схема для сводной аналитики (которую мы обсуждали ранее)
class TopicPerformance(BaseModel):
    id: int
    name: str
    accuracy: int
    avg_time_sec: int
    total_attempts: int

class SummaryResponse(BaseModel):
    topic_performance: List[TopicPerformance]