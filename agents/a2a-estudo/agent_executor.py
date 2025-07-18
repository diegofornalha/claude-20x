import logging
from typing import Dict, Any
from a2a.server.agent_execution.context import RequestContext
from a2a.server.events.event_queue import EventQueue
from a2a.server.agent_execution.agent_executor import AgentExecutor
from a2a.utils.task import create_task_from_result
from a2a.utils.message import create_text_message_from_dict

from .agent import A2AAgent

logger = logging.getLogger(__name__)


class A2AAgentExecutor(AgentExecutor):
    """
    Executor para o A2A Agent - Agent-to-Agent Communication Hub
    
    Implementa a interface AgentExecutor para integração com o sistema a2a-python.
    """

    def __init__(self):
        self.agent = A2AAgent()
        logger.info("🤝 A2A Agent Executor initialized")

    async def execute(self, context: RequestContext, event_queue: EventQueue) -> None:
        """
        Executa o processamento do A2A Agent para uma requisição.
        
        Args:
            context: Contexto da requisição contendo mensagem, task ID, etc.
            event_queue: Fila para publicar eventos de resposta.
        """
        try:
            # Extrai a mensagem do contexto
            message_content = ""
            if context.message and hasattr(context.message, 'parts'):
                for part in context.message.parts:
                    if hasattr(part, 'text'):
                        message_content += part.text + " "
            
            message_content = message_content.strip()
            logger.info(f"A2A Agent processing: {message_content}")
            
            # Processa a requisição através do agente
            result = await self.agent.process_a2a_request(
                query=message_content,
                context_id=context.task_id
            )
            
            # Cria resposta baseada no resultado
            if result.get("success", False):
                # Cria mensagem de texto com o resultado
                response_message = create_text_message_from_dict({
                    "content": result["result"],
                    "timestamp": result.get("timestamp"),
                    "agent": "a2a_agent"
                })
                
                # Publica a mensagem na fila de eventos
                await event_queue.put(response_message)
                
                # Se a tarefa está completa, cria e publica o task de conclusão
                if result.get("is_task_complete", True):
                    task = create_task_from_result(
                        task_id=context.task_id,
                        result=result["result"],
                        status="completed"
                    )
                    await event_queue.put(task)
                    logger.info(f"A2A Agent task {context.task_id} completed successfully")
            else:
                # Em caso de erro, cria mensagem de erro
                error_message = create_text_message_from_dict({
                    "content": result.get("result", "Erro interno do A2A Agent"),
                    "error": True
                })
                
                await event_queue.put(error_message)
                
                # Marca a tarefa como falhada
                task = create_task_from_result(
                    task_id=context.task_id,
                    result=result.get("result", "Erro interno"),
                    status="failed"
                )
                await event_queue.put(task)
                logger.error(f"A2A Agent task {context.task_id} failed")
                
        except Exception as e:
            logger.exception(f"Error in A2A Agent executor: {e}")
            
            # Em caso de exceção, cria mensagem de erro
            error_message = create_text_message_from_dict({
                "content": f"❌ Erro interno do A2A Agent: {str(e)}",
                "error": True
            })
            
            await event_queue.put(error_message)
            
            # Marca a tarefa como falhada
            task = create_task_from_result(
                task_id=context.task_id,
                result=f"Erro de execução: {str(e)}",
                status="failed"
            )
            await event_queue.put(task)

    async def cancel(self, context: RequestContext, event_queue: EventQueue) -> None:
        """
        Cancela uma tarefa em execução do A2A Agent.
        
        Args:
            context: Contexto da requisição contendo o task ID para cancelar.
            event_queue: Fila para publicar o status de cancelamento.
        """
        try:
            logger.info(f"Cancelling A2A Agent task: {context.task_id}")
            
            # Como o A2A Agent não mantém tarefas de longa duração,
            # simplesmente marca a tarefa como cancelada
            task = create_task_from_result(
                task_id=context.task_id,
                result="Tarefa cancelada pelo usuário",
                status="canceled"
            )
            
            await event_queue.put(task)
            logger.info(f"A2A Agent task {context.task_id} cancelled")
            
        except Exception as e:
            logger.exception(f"Error cancelling A2A Agent task: {e}")
            
            # Em caso de erro no cancelamento
            task = create_task_from_result(
                task_id=context.task_id,
                result=f"Erro ao cancelar: {str(e)}",
                status="failed"
            )
            await event_queue.put(task)