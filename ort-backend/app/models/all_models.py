import enum
import uuid
from datetime import date, datetime
from typing import Optional, List

from sqlalchemy import (
    Boolean, Date, DateTime, Enum as SAEnum, Float, ForeignKey,
    Integer, String, Text, func,
)
from sqlalchemy.dialects.postgresql import UUID, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


# ═══════════════════════════════════════
# ENUMS
# ═══════════════════════════════════════
class QuestionType(str, enum.Enum):
    COMPARISON = "comparison"
    STANDARD = "standard"

class SprintType(str, enum.Enum):
    COMPARISON = "comparison"
    STANDARD = "standard"


# ═══════════════════════════════════════
# 1. USERS
# ═══════════════════════════════════════
class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    username: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    role: Mapped[str] = mapped_column(String(20), nullable=False, default="student")
    target_ort_score: Mapped[int] = mapped_column(Integer, default=180)
    current_level: Mapped[str] = mapped_column(String(20), default="beginner")
    language_pref: Mapped[str] = mapped_column(String(5), default="ru")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    attempts: Mapped[List["UserAttempt"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    recommendations: Mapped[List["Recommendation"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    error_archive: Mapped[List["ErrorArchive"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    daily_streak: Mapped[Optional["DailyStreak"]] = relationship(back_populates="user", cascade="all, delete-orphan", uselist=False)
    sprint_sessions: Mapped[List["SprintSession"]] = relationship(back_populates="user", cascade="all, delete-orphan")


# ═══════════════════════════════════════
# 2. TOPICS
# ═══════════════════════════════════════
class Topic(Base):
    __tablename__ = "topics"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(50), nullable=False, unique=True)
    category: Mapped[str] = mapped_column(String(30), nullable=False)
    description_ky: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    description_ru: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    questions: Mapped[List["Question"]] = relationship(back_populates="topic", cascade="all, delete-orphan")
    recommendations: Mapped[List["Recommendation"]] = relationship(back_populates="prioritized_topic", cascade="all, delete-orphan")


# ═══════════════════════════════════════
# 3. QUESTIONS
# ═══════════════════════════════════════
class Question(Base):
    __tablename__ = "questions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    topic_id: Mapped[int] = mapped_column(Integer, ForeignKey("topics.id", ondelete="CASCADE"), nullable=False, index=True)
    difficulty_level: Mapped[int] = mapped_column(Integer, nullable=False)
    content_latex: Mapped[str] = mapped_column(Text, nullable=False)
    image_url: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    correct_answer: Mapped[str] = mapped_column(String(1), nullable=False)
    explanation: Mapped[str] = mapped_column(Text, nullable=False)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)

    question_type: Mapped[QuestionType] = mapped_column(
        SAEnum(QuestionType, name="questiontype"),
        nullable=False,
        default=QuestionType.STANDARD
    )
    options: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)

    topic: Mapped["Topic"] = relationship(back_populates="questions")
    attempts: Mapped[List["UserAttempt"]] = relationship(back_populates="question", cascade="all, delete-orphan")
    error_entries: Mapped[List["ErrorArchive"]] = relationship(back_populates="question", cascade="all, delete-orphan")


# ═══════════════════════════════════════
# 4. USER_ATTEMPTS
# ═══════════════════════════════════════
class UserAttempt(Base):
    __tablename__ = "user_attempts"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    question_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("questions.id", ondelete="CASCADE"), nullable=False, index=True)
    is_correct: Mapped[bool] = mapped_column(Boolean, nullable=False)
    time_spent_seconds: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    is_time_sink: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    user: Mapped["User"] = relationship(back_populates="attempts")
    question: Mapped["Question"] = relationship(back_populates="attempts")


# ═══════════════════════════════════════
# 5. RECOMMENDATIONS
# ═══════════════════════════════════════
class Recommendation(Base):
    __tablename__ = "recommendations"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    prioritized_topic_id: Mapped[int] = mapped_column(Integer, ForeignKey("topics.id", ondelete="CASCADE"), nullable=False)
    recommended_date: Mapped[date] = mapped_column(Date, nullable=False)
    priority_score: Mapped[float] = mapped_column(Float, nullable=False)

    user: Mapped["User"] = relationship(back_populates="recommendations")
    prioritized_topic: Mapped["Topic"] = relationship(back_populates="recommendations")


# ═══════════════════════════════════════
# 6. ERROR_ARCHIVE (ОБНОВЛЕНО)
# ═══════════════════════════════════════
class ErrorArchive(Base):
    __tablename__ = "error_archive"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    question_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("questions.id", ondelete="CASCADE"), nullable=False)
    
    retry_count: Mapped[int] = mapped_column(Integer, default=0)
    success_count: Mapped[int] = mapped_column(Integer, default=0) # <--- Тот самый счетчик подряд
    mastered: Mapped[bool] = mapped_column(Boolean, default=False)
    
    added_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    user: Mapped["User"] = relationship(back_populates="error_archive")
    question: Mapped["Question"] = relationship(back_populates="error_entries")


# ═══════════════════════════════════════
# 7. DAILY_STREAKS
# ═══════════════════════════════════════
class DailyStreak(Base):
    __tablename__ = "daily_streaks"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    current_streak: Mapped[int] = mapped_column(Integer, default=0)
    longest_streak: Mapped[int] = mapped_column(Integer, default=0)
    xp_points: Mapped[int] = mapped_column(Integer, default=0)
    last_active: Mapped[date] = mapped_column(Date, nullable=False)

    user: Mapped["User"] = relationship(back_populates="daily_streak")


# ═══════════════════════════════════════
# 8. SPRINT_SESSIONS
# ═══════════════════════════════════════
class SprintSession(Base):
    __tablename__ = "sprint_sessions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    sprint_type: Mapped[SprintType] = mapped_column(SAEnum(SprintType, name="sprinttype"), nullable=False)
    total_questions: Mapped[int] = mapped_column(Integer, nullable=False)
    correct_answers: Mapped[int] = mapped_column(Integer, nullable=False)
    time_spent_seconds: Mapped[int] = mapped_column(Integer, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    user: Mapped["User"] = relationship(back_populates="sprint_sessions")