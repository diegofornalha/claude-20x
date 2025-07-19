import logging
from contextlib import asynccontextmanager
from typing import AsyncGenerator

try:
    from sqlalchemy import delete, select
    from sqlalchemy.ext.asyncio import (
        AsyncEngine,
        AsyncSession,
        async_sessionmaker,
    )
    from sqlalchemy.exc import OperationalError, DBAPIError
except ImportError as e:
    raise ImportError(
        'DatabaseTaskStore requires SQLAlchemy and a database driver. '
        'Install with one of: '
        "'pip install a2a-sdk[postgresql]', "
        "'pip install a2a-sdk[mysql]', "
        "'pip install a2a-sdk[sqlite]', "
        "or 'pip install a2a-sdk[sql]'"
    ) from e

from a2a.server.models import Base, TaskModel, create_task_model
from a2a.server.tasks.task_store import TaskStore
from a2a.types import Task

logger = logging.getLogger(__name__)


class DatabaseTaskStore(TaskStore):
    """SQLAlchemy-based implementation of TaskStore with proper error handling."""

    engine: AsyncEngine
    async_session_maker: async_sessionmaker[AsyncSession]
    create_table: bool
    _initialized: bool
    task_model: type[TaskModel]

    def __init__(
        self,
        engine: AsyncEngine,
        create_table: bool = True,
        table_name: str = 'tasks',
    ) -> None:
        """Initializes the DatabaseTaskStore with enhanced error handling."""
        logger.debug(
            f'Initializing DatabaseTaskStore with existing engine, table: {table_name}'
        )
        self.engine = engine
        # Configure session maker with proper settings
        self.async_session_maker = async_sessionmaker(
            self.engine,
            expire_on_commit=False,
            class_=AsyncSession,
            autoflush=False,  # Prevent auto-flush issues
            autocommit=False  # Explicit transaction control
        )
        self.create_table = create_table
        self._initialized = False

        self.task_model = (
            TaskModel
            if table_name == 'tasks'
            else create_task_model(table_name)
        )

    @asynccontextmanager
    async def _get_session(self) -> AsyncGenerator[AsyncSession, None]:
        """Context manager for safe session handling with automatic rollback."""
        async with self.async_session_maker() as session:
            try:
                yield session
                await session.commit()
            except Exception as e:
                await session.rollback()
                logger.error(f"Database operation failed: {e}")
                raise
            finally:
                await session.close()

    async def initialize(self) -> None:
        """Initialize the database and create the table if needed."""
        if self._initialized:
            return

        logger.debug('Initializing database schema...')
        if self.create_table:
            max_retries = 3
            for attempt in range(max_retries):
                try:
                    async with self.engine.begin() as conn:
                        # This will create the 'tasks' table based on TaskModel's definition
                        await conn.run_sync(Base.metadata.create_all)
                    break
                except (OperationalError, DBAPIError) as e:
                    if attempt == max_retries - 1:
                        raise
                    logger.warning(f"Database connection failed (attempt {attempt + 1}): {e}")
                    import asyncio
                    await asyncio.sleep(2 ** attempt)  # Exponential backoff
                    
        self._initialized = True
        logger.debug('Database schema initialized.')

    async def _ensure_initialized(self) -> None:
        """Ensure the database connection is initialized."""
        if not self._initialized:
            await self.initialize()

    def _to_orm(self, task: Task) -> TaskModel:
        """Maps a Pydantic Task to a SQLAlchemy TaskModel instance."""
        return self.task_model(
            id=task.id,
            contextId=task.contextId,
            kind=task.kind,
            status=task.status,
            artifacts=task.artifacts,
            history=task.history,
            task_metadata=task.metadata,
        )

    def _from_orm(self, task_model: TaskModel) -> Task:
        """Maps a SQLAlchemy TaskModel to a Pydantic Task instance."""
        task_data_from_db = {
            'id': task_model.id,
            'contextId': task_model.contextId,
            'kind': task_model.kind,
            'status': task_model.status,
            'artifacts': task_model.artifacts,
            'history': task_model.history,
            'metadata': task_model.task_metadata,
        }
        return Task.model_validate(task_data_from_db)

    async def save(self, task: Task) -> None:
        """Saves or updates a task in the database with proper error handling."""
        await self._ensure_initialized()
        db_task = self._to_orm(task)
        
        async with self._get_session() as session:
            await session.merge(db_task)
            logger.debug(f'Task {task.id} saved/updated successfully.')

    async def get(self, task_id: str) -> Task | None:
        """Retrieves a task from the database by ID with proper error handling."""
        await self._ensure_initialized()
        
        async with self._get_session() as session:
            stmt = select(self.task_model).where(self.task_model.id == task_id)
            result = await session.execute(stmt)
            task_model = result.scalar_one_or_none()
            
            if task_model:
                task = self._from_orm(task_model)
                logger.debug(f'Task {task_id} retrieved successfully.')
                return task

            logger.debug(f'Task {task_id} not found in store.')
            return None

    async def delete(self, task_id: str) -> None:
        """Deletes a task from the database by ID with proper error handling."""
        await self._ensure_initialized()

        async with self._get_session() as session:
            stmt = delete(self.task_model).where(self.task_model.id == task_id)
            result = await session.execute(stmt)

            if result.rowcount > 0:
                logger.info(f'Task {task_id} deleted successfully.')
            else:
                logger.warning(
                    f'Attempted to delete nonexistent task with id: {task_id}'
                )


# Helper function to create engine with proper configuration
def create_robust_engine(database_url: str) -> AsyncEngine:
    """Create an AsyncEngine with robust configuration."""
    from sqlalchemy.ext.asyncio import create_async_engine
    
    return create_async_engine(
        database_url,
        echo=False,  # Set to True for SQL debugging
        pool_pre_ping=True,  # Verify connections before use
        pool_recycle=3600,  # Recycle connections after 1 hour
        pool_size=5,
        max_overflow=10,
        connect_args={
            "server_settings": {"jit": "off"},
            "command_timeout": 60,
            "options": "-c statement_timeout=60000"  # 60 second timeout
        } if "postgresql" in database_url else {}
    )