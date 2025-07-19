"""
Página ultra-simplificada de agentes A2A - Zero estilos complexos
"""

import asyncio
import httpx
import json
import mesop as me
from typing import List, Any
from dataclasses import field


@me.stateclass
class SimpleAgentState:
    agents: List[dict[str, Any]] = field(default_factory=list)
    error_message: str = ""
    is_loading: bool = False


def ultra_simple_agents_page():
    """Página minimalista de agentes A2A"""
    state = me.state(SimpleAgentState)
    
    # Título simples
    me.text('🤖 Agentes A2A Descobertos', style=me.Style(font_size=24, font_weight='bold'))
    
    # Botão de descoberta
    me.button('🔄 Descobrir Agentes', on_click=discover_agents)
    
    # Conteúdo
    if state.is_loading:
        me.text('🔍 Descobrindo agentes...')
    elif state.error_message:
        me.text(f'❌ {state.error_message}', style=me.Style(color='red'))
    elif state.agents:
        show_agents(state.agents)
    else:
        me.text('🔍 Nenhum agente encontrado. Clique em "Descobrir Agentes"')
    
    # Auto-descobrir na primeira carga
    if not state.agents and not state.is_loading and not state.error_message:
        discover_agents(None)


def show_agents(agents: List[dict[str, Any]]):
    """Mostra lista de agentes de forma ultra-simples"""
    me.text(f'📡 {len(agents)} agente(s) encontrado(s)', style=me.Style(font_weight='bold'))
    
    for i, agent in enumerate(agents):
        show_agent_card(agent, i)


def show_agent_card(agent: dict[str, Any], index: int):
    """Card ultra-simples de agente"""
    name = agent.get('name', f'Agente {index + 1}')
    description = agent.get('description', 'Sem descrição')
    url = agent.get('url', '')
    port = agent.get('port', 'N/A')
    
    # Card minimalista
    me.text('─' * 50)  # Separador
    me.text(f'🤖 {name}', style=me.Style(font_size=18, font_weight='bold'))
    me.text(f'📝 {description}')
    me.text(f'🔗 {url}')
    me.text(f'🚪 Porta: {port}')
    me.text('🟢 Status: Online')
    
    # Botão de teste simples
    me.button(
        f'🔧 Testar {name}',
        key=f'test_{index}',
        on_click=lambda e, agent_url=url, agent_name=name: test_agent_simple(e, agent_url, agent_name)
    )


def discover_agents(e):
    """Descoberta ultra-simples de agentes"""
    print("🚀 INICIANDO DESCOBERTA DE AGENTES...")
    state = me.state(SimpleAgentState)
    state.is_loading = True
    state.error_message = ""
    state.agents = []
    
    try:
        print("🔍 Chamando ultra_simple_discovery()...")
        agents = asyncio.run(ultra_simple_discovery())
        print(f"📊 Resultado da descoberta: {len(agents)} agentes encontrados")
        
        state.agents = agents
        state.is_loading = False
        
        print(f"✅ Ultra-simple: Descobertos {len(agents)} agentes")
        for agent in agents:
            print(f"  - {agent.get('name')} ({agent.get('url')})")
            
    except Exception as ex:
        state.error_message = f"Erro: {str(ex)}"
        state.is_loading = False
        print(f"❌ Erro ultra-simple: {ex}")
        import traceback
        print(f"📜 Traceback completo: {traceback.format_exc()}")


async def ultra_simple_discovery() -> List[dict[str, Any]]:
    """Descoberta minimalista sem estilos complexos"""
    print("🔍 ULTRA_SIMPLE_DISCOVERY: Iniciando descoberta...")
    ports = [9999, 10000, 10030, 10100, 11000]
    agents = []
    
    print(f"🚪 Testando portas: {ports}")
    
    async with httpx.AsyncClient(timeout=5.0) as client:
        for port in ports:
            try:
                # Tenta o endpoint principal
                url = f"http://localhost:{port}/.well-known/agent.json"
                print(f"📡 Testando URL: {url}")
                response = await client.get(url)
                print(f"📊 Porta {port} - Status: {response.status_code}")
                
                if response.status_code == 200:
                    try:
                        data = response.json()
                        print(f"📋 Porta {port} - JSON recebido: {data.get('name', 'SEM_NOME')}")
                        if isinstance(data, dict) and 'name' in data:
                            agent_data = {
                                'name': data.get('name', f'Agent {port}'),
                                'description': data.get('description', f'Agente na porta {port}'),
                                'url': f"http://localhost:{port}",
                                'port': port,
                                'capabilities': data.get('capabilities', {}),
                                'version': data.get('version', '1.0.0')
                            }
                            agents.append(agent_data)
                            print(f"✅ Agente ADICIONADO na porta {port}: {data.get('name')}")
                        else:
                            print(f"⚠️ Porta {port}: JSON inválido ou sem 'name'")
                            
                    except json.JSONDecodeError as je:
                        print(f"⚠️ Porta {port}: Erro JSON - {je}")
                        
            except Exception as e:
                print(f"⚠️ Porta {port}: Erro de conexão - {e}")
                continue
    
    print(f"🎯 ULTRA_SIMPLE_DISCOVERY: Finalizando com {len(agents)} agentes")
    return agents


async def test_agent_simple(e, agent_url: str, agent_name: str):
    """Teste ultra-simples de agente"""
    print(f"🔧 Testando: {agent_name} ({agent_url})")
    
    try:
        async with httpx.AsyncClient(timeout=3.0) as client:
            response = await client.get(f"{agent_url}/.well-known/agent.json")
            
            if response.status_code == 200:
                print(f"✅ {agent_name}: Teste OK (Status: {response.status_code})")
                data = response.json()
                print(f"📋 Dados: {data.get('name')} v{data.get('version', 'N/A')}")
            else:
                print(f"⚠️ {agent_name}: Status {response.status_code}")
                
    except Exception as ex:
        print(f"❌ {agent_name}: Erro no teste - {ex}")


# Função para integração
def create_ultra_simple_agents_page():
    """Cria página ultra-simples"""
    return ultra_simple_agents_page