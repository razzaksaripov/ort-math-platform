from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import get_current_admin, get_current_user
from app.db.session import get_db
from app.models import User
from app.schemas.question import TopicCreate, TopicResponse
from app.services.topic_service import TopicService

router = APIRouter(prefix="/topics", tags=["Topics"])


@router.get("/", response_model=list[TopicResponse])
async def list_topics(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """All topics (Redis-cached)."""
    return await TopicService(db).get_all()


@router.get("/{topic_id}", response_model=TopicResponse)
async def get_topic(
    topic_id: int,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    topic = await TopicService(db).get_by_id(topic_id)
    return TopicResponse.model_validate(topic)


@router.post("/", response_model=TopicResponse, status_code=201)
async def create_topic(
    data: TopicCreate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    """Create topic (admin only)."""
    topic = await TopicService(db).create(data)
    return TopicResponse.model_validate(topic)
