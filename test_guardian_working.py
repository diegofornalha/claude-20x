#!/usr/bin/env python3
"""
Teste para verificar se o Guardian Agent está funcionando corretamente
"""

import requests
import json

def test_guardian_agent():
    """Testa o Guardian Agent na porta 10102"""
    
    base_url = "http://localhost:10102"
    
    print("🛡️ TESTANDO GUARDIAN AGENT")
    print("=" * 50)
    
    # Teste 1: Agent Card
    try:
        response = requests.get(f"{base_url}/agent", timeout=5)
        if response.status_code == 200:
            agent_data = response.json()
            print("✅ Agent Card:", agent_data.get("name", "Unknown"))
            print("🌐 URL:", agent_data.get("url", "Unknown"))
            print("📝 Description:", agent_data.get("description", "Unknown"))
        else:
            print(f"❌ Agent Card failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Agent Card error: {e}")
    
    print("\n" + "=" * 50)
    
    # Teste 2: Status do Sistema
    test_commands = [
        ("Status Geral", "status"),
        ("Health Check", "health check"),
        ("Carbon Budget", "budget"),
        ("Entropia", "entropy"),
        ("Jevons", "jevons")
    ]
    
    for test_name, command in test_commands:
        try:
            payload = {
                "type": "sendMessage",
                "message": {
                    "parts": [{"type": "text", "text": command}]
                }
            }
            
            response = requests.post(
                f"{base_url}/messages",
                headers={"Content-Type": "application/json"},
                json=payload,
                timeout=10
            )
            
            if response.status_code == 200:
                print(f"✅ {test_name}: Resposta recebida")
                # Mostrar início da resposta
                try:
                    result = response.json()
                    print(f"   📊 Preview: {str(result)[:100]}...")
                except:
                    print(f"   📊 Preview: {response.text[:100]}...")
            else:
                print(f"❌ {test_name}: Status {response.status_code}")
                
        except Exception as e:
            print(f"❌ {test_name}: Erro {e}")
        
        print("-" * 30)

def test_comparison():
    """Compara HelloWorld vs Guardian"""
    
    print("\n🔍 COMPARAÇÃO DE AGENTES")
    print("=" * 50)
    
    agents = [
        ("HelloWorld", "http://localhost:9999"),
        ("Guardian", "http://localhost:10102")
    ]
    
    for name, url in agents:
        try:
            response = requests.get(f"{url}/agent", timeout=5)
            if response.status_code == 200:
                data = response.json()
                print(f"✅ {name}: {data.get('name')} - {data.get('url')}")
            else:
                print(f"❌ {name}: Status {response.status_code}")
        except Exception as e:
            print(f"❌ {name}: Erro {e}")

if __name__ == "__main__":
    test_guardian_agent()
    test_comparison()
    
    print("\n🎯 CONCLUSÃO:")
    print("Se você vê ✅ acima, o Guardian está funcionando!")
    print("🛡️ Guardian Agent rodando em http://localhost:10102/")
    print("🌍 HelloWorld Agent rodando em http://localhost:9999/")