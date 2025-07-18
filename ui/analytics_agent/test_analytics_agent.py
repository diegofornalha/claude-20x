#!/usr/bin/env python3
"""
Script para testar o Analytics Agent usando o protocolo A2A
"""

import asyncio
import json
import httpx

# Dados de exemplo para testar o Analytics Agent
EXAMPLES = [
    {
        "name": "Receita Mensal",
        "data": "Month,Revenue\nJaneiro,15000\nFevereiro,22000\nMarço,18500\nAbril,25000\nMaio,30000"
    },
    {
        "name": "Vendas por Produto",
        "data": "Product,Sales\nProduto A,5000\nProduto B,7500\nProduto C,3200\nProduto D,9800"
    },
    {
        "name": "Usuarios por Plataforma",
        "data": "Platform,Users\nWeb,45000\nMobile,67000\nDesktop,32000\nTablet,18000"
    }
]

async def test_agent_card():
    """Testar se o agent card está acessível"""
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get("http://localhost:10011/.well-known/agent.json")
            if response.status_code == 200:
                agent_card = response.json()
                print("✅ Agent Card encontrado:")
                print(f"  Nome: {agent_card.get('name')}")
                print(f"  Descrição: {agent_card.get('description')}")
                print(f"  Skills: {[skill.get('name') for skill in agent_card.get('skills', [])]}")
                return True
            else:
                print(f"❌ Erro ao acessar agent card: {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ Erro ao conectar com o agent: {e}")
            return False

async def test_with_simple_request():
    """Testar com requisição simples usando httpx"""
    async with httpx.AsyncClient() as client:
        # Testar diferentes endpoints possíveis
        endpoints = [
            "/v1/messages",
            "/messages",
            "/chat", 
            "/send",
            "/execute",
            "/invoke"
        ]
        
        for endpoint in endpoints:
            try:
                url = f"http://localhost:10011{endpoint}"
                payload = {
                    "message": EXAMPLES[0]["data"],
                    "session_id": "test-session-123"
                }
                
                print(f"🔄 Testando endpoint: {endpoint}")
                response = await client.post(url, json=payload)
                
                if response.status_code == 200:
                    print(f"✅ Sucesso em {endpoint}!")
                    result = response.json()
                    print(f"  Resposta: {result}")
                    return True
                elif response.status_code == 404:
                    print(f"  ❌ Endpoint não encontrado: {endpoint}")
                else:
                    print(f"  ❌ Erro {response.status_code}: {response.text}")
                    
            except Exception as e:
                print(f"  ❌ Erro ao testar {endpoint}: {e}")
        
        return False

async def main():
    """Função principal"""
    print("🚀 Testando Analytics Agent (http://localhost:10011)")
    print("="*50)
    
    # Testar agent card
    if not await test_agent_card():
        print("❌ Agent não está acessível")
        return
    
    print("\n🔄 Testando comunicação com o agent...")
    print("="*50)
    
    # Testar requisições simples
    if not await test_with_simple_request():
        print("❌ Nenhum endpoint de comunicação encontrado")
        return
    
    print("\n✅ Testes concluídos!")

if __name__ == "__main__":
    asyncio.run(main()) 