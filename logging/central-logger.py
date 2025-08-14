#!/usr/bin/env python3
"""
📊 Central Logging System - Claude-20x
Sistema centralizado de logging para todos os serviços
Implementa as recomendações da auditoria SPARC com melhorias:
- Circuit Breaker para resiliência
- Buffer de logs para alta disponibilidade
- Compressão automática
- Métricas de performance
- Tratamento robusto de exceções
"""

import os
import sys
import json
import asyncio
import logging
import traceback
import gzip
import shutil
import psutil
import statistics
from collections import deque, defaultdict
from datetime import datetime, timezone, timedelta
from pathlib import Path
from typing import Dict, List, Optional, Any, Union
from dataclasses import dataclass, asdict, field
from enum import Enum
import aiofiles
import structlog
from logging.handlers import RotatingFileHandler
import uvicorn
from fastapi import FastAPI, WebSocket, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
import threading
import queue
import time

# Importar configurações usando sys.path
sys.path.append('..')
from config import get_config


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


class CircuitBreakerState(Enum):
    """Estados do Circuit Breaker"""
    CLOSED = "closed"
    OPEN = "open"
    HALF_OPEN = "half_open"


@dataclass
class CircuitBreaker:
    """Circuit Breaker para resiliência de serviços"""
    failure_threshold: int = 5
    reset_timeout: int = 60
    failure_count: int = 0
    last_failure_time: Optional[datetime] = None
    state: CircuitBreakerState = CircuitBreakerState.CLOSED
    
    def call(self, func, *args, **kwargs):
        """Executa função com circuit breaker"""
        if self.state == CircuitBreakerState.OPEN:
            if self._should_attempt_reset():
                self.state = CircuitBreakerState.HALF_OPEN
            else:
                raise Exception("Circuit breaker is OPEN")
        
        try:
            result = func(*args, **kwargs)
            self._on_success()
            return result
        except Exception as e:
            self._on_failure()
            raise e
    
    def _should_attempt_reset(self) -> bool:
        """Verifica se deve tentar resetar o circuit breaker"""
        if self.last_failure_time is None:
            return True
        return (datetime.now() - self.last_failure_time).seconds >= self.reset_timeout
    
    def _on_success(self):
        """Callback para sucesso"""
        self.failure_count = 0
        self.state = CircuitBreakerState.CLOSED
    
    def _on_failure(self):
        """Callback para falha"""
        self.failure_count += 1
        self.last_failure_time = datetime.now()
        if self.failure_count >= self.failure_threshold:
            self.state = CircuitBreakerState.OPEN


@dataclass
class PerformanceMetrics:
    """Métricas de performance do sistema"""
    log_write_times: deque = field(default_factory=lambda: deque(maxlen=1000))
    queue_sizes: deque = field(default_factory=lambda: deque(maxlen=1000))
    error_counts: defaultdict = field(default_factory=lambda: defaultdict(int))
    disk_usage: deque = field(default_factory=lambda: deque(maxlen=100))
    memory_usage: deque = field(default_factory=lambda: deque(maxlen=100))
    
    def add_write_time(self, duration: float):
        """Adiciona tempo de escrita"""
        self.log_write_times.append(duration)
    
    def add_queue_size(self, size: int):
        """Adiciona tamanho da queue"""
        self.queue_sizes.append(size)
    
    def increment_error(self, error_type: str):
        """Incrementa contador de erro"""
        self.error_counts[error_type] += 1
    
    def update_system_metrics(self):
        """Atualiza métricas do sistema"""
        try:
            disk = psutil.disk_usage('/')
            memory = psutil.virtual_memory()
            self.disk_usage.append(disk.percent)
            self.memory_usage.append(memory.percent)
        except Exception:
            pass  # Ignore errors in metrics collection
    
    def get_stats(self) -> Dict[str, Any]:
        """Retorna estatísticas consolidadas"""
        stats = {
            "write_times": {
                "avg": statistics.mean(self.log_write_times) if self.log_write_times else 0,
                "max": max(self.log_write_times) if self.log_write_times else 0,
                "min": min(self.log_write_times) if self.log_write_times else 0
            },
            "queue_sizes": {
                "avg": statistics.mean(self.queue_sizes) if self.queue_sizes else 0,
                "max": max(self.queue_sizes) if self.queue_sizes else 0,
                "current": self.queue_sizes[-1] if self.queue_sizes else 0
            },
            "errors": dict(self.error_counts),
            "system": {
                "disk_usage_avg": statistics.mean(self.disk_usage) if self.disk_usage else 0,
                "memory_usage_avg": statistics.mean(self.memory_usage) if self.memory_usage else 0
            }
        }
        return stats


@dataclass
class LogEntry:
    """Estrutura padronizada de log com validação"""
    timestamp: str
    level: LogLevel
    source: LogSource
    service: str
    message: str
    metadata: Dict[str, Any]
    trace_id: Optional[str] = None
    session_id: Optional[str] = None
    user_id: Optional[str] = None
    
    def __post_init__(self):
        """Validação após inicialização"""
        self._validate()
    
    def _validate(self):
        """Valida campos obrigatórios e tipos"""
        if not isinstance(self.message, str):
            raise ValueError("Message deve ser string")
        
        if len(self.message.strip()) == 0:
            raise ValueError("Message não pode estar vazia")
        
        if not isinstance(self.service, str) or len(self.service.strip()) == 0:
            raise ValueError("Service deve ser string não vazia")
        
        if not isinstance(self.metadata, dict):
            raise ValueError("Metadata deve ser dict")
        
        # Validar timestamp
        try:
            datetime.fromisoformat(self.timestamp.replace('Z', '+00:00'))
        except ValueError:
            raise ValueError("Timestamp deve estar em formato ISO")
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            **asdict(self),
            'level': self.level.value,
            'source': self.source.value
        }
    
    def sanitize_for_storage(self) -> Dict[str, Any]:
        """Sanitiza dados para armazenamento seguro"""
        sanitized = self.to_dict().copy()
        
        # Limitar tamanho da mensagem
        if len(sanitized['message']) > 10000:
            sanitized['message'] = sanitized['message'][:10000] + "... [TRUNCATED]"
        
        # Remover dados sensíveis do metadata
        sensitive_keys = ['password', 'token', 'key', 'secret', 'auth']
        if isinstance(sanitized['metadata'], dict):
            for key in list(sanitized['metadata'].keys()):
                if any(sensitive in key.lower() for sensitive in sensitive_keys):
                    sanitized['metadata'][key] = "[REDACTED]"
        
        return sanitized


class CentralLogger:
    """
    🏗️ Sistema Central de Logging Refatorado
    
    Funcionalidades Aprimoradas:
    - Coleta logs de todos os serviços com circuit breaker
    - Padronização de formato com validação rigorosa
    - Rotação e compressão automática de arquivos
    - Buffer inteligente para alta disponibilidade
    - API para consulta de logs com métricas
    - Dashboard em tempo real
    - Alertas automáticos
    - Métricas de performance
    - Batch writes para otimização
    """
    
    def __init__(self, config_override: Optional[Dict[str, Any]] = None):
        # Carregar configurações
        try:
            self.config = get_config()
        except Exception as e:
            logging.error(f"Erro ao carregar configurações: {e}")
            raise RuntimeError("Falha ao inicializar configurações") from e
        
        # Override de configurações se fornecido
        if config_override:
            for key, value in config_override.items():
                if hasattr(self.config, key):
                    setattr(self.config, key, value)
        
        # Configurar paths dinâmicos
        self.base_dir = self.config.paths.project_root
        self.logs_dir = self.config.paths.logs_dir
        self.logs_dir.mkdir(parents=True, exist_ok=True)
        
        # Inicializar componentes
        self.circuit_breaker = CircuitBreaker()
        self.metrics = PerformanceMetrics()
        self.log_buffer = deque(maxlen=10000)  # Buffer para situações críticas
        self.batch_buffer = []
        self.batch_size = 100
        self.last_batch_time = time.time()
        self.max_disk_usage = 90  # Porcentagem máxima de uso do disco
        
        # Configuração estruturada de logs
        try:
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
        except Exception as e:
            logging.error(f"Erro ao configurar structlog: {e}")
            self.logger = logging.getLogger(__name__)
        
        # Queue com limite para prevenir memory leak
        self.log_queue = queue.Queue(maxsize=50000)
        self.websocket_connections: List[WebSocket] = []
        
        # Configurar coletores para cada fonte identificada
        try:
            self.setup_log_collectors()
        except Exception as e:
            self.logger.error(f"Erro ao configurar coletores: {e}")
        
        # Iniciar threads de processamento
        self._start_background_threads()
        
        # Agendar compressão de logs antigos
        self._schedule_log_compression()
    
    def _start_background_threads(self):
        """Inicia threads de processamento em background"""
        try:
            # Thread principal de processamento
            self.processing_thread = threading.Thread(
                target=self._process_logs_worker, 
                daemon=True,
                name="LogProcessor"
            )
            self.processing_thread.start()
            
            # Thread para métricas de sistema
            self.metrics_thread = threading.Thread(
                target=self._metrics_worker,
                daemon=True,
                name="MetricsCollector"
            )
            self.metrics_thread.start()
            
            # Thread para batch writes
            self.batch_thread = threading.Thread(
                target=self._batch_write_worker,
                daemon=True,
                name="BatchWriter"
            )
            self.batch_thread.start()
            
        except Exception as e:
            self.logger.error(f"Erro ao iniciar threads: {e}")
            raise
    
    def setup_log_collectors(self):
        """🔍 Configura coletores para logs existentes identificados na auditoria"""
        
        # Usar paths dinâmicos baseados na configuração
        log_sources = {
            "ui.log": LogSource.UI,
            "mcp_server.log": LogSource.MCP_SERVER,
            "agents/helloworld/helloworld_agent.log": LogSource.AGENT_HELLOWORLD,
        }
        
        # Procurar por logs do Claude Flow dinamicamente
        claude_flow_patterns = [
            "**/claude-flow*/**/logs/**/*.log",
            "**/mcp-*/**/*.log"
        ]
        
        for pattern in claude_flow_patterns:
            try:
                for log_file in self.base_dir.glob(pattern):
                    if log_file.is_file() and log_file.stat().st_size > 0:
                        log_sources[str(log_file.relative_to(self.base_dir))] = LogSource.CLAUDE_FLOW
            except Exception as e:
                self.logger.warning(f"Erro ao buscar logs com padrão {pattern}: {e}")
        
        # Configurar watchers para cada arquivo de log
        for log_file, source in log_sources.items():
            full_path = self.base_dir / log_file
            if full_path.exists():
                try:
                    self._setup_file_watcher(full_path, source)
                except Exception as e:
                    self.logger.error(f"Erro ao configurar watcher para {full_path}: {e}")
    
    def _setup_file_watcher(self, file_path: Path, source: LogSource):
        """👁️ Configura watcher para arquivo de log específico com circuit breaker"""
        
        def watch_file():
            file_watcher_breaker = CircuitBreaker(failure_threshold=3, reset_timeout=30)
            
            while True:
                try:
                    def read_file():
                        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                            # Ir para o final do arquivo
                            f.seek(0, 2)
                            
                            while True:
                                line = f.readline()
                                if line:
                                    self._parse_and_queue_log(line.strip(), source, str(file_path))
                                else:
                                    time.sleep(0.1)
                                    # Verificar se arquivo ainda existe
                                    if not file_path.exists():
                                        return
                    
                    file_watcher_breaker.call(read_file)
                    
                except Exception as e:
                    self.logger.error(f"Erro no watcher para {file_path}: {e}")
                    self.metrics.increment_error("file_watcher_error")
                    time.sleep(5)  # Backoff em caso de erro
        
        # Executar watcher em thread separada
        try:
            watcher_thread = threading.Thread(
                target=watch_file, 
                daemon=True,
                name=f"FileWatcher-{source.value}"
            )
            watcher_thread.start()
            self.logger.info(f"Watcher iniciado para {file_path}")
        except Exception as e:
            self.logger.error(f"Erro ao iniciar watcher thread: {e}")
            raise
    
    def _parse_and_queue_log(self, line: str, source: LogSource, file_path: str):
        """📝 Parseia linha de log e adiciona à queue com validação"""
        if not line or not line.strip():
            return
        
        try:
            # Validação básica de entrada
            if len(line) > 50000:  # Limitar tamanho da linha
                line = line[:50000] + "... [TRUNCATED]"
            
            # Tentar parsear como JSON primeiro
            try:
                data = json.loads(line)
                level_str = data.get('level', 'INFO')
                # Validar nível de log
                try:
                    level = LogLevel(level_str.upper())
                except ValueError:
                    level = LogLevel.INFO
                
                message = str(data.get('message', line))[:10000]  # Limitar tamanho
                metadata = data if isinstance(data, dict) else {"raw_data": str(data)}
                
            except (json.JSONDecodeError, ValueError, TypeError):
                # Fallback para log texto simples
                level = self._detect_log_level(line)
                message = line[:10000]  # Limitar tamanho
                metadata = {"raw_line": line, "file_path": file_path, "parse_method": "text"}
            
            # Criar entrada de log com validação
            try:
                log_entry = LogEntry(
                    timestamp=datetime.now(timezone.utc).isoformat(),
                    level=level,
                    source=source,
                    service=source.value,
                    message=message,
                    metadata=metadata
                )
                
                # Tentar adicionar à queue principal
                try:
                    self.log_queue.put_nowait(log_entry)
                except queue.Full:
                    # Se queue está cheia, usar buffer de emergência
                    self.log_buffer.append(log_entry)
                    self.metrics.increment_error("queue_full")
                    self.logger.warning("Queue principal cheia, usando buffer")
                
            except ValueError as ve:
                self.logger.error(f"Erro de validação no log entry: {ve}", extra={"line": line[:1000]})
                self.metrics.increment_error("validation_error")
            
        except Exception as e:
            self.logger.error(f"Erro crítico ao parsear log: {e}", extra={"line": line[:1000]})
            self.metrics.increment_error("parse_error")
            # Em caso de erro crítico, ainda tentar salvar informação básica
            try:
                emergency_entry = LogEntry(
                    timestamp=datetime.now(timezone.utc).isoformat(),
                    level=LogLevel.ERROR,
                    source=LogSource.GENERAL,
                    service="parser",
                    message=f"Erro ao parsear log: {str(e)[:1000]}",
                    metadata={"original_line": line[:1000], "error": str(e)}
                )
                self.log_buffer.append(emergency_entry)
            except Exception:
                pass  # Se nem isso funcionar, desistir silenciosamente
    
    def _detect_log_level(self, line: str) -> LogLevel:
        """🔍 Detecta nível de log em texto simples com análise aprimorada"""
        if not line:
            return LogLevel.INFO
        
        line_upper = line.upper()
        
        # Ordem de prioridade: CRITICAL > ERROR > WARNING > DEBUG > INFO
        critical_patterns = ['CRITICAL', 'FATAL', 'CRITICO', 'PANIC', 'EMERGENCY']
        error_patterns = ['ERROR', 'ERRO', 'EXCEPTION', 'FAILED', 'FAILURE', 'TRACEBACK']
        warning_patterns = ['WARNING', 'WARN', 'AVISO', 'DEPRECATED', 'ALERT']
        debug_patterns = ['DEBUG', 'TRACE', 'VERBOSE']
        
        for pattern in critical_patterns:
            if pattern in line_upper:
                return LogLevel.CRITICAL
        
        for pattern in error_patterns:
            if pattern in line_upper:
                return LogLevel.ERROR
        
        for pattern in warning_patterns:
            if pattern in line_upper:
                return LogLevel.WARNING
        
        for pattern in debug_patterns:
            if pattern in line_upper:
                return LogLevel.DEBUG
        
        return LogLevel.INFO
    
    def _metrics_worker(self):
        """Worker para coleta de métricas do sistema"""
        while True:
            try:
                # Atualizar métricas de sistema
                self.metrics.update_system_metrics()
                
                # Atualizar tamanho da queue
                queue_size = self.log_queue.qsize()
                self.metrics.add_queue_size(queue_size)
                
                # Verificar uso do disco
                if self.metrics.disk_usage and self.metrics.disk_usage[-1] > self.max_disk_usage:
                    self.logger.warning(f"Uso do disco alto: {self.metrics.disk_usage[-1]:.1f}%")
                    self._compress_old_logs()
                
                time.sleep(30)  # Coleta métricas a cada 30 segundos
                
            except Exception as e:
                self.logger.error(f"Erro no worker de métricas: {e}")
                time.sleep(60)  # Esperar mais tempo em caso de erro
    
    def _batch_write_worker(self):
        """Worker para escritas em batch"""
        while True:
            try:
                current_time = time.time()
                
                # Verifica se deve escrever batch (por tamanho ou tempo)
                if (len(self.batch_buffer) >= self.batch_size or 
                    (current_time - self.last_batch_time) > 10):  # 10 segundos
                    
                    if self.batch_buffer:
                        self._write_batch_logs()
                        self.last_batch_time = current_time
                
                time.sleep(1)  # Verificar a cada segundo
                
            except Exception as e:
                self.logger.error(f"Erro no worker de batch: {e}")
                time.sleep(5)
    
    def _write_batch_logs(self):
        """Escreve logs em batch para otimização"""
        if not self.batch_buffer:
            return
        
        start_time = time.time()
        
        try:
            # Agrupar logs por data
            logs_by_date = defaultdict(list)
            
            for log_entry in self.batch_buffer:
                try:
                    log_date = datetime.fromisoformat(
                        log_entry.timestamp.replace('Z', '+00:00')
                    ).date()
                    logs_by_date[log_date].append(log_entry.sanitize_for_storage())
                except Exception as e:
                    self.logger.warning(f"Erro ao processar log para batch: {e}")
                    continue
            
            # Escrever logs agrupados
            for log_date, logs in logs_by_date.items():
                log_file = self.logs_dir / f"central-{log_date}.jsonl"
                
                try:
                    with open(log_file, 'a', encoding='utf-8') as f:
                        for log_data in logs:
                            f.write(json.dumps(log_data, ensure_ascii=False) + '\n')
                except Exception as e:
                    self.logger.error(f"Erro ao escrever batch para {log_file}: {e}")
                    # Em caso de erro, tentar salvar no buffer de emergência
                    for log_data in logs:
                        try:
                            log_entry = LogEntry(**log_data)
                            self.log_buffer.append(log_entry)
                        except Exception:
                            pass
            
            # Limpar buffer
            self.batch_buffer.clear()
            
            # Registrar métricas
            write_duration = time.time() - start_time
            self.metrics.add_write_time(write_duration)
            
        except Exception as e:
            self.logger.error(f"Erro crítico ao escrever batch: {e}")
            self.metrics.increment_error("batch_write_error")
    
    def _process_logs_worker(self):
        """⚙️ Worker thread para processar logs da queue"""
        while True:
            try:
                log_entry = self.log_queue.get(timeout=1)
                
                # Adicionar ao buffer de batch
                self.batch_buffer.append(log_entry)
                
                # Enviar para websockets em tempo real (se houver conexões)
                if self.websocket_connections:
                    asyncio.create_task(self._broadcast_to_websockets(log_entry))
                
                # Verificar alertas
                self._check_alerts(log_entry)
                
                self.log_queue.task_done()
                
            except queue.Empty:
                # Processar buffer de emergência se houver
                if self.log_buffer:
                    try:
                        emergency_log = self.log_buffer.popleft()
                        self.batch_buffer.append(emergency_log)
                    except IndexError:
                        pass
                continue
            except Exception as e:
                self.logger.error(f"Erro no processamento de logs: {e}")
                self.metrics.increment_error("processing_error")
    
    def _schedule_log_compression(self):
        """Agenda compressão de logs antigos"""
        def compression_worker():
            while True:
                try:
                    # Comprimir logs mais antigos que X dias
                    retention_days = getattr(self.config.logger, 'retention_days', 30)
                    cutoff_date = datetime.now() - timedelta(days=7)  # Comprimir logs de 7+ dias
                    
                    for log_file in self.logs_dir.glob("central-*.jsonl"):
                        try:
                            # Extrair data do nome do arquivo
                            date_str = log_file.stem.replace('central-', '')
                            file_date = datetime.strptime(date_str, '%Y-%m-%d')
                            
                            if file_date.date() < cutoff_date.date():
                                self._compress_log_file(log_file)
                        except Exception as e:
                            self.logger.warning(f"Erro ao processar {log_file} para compressão: {e}")
                    
                    # Dormir por 24 horas
                    time.sleep(86400)
                    
                except Exception as e:
                    self.logger.error(f"Erro no worker de compressão: {e}")
                    time.sleep(3600)  # Tentar novamente em 1 hora
        
        compression_thread = threading.Thread(
            target=compression_worker,
            daemon=True,
            name="LogCompressor"
        )
        compression_thread.start()
    
    def _compress_log_file(self, log_file: Path):
        """Comprime arquivo de log específico"""
        compressed_file = log_file.with_suffix('.jsonl.gz')
        
        if compressed_file.exists():
            return  # Já comprimido
        
        try:
            with open(log_file, 'rb') as f_in:
                with gzip.open(compressed_file, 'wb') as f_out:
                    shutil.copyfileobj(f_in, f_out)
            
            # Remover arquivo original após compressão bem-sucedida
            log_file.unlink()
            self.logger.info(f"Log comprimido: {log_file} -> {compressed_file}")
            
        except Exception as e:
            self.logger.error(f"Erro ao comprimir {log_file}: {e}")
            # Remover arquivo comprimido parcial em caso de erro
            if compressed_file.exists():
                try:
                    compressed_file.unlink()
                except Exception:
                    pass
    
    def _compress_old_logs(self):
        """Comprime logs antigos quando disco está cheio"""
        try:
            # Comprimir logs de mais de 1 dia quando disco está cheio
            cutoff_date = datetime.now() - timedelta(days=1)
            
            for log_file in self.logs_dir.glob("central-*.jsonl"):
                try:
                    date_str = log_file.stem.replace('central-', '')
                    file_date = datetime.strptime(date_str, '%Y-%m-%d')
                    
                    if file_date.date() < cutoff_date.date():
                        self._compress_log_file(log_file)
                except Exception as e:
                    self.logger.warning(f"Erro na compressão de emergência de {log_file}: {e}")
                    
        except Exception as e:
            self.logger.error(f"Erro na compressão de emergência: {e}")
    
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
            except Exception:
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
        try:
            alerts_file = self.logs_dir / "alerts.jsonl"
            with open(alerts_file, 'a', encoding='utf-8') as f:
                f.write(json.dumps(alert, ensure_ascii=False) + '\n')
        except Exception as e:
            self.logger.error(f"Erro ao salvar alerta: {e}")
        
        self.logger.critical("ALERTA GERADO", **alert)
    
    def log(self, level: LogLevel, source: LogSource, service: str, 
            message: str, **metadata):
        """📝 API pública para logging com validação"""
        
        # Validações de entrada
        if not isinstance(message, str) or not message.strip():
            raise ValueError("Message deve ser string não vazia")
        
        if not isinstance(service, str) or not service.strip():
            raise ValueError("Service deve ser string não vazia")
        
        if not isinstance(metadata, dict):
            metadata = {}
        
        try:
            log_entry = LogEntry(
                timestamp=datetime.now(timezone.utc).isoformat(),
                level=level,
                source=source,
                service=service,
                message=message.strip(),
                metadata=metadata
            )
            
            try:
                self.log_queue.put_nowait(log_entry)
            except queue.Full:
                # Usar buffer de emergência
                self.log_buffer.append(log_entry)
                self.metrics.increment_error("queue_full_api")
                
        except Exception as e:
            self.logger.error(f"Erro ao adicionar log via API: {e}")
            self.metrics.increment_error("api_log_error")
            raise
    
    async def query_logs(self, 
                        source: Optional[LogSource] = None,
                        level: Optional[LogLevel] = None,
                        start_time: Optional[str] = None,
                        end_time: Optional[str] = None,
                        limit: int = 100) -> List[Dict[str, Any]]:
        """🔍 API para consulta de logs com filtros aprimorados"""
        
        # Validar parâmetros
        if limit <= 0 or limit > 10000:
            raise ValueError("Limit deve estar entre 1 e 10000")
        
        logs = []
        
        try:
            # Determinar arquivos a serem pesquisados
            if start_time:
                start_date = datetime.fromisoformat(start_time.replace('Z', '+00:00')).date()
            else:
                start_date = datetime.now().date()
            
            if end_time:
                end_date = datetime.fromisoformat(end_time.replace('Z', '+00:00')).date()
            else:
                end_date = datetime.now().date()
            
            # Pesquisar em arquivos de log
            current_date = start_date
            while current_date <= end_date and len(logs) < limit:
                log_file = self.logs_dir / f"central-{current_date}.jsonl"
                compressed_file = self.logs_dir / f"central-{current_date}.jsonl.gz"
                
                # Tentar arquivo normal primeiro, depois comprimido
                file_to_read = None
                is_compressed = False
                
                if log_file.exists():
                    file_to_read = log_file
                elif compressed_file.exists():
                    file_to_read = compressed_file
                    is_compressed = True
                
                if file_to_read:
                    logs.extend(await self._read_log_file(
                        file_to_read, is_compressed, source, level, 
                        start_time, end_time, limit - len(logs)
                    ))
                
                current_date += timedelta(days=1)
            
        except Exception as e:
            self.logger.error(f"Erro ao consultar logs: {e}")
            raise
        
        return logs[-limit:]  # Retornar os mais recentes
    
    async def _read_log_file(self, file_path: Path, is_compressed: bool,
                           source: Optional[LogSource], level: Optional[LogLevel],
                           start_time: Optional[str], end_time: Optional[str],
                           limit: int) -> List[Dict[str, Any]]:
        """Lê arquivo de log com filtros"""
        logs = []
        
        try:
            if is_compressed:
                with gzip.open(file_path, 'rt', encoding='utf-8') as f:
                    lines = f.readlines()
            else:
                with open(file_path, 'r', encoding='utf-8') as f:
                    lines = f.readlines()
            
            for line in lines:
                if len(logs) >= limit:
                    break
                
                try:
                    log_data = json.loads(line.strip())
                    
                    # Aplicar filtros
                    if source and log_data.get('source') != source.value:
                        continue
                    if level and log_data.get('level') != level.value:
                        continue
                    
                    # Filtro de tempo
                    if start_time or end_time:
                        log_time = log_data.get('timestamp')
                        if log_time:
                            if start_time and log_time < start_time:
                                continue
                            if end_time and log_time > end_time:
                                continue
                    
                    logs.append(log_data)
                    
                except json.JSONDecodeError:
                    continue
                    
        except Exception as e:
            self.logger.error(f"Erro ao ler arquivo {file_path}: {e}")
        
        return logs
    
    def get_health_status(self) -> Dict[str, Any]:
        """🔍 Health check detalhado"""
        try:
            # Métricas básicas
            queue_size = self.log_queue.qsize()
            buffer_size = len(self.log_buffer)
            websocket_count = len(self.websocket_connections)
            
            # Métricas de performance
            performance_stats = self.metrics.get_stats()
            
            # Estado do circuit breaker
            circuit_breaker_status = {
                "state": self.circuit_breaker.state.value,
                "failure_count": self.circuit_breaker.failure_count,
                "last_failure": self.circuit_breaker.last_failure_time.isoformat() if self.circuit_breaker.last_failure_time else None
            }
            
            # Verificar threads
            threads_status = {
                "processing_thread": self.processing_thread.is_alive() if hasattr(self, 'processing_thread') else False,
                "metrics_thread": self.metrics_thread.is_alive() if hasattr(self, 'metrics_thread') else False,
                "batch_thread": self.batch_thread.is_alive() if hasattr(self, 'batch_thread') else False,
            }
            
            # Status do disco
            try:
                disk_usage = psutil.disk_usage(str(self.logs_dir))
                disk_status = {
                    "total_gb": round(disk_usage.total / (1024**3), 2),
                    "used_gb": round(disk_usage.used / (1024**3), 2),
                    "free_gb": round(disk_usage.free / (1024**3), 2),
                    "percent_used": round((disk_usage.used / disk_usage.total) * 100, 1)
                }
            except Exception:
                disk_status = {"error": "Não foi possível obter status do disco"}
            
            # Determinar status geral
            status = "healthy"
            issues = []
            
            if queue_size > 40000:
                issues.append("Queue quase cheia")
                status = "degraded"
            
            if buffer_size > 5000:
                issues.append("Buffer de emergência em uso")
                status = "degraded"
            
            if self.circuit_breaker.state != CircuitBreakerState.CLOSED:
                issues.append("Circuit breaker não está fechado")
                status = "unhealthy"
            
            if not all(threads_status.values()):
                issues.append("Algumas threads não estão rodando")
                status = "unhealthy"
            
            if disk_status.get("percent_used", 0) > 90:
                issues.append("Disco quase cheio")
                status = "degraded"
            
            return {
                "status": status,
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "issues": issues,
                "metrics": {
                    "queue_size": queue_size,
                    "buffer_size": buffer_size,
                    "websocket_connections": websocket_count,
                    "batch_buffer_size": len(self.batch_buffer)
                },
                "performance": performance_stats,
                "circuit_breaker": circuit_breaker_status,
                "threads": threads_status,
                "disk": disk_status,
                "config": {
                    "max_queue_size": self.log_queue.maxsize,
                    "batch_size": self.batch_size,
                    "logs_dir": str(self.logs_dir)
                }
            }
            
        except Exception as e:
            self.logger.error(f"Erro ao gerar health status: {e}")
            return {
                "status": "error",
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "error": str(e)
            }


# 🌐 API FastAPI para acesso aos logs
def create_logging_api(central_logger: CentralLogger) -> FastAPI:
    """Cria API FastAPI para sistema de logging"""
    
    app = FastAPI(title="Central Logging API", version="2.0.0")
    
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
        except Exception:
            pass  # Conexão fechada
        finally:
            if websocket in central_logger.websocket_connections:
                central_logger.websocket_connections.remove(websocket)
    
    @app.get("/logs")
    async def get_logs(
        source: Optional[str] = None,
        level: Optional[str] = None,
        start_time: Optional[str] = None,
        end_time: Optional[str] = None,
        limit: int = 100
    ):
        """Consultar logs com filtros avançados"""
        try:
            # Validar parâmetros
            source_enum = LogSource(source) if source else None
            level_enum = LogLevel(level) if level else None
            
            logs = await central_logger.query_logs(
                source=source_enum,
                level=level_enum,
                start_time=start_time,
                end_time=end_time,
                limit=limit
            )
            
            return {
                "logs": logs, 
                "count": len(logs),
                "filters": {
                    "source": source,
                    "level": level,
                    "start_time": start_time,
                    "end_time": end_time,
                    "limit": limit
                }
            }
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))
        except Exception as e:
            central_logger.logger.error(f"Erro na consulta de logs: {e}")
            raise HTTPException(status_code=500, detail="Erro interno do servidor")
    
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
        except Exception as e:
            central_logger.logger.error(f"Erro ao adicionar log via API: {e}")
            raise HTTPException(status_code=500, detail="Erro interno do servidor")
    
    @app.get("/health")
    async def health_check():
        """Health check detalhado"""
        return central_logger.get_health_status()
    
    @app.get("/metrics")
    async def get_metrics():
        """Métricas de performance"""
        return central_logger.metrics.get_stats()
    
    @app.get("/config")
    async def get_config_info():
        """Informações de configuração (sem dados sensíveis)"""
        try:
            return central_logger.config.to_dict()
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Erro ao obter configurações: {e}")
    
    return app


# 🚀 Script principal
if __name__ == "__main__":
    print("🚀 Iniciando Sistema Central de Logging Refatorado...")
    
    try:
        # Inicializar logger central
        central_logger = CentralLogger()
        
        # Criar API
        app = create_logging_api(central_logger)
        
        # Log de teste
        central_logger.log(
            level=LogLevel.INFO,
            source=LogSource.GENERAL,
            service="central_logger",
            message="Sistema Central de Logging refatorado iniciado com sucesso!",
            version="2.0.0",
            features=["circuit_breaker", "buffer", "compression", "metrics", "batch_writes"]
        )
        
        # Informações do sistema
        config = central_logger.config
        port = config.logger.port
        
        print(f"📊 Sistema iniciado em: http://localhost:{port}")
        print(f"🔍 Logs em tempo real: ws://localhost:{port}/ws/logs")
        print(f"📖 API docs: http://localhost:{port}/docs")
        print(f"💾 Logs salvos em: {central_logger.logs_dir}")
        print(f"⚡ Melhorias ativas: Circuit Breaker, Buffer, Compressão, Métricas, Batch Writes")
        
        # Executar servidor
        uvicorn.run(app, host="0.0.0.0", port=port)
        
    except Exception as e:
        print(f"❌ Erro ao inicializar sistema: {e}")
        import traceback
        traceback.print_exc()
        exit(1)