from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import AlreadyExistsException, NotFoundException
from app.db.redis import redis_client
from app.models import Topic
from app.schemas.question import TopicCreate, TopicResponse

CACHE_KEY = "topics:all"


class TopicService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_all(self) -> list[TopicResponse]:
        cached = await redis_client.get(CACHE_KEY)
        if cached:
            return [TopicResponse(**t) for t in cached]

        result = await self.db.execute(select(Topic).order_by(Topic.id))
        topics = result.scalars().all()
        data = [TopicResponse.model_validate(t).model_dump() for t in topics]
        await redis_client.set(CACHE_KEY, data)
        return [TopicResponse(**t) for t in data]

    async def get_by_id(self, topic_id: int) -> Topic:
        result = await self.db.execute(select(Topic).where(Topic.id == topic_id))
        topic = result.scalar_one_or_none()
        if not topic:
            raise NotFoundException("Topic")
        return topic

    async def create(self, data: TopicCreate) -> Topic:
        exists = await self.db.execute(select(Topic).where(Topic.name == data.name))
        if exists.scalar_one_or_none():
            raise AlreadyExistsException("Topic")
        topic = Topic(**data.model_dump())
        self.db.add(topic)
        await self.db.flush()
        await redis_client.delete(CACHE_KEY)
        return topic
