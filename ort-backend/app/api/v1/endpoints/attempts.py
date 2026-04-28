import uuid
from datetime import date
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.security import get_current_user
from app.db.session import get_db
from app.models import DailyStreak, ErrorArchive, User, UserAttempt
from app.schemas.attempt import (
    AttemptCreate,
    AttemptFeedback,
    AttemptResponse,
    DailyStreakResponse,
    ErrorArchiveResponse,
    RetryRequest,
    RetryResponse,
    UserStatsResponse,
)
from app.services.attempt_service import AttemptService

router = APIRouter(prefix="/attempts", tags=["Attempts"])

# Настройки логики (можно вынести в app.core.config)
MASTERY_THRESHOLD = 3
XP_RETRY_REWARD = 20

@router.post("/submit", response_model=AttemptFeedback)
async def submit_attempt(
    data: AttemptCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Отправка ответа на вопрос (Спринт или Тренировка)."""
    service = AttemptService(db)
    return await service.submit(current_user, data)


@router.get("/errors", response_model=List[ErrorArchiveResponse])
async def get_error_archive(
    mastered: bool | None = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Получение списка ошибок пользователя с данными вопросов."""
    stmt = (
        select(ErrorArchive)
        .where(ErrorArchive.user_id == current_user.id)
        .options(selectinload(ErrorArchive.question))
    )
    
    if mastered is not None:
        stmt = stmt.where(ErrorArchive.mastered == mastered)
    
    stmt = stmt.order_by(ErrorArchive.added_at.desc())
    
    result = await db.execute(stmt)
    return list(result.scalars().all())


@router.patch("/errors/{error_id}/retry", response_model=RetryResponse)
async def retry_error(
    error_id: uuid.UUID,
    data: RetryRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Повторная попытка решения задачи из архива.
    Логика: 3 раза подряд верно -> задача освоена (mastered).
    """
    # 1. Ищем запись в архиве вместе с вопросом
    result = await db.execute(
        select(ErrorArchive)
        .where(ErrorArchive.id == error_id, ErrorArchive.user_id == current_user.id)
        .options(selectinload(ErrorArchive.question))
    )
    entry = result.scalar_one_or_none()

    if not entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Запись в архиве не найдена"
        )
    
    if entry.mastered:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Эта задача уже полностью освоена"
        )

    question = entry.question
    is_correct = data.selected_answer.upper() == question.correct_answer.upper()
    xp_earned = 0

    if is_correct:
        # Увеличиваем счетчик успеха
        entry.success_count += 1
        # Проверяем, достигнут ли порог мастерства
        if entry.success_count >= MASTERY_THRESHOLD:
            entry.mastered = True
        xp_earned = XP_RETRY_REWARD
    else:
        # Сбрасываем прогресс, если ошибся снова
        entry.success_count = 0
        entry.retry_count += 1

    db.add(entry)

    # Начисляем XP в профиль пользователя (DailyStreak)
    if xp_earned > 0:
        streak_result = await db.execute(
            select(DailyStreak).where(DailyStreak.user_id == current_user.id)
        )
        streak = streak_result.scalar_one_or_none()
        if streak:
            streak.xp_points += xp_earned
            db.add(streak)

    await db.commit()

    return RetryResponse(
        is_correct=is_correct,
        correct_answer=question.correct_answer,
        explanation=question.explanation,
        success_count=entry.success_count,
        retry_count=entry.retry_count,
        mastered=entry.mastered,
        xp_earned=xp_earned
    )


@router.get("/history", response_model=List[AttemptResponse])
async def get_history(
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """История последних попыток."""
    result = await db.execute(
        select(UserAttempt)
        .where(UserAttempt.user_id == current_user.id)
        .order_by(UserAttempt.created_at.desc())
        .limit(limit)
    )
    return list(result.scalars().all())


@router.get("/stats", response_model=UserStatsResponse)
async def get_stats(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Общая статистика пользователя."""
    service = AttemptService(db)
    return await service.get_stats(current_user.id)


@router.get("/streak", response_model=DailyStreakResponse)
async def get_streak(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Текущий стрик (огни) и XP."""
    result = await db.execute(
        select(DailyStreak).where(DailyStreak.user_id == current_user.id)
    )
    streak = result.scalar_one_or_none()
    if not streak:
        streak = DailyStreak(user_id=current_user.id, last_active=date.today())
        db.add(streak)
        await db.flush()
    return streak