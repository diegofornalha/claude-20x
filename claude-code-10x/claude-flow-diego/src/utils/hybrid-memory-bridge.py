#!/usr/bin/env python3
"""
Hybrid Memory Bridge - Integra Docker mem0-bridge com Mem0 Python local
Permite usar tanto a API REST Docker quanto a API Python diretamente
"""

import asyncio
import json
import requests
from typing import List, Dict, Any, Optional
from dataclasses import dataclass
import os
import sys

# Configuração do ambiente virtual Mem0
sys.path.insert(0, '/Users/agents/mem0-venv/lib/python3.13/site-packages')

try:
    from mem0 import MemoryClient
except ImportError:
    print("❌ Mem0 não encontrado. Instalando...")
    os.system("source ~/mem0-venv/bin/activate && pip install mem0ai")
    from mem0 import MemoryClient

@dataclass
class MemoryEntry:
    id: str
    content: str
    user_id: str
    metadata: Dict[str, Any]
    created_at: str

class HybridMemoryBridge:
    """
    Bridge híbrido que combina:
    1. Docker mem0-bridge (HTTP REST API) - para compatibilidade com containers
    2. Mem0 Python local (API direta) - para performance e features avançadas
    """
    
    def __init__(self):
        self.docker_base_url = "http://localhost:3002"
        self.local_mem0 = None
        self.use_docker = True
        self.use_local = True
        
    async def initialize(self):
        """Inicializa os dois sistemas de memória"""
        print("🔄 Inicializando Hybrid Memory Bridge...")
        
        # Testar conexão Docker
        try:
            response = requests.get(f"{self.docker_base_url}/health", timeout=5)
            if response.status_code == 200:
                print("✅ Docker mem0-bridge: Conectado")
            else:
                print("⚠️  Docker mem0-bridge: Disponível mas com problemas")
        except Exception as e:
            print(f"❌ Docker mem0-bridge: Não disponível ({e})")
            self.use_docker = False
            
        # Inicializar Mem0 local
        try:
            # Para uso local, vamos usar apenas API em memória por enquanto
            # Mem0 pode ser configurado com diferentes backends
            print("✅ Mem0 Python local: Inicializando...")
            self.use_local = True
        except Exception as e:
            print(f"❌ Mem0 Python local: Erro na inicialização ({e})")
            self.use_local = False
            
        if not self.use_docker and not self.use_local:
            raise Exception("❌ Nenhum sistema de memória disponível!")
            
        print(f"✅ Hybrid Bridge ativo - Docker: {self.use_docker}, Local: {self.use_local}")
        
    async def store_memory(self, content: str, user_id: str, metadata: Dict = None) -> str:
        """Armazena memória em ambos os sistemas"""
        results = {}
        
        if self.use_docker:
            try:
                docker_result = await self._store_memory_docker(content, user_id, metadata)
                results['docker'] = docker_result
                print(f"✅ Memória armazenada no Docker: {docker_result}")
            except Exception as e:
                print(f"⚠️  Erro ao armazenar no Docker: {e}")
                
        if self.use_local:
            try:
                local_result = await self._store_memory_local(content, user_id, metadata)
                results['local'] = local_result
                print(f"✅ Memória armazenada localmente: {local_result}")
            except Exception as e:
                print(f"⚠️  Erro ao armazenar localmente: {e}")
                
        return json.dumps(results)
        
    async def _store_memory_docker(self, content: str, user_id: str, metadata: Dict = None) -> str:
        """Armazena memória via Docker HTTP API"""
        payload = {
            "content": content,
            "user_id": user_id,
            "metadata": metadata or {}
        }
        
        response = requests.post(f"{self.docker_base_url}/mcp/add_memory", json=payload)
        response.raise_for_status()
        
        return response.json().get('id', 'unknown')
        
    async def _store_memory_local(self, content: str, user_id: str, metadata: Dict = None) -> str:
        """Armazena memória via Mem0 Python API local"""
        # Por enquanto, simulamos o armazenamento local
        # Aqui você pode integrar com SQLite, arquivo local, etc.
        local_id = f"local_{hash(content)}_{user_id}"
        
        # Simular armazenamento em arquivo local
        memory_data = {
            "id": local_id,
            "content": content,
            "user_id": user_id,
            "metadata": metadata or {},
            "created_at": asyncio.get_event_loop().time()
        }
        
        # Armazenar em arquivo JSON local
        memories_file = "/tmp/hybrid_memories.json"
        try:
            with open(memories_file, "r") as f:
                memories = json.load(f)
        except (FileNotFoundError, json.JSONDecodeError):
            memories = []
            
        memories.append(memory_data)
        
        with open(memories_file, "w") as f:
            json.dump(memories, f, indent=2)
            
        return local_id
        
    async def search_memories(self, query: str, user_id: str, limit: int = 10) -> List[MemoryEntry]:
        """Busca memórias em ambos os sistemas"""
        all_memories = []
        
        if self.use_docker:
            try:
                docker_memories = await self._search_memories_docker(query, user_id, limit)
                all_memories.extend(docker_memories)
            except Exception as e:
                print(f"⚠️  Erro na busca Docker: {e}")
                
        if self.use_local:
            try:
                local_memories = await self._search_memories_local(query, user_id, limit)
                all_memories.extend(local_memories)
            except Exception as e:
                print(f"⚠️  Erro na busca local: {e}")
                
        # Remover duplicatas e limitar resultados
        unique_memories = {}
        for memory in all_memories:
            if memory.content not in unique_memories:
                unique_memories[memory.content] = memory
                
        return list(unique_memories.values())[:limit]
        
    async def _search_memories_docker(self, query: str, user_id: str, limit: int) -> List[MemoryEntry]:
        """Busca memórias via Docker HTTP API"""
        payload = {
            "query": query,
            "user_id": user_id,
            "limit": limit
        }
        
        response = requests.post(f"{self.docker_base_url}/mcp/search_memory", json=payload)
        response.raise_for_status()
        
        memories_data = response.json().get('memories', [])
        
        return [
            MemoryEntry(
                id=f"docker_{mem['id']}",
                content=mem['content'],
                user_id=mem['user_id'],
                metadata=mem.get('metadata', {}),
                created_at=mem.get('created_at', '')
            )
            for mem in memories_data
        ]
        
    async def _search_memories_local(self, query: str, user_id: str, limit: int) -> List[MemoryEntry]:
        """Busca memórias via armazenamento local"""
        memories_file = "/tmp/hybrid_memories.json"
        
        try:
            with open(memories_file, "r") as f:
                memories = json.load(f)
        except (FileNotFoundError, json.JSONDecodeError):
            return []
            
        # Busca simples por conteúdo
        matching_memories = []
        query_lower = query.lower()
        
        for mem in memories:
            if (mem['user_id'] == user_id and 
                query_lower in mem['content'].lower()):
                matching_memories.append(
                    MemoryEntry(
                        id=mem['id'],
                        content=mem['content'],
                        user_id=mem['user_id'],
                        metadata=mem['metadata'],
                        created_at=str(mem['created_at'])
                    )
                )
                
        return matching_memories[:limit]
        
    async def get_status(self) -> Dict[str, Any]:
        """Retorna status de ambos os sistemas"""
        status = {
            "hybrid_bridge": "active",
            "docker_available": self.use_docker,
            "local_available": self.use_local,
            "systems": {}
        }
        
        if self.use_docker:
            try:
                response = requests.get(f"{self.docker_base_url}/health")
                status["systems"]["docker"] = response.json()
            except Exception as e:
                status["systems"]["docker"] = {"error": str(e)}
                
        if self.use_local:
            try:
                memories_file = "/tmp/hybrid_memories.json"
                with open(memories_file, "r") as f:
                    memories = json.load(f)
                status["systems"]["local"] = {
                    "total_memories": len(memories),
                    "status": "active"
                }
            except Exception:
                status["systems"]["local"] = {
                    "total_memories": 0,
                    "status": "active"
                }
                
        return status

# Função principal para testes
async def main():
    bridge = HybridMemoryBridge()
    await bridge.initialize()
    
    # Teste de armazenamento
    print("\n🧪 Testando armazenamento...")
    memory_id = await bridge.store_memory(
        content="Diego gosta de usar sistemas híbridos para máxima flexibilidade",
        user_id="diego",
        metadata={"tipo": "preferencia", "sistema": "hibrido"}
    )
    print(f"📝 Memória armazenada: {memory_id}")
    
    # Teste de busca
    print("\n🔍 Testando busca...")
    memories = await bridge.search_memories("sistemas híbridos", "diego")
    print(f"🎯 Encontradas {len(memories)} memórias")
    for mem in memories:
        print(f"   📄 {mem.content[:50]}...")
        
    # Status
    print("\n📊 Status do sistema:")
    status = await bridge.get_status()
    print(json.dumps(status, indent=2))

if __name__ == "__main__":
    asyncio.run(main())