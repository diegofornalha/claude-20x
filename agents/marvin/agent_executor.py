import logging

from a2a.server.agent_execution import AgentExecutor, RequestContext
from a2a.server.events.event_queue import EventQueue
from a2a.types import (
    TaskArtifactUpdateEvent,
    TaskState,
    TaskStatus,
    TaskStatusUpdateEvent,
)
from a2a.utils import (
    new_agent_text_message,
    new_data_artifact,
    new_task,
    new_text_artifact,
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class ExtractorAgentExecutor(AgentExecutor):
    """
    A ExtractorAgent agent executor.
    """

    def __init__(self, agent):
        self.agent = agent

    async def execute(
        self,
        context: RequestContext,
        event_queue: EventQueue,
    ) -> None:
        query = context.get_user_input()
        task = context.current_task
        if not task:
            task = new_task(context.message)
            await event_queue.enqueue_event(task)

        async for item in self.agent.stream(query, task.contextId):
            is_task_complete = item["is_task_complete"]
            require_user_input = item["require_user_input"]
            content = item["content"]

            logger.info(
                f"Stream item received: complete={is_task_complete}, require_input={require_user_input}, content_len={len(str(content))}"
            )

            agent_outcome = await self.agent.invoke(query, task.contextId)
            is_task_complete = agent_outcome["is_task_complete"]
            require_user_input = not is_task_complete
            text_parts = agent_outcome.get("text_parts", [])
            data = agent_outcome.get("data", {})
            
            # Converter text_parts para string
            text_content = ""
            if text_parts:
                if isinstance(text_parts, list):
                    text_content = "\n".join([part.text if hasattr(part, 'text') else str(part) for part in text_parts])
                else:
                    text_content = str(text_parts)
            
            artifact = new_text_artifact(
                name="current_result",
                description="Result of request to agent.",
                text=text_content,
            )
            if data:
                artifact = new_data_artifact(
                    name="current_result",
                    description="Result of request to agent.",
                    data=data,
                )

            if require_user_input:
                await event_queue.enqueue_event(
                    TaskStatusUpdateEvent(
                        status=TaskStatus(
                            state=TaskState.input_required,
                            message=new_agent_text_message(
                                text_content,
                                task.contextId,
                                task.id,
                            ),
                        ),
                        final=True,
                        contextId=task.contextId,
                        taskId=task.id,
                    )
                )
            elif is_task_complete:
                await event_queue.enqueue_event(
                    TaskArtifactUpdateEvent(
                        append=False,
                        contextId=task.contextId,
                        taskId=task.id,
                        lastChunk=True,
                        artifact=artifact,
                    )
                )
                await event_queue.enqueue_event(
                    TaskStatusUpdateEvent(
                        status=TaskStatus(state=TaskState.completed),
                        final=True,
                        contextId=task.contextId,
                        taskId=task.id,
                    )
                )
            else:
                await event_queue.enqueue_event(
                    TaskStatusUpdateEvent(
                        status=TaskStatus(
                            state=TaskState.working,
                            message=new_agent_text_message(
                                "Analyzing your text...",
                                task.contextId,
                                task.id,
                            ),
                        ),
                        final=False,
                        contextId=task.contextId,
                        taskId=task.id,
                    )
                )

    async def cancel(self, context: RequestContext, event_queue: EventQueue) -> None:
        raise Exception("cancel not supported")