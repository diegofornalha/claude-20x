#!/usr/bin/env python3
"""
📊 Central Logging System - Claude-20x
Sistema centralizado de logging para todos os serviços
Implementa as recomendações da auditoria SPARC
"""

import os
import json
import asyncio
import logging
import traceback
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, asdict
from enum import Enum
import aiofiles
import structlog
from logging.handlers import RotatingFileHandler
import uvicorn
from fastapi import FastAPI, WebSocket, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import threading
import queue
import time


class LogLevel(Enum):
    """Níveis de log padronizados"""
    DEBUG = "DEBUG"
    INFO = "INFO"
    WARNING = "WARNING"
    ERROR = "ERROR"
    CRITICAL = "CRITICAL"


class LogSource(Enum):
    """Fontes de log identificadas na auditoria"""
    UI = "ui"
    AGENT_HELLOWORLD = "agent_helloworld"
    MCP_SERVER = "mcp_server"
    CLAUDE_FLOW = "claude_flow"
    A2A_INSPECTOR = "a2a_inspector"
    GENERAL = "general"


@dataclass
class LogEntry:
    """Estrutura padronizada de log"""
    timestamp: str
    level: LogLevel
    source: LogSource
    service: str
    message: str
    metadata: Dict[str, Any]
    trace_id: Optional[str] = None
    session_id: Optional[str] = None
    user_id: Optional[str] = None
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            **asdict(self),
            'level': self.level.value,
            'source': self.source.value
        }


class CentralLogger:
    """
    🏗️ Sistema Central de Logging
    
    Funcionalidades:
    - Coleta logs de todos os serviços
    - Padronização de formato
    - Rotação automática de arquivos
    - API para consulta de logs
    - Dashboard em tempo real
    - Alertas automáticos
    """
    
    def __init__(self, base_dir: str = "/Users/agents/Desktop/claude-20x"):
        self.base_dir = Path(base_dir)
        self.logs_dir = self.base_dir / "logging" / "logs"
        self.logs_dir.mkdir(parents=True, exist_ok=True)
        
        # Configuração estruturada de logs
        structlog.configure(
            processors=[
                structlog.stdlib.filter_by_level,
                structlog.stdlib.add_logger_name,
                structlog.stdlib.add_log_level,
                structlog.stdlib.PositionalArgumentsFormatter(),
                structlog.processors.TimeStamper(fmt="iso"),
                structlog.processors.StackInfoRenderer(),
                structlog.processors.format_exc_info,
                structlog.processors.UnicodeDecoder(),
                structlog.processors.JSONRenderer()
            ],
            context_class=dict,
            logger_factory=structlog.stdlib.LoggerFactory(),
            wrapper_class=structlog.stdlib.BoundLogger,
            cache_logger_on_first_use=True,
        )
        
        self.logger = structlog.get_logger()
        self.log_queue = queue.Queue()
        self.websocket_connections: List[WebSocket] = []
        
        # Configurar coletores para cada fonte identificada
        self.setup_log_collectors()
        
        # Iniciar processamento assíncrono
        self.processing_thread = threading.Thread(target=self._process_logs_worker, daemon=True)
        self.processing_thread.start()
    
    def setup_log_collectors(self):
        """🔍 Configura coletores para logs existentes identificados na auditoria"""
        
        log_sources = {
            "ui.log": LogSource.UI,
            "mcp_server.log": LogSource.MCP_SERVER,
            "agents/helloworld/helloworld_agent.log": LogSource.AGENT_HELLOWORLD,
            "claude-code-10x/claude-flow-diego/logs/mcp-mem0/mem0-mcp-server.log": LogSource.CLAUDE_FLOW
        }
        
        # Configurar watchers para cada arquivo de log
        for log_file, source in log_sources.items():
            full_path = self.base_dir / log_file
            if full_path.exists():
                self._setup_file_watcher(full_path, source)
    
    def _setup_file_watcher(self, file_path: Path, source: LogSource):
        """👁️ Configura watcher para arquivo de log específico"""
        
        def watch_file():
            try:
                with open(file_path, 'r') as f:
                    # Ir para o final do arquivo
                    f.seek(0, 2)
                    
                    while True:
                        line = f.readline()
                        if line:
                            self._parse_and_queue_log(line.strip(), source, str(file_path))
                        else:
                            time.sleep(0.1)
            except Exception as e:
                self.logger.error("Erro no watcher", file=str(file_path), error=str(e))
        
        # Executar watcher em thread separada
        watcher_thread = threading.Thread(target=watch_file, daemon=True)
        watcher_thread.start()
    
    def _parse_and_queue_log(self, line: str, source: LogSource, file_path: str):
        """📝 Parseia linha de log e adiciona à queue"""
        try:
            # Tentar parsear como JSON primeiro
            try:
                data = json.loads(line)
                level = LogLevel(data.get('level', 'INFO'))
                message = data.get('message', line)
                metadata = data
            except (json.JSONDecodeError, ValueError):
                # Fallback para log texto simples
                level = self._detect_log_level(line)
                message = line
                metadata = {"raw_line": line, "file_path": file_path}
            
            log_entry = LogEntry(
                timestamp=datetime.now(timezone.utc).isoformat(),
                level=level,
                source=source,
                service=source.value,
                message=message,
                metadata=metadata
            )
            
            self.log_queue.put(log_entry)
            
        except Exception as e:
            self.logger.error("Erro ao parsear log", line=line, error=str(e))
    
    def _detect_log_level(self, line: str) -> LogLevel:
        """🔍 Detecta nível de log em texto simples"""
        line_upper = line.upper()
        
        if any(word in line_upper for word in ['ERROR', 'ERRO', 'EXCEPTION', 'FAILED']):
            return LogLevel.ERROR
        elif any(word in line_upper for word in ['WARNING', 'WARN', 'AVISO']):
            return LogLevel.WARNING
        elif any(word in line_upper for word in ['DEBUG', 'TRACE']):
            return LogLevel.DEBUG
        elif any(word in line_upper for word in ['CRITICAL', 'FATAL', 'CRITICO']):
            return LogLevel.CRITICAL
        else:
            return LogLevel.INFO
    
    def _process_logs_worker(self):
        """⚙️ Worker thread para processar logs da queue"""
        while True:
            try:
                log_entry = self.log_queue.get(timeout=1)
                
                # Salvar no arquivo central
                self._save_to_central_log(log_entry)
                
                # Enviar para websockets em tempo real
                self._broadcast_to_websockets(log_entry)
                
                # Verificar alertas
                self._check_alerts(log_entry)
                
                self.log_queue.task_done()
                
            except queue.Empty:
                continue
            except Exception as e:
                self.logger.error("Erro no processamento de logs", error=str(e))
    
    def _save_to_central_log(self, log_entry: LogEntry):
        """💾 Salva log no arquivo central com rotação"""
        
        # Arquivo por dia
        date_str = datetime.now().strftime("%Y-%m-%d")
        log_file = self.logs_dir / f"central-{date_str}.jsonl"
        
        try:
            with open(log_file, 'a', encoding='utf-8') as f:
                f.write(json.dumps(log_entry.to_dict(), ensure_ascii=False) + '\n')
        except Exception as e:
            self.logger.error("Erro ao salvar log central", error=str(e))
    
    async def _broadcast_to_websockets(self, log_entry: LogEntry):
        """📡 Envia log para todas as conexões WebSocket"""
        if not self.websocket_connections:
            return
        
        message = json.dumps(log_entry.to_dict())
        
        # Remover conexões fechadas
        active_connections = []
        for ws in self.websocket_connections:
            try:
                await ws.send_text(message)
                active_connections.append(ws)
            except:
                pass  # Conexão fechada
        
        self.websocket_connections = active_connections
    
    def _check_alerts(self, log_entry: LogEntry):
        """🚨 Verifica se log dispara algum alerta"""
        
        # Alertas para erros críticos
        if log_entry.level in [LogLevel.ERROR, LogLevel.CRITICAL]:
            self._send_alert(log_entry)
    
    def _send_alert(self, log_entry: LogEntry):
        """📢 Envia alerta para log crítico"""
        alert = {
            "type": "critical_log",
            "timestamp": log_entry.timestamp,
            "source": log_entry.source.value,
            "message": log_entry.message,
            "level": log_entry.level.value
        }
        
        # Salvar alerta
        alerts_file = self.logs_dir / "alerts.jsonl"
        with open(alerts_file, 'a') as f:
            f.write(json.dumps(alert) + '\n')
        
        self.logger.critical("ALERTA GERADO", **alert)
    
    def log(self, level: LogLevel, source: LogSource, service: str, 
            message: str, **metadata):
        """📝 API pública para logging"""
        
        log_entry = LogEntry(
            timestamp=datetime.now(timezone.utc).isoformat(),
            level=level,
            source=source,
            service=service,
            message=message,
            metadata=metadata
        )
        
        self.log_queue.put(log_entry)
    
    async def query_logs(self, 
                        source: Optional[LogSource] = None,
                        level: Optional[LogLevel] = None,
                        start_time: Optional[str] = None,
                        end_time: Optional[str] = None,
                        limit: int = 100) -> List[Dict[str, Any]]:
        """🔍 API para consulta de logs"""
        
        # Por simplicidade, retornar logs do dia atual
        # Em produção, usar banco de dados para consultas eficientes
        
        date_str = datetime.now().strftime("%Y-%m-%d")
        log_file = self.logs_dir / f"central-{date_str}.jsonl"
        
        if not log_file.exists():
            return []
        
        logs = []
        try:
            with open(log_file, 'r') as f:
                for line in f:
                    if len(logs) >= limit:
                        break
                    
                    try:
                        log_data = json.loads(line)
                        
                        # Aplicar filtros
                        if source and log_data.get('source') != source.value:
                            continue
                        if level and log_data.get('level') != level.value:
                            continue
                        
                        logs.append(log_data)
                    except json.JSONDecodeError:
                        continue
        except Exception as e:
            self.logger.error("Erro ao consultar logs", error=str(e))
        
        return logs[-limit:]  # Retornar os mais recentes


# 🌐 API FastAPI para acesso aos logs
def create_logging_api(central_logger: CentralLogger) -> FastAPI:
    """Cria API FastAPI para sistema de logging"""
    
    app = FastAPI(title="Central Logging API", version="1.0.0")
    
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    @app.websocket("/ws/logs")
    async def websocket_logs(websocket: WebSocket):
        """WebSocket para logs em tempo real"""
        await websocket.accept()
        central_logger.websocket_connections.append(websocket)
        
        try:
            while True:
                await websocket.receive_text()  # Keep alive
        except:
            pass  # Conexão fechada
    
    @app.get("/logs")
    async def get_logs(
        source: Optional[str] = None,
        level: Optional[str] = None,
        limit: int = 100
    ):
        """Consultar logs"""
        try:
            source_enum = LogSource(source) if source else None
            level_enum = LogLevel(level) if level else None
            
            logs = await central_logger.query_logs(
                source=source_enum,
                level=level_enum,
                limit=limit
            )
            
            return {"logs": logs, "count": len(logs)}
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))
    
    @app.post("/logs")
    async def add_log(log_data: dict):
        """Adicionar novo log via API"""
        try:
            central_logger.log(
                level=LogLevel(log_data.get('level', 'INFO')),
                source=LogSource(log_data.get('source', 'GENERAL')),
                service=log_data.get('service', 'api'),
                message=log_data.get('message', ''),
                **log_data.get('metadata', {})
            )
            return {"status": "success"}
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))
    
    @app.get("/health")
    async def health_check():
        """Health check"""
        return {
            "status": "healthy",
            "queue_size": central_logger.log_queue.qsize(),
            "websocket_connections": len(central_logger.websocket_connections)
        }
    
    return app


# 🚀 Script principal
if __name__ == "__main__":
    print("🚀 Iniciando Sistema Central de Logging...")
    
    # Inicializar logger central
    central_logger = CentralLogger()
    
    # Criar API
    app = create_logging_api(central_logger)
    
    # Log de teste
    central_logger.log(
        level=LogLevel.INFO,
        source=LogSource.GENERAL,
        service="central_logger",
        message="Sistema Central de Logging iniciado com sucesso!",
        version="1.0.0"
    )
    
    print("📊 Sistema iniciado em: http://localhost:8001")
    print("🔍 Logs em tempo real: ws://localhost:8001/ws/logs")
    print("📖 API docs: http://localhost:8001/docs")
    
    # Executar servidor
    uvicorn.run(app, host="0.0.0.0", port=8001)