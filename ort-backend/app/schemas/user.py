import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field


class UserRegister(BaseModel):
    email: EmailStr
    username: str = Field(min_length=3, max_length=50)
    password: str = Field(min_length=6, max_length=128)
    language_pref: str = Field(default="ru", pattern=r"^(ru|ky)$")
    target_ort_score: int = Field(default=180, ge=110, le=245)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class TokenRefresh(BaseModel):
    refresh_token: str


class UserUpdate(BaseModel):
    username: Optional[str] = Field(None, min_length=3, max_length=50)
    language_pref: Optional[str] = Field(None, pattern=r"^(ru|ky)$")
    target_ort_score: Optional[int] = Field(None, ge=110, le=245)
    current_level: Optional[str] = None


class UserResponse(BaseModel):
    id: uuid.UUID
    email: str
    username: str
    role: str
    target_ort_score: int
    current_level: str
    language_pref: str
    is_active: bool
    created_at: datetime
    model_config = {"from_attributes": True}
