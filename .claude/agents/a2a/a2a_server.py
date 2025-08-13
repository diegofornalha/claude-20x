#!/usr/bin/env python3
"""
A2A Agent Server - Implementação oficial com Starlette/ASGI/Uvicorn
SDK A2A v2.0 - Async Nativo
"""

from starlette.applications import Starlette
from starlette.routing import Route, WebSocketRoute
from starlette.responses import JSONResponse, StreamingResponse
from starlette.middleware.cors import CORSMiddleware
from starlette.background import BackgroundTask
import uvicorn
import asyncio
import json
import uuid
import time
from datetime import datetime
from typing import Dict, List, Optional, AsyncIterator
import logging

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class A2AAgent:
    """Agente A2A com servidor ASGI nativo seguindo SDK oficial"""
    
    def __init__(self, name: str, agent_type: str = "autonomous"):
        self.name = name
        self.agent_type = agent_type
        self.agent_id = f"agent_{uuid.uuid4().hex[:8]}"
        self.peers: Dict[str, any] = {}
        self.state = {
            "status": "initializing",
            "started_at": datetime.utcnow().isoformat(),
            "decisions": 0,
            "learnings": 0,
            "consensus_participations": 0
        }
        self.knowledge_base = []
        self.emergent_patterns = []
        
        # Configurar aplicação Starlette
        self.app = Starlette(
            debug=False,
            routes=self._setup_routes(),
            on_startup=[self.startup],
            on_shutdown=[self.shutdown]
        )
        
        # Adicionar middleware
        self.app.add_middleware(
            CORSMiddleware,
            allow_origins=["*"],
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )
    
    def _setup_routes(self) -> List:
        """Define todas as rotas do agente A2A"""
        return [
            # Informações básicas
            Route('/', self.index, methods=['GET']),
            Route('/health', self.health_check, methods=['GET']),
            Route('/status', self.get_status, methods=['GET']),
            Route('/metrics', self.get_metrics, methods=['GET']),
            
            # Capacidades A2A
            Route('/decide', self.make_decision, methods=['POST']),
            Route('/learn', self.learn_from_data, methods=['POST']),
            Route('/adapt', self.self_adapt, methods=['POST']),
            Route('/consensus', self.participate_consensus, methods=['POST']),
            Route('/knowledge', self.share_knowledge, methods=['GET', 'POST']),
            
            # Comportamentos emergentes
            Route('/emergence/detect', self.detect_emergence, methods=['POST']),
            Route('/emergence/patterns', self.get_emergent_patterns, methods=['GET']),
            
            # Comunicação P2P
            Route('/peers', self.list_peers, methods=['GET']),
            Route('/peers/discover', self.discover_peers, methods=['POST']),
            Route('/peers/connect', self.connect_peer, methods=['POST']),
            
            # WebSocket para comunicação em tempo real
            WebSocketRoute('/ws', self.websocket_endpoint),
            
            # Server-Sent Events para streaming
            Route('/stream/events', self.stream_events, methods=['GET']),
            Route('/stream/metrics', self.stream_metrics, methods=['GET']),
        ]
    
    async def startup(self):
        """Inicialização do agente"""
        logger.info(f"🚀 A2A Agent '{self.name}' starting up...")
        self.state["status"] = "active"
        
        # Iniciar tarefas em background
        asyncio.create_task(self.peer_discovery_loop())
        asyncio.create_task(self.emergent_behavior_monitor())
        asyncio.create_task(self.knowledge_sync_loop())
    
    async def shutdown(self):
        """Shutdown gracioso do agente"""
        logger.info(f"🛑 A2A Agent '{self.name}' shutting down...")
        self.state["status"] = "shutting_down"
        
        # Notificar peers
        await self.notify_peers({"type": "shutdown", "agent_id": self.agent_id})
        
        # Fechar conexões WebSocket
        for peer_id, ws in self.peers.items():
            try:
                await ws.close()
            except:
                pass
    
    async def index(self, request):
        """Endpoint principal com informações do agente"""
        return JSONResponse({
            "agent": {
                "name": self.name,
                "id": self.agent_id,
                "type": self.agent_type
            },
            "protocol": {
                "version": "2.0",
                "type": "a2a"
            },
            "server": {
                "framework": "starlette",
                "server": "uvicorn",
                "async": True,
                "asgi": "3.0"
            },
            "capabilities": [
                "autonomous_decision_making",
                "peer_communication",
                "self_adaptation",
                "distributed_coordination",
                "emergent_behavior_detection",
                "continuous_learning",
                "byzantine_fault_tolerance"
            ],
            "endpoints": {
                "rest": ["/decide", "/learn", "/adapt", "/consensus"],
                "websocket": "/ws",
                "sse": ["/stream/events", "/stream/metrics"]
            }
        })
    
    async def health_check(self, request):
        """Health check endpoint"""
        return JSONResponse({
            "status": "healthy",
            "agent_id": self.agent_id,
            "uptime": self._calculate_uptime()
        })
    
    async def get_status(self, request):
        """Status detalhado do agente"""
        return JSONResponse({
            "agent_id": self.agent_id,
            "name": self.name,
            "type": self.agent_type,
            "state": self.state,
            "peers_connected": len(self.peers),
            "knowledge_items": len(self.knowledge_base),
            "emergent_patterns": len(self.emergent_patterns)
        })
    
    async def get_metrics(self, request):
        """Métricas de performance do agente"""
        return JSONResponse({
            "decisions": self.state["decisions"],
            "learnings": self.state["learnings"],
            "consensus_participations": self.state["consensus_participations"],
            "peers": len(self.peers),
            "knowledge_base_size": len(self.knowledge_base),
            "emergent_patterns_detected": len(self.emergent_patterns),
            "uptime_seconds": self._calculate_uptime()
        })
    
    async def make_decision(self, request):
        """Tomada de decisão autônoma (async)"""
        data = await request.json()
        context = data.get("context", {})
        
        # Simular processamento de decisão complexo
        logger.info(f"Making autonomous decision for context: {context}")
        
        # Avaliar opções em paralelo
        options = await asyncio.gather(
            self._evaluate_option(context, "option_a"),
            self._evaluate_option(context, "option_b"),
            self._evaluate_option(context, "option_c")
        )
        
        # Selecionar melhor opção
        best_option = max(options, key=lambda x: x["score"])
        
        self.state["decisions"] += 1
        
        # Background task para compartilhar decisão
        background = BackgroundTask(
            self.notify_peers,
            {"type": "decision", "decision": best_option}
        )
        
        return JSONResponse({
            "decision": best_option["action"],
            "confidence": best_option["score"],
            "reasoning": best_option["reasoning"],
            "agent_id": self.agent_id,
            "timestamp": datetime.utcnow().isoformat()
        }, background=background)
    
    async def learn_from_data(self, request):
        """Aprendizagem contínua com dados"""
        data = await request.json()
        learning_data = data.get("data", {})
        
        logger.info(f"Learning from data: {learning_data}")
        
        # Simular aprendizagem neural
        await asyncio.sleep(0.1)  # Simular processamento
        
        # Adicionar ao knowledge base
        knowledge_item = {
            "id": str(uuid.uuid4()),
            "data": learning_data,
            "learned_at": datetime.utcnow().isoformat(),
            "confidence": 0.95
        }
        self.knowledge_base.append(knowledge_item)
        
        self.state["learnings"] += 1
        
        # Compartilhar conhecimento com peers
        asyncio.create_task(
            self.broadcast_knowledge(knowledge_item)
        )
        
        return JSONResponse({
            "success": True,
            "knowledge_id": knowledge_item["id"],
            "confidence": knowledge_item["confidence"],
            "total_knowledge": len(self.knowledge_base)
        })
    
    async def self_adapt(self, request):
        """Auto-adaptação baseada em feedback"""
        data = await request.json()
        feedback = data.get("feedback", {})
        
        logger.info(f"Self-adapting based on feedback: {feedback}")
        
        # Analisar feedback e ajustar comportamento
        adaptation = {
            "type": feedback.get("type", "performance"),
            "adjustments": {
                "decision_threshold": 0.02,
                "learning_rate": 0.001,
                "consensus_weight": 0.05
            },
            "timestamp": datetime.utcnow().isoformat()
        }
        
        return JSONResponse({
            "adapted": True,
            "adaptation": adaptation,
            "new_state": self.state
        })
    
    async def participate_consensus(self, request):
        """Participar de consenso distribuído"""
        data = await request.json()
        proposal = data.get("proposal", {})
        
        logger.info(f"Participating in consensus for proposal: {proposal}")
        
        # Avaliar proposta
        evaluation = await self._evaluate_proposal(proposal)
        
        # Votar
        vote = {
            "proposal_id": proposal.get("id"),
            "agent_id": self.agent_id,
            "vote": "approve" if evaluation["score"] > 0.7 else "reject",
            "confidence": evaluation["score"],
            "timestamp": datetime.utcnow().isoformat()
        }
        
        self.state["consensus_participations"] += 1
        
        # Broadcast voto para peers
        asyncio.create_task(
            self.notify_peers({"type": "vote", "vote": vote})
        )
        
        return JSONResponse(vote)
    
    async def share_knowledge(self, request):
        """Compartilhar ou receber conhecimento"""
        if request.method == "GET":
            # Retornar knowledge base
            return JSONResponse({
                "agent_id": self.agent_id,
                "knowledge_base": self.knowledge_base[-10:],  # Últimos 10 items
                "total_items": len(self.knowledge_base)
            })
        else:
            # Receber conhecimento de outro agente
            data = await request.json()
            external_knowledge = data.get("knowledge", {})
            
            # Integrar conhecimento externo
            self.knowledge_base.append({
                **external_knowledge,
                "source": "external",
                "integrated_at": datetime.utcnow().isoformat()
            })
            
            return JSONResponse({
                "integrated": True,
                "total_knowledge": len(self.knowledge_base)
            })
    
    async def detect_emergence(self, request):
        """Detectar comportamentos emergentes"""
        data = await request.json()
        logs = data.get("logs", [])
        
        logger.info("Analyzing for emergent behaviors...")
        
        # Análise de padrões
        patterns = await self._analyze_patterns(logs)
        
        emergent = []
        for pattern in patterns:
            if pattern["score"] > 0.8 and not self._is_programmed(pattern):
                emergent_pattern = {
                    "id": str(uuid.uuid4()),
                    "pattern": pattern["name"],
                    "confidence": pattern["score"],
                    "detected_at": datetime.utcnow().isoformat(),
                    "description": pattern.get("description", "")
                }
                emergent.append(emergent_pattern)
                self.emergent_patterns.append(emergent_pattern)
        
        return JSONResponse({
            "emergent_behaviors": emergent,
            "total_patterns": len(self.emergent_patterns)
        })
    
    async def get_emergent_patterns(self, request):
        """Listar padrões emergentes detectados"""
        return JSONResponse({
            "patterns": self.emergent_patterns[-20:],  # Últimos 20
            "total": len(self.emergent_patterns)
        })
    
    async def list_peers(self, request):
        """Listar peers conectados"""
        return JSONResponse({
            "peers": list(self.peers.keys()),
            "count": len(self.peers)
        })
    
    async def discover_peers(self, request):
        """Descobrir novos peers na rede"""
        logger.info("Discovering peers...")
        
        # Simular descoberta
        discovered = [
            {"id": f"peer_{i}", "endpoint": f"http://localhost:800{i}"}
            for i in range(1, 4)
        ]
        
        return JSONResponse({
            "discovered": discovered,
            "count": len(discovered)
        })
    
    async def connect_peer(self, request):
        """Conectar a um peer específico"""
        data = await request.json()
        peer_endpoint = data.get("endpoint")
        
        logger.info(f"Connecting to peer: {peer_endpoint}")
        
        # Simular conexão
        peer_id = f"peer_{uuid.uuid4().hex[:8]}"
        self.peers[peer_id] = {"endpoint": peer_endpoint, "connected_at": time.time()}
        
        return JSONResponse({
            "connected": True,
            "peer_id": peer_id,
            "total_peers": len(self.peers)
        })
    
    async def websocket_endpoint(self, websocket):
        """WebSocket para comunicação P2P em tempo real"""
        await websocket.accept()
        peer_id = None
        
        try:
            # Handshake inicial
            message = await websocket.receive_json()
            peer_id = message.get("peer_id", str(uuid.uuid4()))
            self.peers[peer_id] = websocket
            
            await websocket.send_json({
                "type": "connected",
                "agent_id": self.agent_id,
                "peer_id": peer_id
            })
            
            # Loop de mensagens
            while True:
                message = await websocket.receive_json()
                await self._handle_ws_message(peer_id, message)
                
        except Exception as e:
            logger.error(f"WebSocket error: {e}")
        finally:
            if peer_id and peer_id in self.peers:
                del self.peers[peer_id]
            try:
                await websocket.close()
            except:
                pass
    
    async def stream_events(self, request):
        """Server-Sent Events para streaming de eventos"""
        async def event_generator():
            while True:
                # Gerar evento
                event = {
                    "type": "heartbeat",
                    "agent_id": self.agent_id,
                    "timestamp": datetime.utcnow().isoformat(),
                    "status": self.state["status"]
                }
                
                # Verificar comportamentos emergentes
                if self.emergent_patterns:
                    event["emergent"] = self.emergent_patterns[-1]
                
                yield f"data: {json.dumps(event)}\n\n"
                await asyncio.sleep(5)
        
        return StreamingResponse(
            event_generator(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive"
            }
        )
    
    async def stream_metrics(self, request):
        """Stream de métricas em tempo real"""
        async def metrics_generator():
            while True:
                metrics = {
                    "timestamp": datetime.utcnow().isoformat(),
                    "decisions_per_minute": self.state["decisions"] / max(1, self._calculate_uptime() / 60),
                    "learning_rate": self.state["learnings"] / max(1, self._calculate_uptime() / 60),
                    "peers": len(self.peers),
                    "knowledge_items": len(self.knowledge_base)
                }
                
                yield f"data: {json.dumps(metrics)}\n\n"
                await asyncio.sleep(2)
        
        return StreamingResponse(
            metrics_generator(),
            media_type="text/event-stream"
        )
    
    # Métodos auxiliares privados
    
    async def _evaluate_option(self, context: dict, option: str) -> dict:
        """Avaliar uma opção de decisão"""
        await asyncio.sleep(0.01)  # Simular processamento
        
        score = 0.5 + (hash(str(context) + option) % 50) / 100
        
        return {
            "action": option,
            "score": score,
            "reasoning": f"Option {option} evaluated with context factors"
        }
    
    async def _evaluate_proposal(self, proposal: dict) -> dict:
        """Avaliar uma proposta para consenso"""
        await asyncio.sleep(0.01)
        
        # Análise simulada
        score = 0.6 + (hash(str(proposal)) % 40) / 100
        
        return {
            "score": score,
            "factors": ["feasibility", "impact", "risk"]
        }
    
    async def _analyze_patterns(self, logs: list) -> list:
        """Analisar logs para padrões"""
        await asyncio.sleep(0.05)  # Simular análise
        
        patterns = [
            {"name": "coordination_sync", "score": 0.85, "description": "Synchronized coordination detected"},
            {"name": "adaptive_routing", "score": 0.92, "description": "Adaptive routing pattern emerged"}
        ]
        
        return patterns
    
    def _is_programmed(self, pattern: dict) -> bool:
        """Verificar se padrão é programado ou emergente"""
        programmed_patterns = ["heartbeat", "health_check", "status_update"]
        return pattern.get("name", "") in programmed_patterns
    
    def _calculate_uptime(self) -> float:
        """Calcular uptime em segundos"""
        started = datetime.fromisoformat(self.state["started_at"])
        return (datetime.utcnow() - started).total_seconds()
    
    async def _handle_ws_message(self, peer_id: str, message: dict):
        """Processar mensagem WebSocket"""
        msg_type = message.get("type")
        
        if msg_type == "knowledge_share":
            # Integrar conhecimento compartilhado
            self.knowledge_base.append({
                **message.get("data", {}),
                "from_peer": peer_id,
                "received_at": datetime.utcnow().isoformat()
            })
        elif msg_type == "consensus":
            # Participar de consenso
            await self.participate_consensus(message)
        elif msg_type == "emergency":
            # Lidar com emergência
            logger.warning(f"Emergency from {peer_id}: {message}")
    
    # Loops em background
    
    async def peer_discovery_loop(self):
        """Loop contínuo de descoberta de peers"""
        while self.state["status"] == "active":
            try:
                # Descobrir novos peers periodicamente
                logger.debug("Running peer discovery...")
                await asyncio.sleep(30)  # A cada 30 segundos
            except Exception as e:
                logger.error(f"Peer discovery error: {e}")
    
    async def emergent_behavior_monitor(self):
        """Monitor contínuo de comportamentos emergentes"""
        while self.state["status"] == "active":
            try:
                # Analisar comportamentos
                logger.debug("Monitoring emergent behaviors...")
                await asyncio.sleep(10)  # A cada 10 segundos
            except Exception as e:
                logger.error(f"Emergence monitor error: {e}")
    
    async def knowledge_sync_loop(self):
        """Loop de sincronização de conhecimento"""
        while self.state["status"] == "active":
            try:
                # Sincronizar conhecimento com peers
                logger.debug("Syncing knowledge...")
                await asyncio.sleep(60)  # A cada minuto
            except Exception as e:
                logger.error(f"Knowledge sync error: {e}")
    
    async def notify_peers(self, message: dict):
        """Notificar todos os peers"""
        tasks = []
        for peer_id, ws in self.peers.items():
            if isinstance(ws, dict):  # HTTP peer
                continue
            tasks.append(ws.send_json(message))
        
        if tasks:
            await asyncio.gather(*tasks, return_exceptions=True)
    
    async def broadcast_knowledge(self, knowledge: dict):
        """Broadcast de conhecimento para peers"""
        await self.notify_peers({
            "type": "knowledge_share",
            "data": knowledge,
            "from": self.agent_id
        })


def create_app(name: str = "a2a-agent", agent_type: str = "autonomous") -> Starlette:
    """Factory para criar aplicação A2A"""
    agent = A2AAgent(name, agent_type)
    return agent.app


if __name__ == "__main__":
    # Configuração do servidor
    import os
    
    agent_name = os.getenv("AGENT_NAME", "a2a-agent")
    agent_type = os.getenv("AGENT_TYPE", "autonomous")
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", 8000))
    workers = int(os.getenv("WORKERS", 4))
    
    # Criar aplicação
    app = create_app(agent_name, agent_type)
    
    # Iniciar servidor Uvicorn
    uvicorn.run(
        app,
        host=host,
        port=port,
        loop="uvloop",
        access_log=False,
        workers=workers
    )