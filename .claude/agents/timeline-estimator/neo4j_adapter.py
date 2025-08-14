#!/usr/bin/env python3
"""
Neo4j Memory Adapter com Dual-Write para SQLite
Permite migração gradual mantendo compatibilidade
"""

import json
import sqlite3
import time
from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime
import logging
import os

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class Neo4jMemoryAdapter:
    """Adapter para gerenciar memórias no Neo4j com fallback para SQLite"""
    
    def __init__(self, 
                 sqlite_path: str = ".swarm/memory.db",
                 dual_write: bool = True,
                 cache_enabled: bool = True):
        """
        Inicializa o adapter com suporte dual-write
        
        Args:
            sqlite_path: Caminho para o banco SQLite
            dual_write: Se True, escreve em ambos os bancos
            cache_enabled: Se True, usa cache em memória
        """
        self.sqlite_path = sqlite_path
        self.dual_write = dual_write
        self.cache_enabled = cache_enabled
        self.cache = {} if cache_enabled else None
        
        # Garantir que o diretório existe
        os.makedirs(os.path.dirname(sqlite_path), exist_ok=True)
        
        # Inicializar conexão SQLite
        self.sqlite_conn = sqlite3.connect(sqlite_path)
        self._ensure_sqlite_tables()
        
        # Configuração para Neo4j MCP
        self.neo4j_tool = "mcp__knowall-ai-mcp-neo-4-j-agent-memory__"
        
        logger.info(f"Neo4j Adapter inicializado - Dual-write: {dual_write}")
    
    def _ensure_sqlite_tables(self):
        """Garante que as tabelas SQLite existem"""
        cursor = self.sqlite_conn.cursor()
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS memory_entries (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                key TEXT NOT NULL,
                value TEXT NOT NULL,
                namespace TEXT NOT NULL DEFAULT 'default',
                metadata TEXT,
                created_at INTEGER DEFAULT (strftime('%s', 'now')),
                updated_at INTEGER DEFAULT (strftime('%s', 'now')),
                accessed_at INTEGER DEFAULT (strftime('%s', 'now')),
                access_count INTEGER DEFAULT 0,
                ttl INTEGER,
                expires_at INTEGER
            )
        ''')
        self.sqlite_conn.commit()
    
    def _parse_memory_entry(self, entry: Dict) -> Tuple[str, Dict]:
        """
        Converte entrada SQLite para formato Neo4j
        
        Returns:
            (label, properties)
        """
        # Determinar label baseado no namespace ou tipo
        namespace = entry.get('namespace', 'default')
        key = entry.get('key', '')
        
        # Mapear namespaces para labels Neo4j
        label_map = {
            'hooks:post-bash': 'command',
            'command-results': 'result',
            'performance-metrics': 'metric',
            'agent': 'agent',
            'task': 'task',
            'default': 'memory'
        }
        
        label = label_map.get(namespace, 'memory')
        
        # Converter value (pode ser JSON)
        value = entry.get('value', '')
        try:
            value_dict = json.loads(value) if isinstance(value, str) else value
        except:
            value_dict = {'content': value}
        
        # Construir propriedades
        properties = {
            'name': key,
            'namespace': namespace,
            'created_at': entry.get('created_at', int(time.time())),
            'updated_at': entry.get('updated_at', int(time.time())),
            **value_dict
        }
        
        # Adicionar metadata se existir
        if entry.get('metadata'):
            try:
                metadata = json.loads(entry['metadata'])
                properties.update(metadata)
            except:
                pass
        
        return label, properties
    
    def create_memory(self, 
                     key: str, 
                     value: Any, 
                     namespace: str = "default",
                     metadata: Optional[Dict] = None,
                     ttl: Optional[int] = None) -> Dict:
        """
        Cria uma nova memória em ambos os sistemas
        
        Args:
            key: Chave única da memória
            value: Valor a armazenar
            namespace: Namespace para organização
            metadata: Metadados adicionais
            ttl: Time-to-live em segundos
        
        Returns:
            Dict com informações da memória criada
        """
        # Preparar dados
        value_str = json.dumps(value) if not isinstance(value, str) else value
        metadata_str = json.dumps(metadata) if metadata else None
        timestamp = int(time.time())
        expires_at = timestamp + ttl if ttl else None
        
        result = {}
        
        # 1. Escrever no SQLite
        try:
            cursor = self.sqlite_conn.cursor()
            cursor.execute('''
                INSERT INTO memory_entries 
                (key, value, namespace, metadata, ttl, expires_at)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', (key, value_str, namespace, metadata_str, ttl, expires_at))
            self.sqlite_conn.commit()
            sqlite_id = cursor.lastrowid
            result['sqlite_id'] = sqlite_id
            logger.debug(f"SQLite: Memória criada - ID {sqlite_id}")
        except Exception as e:
            logger.error(f"Erro ao criar no SQLite: {e}")
            raise
        
        # 2. Escrever no Neo4j se dual_write ativo
        if self.dual_write:
            try:
                # Converter para formato Neo4j
                entry = {
                    'key': key,
                    'value': value_str,
                    'namespace': namespace,
                    'metadata': metadata_str,
                    'created_at': timestamp
                }
                label, properties = self._parse_memory_entry(entry)
                
                # Criar no Neo4j via MCP tool
                # Nota: Em produção, isso seria uma chamada real ao MCP
                result['neo4j'] = {
                    'label': label,
                    'properties': properties,
                    'status': 'pending_mcp_call'
                }
                logger.info(f"Neo4j: Preparado para criar - Label: {label}")
                
            except Exception as e:
                logger.error(f"Erro ao preparar para Neo4j: {e}")
                # Não falhar se Neo4j der erro (graceful degradation)
        
        # 3. Atualizar cache
        if self.cache_enabled:
            cache_key = f"{namespace}:{key}"
            self.cache[cache_key] = {
                'value': value,
                'metadata': metadata,
                'timestamp': timestamp
            }
        
        return result
    
    def search_memories(self,
                       query: Optional[str] = None,
                       namespace: Optional[str] = None,
                       limit: int = 10) -> List[Dict]:
        """
        Busca memórias com suporte a fallback
        
        Args:
            query: Texto para buscar
            namespace: Filtrar por namespace
            limit: Número máximo de resultados
        
        Returns:
            Lista de memórias encontradas
        """
        results = []
        
        # Tentar buscar no cache primeiro
        if self.cache_enabled and not query:
            for cache_key, cache_value in list(self.cache.items())[:limit]:
                if namespace and not cache_key.startswith(f"{namespace}:"):
                    continue
                results.append(cache_value)
            if results:
                return results
        
        # Buscar no SQLite (sempre disponível)
        try:
            cursor = self.sqlite_conn.cursor()
            sql = "SELECT * FROM memory_entries WHERE 1=1"
            params = []
            
            if namespace:
                sql += " AND namespace = ?"
                params.append(namespace)
            
            if query:
                sql += " AND (key LIKE ? OR value LIKE ?)"
                params.extend([f"%{query}%", f"%{query}%"])
            
            sql += f" ORDER BY updated_at DESC LIMIT {limit}"
            
            cursor.execute(sql, params)
            columns = [desc[0] for desc in cursor.description]
            
            for row in cursor.fetchall():
                entry = dict(zip(columns, row))
                results.append(entry)
            
            logger.debug(f"SQLite: Encontradas {len(results)} memórias")
            
        except Exception as e:
            logger.error(f"Erro ao buscar no SQLite: {e}")
        
        return results
    
    def update_memory(self,
                     key: str,
                     value: Any,
                     namespace: str = "default",
                     metadata: Optional[Dict] = None) -> bool:
        """
        Atualiza uma memória existente
        
        Args:
            key: Chave da memória
            value: Novo valor
            namespace: Namespace
            metadata: Novos metadados
        
        Returns:
            True se atualizado com sucesso
        """
        value_str = json.dumps(value) if not isinstance(value, str) else value
        metadata_str = json.dumps(metadata) if metadata else None
        timestamp = int(time.time())
        
        success = False
        
        # 1. Atualizar SQLite
        try:
            cursor = self.sqlite_conn.cursor()
            cursor.execute('''
                UPDATE memory_entries 
                SET value = ?, metadata = ?, updated_at = ?
                WHERE key = ? AND namespace = ?
            ''', (value_str, metadata_str, timestamp, key, namespace))
            self.sqlite_conn.commit()
            success = cursor.rowcount > 0
            
            if success:
                logger.debug(f"SQLite: Memória atualizada - {namespace}:{key}")
        except Exception as e:
            logger.error(f"Erro ao atualizar SQLite: {e}")
        
        # 2. Atualizar cache
        if self.cache_enabled and success:
            cache_key = f"{namespace}:{key}"
            self.cache[cache_key] = {
                'value': value,
                'metadata': metadata,
                'timestamp': timestamp
            }
        
        return success
    
    def delete_memory(self, key: str, namespace: str = "default") -> bool:
        """
        Remove uma memória
        
        Args:
            key: Chave da memória
            namespace: Namespace
        
        Returns:
            True se removido com sucesso
        """
        success = False
        
        # 1. Remover do SQLite
        try:
            cursor = self.sqlite_conn.cursor()
            cursor.execute('''
                DELETE FROM memory_entries 
                WHERE key = ? AND namespace = ?
            ''', (key, namespace))
            self.sqlite_conn.commit()
            success = cursor.rowcount > 0
            
            if success:
                logger.debug(f"SQLite: Memória removida - {namespace}:{key}")
        except Exception as e:
            logger.error(f"Erro ao remover do SQLite: {e}")
        
        # 2. Remover do cache
        if self.cache_enabled:
            cache_key = f"{namespace}:{key}"
            self.cache.pop(cache_key, None)
        
        return success
    
    def get_statistics(self) -> Dict:
        """
        Retorna estatísticas sobre as memórias
        
        Returns:
            Dict com estatísticas
        """
        stats = {
            'total_memories': 0,
            'namespaces': {},
            'cache_size': len(self.cache) if self.cache_enabled else 0,
            'dual_write_enabled': self.dual_write
        }
        
        try:
            cursor = self.sqlite_conn.cursor()
            
            # Total de memórias
            cursor.execute("SELECT COUNT(*) FROM memory_entries")
            stats['total_memories'] = cursor.fetchone()[0]
            
            # Memórias por namespace
            cursor.execute("""
                SELECT namespace, COUNT(*) 
                FROM memory_entries 
                GROUP BY namespace
            """)
            for namespace, count in cursor.fetchall():
                stats['namespaces'][namespace] = count
            
        except Exception as e:
            logger.error(f"Erro ao obter estatísticas: {e}")
        
        return stats
    
    def close(self):
        """Fecha conexões"""
        if self.sqlite_conn:
            self.sqlite_conn.close()
        logger.info("Conexões fechadas")


if __name__ == "__main__":
    # Teste básico do adapter
    adapter = Neo4jMemoryAdapter(dual_write=True)
    
    # Criar uma memória de teste
    result = adapter.create_memory(
        key="test_migration",
        value={"message": "Teste de migração para Neo4j"},
        namespace="migration_test",
        metadata={"phase": "testing", "timestamp": datetime.now().isoformat()}
    )
    print(f"Memória criada: {result}")
    
    # Buscar memórias
    memories = adapter.search_memories(namespace="migration_test")
    print(f"Memórias encontradas: {len(memories)}")
    
    # Estatísticas
    stats = adapter.get_statistics()
    print(f"Estatísticas: {stats}")
    
    adapter.close()