#!/usr/bin/env python3
"""
🎯 Demonstração Prática do Service Discovery
Exemplo de como usar o Service Discovery em aplicações reais
"""

import requests
import time
import random
from typing import List, Dict, Optional

class ServiceDiscoveryClient:
    """Cliente para interagir com o Service Discovery"""
    
    def __init__(self, discovery_url: str = "http://localhost:8002"):
        self.discovery_url = discovery_url
    
    def get_all_agents(self) -> List[Dict]:
        """Obter todos os agentes"""
        response = requests.get(f"{self.discovery_url}/agents")
        return response.json()["agents"]
    
    def get_healthy_agents(self) -> List[Dict]:
        """Obter apenas agentes saudáveis"""
        response = requests.get(f"{self.discovery_url}/agents?healthy_only=true")
        return response.json()["agents"]
    
    def get_agents_by_type(self, agent_type: str) -> List[Dict]:
        """Obter agentes de um tipo específico"""
        response = requests.get(f"{self.discovery_url}/agents?agent_type={agent_type}")
        return response.json()["agents"]
    
    def get_agent_details(self, agent_id: str) -> Dict:
        """Obter detalhes de um agente específico"""
        response = requests.get(f"{self.discovery_url}/agents/{agent_id}")
        return response.json()
    
    def check_agent_health(self, agent_id: str) -> bool:
        """Verificar saúde de um agente"""
        response = requests.post(f"{self.discovery_url}/agents/{agent_id}/health")
        return response.json()["healthy"]
    
    def trigger_discovery(self, force: bool = False) -> Dict:
        """Forçar nova descoberta"""
        response = requests.post(f"{self.discovery_url}/discover", json={"force": force})
        return response.json()
    
    def get_stats(self) -> Dict:
        """Obter estatísticas do sistema"""
        response = requests.get(f"{self.discovery_url}/stats")
        return response.json()


class LoadBalancer:
    """Exemplo de Load Balancer usando Service Discovery"""
    
    def __init__(self, discovery_client: ServiceDiscoveryClient):
        self.discovery = discovery_client
        self.request_count = {}
    
    def select_agent(self, agent_type: str = None, capability: str = None) -> Optional[Dict]:
        """Seleciona um agente saudável usando round-robin"""
        
        # Obter agentes candidatos
        if agent_type:
            candidates = self.discovery.get_agents_by_type(agent_type)
        else:
            candidates = self.discovery.get_healthy_agents()
        
        # Filtrar por capacidade se especificada
        if capability:
            candidates = [
                agent for agent in candidates 
                if capability in agent.get("capabilities", [])
            ]
        
        if not candidates:
            return None
        
        # Round-robin simples
        key = f"{agent_type or 'all'}_{capability or 'any'}"
        count = self.request_count.get(key, 0)
        selected = candidates[count % len(candidates)]
        self.request_count[key] = count + 1
        
        return selected
    
    def send_request(self, path: str, agent_type: str = None, capability: str = None):
        """Enviar requisição para um agente via load balancing"""
        
        agent = self.select_agent(agent_type, capability)
        if not agent:
            return {"error": "No healthy agents available"}
        
        try:
            url = f"{agent['url']}{path}"
            response = requests.get(url, timeout=5)
            return {
                "agent": agent["name"],
                "agent_url": agent["url"],
                "status": response.status_code,
                "response": response.text[:200] + "..." if len(response.text) > 200 else response.text
            }
        except Exception as e:
            return {
                "agent": agent["name"],
                "agent_url": agent["url"],
                "error": str(e)
            }


class ServiceMonitor:
    """Monitor de saúde dos serviços"""
    
    def __init__(self, discovery_client: ServiceDiscoveryClient):
        self.discovery = discovery_client
    
    def health_check_all(self) -> Dict:
        """Verificar saúde de todos os agentes"""
        
        agents = self.discovery.get_all_agents()
        results = {
            "healthy": [],
            "unhealthy": [],
            "total": len(agents)
        }
        
        for agent in agents:
            try:
                is_healthy = self.discovery.check_agent_health(agent["id"])
                if is_healthy:
                    results["healthy"].append({
                        "id": agent["id"],
                        "name": agent["name"],
                        "type": agent["type"]
                    })
                else:
                    results["unhealthy"].append({
                        "id": agent["id"], 
                        "name": agent["name"],
                        "type": agent["type"]
                    })
            except Exception as e:
                results["unhealthy"].append({
                    "id": agent["id"],
                    "name": agent["name"], 
                    "type": agent["type"],
                    "error": str(e)
                })
        
        return results
    
    def get_system_health(self) -> Dict:
        """Obter saúde geral do sistema"""
        
        stats = self.discovery.get_stats()
        health_check = self.health_check_all()
        
        health_percentage = (len(health_check["healthy"]) / max(health_check["total"], 1)) * 100
        
        return {
            "overall_health": "healthy" if health_percentage > 75 else "degraded" if health_percentage > 25 else "critical",
            "health_percentage": round(health_percentage, 2),
            "stats": stats,
            "details": health_check
        }


def demo_basic_discovery():
    """Demonstração básica do Service Discovery"""
    
    print("🔍 === DEMONSTRAÇÃO BÁSICA DO SERVICE DISCOVERY ===")
    
    # Inicializar cliente
    discovery = ServiceDiscoveryClient()
    
    # Obter todos os agentes
    print("\n📋 Todos os agentes descobertos:")
    agents = discovery.get_all_agents()
    for agent in agents:
        print(f"  🤖 {agent['name']} ({agent['type']}) - {agent['status']} - {agent['url']}")
    
    # Obter apenas agentes saudáveis
    print("\n💚 Agentes saudáveis:")
    healthy = discovery.get_healthy_agents()
    for agent in healthy:
        print(f"  ✅ {agent['name']} - {agent['url']}")
    
    # Estatísticas
    print("\n📊 Estatísticas:")
    stats = discovery.get_stats()
    print(f"  Total: {stats['total_agents']}")
    print(f"  Por status: {stats['by_status']}")
    print(f"  Por tipo: {stats['by_type']}")


def demo_load_balancer():
    """Demonstração do Load Balancer"""
    
    print("\n⚖️ === DEMONSTRAÇÃO DO LOAD BALANCER ===")
    
    discovery = ServiceDiscoveryClient()
    lb = LoadBalancer(discovery)
    
    # Enviar várias requisições
    print("\n🔄 Enviando requisições via load balancer:")
    for i in range(5):
        result = lb.send_request("/", agent_type="web")
        if "error" not in result:
            print(f"  Req {i+1}: {result['agent']} ({result['agent_url']}) - Status: {result['status']}")
        else:
            print(f"  Req {i+1}: ERRO - {result['error']}")
        time.sleep(0.5)


def demo_monitoring():
    """Demonstração do Monitor"""
    
    print("\n📡 === DEMONSTRAÇÃO DO MONITOR ===")
    
    discovery = ServiceDiscoveryClient()
    monitor = ServiceMonitor(discovery)
    
    # Health check completo
    print("\n💓 Health check de todos os serviços:")
    health = monitor.health_check_all()
    
    print(f"  ✅ Saudáveis: {len(health['healthy'])}")
    for agent in health['healthy']:
        print(f"    - {agent['name']} ({agent['type']})")
    
    print(f"  ❌ Com problemas: {len(health['unhealthy'])}")
    for agent in health['unhealthy']:
        error_msg = f" - {agent.get('error', 'offline')}" if 'error' in agent else ""
        print(f"    - {agent['name']} ({agent['type']}){error_msg}")
    
    # Saúde geral do sistema
    print("\n🏥 Saúde geral do sistema:")
    system_health = monitor.get_system_health()
    print(f"  Status: {system_health['overall_health'].upper()}")
    print(f"  Saúde: {system_health['health_percentage']}%")


def demo_real_world_scenario():
    """Cenário do mundo real"""
    
    print("\n🌍 === CENÁRIO DO MUNDO REAL ===")
    print("Simulando uma aplicação que precisa:")
    print("1. Encontrar serviços web para UI")
    print("2. Rotear requisições entre eles")
    print("3. Monitorar saúde continuamente")
    
    discovery = ServiceDiscoveryClient()
    lb = LoadBalancer(discovery)
    monitor = ServiceMonitor(discovery)
    
    # 1. Descobrir serviços web
    web_agents = discovery.get_agents_by_type("web")
    print(f"\n🔍 Encontrados {len(web_agents)} serviços web:")
    for agent in web_agents:
        print(f"  🌐 {agent['name']} - {agent['url']}")
    
    # 2. Enviar requisições com balanceamento
    print(f"\n⚖️ Balanceando 3 requisições entre os serviços:")
    for i in range(3):
        result = lb.send_request("/", agent_type="web")
        if "error" not in result:
            print(f"  📨 Requisição {i+1} → {result['agent']} ({result['status']})")
        time.sleep(0.2)
    
    # 3. Verificar saúde
    print(f"\n💊 Verificando saúde dos serviços:")
    system_health = monitor.get_system_health()
    print(f"  🏥 Sistema: {system_health['overall_health'].upper()}")
    print(f"  📈 Taxa de saúde: {system_health['health_percentage']}%")
    
    # 4. Forçar redescoberta
    print(f"\n🔄 Forçando redescoberta de serviços...")
    discovery.trigger_discovery(force=True)
    time.sleep(2)
    
    new_stats = discovery.get_stats()
    print(f"  📊 Agentes após redescoberta: {new_stats['total_agents']}")


if __name__ == "__main__":
    try:
        # Verificar se Service Discovery está rodando
        discovery = ServiceDiscoveryClient()
        discovery.get_stats()
        
        print("🚀 Claude-20x Service Discovery - Demonstração Prática")
        print("=" * 60)
        
        # Executar demonstrações
        demo_basic_discovery()
        demo_load_balancer()
        demo_monitoring()
        demo_real_world_scenario()
        
        print("\n" + "=" * 60)
        print("✅ Demonstração concluída!")
        print("\n🔗 URLs úteis:")
        print("  📊 API: http://localhost:8002/docs")
        print("  🤖 Agentes: http://localhost:8002/agents")
        print("  📈 Stats: http://localhost:8002/stats")
        
    except Exception as e:
        print(f"❌ Erro: {e}")
        print("💡 Verifique se o Service Discovery está rodando em http://localhost:8002")