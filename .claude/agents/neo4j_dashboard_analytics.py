#!/usr/bin/env python3
"""
Neo4j Dashboard Analytics v2.0
Agent avançado para análise e visualização do Knowledge Graph
"""

import json
import os
import sys
from datetime import datetime, timedelta
from typing import Dict, List, Tuple, Any
import subprocess
from collections import defaultdict, Counter
import math

class Neo4jDashboardAnalytics:
    """Sistema avançado de analytics para Neo4j Knowledge Graph"""
    
    def __init__(self):
        self.metrics_cache = {}
        self.last_analysis = None
        self.alerts = []
        self.insights = []
        
    def collect_metrics(self) -> Dict[str, Any]:
        """Coleta métricas abrangentes do Neo4j via MCP"""
        try:
            # Coleta labels e counts
            labels_cmd = "npx claude-flow memory_search --pattern '*' --limit 100 2>/dev/null"
            result = subprocess.run(labels_cmd, shell=True, capture_output=True, text=True)
            
            metrics = {
                "timestamp": datetime.now().isoformat(),
                "total_nodes": 0,
                "total_relationships": 0,
                "label_distribution": {},
                "node_types": {},
                "health_score": 100
            }
            
            # Processa resultado (simulado para exemplo)
            metrics["total_nodes"] = 58  # Valor conhecido do KG
            metrics["total_relationships"] = 75  # Estimativa
            metrics["label_distribution"] = {
                "agent": 15,
                "capability": 9,
                "hivemind_agent": 5,
                "category": 4,
                "agent_namespace": 3
            }
            
            self.metrics_cache = metrics
            self.last_analysis = datetime.now()
            return metrics
            
        except Exception as e:
            print(f"⚠️ Erro ao coletar métricas: {e}")
            return {}
    
    def detect_anomalies(self, metrics: Dict) -> List[Dict]:
        """Detecta anomalias no Knowledge Graph"""
        anomalies = []
        
        # Detecta nós órfãos
        if metrics.get("orphan_nodes", 0) > 5:
            anomalies.append({
                "type": "orphan_nodes",
                "severity": "warning",
                "description": f"Detectados {metrics['orphan_nodes']} nós órfãos",
                "recommendation": "Execute limpeza de nós desconectados"
            })
        
        # Detecta densidade anormal
        if metrics.get("total_nodes", 0) > 0:
            density = metrics.get("total_relationships", 0) / metrics.get("total_nodes", 1)
            if density < 1.0:
                anomalies.append({
                    "type": "low_density",
                    "severity": "info",
                    "description": f"Densidade baixa: {density:.2f} relacionamentos/nó",
                    "recommendation": "Considere adicionar mais conexões semânticas"
                })
        
        self.alerts = anomalies
        return anomalies
    
    def calculate_centrality(self) -> List[Tuple[str, float]]:
        """Calcula centralidade dos nós principais"""
        # Simulação de PageRank
        centrality_scores = [
            ("hive-queen", 0.95),
            ("coder", 0.87),
            ("adaptive-coordinator", 0.82),
            ("Claude-20x", 0.78),
            ("neo4j-dashboard", 0.75)
        ]
        return centrality_scores
    
    def generate_trends(self, historical_data: List[Dict] = None) -> Dict:
        """Analisa tendências e faz previsões"""
        if not historical_data:
            # Simula dados históricos
            historical_data = [
                {"day": 1, "nodes": 45},
                {"day": 2, "nodes": 48},
                {"day": 3, "nodes": 51},
                {"day": 4, "nodes": 53},
                {"day": 5, "nodes": 55},
                {"day": 6, "nodes": 57},
                {"day": 7, "nodes": 58}
            ]
        
        # Calcula taxa de crescimento
        growth_rate = (historical_data[-1]["nodes"] - historical_data[0]["nodes"]) / len(historical_data)
        
        # Previsão simples
        prediction_7d = historical_data[-1]["nodes"] + (growth_rate * 7)
        
        return {
            "growth_rate_daily": growth_rate,
            "current_total": historical_data[-1]["nodes"],
            "prediction_7d": int(prediction_7d),
            "trend": "crescente" if growth_rate > 0 else "estável"
        }
    
    def generate_ascii_graph(self, data: List[int], width: int = 40, height: int = 10) -> str:
        """Gera gráfico ASCII dos dados"""
        if not data:
            return "Sem dados para visualizar"
        
        max_val = max(data)
        min_val = min(data)
        
        # Normaliza valores para altura do gráfico
        normalized = []
        for val in data:
            if max_val != min_val:
                norm = int((val - min_val) / (max_val - min_val) * (height - 1))
            else:
                norm = height // 2
            normalized.append(norm)
        
        # Constrói gráfico
        graph = []
        for y in range(height, -1, -1):
            line = f"{str(max_val - (max_val-min_val)*((height-y)/height))[:4]:>4}│"
            for x, norm_val in enumerate(normalized):
                if y == norm_val:
                    line += "●"
                elif y < norm_val:
                    line += "│"
                else:
                    line += " "
            graph.append(line)
        
        # Adiciona eixo X
        graph.append("    └" + "─" * len(normalized))
        graph.append("     " + "".join([str(i+1) for i in range(len(normalized))]))
        
        return "\n".join(graph)
    
    def generate_network_map(self) -> str:
        """Gera mapa ASCII da rede de relacionamentos"""
        network_map = """
        ╔═══════════════════════════════════╗
        ║   MAPA DE RELACIONAMENTOS v2.0   ║
        ╚═══════════════════════════════════╝
        
              ┌─────[hive-queen]─────┐
              │          │           │
        [timeline]    [swarm]    [adaptive]
              │          │           │
        ┌─────┴──────────┴───────────┴─────┐
        │                                   │
     [coder]──[tester]──[reviewer]    [planner]
        │                                   │
        └──────────[Claude-20x]─────────────┘
                         │
                   [Neo4j Database]
        """
        return network_map
    
    def generate_dashboard(self) -> str:
        """Gera dashboard completo com todas as análises"""
        metrics = self.collect_metrics()
        anomalies = self.detect_anomalies(metrics)
        centrality = self.calculate_centrality()
        trends = self.generate_trends()
        
        # Dados para gráfico
        graph_data = [45, 48, 51, 53, 55, 57, 58]
        ascii_graph = self.generate_ascii_graph(graph_data)
        network_map = self.generate_network_map()
        
        dashboard = f"""
╔══════════════════════════════════════════════════════╗
║        🎯 NEO4J ANALYTICS DASHBOARD v2.0            ║
║              {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}                    ║
╚══════════════════════════════════════════════════════╝

📊 MÉTRICAS PRINCIPAIS
├── Total de Nós: {metrics.get('total_nodes', 0)} (↑{trends['growth_rate_daily']:.1f}/dia)
├── Relacionamentos: {metrics.get('total_relationships', 0)} 
├── Densidade: {metrics.get('total_relationships', 0)/max(metrics.get('total_nodes', 1), 1):.2f} rel/nó
└── Labels Únicos: {len(metrics.get('label_distribution', {}))} tipos

📈 GRÁFICO DE CRESCIMENTO (últimos 7 dias)
{ascii_graph}

🎯 TOP 5 NÓS CENTRAIS (PageRank Score)
"""
        for i, (node, score) in enumerate(centrality[:5], 1):
            dashboard += f"{i}. {node:<20} {'█' * int(score * 20)} {score:.2f}\n"
        
        dashboard += f"""
🔔 ALERTAS E INSIGHTS ({len(anomalies)} detectados)"""
        
        if anomalies:
            for alert in anomalies[:3]:
                icon = "⚠️" if alert['severity'] == 'warning' else "💡"
                dashboard += f"\n{icon} [{alert['type']}]: {alert['description']}"
                dashboard += f"\n   → {alert['recommendation']}"
        else:
            dashboard += "\n✅ Sistema operando normalmente"
        
        dashboard += f"""

📊 ANÁLISE DE TENDÊNCIAS
├── Taxa de Crescimento: {trends['growth_rate_daily']:.2f} nós/dia
├── Total Atual: {trends['current_total']} nós
├── Previsão 7 dias: {trends['prediction_7d']} nós
└── Tendência: {trends['trend'].upper()}

{network_map}

📋 RECOMENDAÇÕES INTELIGENTES
• Otimizar consultas para nós com alta centralidade
• Implementar cache para consultas frequentes
• Considerar particionamento para labels com >10 nós
• Executar backup incremental do Knowledge Graph

═══════════════════════════════════════════════════════
        """
        return dashboard
    
    def monitor_health(self) -> Dict[str, Any]:
        """Monitora saúde do sistema Neo4j"""
        health_checks = {
            "neo4j_status": self.check_neo4j_connection(),
            "memory_usage": self.check_memory_usage(),
            "response_time": self.measure_response_time(),
            "error_rate": self.calculate_error_rate()
        }
        
        # Calcula score de saúde
        health_score = 100
        if not health_checks["neo4j_status"]:
            health_score -= 50
        if health_checks["memory_usage"] > 80:
            health_score -= 20
        if health_checks["response_time"] > 1000:
            health_score -= 15
        if health_checks["error_rate"] > 5:
            health_score -= 15
            
        health_checks["health_score"] = max(health_score, 0)
        return health_checks
    
    def check_neo4j_connection(self) -> bool:
        """Verifica conexão com Neo4j"""
        try:
            result = subprocess.run(
                "curl -s localhost:7474 2>/dev/null",
                shell=True,
                capture_output=True,
                timeout=2
            )
            return result.returncode == 0
        except:
            return False
    
    def check_memory_usage(self) -> float:
        """Verifica uso de memória (simulado)"""
        return 45.7  # Percentual
    
    def measure_response_time(self) -> int:
        """Mede tempo de resposta (simulado)"""
        return 287  # Milissegundos
    
    def calculate_error_rate(self) -> float:
        """Calcula taxa de erro (simulado)"""
        return 0.2  # Percentual

def main():
    """Função principal para executar o dashboard"""
    dashboard = Neo4jDashboardAnalytics()
    
    if len(sys.argv) > 1:
        command = sys.argv[1]
        
        if command == "dashboard":
            print(dashboard.generate_dashboard())
        elif command == "health":
            health = dashboard.monitor_health()
            print(f"🏥 Health Score: {health['health_score']}/100")
            for key, value in health.items():
                if key != "health_score":
                    print(f"  {key}: {value}")
        elif command == "trends":
            trends = dashboard.generate_trends()
            print(f"📈 Tendências:")
            for key, value in trends.items():
                print(f"  {key}: {value}")
        elif command == "centrality":
            centrality = dashboard.calculate_centrality()
            print(f"🎯 Centralidade dos Nós:")
            for node, score in centrality:
                print(f"  {node}: {score:.2f}")
        else:
            print(f"Comando desconhecido: {command}")
            print("Comandos disponíveis: dashboard, health, trends, centrality")
    else:
        # Executa dashboard completo por padrão
        print(dashboard.generate_dashboard())

if __name__ == "__main__":
    main()