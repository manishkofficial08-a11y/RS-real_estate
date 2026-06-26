from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker
from app.config import settings


def get_async_database_url(database_url: str) -> str:
    """Return an asyncpg-compatible SQLAlchemy URL.

    Alembic uses the sync psycopg2 driver and expects Supabase SSL as
    `sslmode=require`. The application uses asyncpg, which expects `ssl=require`.
    Convert only the runtime async URL here so one DATABASE_URL can support both.
    """
    async_url = database_url.replace("postgresql://", "postgresql+asyncpg://", 1)
    async_url = async_url.replace("?sslmode=require", "?ssl=require")
    async_url = async_url.replace("&sslmode=require", "&ssl=require")
    return async_url


# Async engine
engine = create_async_engine(
    get_async_database_url(settings.DATABASE_URL),
    echo=settings.DEBUG,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20,
)

# Session factory
AsyncSessionLocal = sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

# Base class for all models
class Base(DeclarativeBase):
    pass
