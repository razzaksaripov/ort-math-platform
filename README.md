# ORT Math Platform

Адаптивная веб-платформа для подготовки к математической секции ОРТ (Общереспубликанское тестирование, Кыргызстан).

Платформа предоставляет студентам персонализированную среду для тренировки: тематические задания, спринт-режим, полную симуляцию экзамена, архив ошибок с системой мастерства и аналитику успеваемости. Администраторы могут загружать задачи через ИИ-парсер изображений (Gemini API).

---

## Стек технологий

| Слой | Технология |
|---|---|
| Frontend | React 19, Vite 6, React Router 7 |
| Стилизация | Tailwind CSS 4, Framer Motion 11 |
| Состояние | Zustand 5 |
| Математика | KaTeX 0.16 |
| HTTP-клиент | Axios 1.7 |
| Backend | Python 3.13, FastAPI |
| ORM | SQLAlchemy 2.0 (async) |
| База данных | PostgreSQL (asyncpg) |
| Кэш | Redis (aioredis) |
| Аутентификация | JWT (access + refresh токены) |
| ИИ-парсер | Google Gemini 2.5 Flash |
| Миграции | Alembic |

---

## Структура репозитория

```
ort-frontend/       # React SPA
├── src/
│   ├── pages/      # Страницы приложения
│   ├── components/ # Layout и переиспользуемые компоненты
│   ├── services/   # Axios-клиент с интерцепторами
│   ├── store/      # Zustand (authStore)
│   └── hooks/      # useTopics, useStats
└── vite.config.js

ort-backend/        # FastAPI приложение
├── app/
│   ├── api/v1/endpoints/   # Маршруты: auth, topics, questions, attempts, analytics, admin
│   ├── models/             # SQLAlchemy-модели
│   ├── schemas/            # Pydantic-схемы
│   ├── services/           # Бизнес-логика
│   ├── core/               # Конфиг, безопасность, исключения
│   └── db/                 # Сессия PostgreSQL, Redis-клиент
├── alembic/                # Миграции БД
└── docker-compose.yml
```

---

## Развёртывание

### Предварительные требования

- Node.js ≥ 20
- Python ≥ 3.11
- PostgreSQL ≥ 14
- Redis ≥ 7

---

### Бэкенд

```bash
cd ort-backend

# 1. Создать и активировать виртуальное окружение
python -m venv venv
source venv/bin/activate          # macOS/Linux
# venv\Scripts\activate           # Windows

# 2. Установить зависимости
pip install -r requirements.txt

# 3. Создать файл .env в корне ort-backend/
cat > .env << 'EOF'
DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/ort_db
REDIS_URL=redis://localhost:6379
SECRET_KEY=your_secret_key_here
GEMINI_API_KEY=your_gemini_api_key
DEBUG=True
EOF

# 4. Применить миграции
alembic upgrade head

# 5. (Опционально) Загрузить начальные данные
python -m app.seed

# 6. Запустить сервер
uvicorn app.main:app --reload --port 8000
```

Документация API доступна по адресу: `http://127.0.0.1:8000/docs`

---

### Фронтенд

```bash
cd ort-frontend

# 1. Установить зависимости
npm install

# 2. Запустить dev-сервер
npm run dev
```

Приложение откроется по адресу: `http://localhost:5173`

> Бэкенд должен быть запущен на `http://127.0.0.1:8000` — это значение прописано в `src/services/api.js`.

---

### Запуск через Docker (бэкенд + PostgreSQL + Redis)

```bash
cd ort-backend
docker-compose up -d
```

---

## Основные страницы

| Маршрут | Описание |
|---|---|
| `/login` | Регистрация и вход |
| `/dashboard` | Главная панель со статистикой и темами |
| `/practice` | Выбор режима тренировки |
| `/practice/sprint` | Спринт (тайм-атака по 20 задач) |
| `/quiz` | Тренировка по конкретной теме |
| `/exam` | Симуляция полного ОРТ (90 мин, 60 задач) |
| `/errors` | Архив ошибок с системой мастерства (3/3) |
| `/analytics` | Аналитика успеваемости по темам |
| `/admin` | Загрузка задач через ИИ-парсер |
