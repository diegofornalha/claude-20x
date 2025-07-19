import asyncio
import logging

from a2a.server.tasks.task_store import TaskStore
from a2a.types import Task


logger = logging.getLogger(__name__)


class ReadWriteLock:
    """Simple read-write lock implementation for asyncio."""
    
    def __init__(self):
        self._read_ready = asyncio.Condition(asyncio.Lock())
        self._readers = 0
    
    async def acquire_read(self):
        async with self._read_ready:
            self._readers += 1
    
    async def release_read(self):
        async with self._read_ready:
            self._readers -= 1
            if self._readers == 0:
                self._read_ready.notify_all()
    
    async def acquire_write(self):
        await self._read_ready.acquire()
        await self._read_ready.wait_for(lambda: self._readers == 0)
    
    async def release_write(self):
        self._read_ready.release()


class InMemoryTaskStore(TaskStore):
    """In-memory implementation of TaskStore with optimized read-write locking.

    Stores task objects in a dictionary in memory. Task data is lost when the
    server process stops. Uses read-write locks to allow concurrent reads.
    """

    def __init__(self) -> None:
        """Initializes the InMemoryTaskStore."""
        logger.debug('Initializing InMemoryTaskStore with read-write locks')
        self.tasks: dict[str, Task] = {}
        self.lock = ReadWriteLock()

    async def save(self, task: Task) -> None:
        """Saves or updates a task in the in-memory store."""
        await self.lock.acquire_write()
        try:
            self.tasks[task.id] = task
            logger.debug('Task %s saved successfully.', task.id)
        finally:
            await self.lock.release_write()

    async def get(self, task_id: str) -> Task | None:
        """Retrieves a task from the in-memory store by ID."""
        await self.lock.acquire_read()
        try:
            logger.debug('Attempting to get task with id: %s', task_id)
            task = self.tasks.get(task_id)
            if task:
                logger.debug('Task %s retrieved successfully.', task_id)
            else:
                logger.debug('Task %s not found in store.', task_id)
            return task
        finally:
            await self.lock.release_read()

    async def delete(self, task_id: str) -> None:
        """Deletes a task from the in-memory store by ID."""
        await self.lock.acquire_write()
        try:
            logger.debug('Attempting to delete task with id: %s', task_id)
            if task_id in self.tasks:
                del self.tasks[task_id]
                logger.debug('Task %s deleted successfully.', task_id)
            else:
                logger.warning(
                    'Attempted to delete nonexistent task with id: %s', task_id
                )
        finally:
            await self.lock.release_write()
