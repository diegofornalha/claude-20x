"""
A2A Agent - Agent-to-Agent Communication and Coordination Hub

Este módulo implementa um agente especializado em facilitar a comunicação
e coordenação entre diferentes agentes no ecossistema A2A.

Principais funcionalidades:
- Descoberta automática de agentes
- Roteamento inteligente de mensagens
- Coordenação de tarefas multi-agente
- Monitoramento de saúde dos agentes
- Gestão de capacidades do ecossistema

Author: Diego
Version: 1.0.0
"""

from .agent import A2AAgent
from .agent_executor import A2AAgentExecutor

__version__ = "1.0.0"
__all__ = ["A2AAgent", "A2AAgentExecutor"]