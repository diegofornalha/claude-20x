#!/usr/bin/env python3
"""
⚙️ Configuração centralizada - Claude-20x Dalat
Sistema de gerenciamento de configurações com fallbacks e validação
"""

import os
import json
from pathlib import Path
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, field
from dotenv import load_dotenv
import logging

# Carregar variáveis de ambiente
load_dotenv()

logger = logging.getLogger(__name__)


@dataclass
class ServiceDiscoveryConfig:
    """Configurações do Service Discovery"""
    host: str = field(default_factory=lambda: os.getenv('DISCOVERY_HOST', '0.0.0.0'))
    port: int = field(default_factory=lambda: int(os.getenv('DISCOVERY_PORT', '8002')))
    scan_interval: int = field(default_factory=lambda: int(os.getenv('DISCOVERY_SCAN_INTERVAL', '30')))
    cache_ttl: int = field(default_factory=lambda: int(os.getenv('DISCOVERY_CACHE_TTL', '30')))
    scan_ranges: List[tuple] = field(default_factory=list)
    max_concurrent: int = field(default_factory=lambda: int(os.getenv('MAX_CONCURRENT_CONNECTIONS', '20')))
    
    def __post_init__(self):
        """Parse scan ranges from environment"""
        ranges_str = os.getenv('DISCOVERY_SCAN_RANGES', 'localhost:3000-4000')
        self.scan_ranges = self._parse_scan_ranges(ranges_str)
    
    def _parse_scan_ranges(self, ranges_str: str) -> List[tuple]:
        """Parse scan ranges string into list of tuples"""
        ranges = []
        try:
            for range_spec in ranges_str.split(','):
                range_spec = range_spec.strip()
                if ':' in range_spec:
                    host, ports = range_spec.split(':')
                    if '-' in ports:
                        start, end = ports.split('-')
                        ranges.append((host, range(int(start), int(end) + 1)))
                    else:
                        ranges.append((host, [int(ports)]))
        except Exception as e:
            logger.warning(f"Erro ao parsear scan_ranges, usando padrão: {e}")
            ranges = [("localhost", range(3000, 4000))]
        return ranges


@dataclass
class LoggerConfig:
    """Configurações do Central Logger"""
    host: str = field(default_factory=lambda: os.getenv('LOGGER_HOST', '0.0.0.0'))
    port: int = field(default_factory=lambda: int(os.getenv('LOGGER_PORT', '8003')))
    max_file_size: str = field(default_factory=lambda: os.getenv('LOGGER_MAX_FILE_SIZE', '100MB'))
    retention_days: int = field(default_factory=lambda: int(os.getenv('LOGGER_RETENTION_DAYS', '30')))
    alert_level: str = field(default_factory=lambda: os.getenv('LOGGER_ALERT_LEVEL', 'ERROR'))
    log_level: str = field(default_factory=lambda: os.getenv('LOG_LEVEL', 'INFO'))


@dataclass
class PathsConfig:
    """Configurações de paths do sistema"""
    project_root: Path
    logs_dir: Path
    memory_dir: Path
    sessions_dir: Path
    
    def __init__(self):
        # Usar variável de ambiente ou detectar automaticamente
        root_str = os.getenv('PROJECT_ROOT')
        if root_str:
            self.project_root = Path(root_str)
        else:
            # Tentar detectar o diretório do projeto
            current_file = Path(__file__).resolve()
            self.project_root = current_file.parent
        
        # Configurar subdiretórios
        self.logs_dir = Path(os.getenv('LOGS_DIR', str(self.project_root / 'logging' / 'logs')))
        self.memory_dir = Path(os.getenv('MEMORY_DIR', str(self.project_root / 'memory')))
        self.sessions_dir = Path(os.getenv('SESSIONS_DIR', str(self.memory_dir / 'sessions')))
        
        # Criar diretórios se não existirem
        self._ensure_directories()
    
    def _ensure_directories(self):
        """Garante que todos os diretórios necessários existam"""
        for dir_path in [self.logs_dir, self.memory_dir, self.sessions_dir]:
            try:
                dir_path.mkdir(parents=True, exist_ok=True)
            except Exception as e:
                logger.warning(f"Não foi possível criar diretório {dir_path}: {e}")


@dataclass
class AgentsConfig:
    """Configurações dos agentes conhecidos"""
    known_agents: Dict[str, Dict[str, Any]]
    
    def __init__(self):
        self.known_agents = {
            "helloworld": {
                "ports": [int(os.getenv('AGENT_HELLOWORLD_PORT', '9999'))],
                "type": "a2a"
            },
            "marvin": {
                "ports": [int(os.getenv('AGENT_MARVIN_PORT', '3002'))],
                "type": "a2a"
            },
            "gemini": {
                "ports": [int(os.getenv('AGENT_GEMINI_PORT', '3003'))],
                "type": "a2a"
            },
            "ui": {
                "ports": [int(os.getenv('UI_PORT', '12000'))],
                "type": "web"
            },
            "analytics": {
                "ports": [int(os.getenv('ANALYTICS_PORT', '5000'))],
                "type": "analytics"
            },
            "a2a-inspector": {
                "ports": [int(os.getenv('INSPECTOR_PORT', '5001'))],
                "type": "debug"
            }
        }


@dataclass
class SecurityConfig:
    """Configurações de segurança"""
    enable_auth: bool = field(default_factory=lambda: os.getenv('ENABLE_AUTH', 'false').lower() == 'true')
    jwt_secret: str = field(default_factory=lambda: os.getenv('JWT_SECRET', 'change-this-in-production'))
    api_rate_limit: int = field(default_factory=lambda: int(os.getenv('API_RATE_LIMIT', '100')))


@dataclass
class PerformanceConfig:
    """Configurações de performance"""
    request_timeout: int = field(default_factory=lambda: int(os.getenv('REQUEST_TIMEOUT', '5000')))
    websocket_heartbeat: int = field(default_factory=lambda: int(os.getenv('WEBSOCKET_HEARTBEAT', '30000')))
    max_concurrent: int = field(default_factory=lambda: int(os.getenv('MAX_CONCURRENT_CONNECTIONS', '20')))


class Config:
    """Configuração principal do sistema"""
    
    def __init__(self):
        self.paths = PathsConfig()
        self.discovery = ServiceDiscoveryConfig()
        self.logger = LoggerConfig()
        self.agents = AgentsConfig()
        self.security = SecurityConfig()
        self.performance = PerformanceConfig()
        self.debug_mode = os.getenv('DEBUG_MODE', 'false').lower() == 'true'
        
        # Validar configurações
        self._validate()
        
        # Log configurações carregadas (sem dados sensíveis)
        if self.debug_mode:
            logger.info("Configurações carregadas com sucesso")
            logger.debug(f"Project root: {self.paths.project_root}")
            logger.debug(f"Discovery port: {self.discovery.port}")
            logger.debug(f"Logger port: {self.logger.port}")
    
    def _validate(self):
        """Valida as configurações"""
        # Validar portas
        if not (1 <= self.discovery.port <= 65535):
            raise ValueError(f"Porta do Discovery inválida: {self.discovery.port}")
        
        if not (1 <= self.logger.port <= 65535):
            raise ValueError(f"Porta do Logger inválida: {self.logger.port}")
        
        # Validar paths
        if not self.paths.project_root.exists():
            logger.warning(f"Project root não existe: {self.paths.project_root}")
        
        # Avisar sobre segurança em produção
        if not self.security.enable_auth:
            logger.warning("⚠️ Autenticação desabilitada - não usar em produção!")
        
        if self.security.jwt_secret == 'change-this-in-production':
            logger.warning("⚠️ JWT secret padrão - alterar em produção!")
    
    def to_dict(self) -> Dict[str, Any]:
        """Converte configurações para dicionário (sem dados sensíveis)"""
        return {
            "paths": {
                "project_root": str(self.paths.project_root),
                "logs_dir": str(self.paths.logs_dir)
            },
            "discovery": {
                "host": self.discovery.host,
                "port": self.discovery.port,
                "scan_interval": self.discovery.scan_interval
            },
            "logger": {
                "host": self.logger.host,
                "port": self.logger.port,
                "retention_days": self.logger.retention_days
            },
            "security": {
                "auth_enabled": self.security.enable_auth,
                "rate_limit": self.security.api_rate_limit
            },
            "debug_mode": self.debug_mode
        }


# Singleton da configuração
_config = None


def get_config() -> Config:
    """Retorna instância singleton da configuração"""
    global _config
    if _config is None:
        _config = Config()
    return _config


# Exportar para uso direto
config = get_config()


if __name__ == "__main__":
    # Teste das configurações
    print("🔧 Testando configurações...")
    cfg = get_config()
    print(json.dumps(cfg.to_dict(), indent=2))
    print("✅ Configurações carregadas com sucesso!")