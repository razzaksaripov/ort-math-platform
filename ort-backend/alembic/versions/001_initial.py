"""create all 7 tables

Revision ID: 001_initial
Revises:
Create Date: 2026-03-21
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

revision: str = "001_initial"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("email", sa.String(100), unique=True, nullable=False, index=True),
        sa.Column("hashed_password", sa.String(255), nullable=False),
        sa.Column("username", sa.String(50), unique=True, nullable=False),
        sa.Column("role", sa.String(20), nullable=False, server_default="student"),
        sa.Column("target_ort_score", sa.Integer, server_default="180"),
        sa.Column("current_level", sa.String(20), server_default="beginner"),
        sa.Column("language_pref", sa.String(5), server_default="ru"),
        sa.Column("is_active", sa.Boolean, server_default="true"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "topics",
        sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
        sa.Column("name", sa.String(50), unique=True, nullable=False),
        sa.Column("category", sa.String(30), nullable=False),
        sa.Column("description_ky", sa.Text, nullable=True),
        sa.Column("description_ru", sa.Text, nullable=True),
    )

    op.create_table(
        "questions",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("topic_id", sa.Integer, sa.ForeignKey("topics.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("difficulty_level", sa.Integer, nullable=False),
        sa.Column("content_latex", sa.Text, nullable=False),
        sa.Column("image_url", sa.String(255), nullable=True),
        sa.Column("correct_answer", sa.String(1), nullable=False),
        sa.Column("explanation", sa.Text, nullable=False),
        sa.Column("is_verified", sa.Boolean, server_default="false"),
    )

    op.create_table(
        "user_attempts",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("question_id", UUID(as_uuid=True), sa.ForeignKey("questions.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("is_correct", sa.Boolean, nullable=False),
        sa.Column("time_spent_seconds", sa.Integer, nullable=False),
        sa.Column("is_time_sink", sa.Boolean, server_default="false"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "recommendations",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("prioritized_topic_id", sa.Integer, sa.ForeignKey("topics.id", ondelete="CASCADE"), nullable=False),
        sa.Column("recommended_date", sa.Date, nullable=False),
        sa.Column("priority_score", sa.Float, nullable=False),
    )

    op.create_table(
        "error_archive",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("question_id", UUID(as_uuid=True), sa.ForeignKey("questions.id", ondelete="CASCADE"), nullable=False),
        sa.Column("retry_count", sa.Integer, server_default="0"),
        sa.Column("mastered", sa.Boolean, server_default="false"),
        sa.Column("added_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "daily_streaks",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True, index=True),
        sa.Column("current_streak", sa.Integer, server_default="0"),
        sa.Column("longest_streak", sa.Integer, server_default="0"),
        sa.Column("xp_points", sa.Integer, server_default="0"),
        sa.Column("last_active", sa.Date, nullable=False),
    )


def downgrade() -> None:
    op.drop_table("daily_streaks")
    op.drop_table("error_archive")
    op.drop_table("recommendations")
    op.drop_table("user_attempts")
    op.drop_table("questions")
    op.drop_table("topics")
    op.drop_table("users")
