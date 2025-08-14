#!/usr/bin/env python3
"""
🧪 Script de teste para o Service Discovery refatorado
Testa todas as funcionalidades implementadas
"""

import asyncio
import sys
import time
from pathlib import Path

# Adicionar o diretório parent ao path para importar modules
sys.path.insert(0, str(Path(__file__).parent.parent))
sys.path.insert(0, str(Path(__file__).parent))

from service_discovery import (
    ServiceDiscovery, 
    InputValidator, 
    retry_with_backoff,
    CircuitBreaker,
    CircuitBreakerConfig,
    AgentStatus
)

# Importar config do diretório parent
sys.path.insert(0, str(Path(__file__).parent.parent))
from config import get_config

async def test_input_validator():
    """Testa o validador de entradas"""
    print("🧪 Testando InputValidator...")
    
    # Teste de validação de host
    try:
        valid_host = InputValidator.validate_host("localhost")
        print(f"✅ Host válido: {valid_host}")
    except Exception as e:
        print(f"❌ Erro na validação de host: {e}")
    
    # Teste de validação de porta
    try:
        valid_port = InputValidator.validate_port("8002")
        print(f"✅ Porta válida: {valid_port}")
    except Exception as e:
        print(f"❌ Erro na validação de porta: {e}")
    
    # Teste de validação de URL
    try:
        valid_url = InputValidator.validate_url("http://localhost:8002")
        print(f"✅ URL válida: {valid_url}")
    except Exception as e:
        print(f"❌ Erro na validação de URL: {e}")

async def test_retry_logic():
    """Testa a lógica de retry"""
    print("\n🧪 Testando retry logic...")
    
    attempt_count = 0
    
    async def failing_function():
        nonlocal attempt_count
        attempt_count += 1
        if attempt_count < 3:
            raise Exception(f"Tentativa {attempt_count} falhou")
        return "Sucesso!"
    
    try:
        result = await retry_with_backoff(
            failing_function,
            max_retries=3,
            base_delay=0.1,
            jitter=False
        )
        print(f"✅ Retry bem-sucedido: {result}")
    except Exception as e:
        print(f"❌ Retry falhou: {e}")

async def test_circuit_breaker():
    """Testa o circuit breaker"""
    print("\n🧪 Testando Circuit Breaker...")
    
    config = CircuitBreakerConfig(
        failure_threshold=2,
        recovery_timeout=1,
        expected_exception=(Exception,)
    )
    
    cb = CircuitBreaker(config)
    
    @cb
    async def test_function():
        raise Exception("Simulando falha")
    
    # Testar falhas consecutivas
    for i in range(3):
        try:
            await test_function()
        except Exception as e:
            print(f"Tentativa {i+1}: {e}")
    
    print(f"Estado do circuit breaker: {cb.state.value}")

async def test_service_discovery():
    """Testa o Service Discovery principal"""
    print("\n🧪 Testando Service Discovery...")
    
    try:
        # Inicializar com configuração padrão
        discovery = ServiceDiscovery()
        print("✅ Service Discovery inicializado")
        
        # Testar descoberta de agentes
        print("🔍 Iniciando descoberta de agentes...")
        agents = await discovery.discover_agents(force_scan=True)
        print(f"✅ Descobertos {len(agents)} agentes")
        
        # Mostrar estatísticas
        stats = discovery.get_agent_stats()
        print(f"📊 Estatísticas: {stats}")
        
        # Testar agentes por tipo
        a2a_agents = discovery.get_agents_by_type("a2a")
        print(f"🤖 Agentes A2A: {len(a2a_agents)}")
        
        # Testar agentes saudáveis
        healthy_agents = discovery.get_healthy_agents()
        print(f"💚 Agentes saudáveis: {len(healthy_agents)}")
        
        # Parar o serviço
        discovery.stop()
        print("✅ Service Discovery parado")
        
    except Exception as e:
        print(f"❌ Erro no teste do Service Discovery: {e}")
        import traceback
        traceback.print_exc()

async def test_configuration():
    """Testa as configurações"""
    print("\n🧪 Testando configurações...")
    
    try:
        config = get_config()
        print(f"✅ Configuração carregada")
        print(f"📁 Project root: {config.paths.project_root}")
        print(f"🔍 Discovery port: {config.discovery.port}")
        print(f"📊 Known agents: {list(config.agents.known_agents.keys())}")
        
    except Exception as e:
        print(f"❌ Erro ao carregar configuração: {e}")

def test_fallback_behavior():
    """Testa comportamento de fallback"""
    print("\n🧪 Testando comportamento de fallback...")
    
    try:
        discovery = ServiceDiscovery()
        
        # Testar fallback agents
        fallback_agents = discovery._get_fallback_agents()
        print(f"🆘 Agentes fallback: {len(fallback_agents)}")
        
        for agent in fallback_agents[:3]:  # Mostrar apenas os primeiros 3
            print(f"  - {agent.name} ({agent.id})")
        
        discovery.stop()
        
    except Exception as e:
        print(f"❌ Erro no teste de fallback: {e}")

async def main():
    """Executa todos os testes"""
    print("🚀 Iniciando testes do Service Discovery refatorado...")
    print("=" * 60)
    
    # Executar testes
    await test_input_validator()
    await test_retry_logic()
    await test_circuit_breaker()
    await test_configuration()
    test_fallback_behavior()
    await test_service_discovery()
    
    print("\n" + "=" * 60)
    print("✅ Todos os testes concluídos!")

if __name__ == "__main__":
    asyncio.run(main())