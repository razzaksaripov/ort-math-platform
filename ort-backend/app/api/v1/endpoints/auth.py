from datetime import date
import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import AlreadyExistsException
from app.core.security import (
    create_access_token, create_refresh_token, decode_token,
    get_current_user, hash_password, verify_password,
)
from app.db.session import get_db
from app.models.all_models import DailyStreak, User
from app.schemas.user import (
    TokenRefresh, TokenResponse, UserRegister, UserResponse, UserUpdate,
)

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/register", response_model=UserResponse, status_code=201)
async def register(data: UserRegister, db: AsyncSession = Depends(get_db)):
    # 1. Проверяем, не занят ли email
    q = await db.execute(select(User).where(User.email == data.email))
    if q.scalar_one_or_none():
        raise AlreadyExistsException("User with this email")

    # 2. Проверяем, не занят ли username
    q2 = await db.execute(select(User).where(User.username == data.username))
    if q2.scalar_one_or_none():
        raise AlreadyExistsException("User with this username")

    # 3. Подготавливаем объект пользователя
    user = User(
        email=data.email,
        username=data.username,
        hashed_password=hash_password(data.password),
        language_pref=data.language_pref,
        target_ort_score=data.target_ort_score,
    )
    
    db.add(user)
    await db.flush()

    # 4. Создаем запись о стрике (активности)
    db.add(DailyStreak(user_id=user.id, last_active=date.today()))
    
    # 5. Фиксируем изменения
    try:
        await db.commit()
        await db.refresh(user)
    except Exception as e:
        await db.rollback()
        raise e
        
    return user


@router.post("/login", response_model=TokenResponse)
async def login(
    # Используем форму для совместимости со Swagger Authorize
    data: OAuth2PasswordRequestForm = Depends(), 
    db: AsyncSession = Depends(get_db)
):
    # В OAuth2PasswordRequestForm email передается в поле 'username'
    result = await db.execute(select(User).where(User.email == data.username))
    user = result.scalar_one_or_none()

    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Incorrect email or password"
        )
        
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Account deactivated"
        )

    return {
        "access_token": create_access_token(user.id, extra={"role": user.role}),
        "refresh_token": create_refresh_token(user.id),
        "token_type": "bearer",
    }


@router.post("/refresh", response_model=TokenResponse)
async def refresh(data: TokenRefresh, db: AsyncSession = Depends(get_db)):
    payload = decode_token(data.refresh_token)
    if payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Expected refresh token")

    result = await db.execute(select(User).where(User.id == uuid.UUID(payload["sub"])))
    user = result.scalar_one_or_none()
    
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User not found or inactive")

    return {
        "access_token": create_access_token(user.id, extra={"role": user.role}),
        "refresh_token": create_refresh_token(user.id),
        "token_type": "bearer",
    }


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.patch("/me", response_model=UserResponse)
async def update_me(
    data: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(current_user, field, value)
    
    db.add(current_user)
    await db.commit()
    await db.refresh(current_user)
    return current_user