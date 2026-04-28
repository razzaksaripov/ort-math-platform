"""
Core business logic: submit answer → timer check → error archive → XP → stats.
"""

import uuid
from datetime import date

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.exceptions import NotFoundException
from app.models import DailyStreak, ErrorArchive, Question, User, UserAttempt
from app.schemas.attempt import AttemptCreate, AttemptFeedback


class AttemptService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def submit(self, user: User, data: AttemptCreate) -> AttemptFeedback:
        # 1. Get question
        q = await self.db.execute(select(Question).where(Question.id == data.question_id))
        question = q.scalar_one_or_none()
        if not question:
            raise NotFoundException("Question")

        # 2. Check answer
        is_correct = data.selected_answer.upper() == question.correct_answer.upper()

        # 3. Smart Timer
        is_time_sink = data.time_spent_seconds > settings.TIME_SINK_THRESHOLD

        # 4. Save attempt
        attempt = UserAttempt(
            user_id=user.id,
            question_id=question.id,
            is_correct=is_correct,
            time_spent_seconds=data.time_spent_seconds,
            is_time_sink=is_time_sink,
        )
        self.db.add(attempt)
        await self.db.flush()

        # 5. Error Archive
        added_to_archive = False
        if not is_correct:
            added_to_archive = await self._add_to_error_archive(user.id, question.id)
        else:
            await self._update_mastery(user.id, question.id)

        # 6. Gamification
        xp = await self._update_streak(user.id, is_correct)

        return AttemptFeedback(
            attempt_id=attempt.id,
            is_correct=is_correct,
            correct_answer=question.correct_answer,
            explanation=question.explanation,
            time_spent_seconds=data.time_spent_seconds,
            is_time_sink=is_time_sink,
            xp_earned=xp,
            added_to_error_archive=added_to_archive,
        )

    async def _add_to_error_archive(self, user_id: uuid.UUID, question_id: uuid.UUID) -> bool:
        q = await self.db.execute(
            select(ErrorArchive).where(
                ErrorArchive.user_id == user_id,
                ErrorArchive.question_id == question_id,
            )
        )
        if q.scalar_one_or_none() is None:
            self.db.add(ErrorArchive(user_id=user_id, question_id=question_id))
            return True
        return False

    async def _update_mastery(self, user_id: uuid.UUID, question_id: uuid.UUID) -> None:
        q = await self.db.execute(
            select(ErrorArchive).where(
                ErrorArchive.user_id == user_id,
                ErrorArchive.question_id == question_id,
                ErrorArchive.mastered == False,
            )
        )
        entry = q.scalar_one_or_none()
        if entry:
            entry.retry_count += 1
            if entry.retry_count >= settings.MASTERY_CORRECT_COUNT:
                entry.mastered = True
            self.db.add(entry)

    async def _update_streak(self, user_id: uuid.UUID, is_correct: bool) -> int:
        q = await self.db.execute(select(DailyStreak).where(DailyStreak.user_id == user_id))
        streak = q.scalar_one_or_none()
        if not streak:
            streak = DailyStreak(user_id=user_id, last_active=date.today(), current_streak=1, longest_streak=1)
            self.db.add(streak)

        today = date.today()
        xp = settings.XP_PER_CORRECT if is_correct else 0

        if streak.last_active != today:
            yesterday = date.fromordinal(today.toordinal() - 1)
            streak.current_streak = streak.current_streak + 1 if streak.last_active == yesterday else 1
            if streak.current_streak > streak.longest_streak:
                streak.longest_streak = streak.current_streak
            xp += settings.XP_PER_STREAK_DAY
            streak.last_active = today

        streak.xp_points += xp
        self.db.add(streak)
        return xp

    async def get_stats(self, user_id: uuid.UUID) -> dict:
        total = (await self.db.execute(
            select(func.count()).where(UserAttempt.user_id == user_id)
        )).scalar() or 0

        correct = (await self.db.execute(
            select(func.count()).where(UserAttempt.user_id == user_id, UserAttempt.is_correct == True)
        )).scalar() or 0

        avg_time = (await self.db.execute(
            select(func.avg(UserAttempt.time_spent_seconds)).where(UserAttempt.user_id == user_id)
        )).scalar() or 0.0

        errors = (await self.db.execute(
            select(func.count()).where(ErrorArchive.user_id == user_id, ErrorArchive.mastered == False)
        )).scalar() or 0

        streak_row = (await self.db.execute(
            select(DailyStreak).where(DailyStreak.user_id == user_id)
        )).scalar_one_or_none()

        acc = (correct / total * 100) if total > 0 else 0.0
        score = int(110 + 135 * (correct / total)) if total > 0 else 110

        return {
            "total_solved": total,
            "total_correct": correct,
            "accuracy_rate": round(acc, 1),
            "average_time_seconds": round(float(avg_time), 1),
            "predicted_ort_score": min(score, 245),
            "current_streak": streak_row.current_streak if streak_row else 0,
            "xp_points": streak_row.xp_points if streak_row else 0,
            "error_archive_count": errors,
        }
