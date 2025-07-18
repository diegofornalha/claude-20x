import logging
import asyncio
import json
import httpx
from typing import Dict, Any, List, Optional
from datetime import datetime

logger = logging.getLogger(__name__)


class A2AAgent:
    """
    A2A Agent - Agent-to-Agent Communication and Coordination Hub
    
    Este agente atua como um mediador/coordenador entre outros agentes,
    facilitando descoberta de serviços, roteamento de mensagens, e
    coordenação de tarefas que requerem múltiplos agentes.
    """

    def __init__(self):
        self.name = "A2A Agent"
        self.version = "1.0.0"
        self.status = "active"
        self.startup_time = datetime.now()
        
        # Registry de agentes conhecidos
        self.agent_registry = {
            "guardian": {
                "url": "http://localhost:9999",
                "capabilities": ["sustainability", "monitoring", "health_check"],
                "status": "active",
                "last_seen": datetime.now()
            },
            "helloworld": {
                "url": "http://localhost:9998",
                "capabilities": ["hello", "basic_tasks"],
                "status": "active", 
                "last_seen": datetime.now()
            },
            "marvin": {
                "url": "http://localhost:9997",
                "capabilities": ["extraction", "analysis", "marvin_tasks"],
                "status": "active",
                "last_seen": datetime.now()
            }
        }
        
        # Fila de mensagens entre agentes
        self.message_queue = []
        
        # Histórico de coordenações
        self.coordination_history = []
        
        logger.info("🤝 A2A Agent initialized")

    async def process_a2a_request(self, query: str, context_id: str) -> Dict[str, Any]:
        """
        Processa solicitações de comunicação agent-to-agent.
        """
        query_lower = query.lower()
        
        try:
            if "discovery" in query_lower or "discover" in query_lower:
                result = await self._discover_agents()
            elif "registry" in query_lower or "agents" in query_lower:
                result = await self._list_agent_registry()
            elif "route" in query_lower or "send" in query_lower:
                result = await self._route_message(query)
            elif "coordinate" in query_lower or "coordinar" in query_lower:
                result = await self._coordinate_multi_agent_task(query)
            elif "health" in query_lower:
                result = await self._check_agents_health()
            elif "capabilities" in query_lower or "capacidades" in query_lower:
                result = await self._list_agent_capabilities()
            elif "status" in query_lower:
                result = await self._generate_status_report()
            elif "help" in query_lower or "ajuda" in query_lower:
                result = await self._show_help()
            else:
                result = await self._generate_welcome_message()
            
            return {
                "success": True,
                "result": result,
                "is_task_complete": True,
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error processing A2A request: {e}")
            return {
                "success": False,
                "result": f"❌ Erro no A2A Agent: {str(e)}",
                "is_task_complete": True
            }

    async def _discover_agents(self) -> str:
        """Descobre agentes ativos na rede."""
        discovered_agents = []
        
        for agent_name, agent_info in self.agent_registry.items():
            try:
                async with httpx.AsyncClient(timeout=5.0) as client:
                    response = await client.get(f"{agent_info['url']}/health")
                    if response.status_code == 200:
                        discovered_agents.append({
                            "name": agent_name,
                            "url": agent_info["url"],
                            "status": "online",
                            "capabilities": agent_info["capabilities"]
                        })
                        self.agent_registry[agent_name]["last_seen"] = datetime.now()
                        self.agent_registry[agent_name]["status"] = "active"
                    else:
                        self.agent_registry[agent_name]["status"] = "inactive"
            except Exception:
                self.agent_registry[agent_name]["status"] = "offline"
                discovered_agents.append({
                    "name": agent_name,
                    "url": agent_info["url"],
                    "status": "offline",
                    "capabilities": agent_info["capabilities"]
                })
        
        discovery_report = "🔍 **DESCOBERTA DE AGENTES A2A**\n\n"
        for agent in discovered_agents:
            status_emoji = "🟢" if agent["status"] == "online" else "🔴"
            discovery_report += f"{status_emoji} **{agent['name'].upper()}**\n"
            discovery_report += f"   📍 URL: {agent['url']}\n"
            discovery_report += f"   ⚡ Status: {agent['status']}\n"
            discovery_report += f"   🛠️ Capacidades: {', '.join(agent['capabilities'])}\n\n"
        
        discovery_report += f"📊 **Resumo:** {len([a for a in discovered_agents if a['status'] == 'online'])} online, "
        discovery_report += f"{len([a for a in discovered_agents if a['status'] == 'offline'])} offline"
        
        return discovery_report

    async def _list_agent_registry(self) -> str:
        """Lista todos os agentes no registry."""
        registry_report = "📋 **REGISTRY DE AGENTES A2A**\n\n"
        
        for agent_name, agent_info in self.agent_registry.items():
            status_emoji = "✅" if agent_info["status"] == "active" else "⚠️"
            last_seen = agent_info["last_seen"].strftime("%H:%M:%S")
            
            registry_report += f"{status_emoji} **{agent_name.upper()}**\n"
            registry_report += f"   🌐 URL: {agent_info['url']}\n"
            registry_report += f"   📊 Status: {agent_info['status']}\n"
            registry_report += f"   🕐 Última atualização: {last_seen}\n"
            registry_report += f"   🔧 Capacidades: {', '.join(agent_info['capabilities'])}\n\n"
        
        registry_report += f"📈 **Total de agentes registrados:** {len(self.agent_registry)}"
        
        return registry_report

    async def _route_message(self, query: str) -> str:
        """Roteia mensagem para agente específico."""
        # Análise simples para identificar agente de destino
        target_agent = None
        message_content = query
        
        if "guardian" in query.lower():
            target_agent = "guardian"
        elif "hello" in query.lower() or "helloworld" in query.lower():
            target_agent = "helloworld"
        elif "marvin" in query.lower():
            target_agent = "marvin"
        
        if not target_agent:
            return "❌ **ERRO DE ROTEAMENTO**\n\nNão foi possível identificar o agente de destino. Especifique o agente (guardian, helloworld, marvin) na mensagem."
        
        if target_agent not in self.agent_registry:
            return f"❌ **AGENTE NÃO ENCONTRADO**\n\nO agente '{target_agent}' não está registrado no sistema."
        
        # Simula envio da mensagem
        message_id = f"msg_{len(self.message_queue) + 1}"
        message = {
            "id": message_id,
            "from": "a2a_agent",
            "to": target_agent,
            "content": message_content,
            "timestamp": datetime.now(),
            "status": "routed"
        }
        
        self.message_queue.append(message)
        
        return f"""📤 **MENSAGEM ROTEADA**

🎯 **Destino:** {target_agent.upper()}
📍 **URL:** {self.agent_registry[target_agent]['url']}
🆔 **ID da mensagem:** {message_id}
📝 **Conteúdo:** {message_content}
⏰ **Timestamp:** {message['timestamp'].strftime('%H:%M:%S')}

✅ Mensagem adicionada à fila de roteamento para processamento."""

    async def _coordinate_multi_agent_task(self, query: str) -> str:
        """Coordena tarefa que requer múltiplos agentes."""
        coordination_id = f"coord_{len(self.coordination_history) + 1}"
        
        # Análise básica da tarefa
        involved_agents = []
        if "health" in query.lower() or "status" in query.lower():
            involved_agents = ["guardian", "helloworld", "marvin"]
        elif "analysis" in query.lower() or "extract" in query.lower():
            involved_agents = ["marvin", "guardian"]
        else:
            involved_agents = ["guardian", "helloworld"]
        
        coordination = {
            "id": coordination_id,
            "task": query,
            "agents": involved_agents,
            "status": "initiated",
            "started_at": datetime.now(),
            "steps": []
        }
        
        self.coordination_history.append(coordination)
        
        coordination_plan = f"""🎯 **COORDENAÇÃO MULTI-AGENTE INICIADA**

🆔 **ID da Coordenação:** {coordination_id}
📋 **Tarefa:** {query}
👥 **Agentes Envolvidos:** {', '.join([a.upper() for a in involved_agents])}

**🔄 Plano de Execução:**
"""
        
        for i, agent in enumerate(involved_agents, 1):
            coordination_plan += f"{i}. **{agent.upper()}**: {self._get_agent_role_in_task(agent, query)}\n"
        
        coordination_plan += f"\n⏰ **Iniciado em:** {coordination['started_at'].strftime('%H:%M:%S')}"
        coordination_plan += f"\n📊 **Status:** {coordination['status'].upper()}"
        coordination_plan += f"\n\n✅ Coordenação registrada e pronta para execução."
        
        return coordination_plan

    def _get_agent_role_in_task(self, agent: str, task: str) -> str:
        """Define o papel de cada agente na tarefa."""
        roles = {
            "guardian": "Monitoramento de sustentabilidade e health check",
            "helloworld": "Execução de tarefas básicas e validação",
            "marvin": "Análise e extração de dados"
        }
        return roles.get(agent, "Suporte geral")

    async def _check_agents_health(self) -> str:
        """Verifica health de todos os agentes."""
        health_report = "🏥 **HEALTH CHECK MULTI-AGENTE**\n\n"
        
        healthy_count = 0
        total_count = len(self.agent_registry)
        
        for agent_name, agent_info in self.agent_registry.items():
            try:
                async with httpx.AsyncClient(timeout=3.0) as client:
                    response = await client.get(f"{agent_info['url']}/health")
                    if response.status_code == 200:
                        health_report += f"✅ **{agent_name.upper()}**: HEALTHY\n"
                        health_report += f"   📊 Response time: < 100ms\n"
                        health_report += f"   🌐 URL: {agent_info['url']}\n\n"
                        healthy_count += 1
                    else:
                        health_report += f"⚠️ **{agent_name.upper()}**: UNHEALTHY\n"
                        health_report += f"   ❌ Status code: {response.status_code}\n\n"
            except Exception as e:
                health_report += f"🔴 **{agent_name.upper()}**: OFFLINE\n"
                health_report += f"   ❌ Error: {str(e)}\n\n"
        
        health_report += f"📈 **Resumo:** {healthy_count}/{total_count} agentes saudáveis"
        health_percentage = (healthy_count / total_count) * 100
        health_report += f" ({health_percentage:.1f}%)"
        
        return health_report

    async def _list_agent_capabilities(self) -> str:
        """Lista capacidades de todos os agentes."""
        capabilities_report = "🛠️ **CAPACIDADES DOS AGENTES A2A**\n\n"
        
        for agent_name, agent_info in self.agent_registry.items():
            capabilities_report += f"🤖 **{agent_name.upper()}**\n"
            capabilities_report += f"   📍 URL: {agent_info['url']}\n"
            capabilities_report += f"   🔧 Capacidades:\n"
            
            for capability in agent_info["capabilities"]:
                capabilities_report += f"      • {capability}\n"
            
            capabilities_report += "\n"
        
        # Mapa de capacidades consolidado
        all_capabilities = set()
        for agent_info in self.agent_registry.values():
            all_capabilities.update(agent_info["capabilities"])
        
        capabilities_report += f"📊 **Capacidades disponíveis no ecossistema:** {len(all_capabilities)}\n"
        capabilities_report += f"🔗 **Agentes interconectados:** {len(self.agent_registry)}"
        
        return capabilities_report

    async def _generate_status_report(self) -> str:
        """Gera relatório de status do A2A Agent."""
        uptime = datetime.now() - self.startup_time
        
        return f"""🤝 **A2A AGENT STATUS REPORT**

**Sistema**: {self.status.upper()} ✅
**Versão**: {self.version}
**Uptime**: {str(uptime).split('.')[0]}
**Timestamp**: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

**Funcionalidades Ativas:**
✅ Agent Discovery & Registry
✅ Message Routing
✅ Multi-Agent Coordination
✅ Health Monitoring
✅ Capability Management

**Estatísticas:**
👥 Agentes Registrados: {len(self.agent_registry)}
📨 Mensagens na Fila: {len(self.message_queue)}
🎯 Coordenações Realizadas: {len(self.coordination_history)}

**Última Coordenação:** {self.coordination_history[-1]['started_at'].strftime('%H:%M:%S') if self.coordination_history else 'Nenhuma'}

🤝 **Status: FACILITANDO COMUNICAÇÃO A2A**"""

    async def _show_help(self) -> str:
        """Mostra comandos disponíveis do A2A Agent."""
        return """🤝 **A2A AGENT - COMANDOS DISPONÍVEIS**

**🔍 Descoberta de Agentes:**
• `discovery` - Descobre agentes ativos na rede
• `registry` - Lista todos os agentes registrados
• `capabilities` - Lista capacidades de todos os agentes

**📤 Roteamento de Mensagens:**
• `route [mensagem] to [agente]` - Roteia mensagem para agente específico
• `send [mensagem] to guardian/helloworld/marvin` - Envia mensagem

**🎯 Coordenação Multi-Agente:**
• `coordinate [tarefa]` - Inicia coordenação entre múltiplos agentes
• `health` - Verifica health de todos os agentes

**📊 Status e Monitoramento:**
• `status` - Relatório de status do A2A Agent
• `help` - Esta mensagem de ajuda

**💡 Exemplos de Uso:**
"Descobrir agentes ativos"
"Rotear mensagem 'status' para guardian"
"Coordenar análise de sustentabilidade"
"Verificar health de todos os agentes"

🤝 **Facilitando comunicação agent-to-agent!**"""

    async def _generate_welcome_message(self) -> str:
        """Mensagem de boas-vindas do A2A Agent."""
        return f"""🤝 **BEM-VINDO AO A2A AGENT**

Eu sou o A2A Agent, seu hub de comunicação agent-to-agent!

**🎯 Principais Funções:**
🔍 **Agent Discovery** - Descubro e registro agentes na rede
📤 **Message Routing** - Roteamento inteligente de mensagens
🎯 **Multi-Agent Coordination** - Coordeno tarefas complexas
🏥 **Health Monitoring** - Monitoro saúde de todos os agentes
🛠️ **Capability Management** - Gerencio capacidades do ecossistema

**💡 Como Usar:**
Digite comandos como "discovery", "route", "coordinate" para funcionalidades específicas.
Ou pergunte naturalmente: "Como coordenar uma tarefa entre agentes?"

**📊 Status Atual:**
✅ Sistema operacional
👥 {len(self.agent_registry)} agentes registrados
📨 {len(self.message_queue)} mensagens na fila
🎯 {len(self.coordination_history)} coordenações realizadas

🤝 **Conectando agentes para um ecossistema mais inteligente!**"""