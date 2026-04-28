import uuid
from datetime import date, datetime
from typing import Optional, List
from pydantic import BaseModel, Field

# ─── 1. ОСНОВНЫЕ ПОПЫТКИ (ATTEMPTS) ───

class AttemptCreate(BaseModel):
    """Схема для отправки ответа на вопрос"""
    question_id: uuid.UUID
    selected_answer: str = Field(..., pattern=r"^[A-E]$")
    time_spent_seconds: int = Field(0, ge=0)

class AttemptResponse(BaseModel):
    """Базовая информация о попытке для истории"""
    id: uuid.UUID
    user_id: uuid.UUID
    question_id: uuid.UUID
    is_correct: bool
    time_spent_seconds: int
    is_time_sink: bool
    created_at: datetime
    
    model_config = {"from_attributes": True}

class AttemptFeedback(BaseModel):
    """Мгновенная обратная связь после ответа"""
    attempt_id: uuid.UUID
    is_correct: bool
    correct_answer: str
    explanation: str
    time_spent_seconds: int
    is_time_sink: bool
    xp_earned: int
    added_to_error_archive: bool

# ─── 2. АРХИВ ОШИБОК (ERROR ARCHIVE) ───

class ErrorQuestionData(BaseModel):
    """Специальная схема вопроса для карточки в архиве ошибок"""
    id: uuid.UUID
    content_latex: str
    correct_answer: str
    explanation: str
    difficulty_level: int
    topic_id: int
    options: Optional[List] = None
    question_type: Optional[str] = None

    model_config = {"from_attributes": True}

class ErrorArchiveResponse(BaseModel):
    """Схема для отображения списка ошибок в Архиве"""
    id: uuid.UUID
    user_id: uuid.UUID
    question_id: uuid.UUID
    retry_count: int
    success_count: int  # Наш новый счетчик: 3 верных ответа подряд = mastered
    mastered: bool
    added_at: datetime
    # Вложенные данные вопроса, чтобы фронтенд не падал (белый экран)
    question: Optional[ErrorQuestionData] = None

    model_config = {"from_attributes": True}

class RetryRequest(BaseModel):
    """Запрос на повторное решение задачи из архива"""
    selected_answer: str = Field(..., pattern=r"^[A-E]$")

class RetryResponse(BaseModel):
    """Результат повторного решения из архива"""
    is_correct: bool
    correct_answer: str
    explanation: str
    success_count: int
    retry_count: int
    mastered: bool
    xp_earned: int

# ─── 3. СТАТИСТИКА И ПРОГРЕСС ───

class DailyStreakResponse(BaseModel):
    """Информация о ежедневной активности (огни)"""
    current_streak: int
    longest_streak: int
    xp_points: int
    last_active: date
    
    model_config = {"from_attributes": True}

class UserStatsResponse(BaseModel):
    """Агрегированная статистика для Dashboard"""
    total_solved: int
    total_correct: int
    accuracy_rate: float
    average_time_seconds: float
    predicted_ort_score: int
    current_streak: int
    xp_points: int
    error_archive_count: int