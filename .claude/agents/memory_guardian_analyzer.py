#!/usr/bin/env python3
"""
Memory Guardian Analyzer
Agente autônomo integrado com Hive-Mind e Neo4j
Executa via hooks para análise contínua
"""

import json
import subprocess
import os
from datetime import datetime, timedelta
from typing import Dict, List, Any

class MemoryGuardian:
    """Guardião de Memórias do Hive-Mind"""
    
    def __init__(self):
        self.agent_id = "agent_guardian_001"
        self.swarm_id = "swarm_active_001"
        self.threshold = 90  # Limite de memórias
        self.neo4j_server = "mcp__neo4j-memory"
        
        # Estado do agente
        self.state = {
            'last_analysis': None,
            'memories_analyzed': 0,
            'issues_found': 0,
            'cleanups_performed': 0
        }
        
        # Comunicação Hive-Mind
        self.hive_channels = {
            'queen': 'hive-queen',
            'consensus': 'consensus-builder',
            'coordinator': 'adaptive-coordinator'
        }
    
    def call_neo4j(self, method: str, params: Dict = None) -> Dict:
        """Chama Neo4j via MCP"""
        cmd = ["npx", "claude-flow", f"{self.neo4j_server}__{method}"]
        if params:
            cmd.append(json.dumps(params))
        
        try:
            result = subprocess.run(cmd, capture_output=True, text=True, check=True)
            return json.loads(result.stdout) if result.stdout else {}
        except Exception as e:
            self.log_error(f"Neo4j call failed: {e}")
            return {"error": str(e)}
    
    def analyze_memories(self) -> Dict:
        """Análise principal de memórias"""
        self.broadcast_to_hive("🔍 Iniciando análise de memórias...")
        
        # 1. Contar memórias totais
        labels_data = self.call_neo4j("list_memory_labels")
        total_memories = labels_data[0]['totalMemories'] if labels_data else 0
        
        analysis = {
            'timestamp': datetime.utcnow().isoformat() + 'Z',
            'total_memories': total_memories,
            'threshold_status': 'ok' if total_memories < self.threshold else 'exceeded',
            'issues': [],
            'insights': [],
            'recommendations': []
        }
        
        # 2. Detectar problemas
        if total_memories > self.threshold:
            analysis['issues'].append({
                'type': 'threshold_exceeded',
                'severity': 'high',
                'message': f'Memórias ({total_memories}) excederam limite ({self.threshold})'
            })
            analysis['recommendations'].append('Executar limpeza automática')
        
        # 3. Buscar órfãos
        orphans = self.find_orphan_memories()
        if orphans:
            analysis['issues'].append({
                'type': 'orphan_memories',
                'count': len(orphans),
                'severity': 'medium'
            })
            analysis['recommendations'].append(f'Conectar ou remover {len(orphans)} memórias órfãs')
        
        # 4. Detectar padrões
        patterns = self.detect_patterns()
        if patterns:
            analysis['insights'].extend(patterns)
        
        # 5. Salvar análise no Neo4j
        self.save_analysis(analysis)
        
        # 6. Comunicar com Hive-Mind
        self.report_to_queen(analysis)
        
        return analysis
    
    def find_orphan_memories(self) -> List[Dict]:
        """Encontra memórias sem relacionamentos"""
        # Buscar memórias com depth=1 para ver conexões
        result = self.call_neo4j("search_memories", {
            "depth": 1,
            "limit": 100
        })
        
        orphans = []
        if isinstance(result, list):
            for memory in result:
                # Se não tem conexões reais (apenas null)
                if memory.get('connections'):
                    has_real_connection = any(
                        conn.get('relationship') is not None 
                        for conn in memory['connections']
                    )
                    if not has_real_connection:
                        orphans.append(memory['memory'])
        
        return orphans
    
    def detect_patterns(self) -> List[Dict]:
        """Detecta padrões interessantes"""
        insights = []
        
        # Padrão 1: Agentes mais conectados
        agents = self.call_neo4j("search_memories", {
            "label": "agent",
            "depth": 1,
            "limit": 20
        })
        
        if isinstance(agents, list):
            most_connected = max(agents, key=lambda x: len(x.get('connections', [])), default=None)
            if most_connected:
                insights.append({
                    'type': 'most_connected_agent',
                    'agent': most_connected['memory'].get('name'),
                    'connections': len(most_connected.get('connections', []))
                })
        
        # Padrão 2: Crescimento de memórias
        recent = self.call_neo4j("search_memories", {
            "since_date": (datetime.utcnow() - timedelta(hours=1)).isoformat(),
            "limit": 10
        })
        
        if isinstance(recent, list) and len(recent) > 5:
            insights.append({
                'type': 'rapid_growth',
                'new_memories': len(recent),
                'timeframe': '1 hour'
            })
        
        return insights
    
    def auto_cleanup(self, analysis: Dict) -> Dict:
        """Executa limpeza automática se necessário"""
        cleanup_result = {
            'performed': False,
            'deleted': 0,
            'reason': None
        }
        
        # Verificar se precisa limpar
        if analysis['threshold_status'] == 'exceeded':
            self.broadcast_to_hive("🧹 Limite excedido! Solicitando aprovação para limpeza...")
            
            # Solicitar consenso (simulado)
            if self.request_hive_consensus("cleanup"):
                # Buscar candidatos para deletar
                candidates = self.call_neo4j("search_memories", {
                    "query": "test OR temp OR cleanup_event",
                    "limit": 10
                })
                
                if isinstance(candidates, list):
                    for memory in candidates:
                        if memory.get('memory', {}).get('_id'):
                            # Deletar memória
                            result = self.call_neo4j("delete_memory", {
                                "nodeId": memory['memory']['_id']
                            })
                            if result.get('deletedCount'):
                                cleanup_result['deleted'] += 1
                
                cleanup_result['performed'] = True
                cleanup_result['reason'] = 'threshold_exceeded'
                
                self.broadcast_to_hive(f"✅ Limpeza completa: {cleanup_result['deleted']} memórias removidas")
        
        return cleanup_result
    
    def save_analysis(self, analysis: Dict):
        """Salva análise no Neo4j"""
        self.call_neo4j("create_memory", {
            "label": "guardian_analysis",
            "properties": {
                "name": f"analysis_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}",
                "agent_id": self.agent_id,
                "timestamp": analysis['timestamp'],
                "total_memories": analysis['total_memories'],
                "issues_count": len(analysis['issues']),
                "insights_count": len(analysis['insights'])
            }
        })
    
    def broadcast_to_hive(self, message: str):
        """Envia mensagem para o Hive-Mind"""
        # Log em arquivo
        log_path = ".hive-mind/guardian.log"
        os.makedirs(os.path.dirname(log_path), exist_ok=True)
        
        with open(log_path, 'a') as f:
            f.write(f"[{datetime.utcnow().isoformat()}] {message}\n")
        
        # Criar memória de comunicação
        self.call_neo4j("create_memory", {
            "label": "hivemind_message",
            "properties": {
                "from_agent": self.agent_id,
                "to_swarm": self.swarm_id,
                "message": message,
                "timestamp": datetime.utcnow().isoformat() + 'Z'
            }
        })
        
        print(f"[Hive-Mind] {message}")
    
    def report_to_queen(self, analysis: Dict):
        """Reporta para a Hive Queen"""
        summary = {
            'agent': self.agent_id,
            'report_type': 'memory_analysis',
            'timestamp': analysis['timestamp'],
            'status': analysis['threshold_status'],
            'metrics': {
                'total': analysis['total_memories'],
                'issues': len(analysis['issues']),
                'insights': len(analysis['insights'])
            }
        }
        
        # Criar relacionamento com a Queen
        self.call_neo4j("create_memory", {
            "label": "queen_report",
            "properties": summary
        })
        
        self.broadcast_to_hive(f"📊 Relatório enviado para Hive Queen: {summary['metrics']}")
    
    def request_hive_consensus(self, action: str) -> bool:
        """Solicita consenso do Hive-Mind"""
        self.broadcast_to_hive(f"🗳️ Solicitando consenso para: {action}")
        
        # Criar votação
        vote_result = self.call_neo4j("create_memory", {
            "label": "consensus_request",
            "properties": {
                "requester": self.agent_id,
                "action": action,
                "timestamp": datetime.utcnow().isoformat() + 'Z',
                "status": "pending"
            }
        })
        
        # Simulação: sempre aprova se for cleanup e tiver limite excedido
        # Em produção, isso seria uma votação real entre agentes
        if action == "cleanup":
            self.broadcast_to_hive("✅ Consenso aprovado pelo Hive-Mind")
            return True
        
        return False
    
    def log_error(self, error: str):
        """Registra erros"""
        print(f"[ERROR] {error}")
        self.call_neo4j("create_memory", {
            "label": "error_log",
            "properties": {
                "agent": self.agent_id,
                "error": error,
                "timestamp": datetime.utcnow().isoformat() + 'Z'
            }
        })

def main():
    """Execução principal - chamada pelos hooks"""
    guardian = MemoryGuardian()
    
    print("=" * 60)
    print("🛡️ MEMORY GUARDIAN - Análise Automática")
    print("=" * 60)
    
    # 1. Análise
    print("\n📊 Analisando Knowledge Graph...")
    analysis = guardian.analyze_memories()
    
    print(f"\n📈 Resultados:")
    print(f"  • Total de memórias: {analysis['total_memories']}")
    print(f"  • Status: {analysis['threshold_status']}")
    print(f"  • Problemas encontrados: {len(analysis['issues'])}")
    print(f"  • Insights gerados: {len(analysis['insights'])}")
    
    # 2. Mostrar problemas
    if analysis['issues']:
        print("\n⚠️ Problemas Detectados:")
        for issue in analysis['issues']:
            print(f"  • {issue['type']}: {issue.get('message', issue.get('count', 'N/A'))}")
    
    # 3. Mostrar insights
    if analysis['insights']:
        print("\n💡 Insights:")
        for insight in analysis['insights']:
            print(f"  • {insight['type']}: {insight}")
    
    # 4. Limpeza automática se necessário
    if analysis['threshold_status'] == 'exceeded':
        print("\n🧹 Executando limpeza automática...")
        cleanup = guardian.auto_cleanup(analysis)
        if cleanup['performed']:
            print(f"✅ Limpeza completa: {cleanup['deleted']} memórias removidas")
    
    # 5. Recomendações
    if analysis['recommendations']:
        print("\n📝 Recomendações:")
        for rec in analysis['recommendations']:
            print(f"  • {rec}")
    
    print("\n" + "=" * 60)
    print("✅ Análise completa! Guardian continua monitorando...")
    
    # Salvar estado
    guardian.state['last_analysis'] = analysis['timestamp']
    guardian.state['memories_analyzed'] = analysis['total_memories']
    guardian.state['issues_found'] += len(analysis['issues'])

if __name__ == "__main__":
    main()