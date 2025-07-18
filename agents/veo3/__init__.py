"""
Veo3 Agent - Google Veo 3 Video Generation Agent

A specialized agent for generating high-quality videos using Google's Veo 3 model.
Supports long-running operations, video monitoring, and result retrieval.
"""

from .agent import Veo3Agent
from .agent_executor import Veo3AgentExecutor

__version__ = "1.0.0"
__author__ = "Claude Code - SPARC Development"

__all__ = ["Veo3Agent", "Veo3AgentExecutor"]