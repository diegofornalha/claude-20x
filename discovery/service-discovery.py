#!/usr/bin/env python3
"""
🔍 Service Discovery System - Claude-20x
Sistema de descoberta automática de agentes A2A
Implementa as recomendações da auditoria SPARC
"""

import os
import json
import asyncio
import aiohttp
import socket
import time
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Optional, Set, Tuple
from dataclasses import dataclass, asdict
from enum import Enum
import threading
import uvicorn
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
import psutil
import requests
from urllib.parse import urljoin
import logging

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class AgentStatus(Enum):
    """Status possíveis dos agentes"""
    ONLINE = "online"
    OFFLINE = "offline"
    STARTING = "starting"
    ERROR = "error"
    UNKNOWN = "unknown"


@dataclass
class AgentInfo:
    """Informações completas do agente"""
    id: str
    name: str
    type: str
    host: str
    port: int
    url: str
    status: AgentStatus
    last_seen: datetime
    capabilities: List[str]
    metadata: Dict[str, any]
    health_endpoint: str
    card_endpoint: str
    version: Optional[str] = None
    uptime: Optional[float] = None
    
    def to_dict(self) -> Dict[str, any]:
        return {
            **asdict(self),
            'status': self.status.value,
            'last_seen': self.last_seen.isoformat(),
            'uptime': self.uptime
        }


class ServiceDiscovery:
    """
    🕵️ Sistema de Service Discovery
    
    Funcionalidades identificadas na auditoria:
    - Descoberta automática de agentes A2A
    - Health checking contínuo
    - Registry centralizado
    - Load balancing básico
    - Auto-scaling triggers
    """
    
    def __init__(self, project_root: str = "/Users/agents/Desktop/claude-20x"):
        self.project_root = Path(project_root)
        self.registry: Dict[str, AgentInfo] = {}
        self.scan_ranges = [
            ("localhost", range(3000, 4000)),  # Portas comuns para agentes
            ("localhost", range(8000, 9000)),  # Portas alternativas
            ("localhost", [9999]),            # HelloWorld Agent (porta 9999)
            ("127.0.0.1", [12000]),           # UI principal
        ]
        
        # Agentes conhecidos da análise
        self.known_agents = {
            "helloworld": {"ports": [9999], "type": "a2a"},  # Atualizado para porta 9999
            "marvin": {"ports": [3002], "type": "a2a"},
            "gemini": {"ports": [3003], "type": "a2a"},
            "ui": {"ports": [12000], "type": "web"},
            "analytics": {"ports": [5000], "type": "analytics"},
            "a2a-inspector": {"ports": [5001], "type": "debug"}
        }
        
        # Cache para otimizar descoberta
        self.discovery_cache = {}
        self.cache_ttl = 30  # 30 segundos
        
        # Iniciar discovery automático
        self.running = True
        self.discovery_thread = threading.Thread(target=self._discovery_worker, daemon=True)
        self.discovery_thread.start()
    
    async def discover_agents(self, force_scan: bool = False) -> List[AgentInfo]:
        """🔍 Descobre todos os agentes ativos"""
        
        if not force_scan and self._is_cache_valid():
            return list(self.registry.values())
        
        logger.info("🔍 Iniciando descoberta de agentes...")
        discovered = []
        
        # 1. Descoberta por portas conhecidas
        for agent_name, config in self.known_agents.items():
            for port in config["ports"]:
                agent = await self._probe_agent("localhost", port, agent_name, config["type"])
                if agent:
                    discovered.append(agent)
        
        # 2. Descoberta por scanning
        scan_tasks = []
        for host, port_range in self.scan_ranges:
            if isinstance(port_range, range):
                for port in port_range:
                    scan_tasks.append(self._probe_agent(host, port))
            else:
                for port in port_range:
                    scan_tasks.append(self._probe_agent(host, port))
        
        # Executar scans em paralelo (limitado para não sobrecarregar)
        semaphore = asyncio.Semaphore(20)
        async def limited_probe(task):
            async with semaphore:
                return await task
        
        results = await asyncio.gather(*[limited_probe(task) for task in scan_tasks], return_exceptions=True)
        
        for result in results:
            if isinstance(result, AgentInfo):
                discovered.append(result)
        
        # 3. Descoberta por configuração
        config_agents = await self._discover_from_configs()
        discovered.extend(config_agents)
        
        # Atualizar registry
        for agent in discovered:
            self.registry[agent.id] = agent
        
        # Limpar agentes offline
        await self._cleanup_offline_agents()
        
        logger.info(f"✅ Descobriu {len(discovered)} agentes ativos")
        return discovered
    
    async def _probe_agent(self, host: str, port: int, 
                          expected_name: str = None, 
                          expected_type: str = None) -> Optional[AgentInfo]:
        """🔎 Testa se há um agente em host:port específico"""
        
        try:
            # Verificar se porta está aberta
            if not self._is_port_open(host, port):
                return None
            
            base_url = f"http://{host}:{port}"
            
            # Tentar endpoints A2A padrão
            agent_info = await self._probe_a2a_agent(base_url, expected_name, expected_type)
            if agent_info:
                return agent_info
            
            # Tentar endpoints web padrão
            agent_info = await self._probe_web_service(base_url, expected_name, expected_type)
            if agent_info:
                return agent_info
                
        except Exception as e:
            logger.debug(f"Erro ao verificar {host}:{port} - {e}")
            
        return None
    
    async def _probe_a2a_agent(self, base_url: str, 
                              expected_name: str = None,
                              expected_type: str = None) -> Optional[AgentInfo]:
        """🤖 Verifica se é um agente A2A válido"""
        
        try:
            async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=2)) as session:
                # Tentar endpoint de agent card
                card_endpoints = ["/agent/card", "/.well-known/agent.json", "/agent"]
                
                for endpoint in card_endpoints:
                    try:
                        async with session.get(urljoin(base_url, endpoint)) as response:
                            if response.status == 200:
                                card_data = await response.json()
                                return self._create_agent_from_card(base_url, card_data, expected_name, expected_type)
                    except:
                        continue
                        
        except Exception as e:
            logger.debug(f"Erro A2A probe {base_url}: {e}")
        
        return None
    
    async def _probe_web_service(self, base_url: str,
                                expected_name: str = None,
                                expected_type: str = None) -> Optional[AgentInfo]:
        """🌐 Verifica se é um serviço web válido"""
        
        try:
            async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=2)) as session:
                # Tentar endpoints comuns
                health_endpoints = ["/health", "/status", "/ping", "/api/health", "/"]
                
                for endpoint in health_endpoints:
                    try:
                        async with session.get(urljoin(base_url, endpoint)) as response:
                            if 200 <= response.status < 400:
                                content = await response.text()
                                return self._create_web_service_info(base_url, content, expected_name, expected_type)
                    except:
                        continue
                        
        except Exception as e:
            logger.debug(f"Erro web probe {base_url}: {e}")
        
        return None
    
    def _create_agent_from_card(self, base_url: str, card_data: dict,
                               expected_name: str = None,
                               expected_type: str = None) -> AgentInfo:
        """🎯 Cria AgentInfo a partir de agent card A2A"""
        
        host, port = self._parse_url(base_url)
        agent_id = f"{host}:{port}"
        
        return AgentInfo(
            id=agent_id,
            name=card_data.get('name', expected_name or f"agent-{port}"),
            type=expected_type or "a2a",
            host=host,
            port=port,
            url=base_url,
            status=AgentStatus.ONLINE,
            last_seen=datetime.now(),
            capabilities=card_data.get('capabilities', []),
            metadata=card_data,
            health_endpoint=urljoin(base_url, "/health"),
            card_endpoint=urljoin(base_url, "/agent/card"),
            version=card_data.get('version')
        )
    
    def _create_web_service_info(self, base_url: str, content: str,
                                expected_name: str = None,
                                expected_type: str = None) -> AgentInfo:
        """🌐 Cria AgentInfo para serviço web"""
        
        host, port = self._parse_url(base_url)
        agent_id = f"{host}:{port}"
        
        # Tentar extrair informações do conteúdo
        service_name = expected_name or self._detect_service_name(content, port)
        service_type = expected_type or self._detect_service_type(content, port)
        
        return AgentInfo(
            id=agent_id,
            name=service_name,
            type=service_type,
            host=host,
            port=port,
            url=base_url,
            status=AgentStatus.ONLINE,
            last_seen=datetime.now(),
            capabilities=self._detect_capabilities(content),
            metadata={"content_preview": content[:200]},
            health_endpoint=urljoin(base_url, "/health"),
            card_endpoint=urljoin(base_url, "/"),
        )
    
    def _detect_service_name(self, content: str, port: int) -> str:
        """🏷️ Detecta nome do serviço baseado no conteúdo"""
        
        content_lower = content.lower()
        
        # Padrões conhecidos
        if "a2a inspector" in content_lower:
            return "A2A Inspector"
        elif "analytics" in content_lower:
            return "Analytics Service"
        elif "claude" in content_lower:
            return "Claude Service"
        elif "ui" in content_lower or "interface" in content_lower:
            return "Web UI"
        else:
            return f"Service-{port}"
    
    def _detect_service_type(self, content: str, port: int) -> str:
        """🔍 Detecta tipo do serviço"""
        
        content_lower = content.lower()
        
        if "inspector" in content_lower:
            return "debug"
        elif "analytics" in content_lower:
            return "analytics"
        elif "api" in content_lower:
            return "api"
        elif port in [12000]:
            return "web"
        else:
            return "service"
    
    def _detect_capabilities(self, content: str) -> List[str]:
        """⚡ Detecta capacidades do serviço"""
        
        capabilities = []
        content_lower = content.lower()
        
        capability_keywords = {
            "rest": ["api", "rest", "endpoint"],
            "websocket": ["websocket", "ws", "socket"],
            "debug": ["debug", "inspector", "console"],
            "analytics": ["analytics", "metrics", "monitoring"],
            "ui": ["ui", "interface", "dashboard"],
            "chat": ["chat", "conversation", "message"]
        }
        
        for capability, keywords in capability_keywords.items():
            if any(keyword in content_lower for keyword in keywords):
                capabilities.append(capability)
        
        return capabilities
    
    async def _discover_from_configs(self) -> List[AgentInfo]:
        """📋 Descobre agentes através de arquivos de configuração"""
        
        agents = []
        
        # Buscar por arquivos a2a-config.json
        config_files = list(self.project_root.rglob("a2a-config.json"))
        
        for config_file in config_files:
            try:
                with open(config_file, 'r') as f:
                    config = json.load(f)
                
                # Extrair informações do config
                agent_info = self._create_agent_from_config(config, config_file)
                if agent_info:
                    agents.append(agent_info)
                    
            except Exception as e:
                logger.debug(f"Erro ao ler config {config_file}: {e}")
        
        return agents
    
    def _create_agent_from_config(self, config: dict, config_file: Path) -> Optional[AgentInfo]:
        """📝 Cria AgentInfo a partir de configuração"""
        
        try:
            # Tentar descobrir porta e host do config
            host = config.get('host', 'localhost')
            port = config.get('port')
            
            if not port:
                # Tentar extrair do diretório
                parent_dir = config_file.parent.name
                if parent_dir == "helloworld":
                    port = 9999  # Atualizado para porta 9999
                elif parent_dir == "marvin":
                    port = 3002
                else:
                    return None
            
            base_url = f"http://{host}:{port}"
            
            return AgentInfo(
                id=f"{host}:{port}",
                name=config.get('name', parent_dir),
                type=config.get('type', 'a2a'),
                host=host,
                port=port,
                url=base_url,
                status=AgentStatus.UNKNOWN,  # Verificar depois
                last_seen=datetime.now(),
                capabilities=config.get('capabilities', []),
                metadata=config,
                health_endpoint=urljoin(base_url, "/health"),
                card_endpoint=urljoin(base_url, "/agent/card"),
                version=config.get('version')
            )
            
        except Exception as e:
            logger.debug(f"Erro ao criar agent do config: {e}")
            return None
    
    async def health_check_agent(self, agent_id: str) -> bool:
        """💓 Verifica saúde de agente específico"""
        
        if agent_id not in self.registry:
            return False
        
        agent = self.registry[agent_id]
        
        try:
            async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=5)) as session:
                async with session.get(agent.health_endpoint) as response:
                    if response.status == 200:
                        agent.status = AgentStatus.ONLINE
                        agent.last_seen = datetime.now()
                        return True
                    else:
                        agent.status = AgentStatus.ERROR
                        return False
        except Exception:
            agent.status = AgentStatus.OFFLINE
            return False
    
    async def _cleanup_offline_agents(self):
        """🧹 Remove agentes offline há muito tempo"""
        
        cutoff_time = datetime.now() - timedelta(minutes=5)
        offline_agents = []
        
        for agent_id, agent in self.registry.items():
            if agent.last_seen < cutoff_time:
                offline_agents.append(agent_id)
        
        for agent_id in offline_agents:
            del self.registry[agent_id]
            logger.info(f"🗑️ Removido agente offline: {agent_id}")
    
    def _discovery_worker(self):
        """⚙️ Worker thread para descoberta contínua"""
        
        while self.running:
            try:
                # Executar descoberta
                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)
                loop.run_until_complete(self.discover_agents())
                loop.close()
                
                # Aguardar próximo ciclo
                time.sleep(30)  # Descoberta a cada 30 segundos
                
            except Exception as e:
                logger.error(f"Erro no discovery worker: {e}")
                time.sleep(10)
    
    def _is_port_open(self, host: str, port: int) -> bool:
        """🚪 Verifica se porta está aberta"""
        
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
                sock.settimeout(1)
                result = sock.connect_ex((host, port))
                return result == 0
        except:
            return False
    
    def _parse_url(self, url: str) -> Tuple[str, int]:
        """🔗 Extrai host e porta da URL"""
        
        # Remover protocolo
        if "://" in url:
            url = url.split("://")[1]
        
        # Separar host e porta
        if ":" in url:
            host, port = url.split(":")
            return host, int(port)
        else:
            return url, 80
    
    def _is_cache_valid(self) -> bool:
        """⏰ Verifica se cache ainda é válido"""
        
        if not hasattr(self, '_last_discovery'):
            return False
        
        return (time.time() - self._last_discovery) < self.cache_ttl
    
    def get_agents_by_type(self, agent_type: str) -> List[AgentInfo]:
        """📋 Retorna agentes de um tipo específico"""
        
        return [agent for agent in self.registry.values() if agent.type == agent_type]
    
    def get_healthy_agents(self) -> List[AgentInfo]:
        """💚 Retorna apenas agentes saudáveis"""
        
        return [agent for agent in self.registry.values() if agent.status == AgentStatus.ONLINE]
    
    def stop(self):
        """🛑 Para o sistema de descoberta"""
        
        self.running = False
        if self.discovery_thread.is_alive():
            self.discovery_thread.join(timeout=5)


# 🌐 API FastAPI para Service Discovery
def create_discovery_api(discovery_service: ServiceDiscovery) -> FastAPI:
    """Cria API FastAPI para service discovery"""
    
    app = FastAPI(title="Service Discovery API", version="1.0.0")
    
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    @app.get("/agents")
    async def list_agents(agent_type: Optional[str] = None, healthy_only: bool = False):
        """Listar todos os agentes descobertos"""
        
        agents = list(discovery_service.registry.values())
        
        if agent_type:
            agents = [a for a in agents if a.type == agent_type]
        
        if healthy_only:
            agents = [a for a in agents if a.status == AgentStatus.ONLINE]
        
        return {
            "agents": [agent.to_dict() for agent in agents],
            "count": len(agents)
        }
    
    @app.get("/agents/{agent_id}")
    async def get_agent(agent_id: str):
        """Obter informações de agente específico"""
        
        if agent_id not in discovery_service.registry:
            raise HTTPException(status_code=404, detail="Agent not found")
        
        agent = discovery_service.registry[agent_id]
        return agent.to_dict()
    
    @app.post("/discover")
    async def trigger_discovery(background_tasks: BackgroundTasks, force: bool = False):
        """Disparar descoberta manual"""
        
        async def discover():
            await discovery_service.discover_agents(force_scan=force)
        
        background_tasks.add_task(discover)
        return {"status": "discovery_triggered"}
    
    @app.post("/agents/{agent_id}/health")
    async def check_agent_health(agent_id: str):
        """Verificar saúde de agente específico"""
        
        is_healthy = await discovery_service.health_check_agent(agent_id)
        return {"agent_id": agent_id, "healthy": is_healthy}
    
    @app.get("/stats")
    async def get_stats():
        """Estatísticas do sistema"""
        
        agents = list(discovery_service.registry.values())
        stats = {
            "total_agents": len(agents),
            "by_status": {},
            "by_type": {}
        }
        
        for agent in agents:
            # Por status
            status = agent.status.value
            stats["by_status"][status] = stats["by_status"].get(status, 0) + 1
            
            # Por tipo
            agent_type = agent.type
            stats["by_type"][agent_type] = stats["by_type"].get(agent_type, 0) + 1
        
        return stats
    
    return app


# 🚀 Script principal
if __name__ == "__main__":
    print("🔍 Iniciando Service Discovery System...")
    
    # Inicializar service discovery
    discovery = ServiceDiscovery()
    
    # Criar API
    app = create_discovery_api(discovery)
    
    print("🔍 Service Discovery iniciado em: http://localhost:8002")
    print("📖 API docs: http://localhost:8002/docs")
    print("🤖 Agentes descobertos: http://localhost:8002/agents")
    
    try:
        # Executar servidor
        uvicorn.run(app, host="0.0.0.0", port=8002)
    finally:
        discovery.stop()