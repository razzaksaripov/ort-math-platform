import asyncio
import sys
import os
from logging.config import fileConfig

# Гарантируем, что корень проекта в sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from alembic import context
from sqlalchemy import pool
from sqlalchemy.ext.asyncio import async_engine_from_config

from app.core.config import settings

# --- ИСПРАВЛЕННЫЙ ИМПОРТ ---
# Импортируем Base из app.models, так как именно там через __init__.py 
# подтягиваются все модели (User, SprintSession и т.д.)
from app.models import Base 
# ---------------------------

config = context.config
# Убедись, что DATABASE_URL в settings корректный (postgresql+asyncpg://...)
config.set_main_option("sqlalchemy.url", str(settings.DATABASE_URL))

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Теперь target_metadata будет содержать все зарегистрированные таблицы
target_metadata = Base.metadata

def run_migrations_offline() -> None:
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()

def do_run_migrations(connection) -> None:
    context.configure(connection=connection, target_metadata=target_metadata)
    with context.begin_transaction():
        context.run_migrations()

async def run_async_migrations() -> None:
    # Создаем асинхронный движок для миграций
    connectable = async_engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)
    await connectable.dispose()

def run_migrations_online() -> None:
    # Для асинхронного SQLAlchemy используем запуск асинхронной функции
    asyncio.run(run_async_migrations())

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()