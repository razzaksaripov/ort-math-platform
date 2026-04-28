from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

# Импорты ядра и БД
from app.db.session import get_db
from app.core.security import get_current_user
from app.models.all_models import User, Question, UserAttempt, SprintSession  # Добавили SprintSession

# Импортируем схемы из твоего нового файла в папке schemas
from app.schemas.analytics import (
    SprintSessionCreate, 
    SprintSessionRead, 
    SummaryResponse, 
    TopicPerformance
)

router = APIRouter(prefix="/analytics", tags=["Analytics"])

# Справочник тем ОРТ (можно позже вынести в отдельный файл констант)
TOPIC_MAPPING = {
    5: "Арифметика",
    6: "Алгебра",
    7: "Геометрия",
    8: "Анализ данных"
}

# ═══════════════════════════════════════
# 1. СОХРАНЕНИЕ РЕЗУЛЬТАТОВ СПРИНТА (POST)
# ═══════════════════════════════════════
@router.post("/sprint-session", response_model=SprintSessionRead, status_code=status.HTTP_201_CREATED)
async def save_sprint_session(
    session_in: SprintSessionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Сохраняет итоги завершенного спринта. Вызывается фронтендом автоматически.
    """
    new_session = SprintSession(
        user_id=current_user.id,
        **session_in.model_dump()
    )
    db.add(new_session)
    await db.commit()
    await db.refresh(new_session)
    return new_session


# ═══════════════════════════════════════
# 2. ПОЛУЧЕНИЕ СВОДНОЙ СТАТИСТИКИ (GET)
# ═══════════════════════════════════════
@router.get("/summary", response_model=SummaryResponse)
async def get_analytics_summary(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Возвращает агрегированную статистику по темам.
    Используется ИИ-наставником на фронтенде для советов.
    """
    # Запрос через агрегатные функции SQLAlchemy 2.0
    stmt = (
        select(
            Question.topic_id,
            func.count(UserAttempt.id).label("total_attempts"),
            func.count(UserAttempt.id).filter(UserAttempt.is_correct == True).label("correct_attempts"),
            func.avg(UserAttempt.time_spent_seconds).label("avg_time_sec")
        )
        .select_from(UserAttempt)
        .join(Question, UserAttempt.question_id == Question.id)
        .where(UserAttempt.user_id == current_user.id)
        .group_by(Question.topic_id)
    )

    result = await db.execute(stmt)
    rows = result.all()

    # Формируем словарь результатов из БД
    db_stats = {}
    for row in rows:
        total = row.total_attempts or 0
        correct = row.correct_attempts or 0
        accuracy = int(round((correct / total) * 100)) if total > 0 else 0
        
        db_stats[row.topic_id] = {
            "total_attempts": total,
            "accuracy": accuracy,
            "avg_time_sec": int(row.avg_time_sec) if row.avg_time_sec else 0
        }

    # Собираем финальный список для фронтенда
    performance_list = []
    for t_id, t_name in TOPIC_MAPPING.items():
        stat = db_stats.get(t_id, {"total_attempts": 0, "accuracy": 0, "avg_time_sec": 0})
        performance_list.append(
            TopicPerformance(
                id=t_id,
                name=t_name,
                accuracy=stat["accuracy"],
                avg_time_sec=stat["avg_time_sec"],
                total_attempts=stat["total_attempts"]
            )
        )

    return SummaryResponse(topic_performance=performance_list)