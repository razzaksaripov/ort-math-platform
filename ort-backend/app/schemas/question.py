import uuid
from typing import Optional, List
from pydantic import BaseModel, Field

class TopicCreate(BaseModel):
    name: str = Field(max_length=50)
    category: str = Field(max_length=30)
    description_ky: Optional[str] = None
    description_ru: Optional[str] = None

class TopicResponse(BaseModel):
    id: int
    name: str
    category: str
    description_ky: Optional[str]
    description_ru: Optional[str]
    model_config = {"from_attributes": True}

class QuestionCreate(BaseModel):
    topic_id: int
    difficulty_level: int = Field(ge=1, le=5)
    content_latex: str = Field(min_length=1)
    image_url: Optional[str] = None
    correct_answer: str = Field(pattern=r"^[A-E]$")
    explanation: str = Field(min_length=1)
    is_verified: bool = False
    question_type: str = "standard"
    options: Optional[List[str]] = None

class QuestionUpdate(BaseModel):
    difficulty_level: Optional[int] = Field(None, ge=1, le=5)
    content_latex: Optional[str] = None
    image_url: Optional[str] = None
    correct_answer: Optional[str] = Field(None, pattern=r"^[A-E]$")
    explanation: Optional[str] = None
    is_verified: Optional[bool] = None
    question_type: Optional[str] = None
    options: Optional[List[str]] = None

class QuestionResponse(BaseModel):
    id: uuid.UUID
    topic_id: int
    difficulty_level: int
    content_latex: str
    image_url: Optional[str]
    correct_answer: str
    explanation: str
    is_verified: bool
    question_type: str
    options: Optional[List[str]]
    model_config = {"from_attributes": True}

class QuestionBrief(BaseModel):
    """Without answer — for test mode."""
    id: uuid.UUID
    topic_id: int
    difficulty_level: int
    content_latex: str
    image_url: Optional[str]
    question_type: str
    options: Optional[List[str]]
    model_config = {"from_attributes": True}