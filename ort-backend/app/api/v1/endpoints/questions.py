import uuid
from typing import Optional, List

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundException
from app.core.security import get_current_admin, get_current_user
from app.db.redis import redis_client
from app.db.session import get_db
from app.models import Question, User
from app.schemas.question import (
    QuestionBrief,
    QuestionCreate,
    QuestionResponse,
    QuestionUpdate,
)

router = APIRouter(prefix="/questions", tags=["Questions"])


@router.get("/exam", response_model=List[QuestionResponse])
async def get_exam_questions(
    type: str = Query(..., description="Тип вопросов: comparison или standard"),
    limit: int = Query(30, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """
    Специальный эндпоинт для режима симуляции ОРТ.
    Возвращает случайные вопросы заданного типа.
    """
    # В базе типы обычно хранятся в верхнем регистре (COMPARISON/STANDARD)
    query = (
        select(Question)
        .where(Question.question_type == type.upper())
        .where(Question.is_verified == True)
        .order_by(func.random())  # Перемешиваем вопросы
        .limit(limit)
    )

    result = await db.execute(query)
    questions = result.scalars().all()
    
    if not questions:
        # Если вопросов такого типа в базе еще нет
        return []

    return [QuestionResponse.model_validate(q) for q in questions]


@router.get("/by-topic/{topic_id}", response_model=list[QuestionBrief])
async def get_by_topic(
    topic_id: int,
    difficulty: Optional[int] = Query(None, ge=1, le=5),
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """Questions for a topic WITHOUT answers (test mode). Redis-cached."""
    cache_key = f"q:topic:{topic_id}:d:{difficulty}:l:{limit}"
    cached = await redis_client.get(cache_key)
    if cached:
        return [QuestionBrief(**q) for q in cached]

    stmt = select(Question).where(
        Question.topic_id == topic_id, Question.is_verified == True
    )
    if difficulty is not None:
        stmt = stmt.where(Question.difficulty_level == difficulty)
    stmt = stmt.limit(limit)

    result = await db.execute(stmt)
    questions = result.scalars().all()
    data = [QuestionBrief.model_validate(q).model_dump() for q in questions]
    await redis_client.set(cache_key, data, ttl=600)
    return [QuestionBrief(**q) for q in data]


@router.get("/{question_id}", response_model=QuestionResponse)
async def get_question(
    question_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """Full question with answer (after submission)."""
    result = await db.execute(select(Question).where(Question.id == question_id))
    question = result.scalar_one_or_none()
    if not question:
        raise NotFoundException("Question")
    return QuestionResponse.model_validate(question)


@router.post("/", response_model=QuestionResponse, status_code=201)
async def create_question(
    data: QuestionCreate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    """Create question (admin only)."""
    question = Question(**data.model_dump())
    db.add(question)
    await db.flush()
    # Очищаем кэш топика при добавлении нового вопроса
    await redis_client.delete_pattern(f"q:topic:{data.topic_id}:*")
    return QuestionResponse.model_validate(question)


@router.patch("/{question_id}", response_model=QuestionResponse)
async def update_question(
    question_id: uuid.UUID,
    data: QuestionUpdate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    """Update question (admin only)."""
    result = await db.execute(select(Question).where(Question.id == question_id))
    question = result.scalar_one_or_none()
    if not question:
        raise NotFoundException("Question")

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(question, field, value)
    
    db.add(question)
    # Очищаем кэш после обновления
    await redis_client.delete_pattern(f"q:topic:{question.topic_id}:*")
    return QuestionResponse.model_validate(question)