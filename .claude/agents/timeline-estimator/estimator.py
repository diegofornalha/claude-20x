#!/usr/bin/env python3
"""
Timeline Estimator - Sistema de estimativas realistas com aprendizado contínuo
"""

import json
import sqlite3
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
import os
from pathlib import Path

class TimelineEstimator:
    def __init__(self, db_path: str = ".swarm/timeline_history.db"):
        self.db_path = db_path
        Path(db_path).parent.mkdir(exist_ok=True)
        self.init_database()
        self.load_patterns()
    
    def init_database(self):
        """Inicializa banco de dados para histórico de estimativas"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS timeline_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                task_name TEXT NOT NULL,
                task_type TEXT,
                estimated_minutes INTEGER NOT NULL,
                actual_minutes INTEGER,
                accuracy_percent REAL,
                factors TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                completed_at TIMESTAMP
            )
        """)
        
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS task_patterns (
                pattern TEXT PRIMARY KEY,
                avg_minutes INTEGER,
                min_minutes INTEGER,
                max_minutes INTEGER,
                sample_count INTEGER,
                last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        conn.commit()
        conn.close()
    
    def load_patterns(self):
        """Carrega padrões conhecidos de tarefas"""
        self.base_patterns = {
            "install": {"base": 15, "factors": {"first_time": 1.5, "dependencies": 1.3}},
            "configure": {"base": 10, "factors": {"complex": 1.4, "auth_issues": 1.8}},
            "implement": {"base": 30, "factors": {"new_tech": 1.6, "refactor": 1.4}},
            "migrate": {"base": 20, "factors": {"per_1000_records": 10, "schema_change": 1.5}},
            "test": {"base": 15, "factors": {"integration": 1.5, "e2e": 2.0}},
            "debug": {"base": 25, "factors": {"unknown_error": 2.0, "permission": 1.3}},
            "deploy": {"base": 20, "factors": {"production": 1.5, "rollback": 2.0}},
            "document": {"base": 10, "factors": {"api": 1.5, "tutorial": 2.0}},
            # Neo4j Agent Memory específicos
            "neo4j_memory": {"base": 2, "factors": {"batch": 0.5, "complex_query": 2.0}},
            "neo4j_connection": {"base": 2, "factors": {"multiple": 0.7, "metadata": 1.3}},
            "neo4j_search": {"base": 1, "factors": {"depth": 1.5, "text_search": 1.2}},
            "knowledge_graph": {"base": 45, "factors": {"nodes": 0.1, "relationships": 0.2}},
            "crm": {"base": 60, "factors": {"contacts": 0.05, "integrations": 1.5}}
        }
    
    def estimate_task(self, task_description: str, context: Dict = None) -> Dict:
        """
        Estima tempo para uma tarefa baseado em histórico e padrões
        """
        context = context or {}
        
        # Identificar tipo de tarefa
        task_type = self.identify_task_type(task_description)
        
        # Buscar histórico similar
        historical_data = self.get_historical_data(task_description, task_type)
        
        # Calcular estimativa base
        base_estimate = self.calculate_base_estimate(task_type, context)
        
        # Aplicar fatores de ajuste
        adjusted_estimate = self.apply_adjustment_factors(base_estimate, context)
        
        # Adicionar buffer de segurança
        safe_estimate = int(adjusted_estimate * 1.2)  # 20% buffer
        
        # Calcular confiança baseada em histórico
        confidence = self.calculate_confidence(historical_data)
        
        return {
            "task": task_description,
            "type": task_type,
            "estimate_minutes": safe_estimate,
            "estimate_readable": self.minutes_to_readable(safe_estimate),
            "confidence": confidence,
            "breakdown": self.generate_breakdown(task_description, context),
            "historical_accuracy": self.get_historical_accuracy(task_type),
            "risk_factors": self.identify_risks(task_description, context),
            "recommendations": self.generate_recommendations(safe_estimate, confidence)
        }
    
    def identify_task_type(self, description: str) -> str:
        """Identifica o tipo de tarefa baseado na descrição"""
        description_lower = description.lower()
        
        keywords = {
            "install": ["instalar", "install", "setup", "configurar brew"],
            "configure": ["configurar", "config", "setting", "senha", "auth"],
            "implement": ["implementar", "criar", "develop", "código", "feature"],
            "migrate": ["migrar", "migration", "transferir", "converter"],
            "test": ["testar", "test", "validar", "verificar"],
            "debug": ["debug", "erro", "fix", "resolver", "corrigir"],
            "deploy": ["deploy", "publicar", "release", "produção"],
            "document": ["documentar", "docs", "readme", "comentar"],
            # Neo4j Agent Memory específicos
            "neo4j_memory": ["memória", "memory", "node", "nó", "label"],
            "neo4j_connection": ["conexão", "connection", "relacionamento", "relationship"],
            "neo4j_search": ["busca", "search", "query", "consulta", "pesquisa"],
            "knowledge_graph": ["knowledge graph", "grafo", "rede", "network"],
            "crm": ["crm", "contatos", "contacts", "clientes", "customers"]
        }
        
        for task_type, words in keywords.items():
            if any(word in description_lower for word in words):
                return task_type
        
        return "general"
    
    def calculate_base_estimate(self, task_type: str, context: Dict) -> int:
        """Calcula estimativa base em minutos"""
        if task_type in self.base_patterns:
            return self.base_patterns[task_type]["base"]
        
        # Estimativa genérica baseada em complexidade
        complexity = context.get("complexity", "medium")
        base_times = {"low": 10, "medium": 25, "high": 45, "very_high": 60}
        
        return base_times.get(complexity, 25)
    
    def apply_adjustment_factors(self, base: int, context: Dict) -> float:
        """Aplica fatores de ajuste na estimativa"""
        adjusted = float(base)
        
        # Fator de primeira execução
        if context.get("first_time", False):
            adjusted *= 1.5
        
        # Fator de dependências
        dependencies = context.get("dependencies", 0)
        if dependencies > 0:
            adjusted *= (1 + 0.1 * min(dependencies, 5))
        
        # Fator de paralelização
        if context.get("parallel", False):
            adjusted *= 0.75
        
        # Fator de experiência
        experience_level = context.get("experience", "intermediate")
        experience_factors = {"beginner": 1.5, "intermediate": 1.0, "expert": 0.8}
        adjusted *= experience_factors.get(experience_level, 1.0)
        
        return adjusted
    
    def get_historical_data(self, task: str, task_type: str) -> List[Dict]:
        """Busca dados históricos similares"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT task_name, estimated_minutes, actual_minutes, accuracy_percent
            FROM timeline_history
            WHERE task_type = ? OR task_name LIKE ?
            ORDER BY created_at DESC
            LIMIT 10
        """, (task_type, f"%{task.split()[0]}%"))
        
        results = cursor.fetchall()
        conn.close()
        
        return [
            {
                "task": r[0],
                "estimated": r[1],
                "actual": r[2],
                "accuracy": r[3]
            }
            for r in results
        ]
    
    def calculate_confidence(self, historical_data: List[Dict]) -> str:
        """Calcula nível de confiança baseado em histórico"""
        if not historical_data:
            return "baixa"
        
        if len(historical_data) < 3:
            return "média"
        
        # Calcular precisão média
        accuracies = [d["accuracy"] for d in historical_data if d.get("accuracy")]
        if accuracies:
            avg_accuracy = sum(accuracies) / len(accuracies)
            if avg_accuracy > 85:
                return "alta"
            elif avg_accuracy > 70:
                return "média"
        
        return "baixa"
    
    def generate_breakdown(self, task: str, context: Dict) -> List[Dict]:
        """Gera breakdown detalhado da tarefa"""
        breakdown = []
        task_lower = task.lower()
        
        # Exemplo específico para Neo4j (baseado no caso real)
        if "neo4j" in task_lower and "install" in task_lower:
            breakdown = [
                {"step": "Instalação via Homebrew", "minutes": 18, "status": "✅ Concluído"},
                {"step": "Configuração inicial", "minutes": 5, "status": "estimado"},
                {"step": "Resolver erro de autenticação", "minutes": 8, "status": "✅ Resolvido"},
                {"step": "Teste de conexão", "minutes": 3, "status": "estimado"}
            ]
        elif "crm" in task_lower and ("neo4j" in task_lower or "memory" in task_lower):
            breakdown = [
                {"step": "Setup MCP Neo4j Agent Memory", "minutes": 8, "status": "estimado"},
                {"step": "Criar labels (pessoa, empresa, projeto)", "minutes": 5, "status": "estimado"},
                {"step": "Definir propriedades padrão", "minutes": 10, "status": "estimado"},
                {"step": "Configurar tipos de relacionamento", "minutes": 10, "status": "estimado"},
                {"step": "Importar contatos iniciais", "minutes": 8, "status": "estimado"},
                {"step": "Criar conexões entre nós", "minutes": 12, "status": "estimado"},
                {"step": "Implementar buscas avançadas", "minutes": 15, "status": "estimado"}
            ]
        elif "knowledge" in task_lower and "graph" in task_lower:
            breakdown = [
                {"step": "Definir ontologia do grafo", "minutes": 15, "status": "estimado"},
                {"step": "Criar estrutura de nós", "minutes": 10, "status": "estimado"},
                {"step": "Implementar relacionamentos", "minutes": 12, "status": "estimado"},
                {"step": "Popular dados iniciais", "minutes": 20, "status": "estimado"},
                {"step": "Configurar índices", "minutes": 5, "status": "estimado"},
                {"step": "Implementar queries", "minutes": 10, "status": "estimado"}
            ]
        elif any(word in task_lower for word in ["memória", "memory", "node", "nó"]):
            breakdown = [
                {"step": "Criar estrutura do nó", "minutes": 2, "status": "estimado"},
                {"step": "Definir propriedades", "minutes": 1, "status": "estimado"},
                {"step": "Validar dados", "minutes": 1, "status": "estimado"}
            ]
        else:
            # Breakdown genérico
            total = context.get("total_estimate", 30)
            breakdown = [
                {"step": "Preparação", "minutes": int(total * 0.2), "status": "estimado"},
                {"step": "Implementação", "minutes": int(total * 0.5), "status": "estimado"},
                {"step": "Testes", "minutes": int(total * 0.2), "status": "estimado"},
                {"step": "Finalização", "minutes": int(total * 0.1), "status": "estimado"}
            ]
        
        return breakdown
    
    def get_historical_accuracy(self, task_type: str) -> Optional[float]:
        """Retorna precisão histórica para tipo de tarefa"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT AVG(accuracy_percent)
            FROM timeline_history
            WHERE task_type = ? AND accuracy_percent IS NOT NULL
        """, (task_type,))
        
        result = cursor.fetchone()
        conn.close()
        
        return result[0] if result and result[0] else None
    
    def identify_risks(self, task: str, context: Dict) -> List[str]:
        """Identifica fatores de risco que podem afetar a estimativa"""
        risks = []
        
        if context.get("first_time"):
            risks.append("⚠️ Primeira execução - pode levar 50% mais tempo")
        
        if context.get("dependencies", 0) > 3:
            risks.append("🔗 Muitas dependências - possíveis delays")
        
        if "migration" in task.lower() or "migrar" in task.lower():
            risks.append("📊 Migração de dados - tempo varia com volume")
        
        if "production" in task.lower() or "produção" in task.lower():
            risks.append("🚨 Ambiente de produção - requer cuidado extra")
        
        return risks
    
    def generate_recommendations(self, estimate: int, confidence: str) -> List[str]:
        """Gera recomendações baseadas na estimativa"""
        recommendations = []
        
        if estimate > 60:
            recommendations.append("📋 Considere dividir em subtarefas menores")
        
        if confidence == "baixa":
            recommendations.append("💡 Adicione 30% de buffer por segurança")
        
        if estimate > 120:
            recommendations.append("☕ Planeje pausas - tarefa longa")
        
        recommendations.append(f"⏰ Reserve {self.minutes_to_readable(int(estimate * 1.3))}")
        
        return recommendations
    
    def minutes_to_readable(self, minutes: int) -> str:
        """Converte minutos em formato legível"""
        if minutes < 60:
            return f"{minutes} minutos"
        
        hours = minutes // 60
        mins = minutes % 60
        
        if mins == 0:
            return f"{hours}h"
        return f"{hours}h{mins:02d}min"
    
    def record_actual_time(self, task_id: int, actual_minutes: int):
        """Registra tempo real gasto em uma tarefa"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Buscar estimativa original
        cursor.execute("""
            SELECT estimated_minutes FROM timeline_history WHERE id = ?
        """, (task_id,))
        
        result = cursor.fetchone()
        if result:
            estimated = result[0]
            accuracy = (min(estimated, actual_minutes) / max(estimated, actual_minutes)) * 100
            
            cursor.execute("""
                UPDATE timeline_history
                SET actual_minutes = ?, accuracy_percent = ?, completed_at = ?
                WHERE id = ?
            """, (actual_minutes, accuracy, datetime.now(), task_id))
            
            conn.commit()
        
        conn.close()
    
    def get_learning_insights(self) -> Dict:
        """Retorna insights do aprendizado do sistema"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Precisão geral
        cursor.execute("""
            SELECT AVG(accuracy_percent), COUNT(*), 
                   AVG(CASE WHEN actual_minutes > estimated_minutes THEN 1 ELSE 0 END)
            FROM timeline_history
            WHERE accuracy_percent IS NOT NULL
        """)
        
        avg_accuracy, total_tasks, overrun_rate = cursor.fetchone()
        
        # Precisão por tipo
        cursor.execute("""
            SELECT task_type, AVG(accuracy_percent), COUNT(*)
            FROM timeline_history
            WHERE accuracy_percent IS NOT NULL
            GROUP BY task_type
        """)
        
        type_accuracy = cursor.fetchall()
        
        conn.close()
        
        return {
            "overall_accuracy": avg_accuracy or 0,
            "total_tracked": total_tasks or 0,
            "overrun_rate": (overrun_rate or 0) * 100,
            "accuracy_by_type": {t[0]: {"accuracy": t[1], "count": t[2]} for t in type_accuracy},
            "recommendation": self.generate_learning_recommendation(avg_accuracy, overrun_rate)
        }
    
    def generate_learning_recommendation(self, accuracy: float, overrun_rate: float) -> str:
        """Gera recomendação baseada no aprendizado"""
        if not accuracy:
            return "📊 Ainda coletando dados para melhorar estimativas"
        
        if accuracy > 85:
            return "🎯 Estimativas muito precisas! Continue assim"
        elif accuracy > 70:
            if overrun_rate > 0.6:
                return "⏰ Tendência a subestimar - adicione 20% nas estimativas"
            else:
                return "✅ Boa precisão - ajuste fino necessário"
        else:
            return "📈 Precisão melhorando - continue registrando tempos reais"


def main():
    """Exemplo de uso do Timeline Estimator"""
    estimator = TimelineEstimator()
    
    # Exemplo 1: Estimar instalação Neo4j
    print("=" * 60)
    print("🕐 TIMELINE ESTIMATOR - Análise Realista")
    print("=" * 60)
    
    task1 = "Instalar e configurar Neo4j com autenticação"
    context1 = {
        "first_time": False,  # Já fizemos uma vez
        "complexity": "medium",
        "dependencies": 2,  # Homebrew, Java
        "experience": "intermediate"
    }
    
    result1 = estimator.estimate_task(task1, context1)
    
    print(f"\n📋 Tarefa: {result1['task']}")
    print(f"⏱️  Estimativa: {result1['estimate_readable']}")
    print(f"🎯 Confiança: {result1['confidence']}")
    
    print("\n📊 Breakdown:")
    for step in result1['breakdown']:
        print(f"   • {step['step']}: {step['minutes']} min ({step['status']})")
    
    if result1['risk_factors']:
        print("\n⚠️ Fatores de Risco:")
        for risk in result1['risk_factors']:
            print(f"   {risk}")
    
    print("\n💡 Recomendações:")
    for rec in result1['recommendations']:
        print(f"   {rec}")
    
    # Exemplo 2: Migração de dados
    print("\n" + "=" * 60)
    
    task2 = "Migrar 1572 registros do SQLite para Neo4j"
    context2 = {
        "first_time": True,
        "complexity": "high",
        "dependencies": 3,
        "parallel": True,
        "experience": "intermediate"
    }
    
    result2 = estimator.estimate_task(task2, context2)
    
    print(f"\n📋 Tarefa: {result2['task']}")
    print(f"⏱️  Estimativa: {result2['estimate_readable']}")
    print(f"🎯 Confiança: {result2['confidence']}")
    
    # Insights de aprendizado
    print("\n" + "=" * 60)
    print("📈 INSIGHTS DE APRENDIZADO")
    print("=" * 60)
    
    insights = estimator.get_learning_insights()
    print(f"\n🎯 Precisão Geral: {insights['overall_accuracy']:.1f}%")
    print(f"📊 Tarefas Rastreadas: {insights['total_tracked']}")
    print(f"⏰ Taxa de Atraso: {insights['overrun_rate']:.1f}%")
    print(f"\n💡 {insights['recommendation']}")


if __name__ == "__main__":
    main()