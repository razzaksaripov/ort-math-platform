"""
Seed script — ORT topics + questions with question_type and options.
Run: python -m app.seed
"""
import asyncio
import json
from pathlib import Path
from sqlalchemy import select, text
from app.db.session import async_session_factory
from app.models.all_models import Topic, Question, QuestionType

# ─── Стандартные варианты для раздела Сравнений ───
COMPARISON_OPTIONS = [
    "Величина в колонке А больше",
    "Величина в колонке Б больше",
    "Величины равны",
    "Недостаточно данных для определения",
]

# ─── Истинные темы математики (БЕЗ "Сравнений") ───
TOPICS = [
    {"name": "Арифметика", "category": "Основная математика", "description_ru": "Арифметика и числа", "description_ky": "Арифметика жана сандар"},
    {"name": "Алгебра", "category": "Основная математика", "description_ru": "Уравнения и функции", "description_ky": "Алгебралык теңдемелер"},
    {"name": "Геометрия", "category": "Основная математика", "description_ru": "Планиметрия и стереометрия", "description_ky": "Геометрия"},
    {"name": "Анализ данных", "category": "Основная математика", "description_ru": "Статистика, вероятности", "description_ky": "Статистика, графиктер"},
]

# ─── Демо-вопросы для проверки (разные форматы внутри одной темы) ───
QUESTIONS = [
    {
        # Формат: СРАВНЕНИЕ КОЛОНОК
        "topic_name": "Алгебра",
        "question_type": QuestionType.COMPARISON,
        "difficulty_level": 2,
        "content_latex": r"Колонка А: $3^4 + 3^4 + 3^4$ \\ Колонка Б: $3^5$",
        "options": COMPARISON_OPTIONS,
        "correct_answer": "C",
        "explanation": r"$3 \cdot 3^4 = 3^5$. Величины равны. Ответ: C",
        "is_verified": True,
    },
    {
        # Формат: СТАНДАРТНЫЙ ТЕСТ
        "topic_name": "Алгебра",
        "question_type": QuestionType.STANDARD,
        "difficulty_level": 2,
        "content_latex": r"Решите уравнение: $2x + 5 = 17$",
        "options": ["4", "5", "6", "7", "8"],
        "correct_answer": "C",
        "explanation": r"$2x = 12 \Rightarrow x = 6$. Ответ: C",
        "is_verified": True,
    }
]

async def seed_core_data(session):
    """Загружает базовые темы и хардкод-вопросы."""
    existing = await session.execute(select(Topic).limit(1))
    if existing.scalar_one_or_none():
        print("⚠️  Базовые темы уже существуют. Пропускаем создание базовых данных.")
        return

    # Вставляем темы
    topic_map: dict[str, int] = {}
    for t_data in TOPICS:
        topic = Topic(**t_data)
        session.add(topic)
        await session.flush()
        topic_map[topic.name] = topic.id
        print(f"  ✅ Тема создана: {topic.name} (id={topic.id})")

    # Вставляем хардкод-вопросы
    for q_data in QUESTIONS:
        topic_name = q_data.pop("topic_name")
        question = Question(
            topic_id=topic_map[topic_name],
            **q_data,
        )
        session.add(question)

    await session.commit()
    print(f"\n🎉 Загружено {len(TOPICS)} тем и {len(QUESTIONS)} базовых вопросов.")


async def seed_from_json(session):
    """Конвейер загрузки сырых данных из Data Lake (папки raw_questions)."""
    data_dir = Path("data/raw_questions")
    
    if not data_dir.exists():
        return

    files = list(data_dir.glob("*.json"))
    if not files:
        print("📂 Новых JSON-файлов для загрузки не найдено.")
        return

    total_added = 0
    for file_path in files:
        print(f"⏳ Читаем файл: {file_path.name}...")
        
        with open(file_path, "r", encoding="utf-8") as f:
            questions_data = json.load(f)
            
            for q_data in questions_data:
                question = Question(
                    topic_id=q_data["topic_id"],
                    difficulty_level=q_data["difficulty_level"],
                    content_latex=q_data["content_latex"],
                    question_type=q_data["question_type"],
                    options=q_data["options"],
                    correct_answer=q_data["correct_answer"],
                    explanation=q_data["explanation"],
                    is_verified=True
                )
                session.add(question)
                total_added += 1
                
        new_file_path = file_path.with_suffix(".json.loaded")
        file_path.rename(new_file_path)
        print(f"  ✅ Файл {file_path.name} обработан и переименован.")

    if total_added > 0:
        await session.commit()
        print(f"\n🚀 Из JSON добавлено {total_added} новых вопросов! 🚀")


async def main():
    async with async_session_factory() as session:
        await seed_core_data(session)
        await seed_from_json(session)


if __name__ == "__main__":
    asyncio.run(main())