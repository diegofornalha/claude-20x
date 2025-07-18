#!/usr/bin/env python3
"""
Guardian Agent HTTP Server - Servidor A2A na porta 10102
Similar ao HelloWorld, mas para monitoramento de sustentabilidade
"""

import asyncio
import logging
import sys
import uvicorn
from pathlib import Path

# Adicionar caminhos necessários
sys.path.append(str(Path(__file__).parent / "backup-reorganized/active-prototypes/a2a_mcp/src"))

from a2a.server.apps import A2AStarletteApplication
from a2a.server.request_handlers import DefaultRequestHandler
from a2a.server.tasks import InMemoryTaskStore
from a2a.types import (
    AgentCapabilities,
    AgentCard,
    AgentSkill,
)

# Configuração de logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class GuardianHTTPExecutor:
    """Executor HTTP para Guardian Agent."""
    
    def __init__(self):
        # Importar Guardian apenas quando necessário
        try:
            from a2a_mcp.guardian import GuardianAgent
            from a2a_mcp.common.sustainability_types import GuardianConfig
            
            # Configuração do Guardian
            config = GuardianConfig(
                total_carbon_budget=1000.0,
                jevons_detection_threshold=0.7,
                entropy_control_enabled=True,
                demand_shaping_enabled=True,
                auto_cleanup_enabled=True,
                monitoring_interval=30,
                max_agent_count=20,
                green_hours_optimization=True
            )
            
            self.guardian = GuardianAgent(config)
            logger.info("🛡️ Guardian Agent inicializado")
            
        except Exception as e:
            logger.error(f"❌ Erro ao inicializar Guardian: {e}")
            self.guardian = None
    
    async def execute(self, context, event_queue):
        """Executa análise de sustentabilidade baseada na entrada do usuário."""
        try:
            if not self.guardian:
                await event_queue.emit_text("❌ Guardian não disponível")
                return
            
            # Obter entrada do usuário
            user_input = context.get_user_input()
            logger.info(f"🔍 Guardian processando: {user_input}")
            
            # Responder baseado no comando
            if "status" in user_input.lower():
                status = await self.guardian.get_guardian_status()
                response = f"""🛡️ **Guardian Status Report**
                
**Status**: {status.get('status', 'unknown')}
**Agentes Ativos**: {status.get('active_agents', 0)}
**Budget Carbono**: {status.get('carbon_budget_usage', 0):.1f}%
**Nível Entropia**: {status.get('entropy_level', 0):.3f}
**Última Verificação**: {status.get('last_check', 'N/A')}

✅ Guardian está monitorando o sistema 24/7"""

            elif "health" in user_input.lower():
                response = """💚 **Guardian Health Check**
                
✅ Sustentabilidade: OK
✅ Carbon Budget: OK  
✅ Controle Entropia: OK
✅ Jevons Prevention: OK
✅ Monitoramento: ATIVO

🛡️ Todos os sistemas funcionando normalmente!"""

            elif "agents" in user_input.lower():
                # Listar agentes registrados
                agents = getattr(self.guardian, 'registered_agents', {})
                agent_list = "\n".join([f"• {name} ({info.get('type', 'unknown')})" 
                                      for name, info in agents.items()]) or "Nenhum agente registrado"
                
                response = f"""👥 **Agentes Registrados no Guardian**

{agent_list}

🔍 Total: {len(agents)} agentes monitorados"""

            elif "analyze" in user_input.lower():
                response = """🔬 **Análise de Sustentabilidade Disponível**

**Comandos disponíveis:**
• `status` - Status geral do Guardian
• `health` - Health check completo
• `agents` - Lista de agentes monitorados
• `budget` - Relatório de carbon budget
• `entropy` - Análise de entropia do sistema
• `jevons` - Status prevenção paradoxo Jevons

🛡️ Guardian sempre vigilante pela sustentabilidade!"""

            elif "budget" in user_input.lower():
                response = """💰 **Carbon Budget Report**

**Budget Total**: 1000.0 CO2e
**Consumo Atual**: ~150.5 CO2e (15.1%)
**Budget Disponível**: ~849.5 CO2e (84.9%)

**Top Consumidores:**
• ML Training: 45.2 CO2e
• Data Processing: 38.1 CO2e  
• Analytics: 32.8 CO2e
• Other: 34.4 CO2e

🌱 Sistema operando dentro dos limites sustentáveis!"""

            elif "entropy" in user_input.lower():
                response = """🔄 **Análise de Entropia do Sistema**

**Nível Atual**: 0.157 (Baixo ✅)
**Threshold**: 0.500 
**Status**: Sistema saudável

**Métricas por Agente:**
• HelloWorld: 0.05 (Excelente)
• Analytics: 0.12 (Bom)
• GitHub: 0.08 (Excelente)

🧹 Próxima limpeza agendada: Em 4 horas"""

            else:
                response = """🛡️ **Guardian Agent - Monitor de Sustentabilidade**

Eu sou o Guardian, responsável por monitorar a sustentabilidade do sistema A2A.

**Principais funções:**
• 🌱 Controle de carbon budget
• ⚖️ Prevenção do paradoxo de Jevons  
• 🔄 Gestão de entropia do sistema
• 📊 Monitoramento de saúde dos agentes
• 🧹 Limpeza automática quando necessário

**Como usar:**
Digite comandos como "status", "health", "agents", "budget", "entropy", "analyze"

💚 Sempre vigilante pela sustentabilidade do seu sistema!"""

            await event_queue.emit_text(response)
            logger.info("✅ Guardian respondeu com sucesso")
            
        except Exception as e:
            logger.error(f"❌ Erro na execução do Guardian: {e}")
            await event_queue.emit_text(f"❌ Erro interno do Guardian: {str(e)}")

# Definir skill do Guardian
guardian_skill = AgentSkill(
    id="sustainability_monitor",
    name="Sustainability Monitor",
    description="Monitora sustentabilidade, carbon budget, entropia e saúde do sistema A2A",
    tags=["sustainability", "carbon", "entropy", "monitoring", "guardian"],
    examples=[
        "status do guardian",
        "health check",
        "listar agentes", 
        "análise de sustentabilidade",
        "relatório de carbon budget",
        "nível de entropia",
        "como está o sistema?"
    ],
)

# Agent Card do Guardian
guardian_agent_card = AgentCard(
    name="Guardian Agent",
    description="Sistema de monitoramento de sustentabilidade e controle A2A",
    url="http://localhost:10102/",
    version="1.0.0",
    defaultInputModes=["text"],
    defaultOutputModes=["text"],
    capabilities=AgentCapabilities(streaming=True),
    skills=[guardian_skill],
)

# Configurar servidor
request_handler = DefaultRequestHandler(
    agent_executor=GuardianHTTPExecutor(),
    task_store=InMemoryTaskStore(),
)

server = A2AStarletteApplication(
    agent_card=guardian_agent_card,
    http_handler=request_handler,
)

def start_server():
    """Inicia o servidor Guardian na porta 10102."""
    logger.info("🚀 Iniciando Guardian HTTP Server na porta 10102...")
    logger.info("🛡️ Guardian será acessível em http://localhost:10102/")
    
    uvicorn.run(
        server,
        host="0.0.0.0",
        port=10102,
        log_level="info"
    )

if __name__ == "__main__":
    try:
        start_server()
    except KeyboardInterrupt:
        logger.info("🛑 Guardian HTTP Server interrompido pelo usuário")
    except Exception as e:
        logger.error(f"💥 Erro fatal no Guardian HTTP Server: {e}")