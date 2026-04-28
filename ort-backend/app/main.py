"""
ORT Math Platform — FastAPI application entry point.
Run: uvicorn app.main:app --reload
"""
from app.api.v1.endpoints import analytics
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.exceptions import register_exception_handlers
from app.db.redis import redis_client
from app.api.v1.endpoints import analytics


def run_migrations():
    import subprocess
    import sys
    import os
    alembic_bin = os.path.join(os.path.dirname(sys.executable), "alembic")
    result = subprocess.run(
        [alembic_bin, "upgrade", "head"],
        capture_output=True,
        text=True,
    )
    print(result.stdout)
    if result.returncode != 0:
        print("ALEMBIC ERROR:", result.stderr)
        raise RuntimeError(f"Alembic migration failed:\n{result.stderr}")


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    # Startup
    run_migrations()
    await redis_client.initialize()
    print("✅ Redis connected")
    yield
    # Shutdown
    await redis_client.close()
    print("🔴 Redis disconnected")


app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    description="Adaptive Web-Platform for ORT Math Preparation in Kyrgyzstan",
    openapi_url=f"{settings.API_V1_PREFIX}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# CORS — allow React dev server on localhost:3000
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://ort-math-platform-51dl.vercel.app",
        "https://ort-math-platform.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global exception handlers
register_exception_handlers(app)


# Health check
@app.get("/health", tags=["Health"])
async def health_check():
    redis_ok = await redis_client.ping()
    return {
        "status": "ok",
        "service": "ort-math-platform",
        "redis": "connected" if redis_ok else "disconnected",
    }


# Register all API routers
from app.api.v1.endpoints import auth, attempts, topics, questions, admin

app.include_router(auth.router, prefix=settings.API_V1_PREFIX)
app.include_router(attempts.router, prefix=settings.API_V1_PREFIX)
app.include_router(topics.router, prefix=settings.API_V1_PREFIX)
app.include_router(questions.router, prefix=settings.API_V1_PREFIX)
app.include_router(admin.router, prefix=settings.API_V1_PREFIX)
app.include_router(analytics.router, prefix="/api/v1")

