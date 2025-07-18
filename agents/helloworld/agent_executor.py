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
    new_task,
    new_text_artifact,
)
from agent import GuardianAgent

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class GuardianAgentExecutor(AgentExecutor):
    """
    Guardian Agent executor with sustainability monitoring and control.
    """

    def __init__(self):
        self.agent = GuardianAgent()

    async def execute(self, context: RequestContext, event_queue: EventQueue) -> None:
        """Execute a Guardian sustainability monitoring task."""
        query = context.get_user_input()
        task = context.current_task
        
        # 1. Criar tarefa se não existir
        if not task:
            task = new_task(context.message)
            await event_queue.enqueue_event(task)
            logger.info(f"Created new Guardian task: {task.id}")

        # 2. Marcar tarefa como em andamento
        await event_queue.enqueue_event(
            TaskStatusUpdateEvent(
                status=TaskStatus(
                    state=TaskState.working,
                    message=new_agent_text_message(
                        "🛡️ Guardian analisando sustentabilidade...",
                        task.contextId,
                        task.id,
                    ),
                ),
                final=False,
                contextId=task.contextId,
                taskId=task.id,
            )
        )
        logger.info(f"Guardian task {task.id} marked as working")

        try:
            # 3. Executar análise de sustentabilidade
            result = await self.agent.process_sustainability_request(query, task.contextId)
            
            is_task_complete = result.get("is_task_complete", True)
            success = result.get("success", True)
            result_text = result.get("result", "Guardian Status: OK")
            
            # 4. Criar artefato com resultado
            if success:
                artifact = new_text_artifact(
                    name="sustainability_report",
                    description="Guardian sustainability analysis report",
                    text=result_text,
                )
            else:
                artifact = new_text_artifact(
                    name="guardian_error",
                    description="Guardian error response",
                    text=result_text,
                )

            # 5. Enviar artefato
            await event_queue.enqueue_event(
                TaskArtifactUpdateEvent(
                    append=False,
                    contextId=task.contextId,
                    taskId=task.id,
                    lastChunk=True,
                    artifact=artifact,
                )
            )
            logger.info(f"Guardian artifact sent for task {task.id}")

            # 6. Marcar tarefa como completa ✅
            if is_task_complete:
                await event_queue.enqueue_event(
                    TaskStatusUpdateEvent(
                        status=TaskStatus(
                            state=TaskState.completed,
                            message=new_agent_text_message(
                                "🛡️ Guardian analysis completed",
                                task.contextId,
                                task.id,
                            ),
                        ),
                        final=True,
                        contextId=task.contextId,
                        taskId=task.id,
                    )
                )
                logger.info(f"Guardian task {task.id} marked as COMPLETED ✅")
            else:
                # Marcar como necessitando input do usuário
                await event_queue.enqueue_event(
                    TaskStatusUpdateEvent(
                        status=TaskStatus(
                            state=TaskState.input_required,
                            message=new_agent_text_message(
                                "🛡️ Guardian waiting for input",
                                task.contextId,
                                task.id,
                            ),
                        ),
                        final=False,
                        contextId=task.contextId,
                        taskId=task.id,
                    )
                )
                logger.info(f"Guardian task {task.id} requires user input")

        except Exception as e:
            logger.exception(f"Error in Guardian task {task.id}")
            
            # Marcar tarefa como falhou
            await event_queue.enqueue_event(
                TaskStatusUpdateEvent(
                    status=TaskStatus(
                        state=TaskState.failed,
                        message=new_agent_text_message(
                            f"🛡️ Guardian Error: {str(e)}",
                            task.contextId,
                            task.id,
                        ),
                    ),
                    final=True,
                    contextId=task.contextId,
                    taskId=task.id,
                )
            )
            logger.error(f"Guardian task {task.id} marked as FAILED")

    async def cancel(self, context: RequestContext, event_queue: EventQueue) -> None:
        """Cancel a running Guardian task."""
        task = context.current_task
        if task:
            await event_queue.enqueue_event(
                TaskStatusUpdateEvent(
                    status=TaskStatus(
                        state=TaskState.cancelled,
                        message=new_agent_text_message(
                            "🛡️ Guardian task cancelled",
                            task.contextId,
                            task.id,
                        ),
                    ),
                    final=True,
                    contextId=task.contextId,
                    taskId=task.id,
                )
            )
            logger.info(f"Guardian task {task.id} cancelled")
        else:
            logger.warning("No Guardian task to cancel")

    # Skill principal do Guardian
    async def sustainability_monitor(self, context: RequestContext, event_queue: EventQueue) -> None:
        """Execute sustainability monitoring and analysis."""
        await self.execute(context, event_queue)