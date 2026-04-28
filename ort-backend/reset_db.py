import asyncio
from app.db.session import engine
from app.models.all_models import Base

async def reset():
    async with engine.begin() as conn:
        print("🗑️  Удаляем старые таблицы...")
        await conn.run_sync(Base.metadata.drop_all)
        print("✨ Создаем новые таблицы с правильными колонками...")
        await conn.run_sync(Base.metadata.create_all)
    print("✅ База данных успешно обновлена и очищена!")

if __name__ == "__main__":
    asyncio.run(reset())