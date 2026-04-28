import json
import io
from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from google import genai
from google.genai import types
from PIL import Image
from app.core.config import settings
from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db # Твой файл с подключением к БД
from app.models.all_models import Question # Твоя модель таблицы вопросов

router = APIRouter(prefix="/admin", tags=["Admin CMS"])

class AIParsedQuestion(BaseModel):
    topic_id: int
    difficulty_level: int
    content_latex: str
    question_type: str
    options: Optional[List[str]] = None
    correct_answer: str
    explanation: str

@router.post("/parse-image", response_model=list[AIParsedQuestion])
async def parse_question_image(file: UploadFile = File(...)):
    if not settings.GEMINI_API_KEY:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY не настроен")

    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Загрузите изображение")

    try:
        content = await file.read()
        img = Image.open(io.BytesIO(content))
        client = genai.Client(api_key=settings.GEMINI_API_KEY)

        # ─── ОБНОВЛЕННЫЙ СТРОГИЙ ПРОМПТ ───
        prompt = """
        Ты — ИИ-ассистент для парсинга тестов ОРТ. Извлеки задачи из изображения.
        
        ВЕРНИ СТРОГО МАССИВ JSON ОБЪЕКТОВ. Каждый объект должен иметь ИМЕННО ЭТИ КЛЮЧИ:
        
        1. "topic_id": 5 (Арифметика), 6 (Алгебра), 7 (Геометрия) или 8 (Анализ данных).
        
        2. "difficulty_level": Определи сложность задачи по шкале от 1 до 5, опираясь на стандарты ОРТ, SAT и GRE:
           - 1 (Очень легко): Базовая арифметика, простые действия в одно касание.
           - 2 (Легко): Типовые задачи, требующие знания одной формулы.
           - 3 (Средне): Задачи среднего уровня сложности SAT, требующие 2-3 шага решения.
           - 4 (Сложно): Задачи с "ловушками", комбинированные темы.
           - 5 (Очень сложно): Олимпиадный уровень или самые сложные задачи из раздела Hard SAT/GRE.
        
        3. "content_latex": сам текст вопроса. Если это сравнение, напиши "Колонка А: ... \nКолонка Б: ...".
        
        4. "question_type": "comparison" или "standard".
        
        5. "options": 
           - Если question_type == "comparison", ВСЕГДА возвращай строго этот массив: 
             ["Величина в колонке А больше", "Величина в колонке Б больше", "Величины равны", "Недостаточно данных для определения"].
           - Если question_type == "standard", извлеки варианты с картинки. ЕСЛИ их нет — сгенерируй 5 правдоподобных вариантов (A, B, C, D, E). Поле "options" никогда не должно быть null.
        
        6. "correct_answer": Правильная буква (A, B, C, D или E).
        
        7. "explanation": Пошаговое решение на русском в LaTeX.
        """

        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=[prompt, img],
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
            )
        )

        import re
        raw_text = response.text.strip()
        if raw_text.startswith("```json"):
            raw_text = raw_text[7:]
        if raw_text.endswith("```"):
            raw_text = raw_text[:-3]

        # Fix invalid JSON escape sequences from LaTeX backslashes (e.g. \underbrace → \\underbrace)
        raw_text = re.sub(r'\\(?!["\\/bfnrt]|u[0-9a-fA-F]{4})', r'\\\\', raw_text.strip())

        parsed_questions = json.loads(raw_text)
        return parsed_questions

    except Exception as e:
        print(f"❌ ОШИБКА ПАРСИНГА: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    
@router.post("/save-questions")
async def save_parsed_questions(
    questions: list[AIParsedQuestion], 
    db: AsyncSession = Depends(get_db)
):
    """
    Принимает массив проверенных вопросов от админа и сохраняет их в БД.
    """
    try:
        # Перебираем массив и создаем записи для БД
        for q_data in questions:
            new_question = Question(
                topic_id=q_data.topic_id,
                difficulty_level=q_data.difficulty_level,
                content_latex=q_data.content_latex,
                question_type=q_data.question_type,
                options=q_data.options,
                correct_answer=q_data.correct_answer,
                explanation=q_data.explanation,
                is_verified=True # Сразу помечаем как проверенные модератором
            )
            db.add(new_question)
            
        # Сохраняем все разом
        await db.commit()
        return {"status": "success", "message": f"Успешно сохранено {len(questions)} задач!"}
        
    except Exception as e:
        await db.rollback() # Если ошибка - отменяем транзакцию
        print(f"❌ ОШИБКА СОХРАНЕНИЯ В БД: {e}")
        raise HTTPException(status_code=500, detail=str(e))