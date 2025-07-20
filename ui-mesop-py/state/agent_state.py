"""
Estado robusto para gerenciamento de agentes A2A
Seguindo as melhores práticas do Mesop
"""

from dataclasses import dataclass, field
from typing import List, Any, Optional
import mesop as me


@dataclass
class AgentInfoState:
    """Informações estruturadas de um agente"""
    name: str
    description: str
    url: str
    port: int
    status: str = "unknown"
    is_online: bool = False
    enabled: bool = False
    capabilities: dict[str, Any] = field(default_factory=dict)
    version: str = "1.0.0"


@me.stateclass
class AgentState:
    """Estado principal para gerenciamento de agentes"""
    agents: List[AgentInfoState] = field(default_factory=list)
    error_message: str = ""
    is_loading: bool = False
    last_update: Optional[str] = None
    total_discovered: int = 0
    refresh_count: int = 0


@me.stateclass
class UIState:
    """Estado para configurações da UI"""
    show_details: bool = False
    auto_refresh: bool = False
    theme_mode: str = "light"
    selected_agent: Optional[str] = None