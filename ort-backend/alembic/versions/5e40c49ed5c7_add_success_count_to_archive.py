"""add_success_count_to_archive

Revision ID: 5e40c49ed5c7
Revises: f91865c9b85e
Create Date: 2026-04-06 00:55:20.631801
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


revision: str = '5e40c49ed5c7'
down_revision: Union[str, None] = 'f91865c9b85e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Добавляем колонку, временно разрешая NULL (пустые значения)
    op.add_column('error_archive', sa.Column('success_count', sa.Integer(), nullable=True))
    
    # 2. Заполняем существующие 44 записи нулями, чтобы они не были пустыми
    op.execute("UPDATE error_archive SET success_count = 0")
    
    # 3. Теперь, когда пустых строк нет, ставим ограничение NOT NULL
    op.alter_column('error_archive', 'success_count', nullable=False)


def downgrade() -> None:
    op.drop_column('error_archive', 'success_count')