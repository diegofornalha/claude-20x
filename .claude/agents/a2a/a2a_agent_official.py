#!/usr/bin/env python3
"""
A2A Agent - Implementação com SDK Oficial
Usando A2AStarletteApplication do a2a-sdk
"""

import asyncio
import os
from typing import Dict, Any, Optional
import uvicorn
from a2a_sdk import (
    A2AStarletteApplication,
    TaskStore,
    MessageHandler,
    ConsensusHandler,
    EmergenceDetector,
    PeerDiscovery,
    KnowledgeBase,
    A2AConfig,
    A2AMetrics,
)
from a2a_sdk.handlers import (
    DecisionHandler,
    LearningHandler,
    AdaptationHandler,
)
from a2a_sdk.stores import (
    InMemoryTaskStore,
    SQLiteTaskStore,
    RedisTaskStore,
)
from starlette.responses import JSONResponse
from starlette.requests import Request
import structlog

# Configurar logging estruturado
logger = structlog.get_logger()


class A2AAgentOfficial:
    """
    Agente A2A usando SDK oficial com A2AStarletteApplication
    """
    
    def __init__(
        self,
        name: str = "a2a-agent",
        config: Optional[A2AConfig] = None,
        task_store: Optional[TaskStore] = None,
    ):
        self.name = name
        self.config = config or self._default_config()
        
        # Task Store - pode ser InMemory, SQLite ou Redis
        self.task_store = task_store or self._create_task_store()
        
        # Criar aplicação usando SDK oficial
        self.app = A2AStarletteApplication(
            name=name,
            config=self.config,
            task_store=self.task_store,
        )
        
        # Configurar handlers do SDK
        self._setup_handlers()
        
        # Configurar rotas customizadas (além das padrão do SDK)
        self._setup_custom_routes()
        
        # Inicializar componentes A2A
        self._initialize_components()
        
        logger.info(
            "a2a_agent_initialized",
            name=name,
            config=self.config.dict(),
            task_store_type=type(self.task_store).__name__,
        )
    
    def _default_config(self) -> A2AConfig:
        """Configuração padrão do agente A2A"""
        return A2AConfig(
            # Configurações básicas
            protocol_version="2.0",
            agent_type="autonomous",
            
            # Capacidades
            capabilities=[
                "autonomous_decision_making",
                "peer_communication",
                "self_adaptation",
                "distributed_coordination",
                "emergent_behavior_detection",
                "continuous_learning",
                "byzantine_fault_tolerance",
            ],
            
            # Rede e comunicação
            network=A2AConfig.NetworkConfig(
                enable_p2p=True,
                enable_websocket=True,
                enable_sse=True,
                discovery_interval=30,
                heartbeat_interval=10,
            ),
            
            # Performance
            performance=A2AConfig.PerformanceConfig(
                max_concurrent_tasks=100,
                task_timeout=300,
                enable_caching=True,
                cache_ttl=3600,
            ),
            
            # Segurança
            security=A2AConfig.SecurityConfig(
                enable_encryption=True,
                enable_authentication=True,
                jwt_secret=os.getenv("JWT_SECRET", "change-me-in-production"),
            ),
            
            # Observabilidade
            observability=A2AConfig.ObservabilityConfig(
                enable_metrics=True,
                enable_tracing=True,
                enable_logging=True,
                log_level="INFO",
            ),
        )
    
    def _create_task_store(self) -> TaskStore:
        """Criar Task Store baseado em configuração"""
        store_type = os.getenv("TASK_STORE_TYPE", "memory")
        
        if store_type == "sqlite":
            db_path = os.getenv("SQLITE_PATH", "./.a2a/tasks.db")
            return SQLiteTaskStore(db_path)
        elif store_type == "redis":
            redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")
            return RedisTaskStore(redis_url)
        else:
            return InMemoryTaskStore()
    
    def _setup_handlers(self):
        """Configurar handlers do SDK A2A"""
        
        # Handler de decisão
        self.decision_handler = DecisionHandler(
            strategy="multi_criteria",
            weights={
                "feasibility": 0.3,
                "impact": 0.4,
                "risk": 0.3,
            },
        )
        self.app.register_handler("/decide", self.decision_handler)
        
        # Handler de aprendizagem
        self.learning_handler = LearningHandler(
            model_type="neural_network",
            learning_rate=0.001,
            batch_size=32,
        )
        self.app.register_handler("/learn", self.learning_handler)
        
        # Handler de adaptação
        self.adaptation_handler = AdaptationHandler(
            adaptation_rate=0.05,
            threshold=0.7,
        )
        self.app.register_handler("/adapt", self.adaptation_handler)
        
        # Handler de consenso
        self.consensus_handler = ConsensusHandler(
            algorithm="pbft",  # Practical Byzantine Fault Tolerance
            quorum_size=0.67,  # 2/3 majority
            timeout=30,
        )
        self.app.register_handler("/consensus", self.consensus_handler)
        
        # Handler de mensagens P2P
        self.message_handler = MessageHandler(
            encryption_enabled=True,
            compression_enabled=True,
        )
        self.app.register_handler("/message", self.message_handler)
        
        logger.info("handlers_configured", handlers=[
            "decision", "learning", "adaptation", "consensus", "message"
        ])
    
    def _setup_custom_routes(self):
        """Adicionar rotas customizadas além das padrão do SDK"""
        
        @self.app.route("/custom/analyze", methods=["POST"])
        async def analyze(request: Request):
            """Endpoint customizado para análise"""
            data = await request.json()
            
            # Usar componentes do SDK
            result = await self._analyze_with_sdk(data)
            
            return JSONResponse({
                "status": "analyzed",
                "result": result,
                "agent": self.name,
            })
        
        @self.app.route("/custom/orchestrate", methods=["POST"])
        async def orchestrate(request: Request):
            """Orquestrar múltiplas tarefas"""
            data = await request.json()
            tasks = data.get("tasks", [])
            
            # Criar tarefas no task store
            task_ids = []
            for task in tasks:
                task_id = await self.task_store.create_task(task)
                task_ids.append(task_id)
            
            # Executar em paralelo
            results = await asyncio.gather(*[
                self.task_store.execute_task(tid) for tid in task_ids
            ])
            
            return JSONResponse({
                "orchestrated": True,
                "task_ids": task_ids,
                "results": results,
            })
        
        logger.info("custom_routes_added", routes=[
            "/custom/analyze", "/custom/orchestrate"
        ])
    
    def _initialize_components(self):
        """Inicializar componentes A2A do SDK"""
        
        # Descoberta de peers
        self.peer_discovery = PeerDiscovery(
            discovery_method="mdns",  # Multicast DNS
            announce_interval=30,
            scan_interval=60,
        )
        self.app.register_component(self.peer_discovery)
        
        # Base de conhecimento
        self.knowledge_base = KnowledgeBase(
            storage_backend="sqlite",
            db_path="./.a2a/knowledge.db",
            embedding_model="sentence-transformers",
        )
        self.app.register_component(self.knowledge_base)
        
        # Detector de emergência
        self.emergence_detector = EmergenceDetector(
            detection_threshold=0.8,
            pattern_recognition_model="lstm",
            catalog_emergent_behaviors=True,
        )
        self.app.register_component(self.emergence_detector)
        
        # Métricas A2A
        self.metrics = A2AMetrics(
            export_format="prometheus",
            export_interval=60,
            include_system_metrics=True,
        )
        self.app.register_component(self.metrics)
        
        logger.info("components_initialized", components=[
            "peer_discovery", "knowledge_base", "emergence_detector", "metrics"
        ])
    
    async def _analyze_with_sdk(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Análise usando componentes do SDK"""
        
        # Detectar padrões emergentes
        patterns = await self.emergence_detector.detect(data)
        
        # Buscar conhecimento relevante
        knowledge = await self.knowledge_base.search(
            query=data.get("query", ""),
            limit=5,
        )
        
        # Tomar decisão
        decision = await self.decision_handler.decide({
            "context": data,
            "patterns": patterns,
            "knowledge": knowledge,
        })
        
        return {
            "patterns": patterns,
            "knowledge": knowledge,
            "decision": decision,
        }
    
    def run(self, host: str = "0.0.0.0", port: int = 8000, **kwargs):
        """Executar servidor usando Uvicorn"""
        
        # Configurações do Uvicorn
        config = {
            "host": host,
            "port": port,
            "loop": "uvloop",
            "access_log": False,
            "log_config": self._get_log_config(),
            **kwargs,  # Permite override de configurações
        }
        
        # Se em produção, adicionar workers
        if os.getenv("ENV") == "production":
            config["workers"] = int(os.getenv("WORKERS", 4))
            config["ssl_keyfile"] = os.getenv("SSL_KEY")
            config["ssl_certfile"] = os.getenv("SSL_CERT")
        
        logger.info(
            "starting_server",
            name=self.name,
            host=host,
            port=port,
            config=config,
        )
        
        # Executar servidor
        uvicorn.run(self.app, **config)
    
    def _get_log_config(self) -> dict:
        """Configuração de logging para Uvicorn"""
        return {
            "version": 1,
            "disable_existing_loggers": False,
            "formatters": {
                "default": {
                    "format": "%(asctime)s - %(name)s - %(levelname)s - %(message)s",
                },
                "json": {
                    "()": "pythonjsonlogger.jsonlogger.JsonFormatter",
                    "format": "%(asctime)s %(name)s %(levelname)s %(message)s",
                },
            },
            "handlers": {
                "default": {
                    "formatter": "json" if os.getenv("LOG_FORMAT") == "json" else "default",
                    "class": "logging.StreamHandler",
                    "stream": "ext://sys.stdout",
                },
            },
            "root": {
                "level": os.getenv("LOG_LEVEL", "INFO"),
                "handlers": ["default"],
            },
        }


def create_agent(
    name: Optional[str] = None,
    config: Optional[Dict[str, Any]] = None,
) -> A2AAgentOfficial:
    """Factory function para criar agente A2A"""
    
    agent_name = name or os.getenv("AGENT_NAME", "a2a-agent")
    
    # Criar configuração a partir de dict ou usar padrão
    if config:
        agent_config = A2AConfig(**config)
    else:
        agent_config = None
    
    return A2AAgentOfficial(
        name=agent_name,
        config=agent_config,
    )


def main():
    """Entry point principal"""
    
    # Criar agente
    agent = create_agent()
    
    # Configurações do servidor
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", 8000))
    workers = int(os.getenv("WORKERS", 1))
    
    # Executar
    agent.run(
        host=host,
        port=port,
        workers=workers,
        reload=os.getenv("ENV") == "development",
    )


if __name__ == "__main__":
    main()