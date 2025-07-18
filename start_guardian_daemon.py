#!/usr/bin/env python3
"""
Guardian Agent Daemon - Serviço Permanente de Sustentabilidade
Inicia o Guardian Agent como serviço de background independente.
"""

import asyncio
import logging
import signal
import sys
from pathlib import Path

# Adicionar o caminho do Guardian
sys.path.append(str(Path(__file__).parent / "backup-reorganized/active-prototypes/a2a_mcp/src"))

from a2a_mcp.guardian import GuardianAgent
from a2a_mcp.common.sustainability_types import GuardianConfig

# Configuração de logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('/tmp/guardian_daemon.log'),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)

class GuardianDaemon:
    """Daemon do Guardian Agent para execução permanente."""
    
    def __init__(self):
        self.guardian = None
        self.running = True
        
    async def start_guardian(self):
        """Inicia o Guardian Agent."""
        try:
            # Configuração otimizada para execução permanente
            config = GuardianConfig(
                total_carbon_budget=1000.0,  # Budget generoso para operação contínua
                jevons_detection_threshold=0.7,  # Threshold mais permissivo
                entropy_control_enabled=True,
                demand_shaping_enabled=True,
                auto_cleanup_enabled=True,
                monitoring_interval=30,  # Check a cada 30 segundos
                max_agent_count=20,  # Suporte para muitos agentes
                green_hours_optimization=True
            )
            
            self.guardian = GuardianAgent(config)
            logger.info("🛡️ Guardian Agent iniciado com sucesso!")
            
            # Iniciar monitoramento
            await self.guardian.start_guardian_monitoring()
            logger.info("🔍 Monitoramento Guardian ativo!")
            
            return True
            
        except Exception as e:
            logger.error(f"❌ Erro ao iniciar Guardian: {e}")
            return False
    
    async def monitor_guardian(self):
        """Monitora a saúde do Guardian continuamente."""
        while self.running:
            try:
                if self.guardian:
                    # Health check do Guardian
                    status = await self.guardian.get_guardian_status()
                    logger.info(f"Guardian Status: {status['status']} - "
                              f"Agentes: {status['active_agents']} - "
                              f"Budget: {status['carbon_budget_usage']:.1f}%")
                    
                    # Limpeza automática se necessário
                    if status.get('entropy_level', 0) > 0.8:
                        logger.warning("🧹 Alto nível de entropia, iniciando limpeza...")
                        await self.guardian.entropy_controller.coordinate_cleanup()
                        
                else:
                    logger.warning("⚠️ Guardian não está ativo, tentando reiniciar...")
                    await self.start_guardian()
                    
            except Exception as e:
                logger.error(f"❌ Erro no monitoramento: {e}")
                
            # Aguardar próximo ciclo
            await asyncio.sleep(30)
    
    async def handle_shutdown(self):
        """Gerencia shutdown graceful."""
        logger.info("🔄 Recebido sinal de shutdown...")
        self.running = False
        
        if self.guardian:
            try:
                await self.guardian.shutdown()
                logger.info("✅ Guardian Agent finalizado gracefully")
            except Exception as e:
                logger.error(f"❌ Erro no shutdown: {e}")
    
    async def run(self):
        """Execução principal do daemon."""
        logger.info("🚀 Iniciando Guardian Daemon...")
        
        # Configurar handlers de sinal
        loop = asyncio.get_event_loop()
        for sig in [signal.SIGTERM, signal.SIGINT]:
            loop.add_signal_handler(sig, lambda: asyncio.create_task(self.handle_shutdown()))
        
        # Iniciar Guardian
        if not await self.start_guardian():
            logger.error("💥 Falha fatal ao iniciar Guardian")
            return False
        
        # Executar monitoramento contínuo
        await self.monitor_guardian()
        return True

async def main():
    """Função principal."""
    daemon = GuardianDaemon()
    
    try:
        await daemon.run()
    except KeyboardInterrupt:
        logger.info("🛑 Interrupção manual recebida")
    except Exception as e:
        logger.error(f"💥 Erro fatal no daemon: {e}")
    finally:
        await daemon.handle_shutdown()

if __name__ == "__main__":
    logger.info("🛡️ Guardian Daemon v1.0 - Iniciando...")
    asyncio.run(main())