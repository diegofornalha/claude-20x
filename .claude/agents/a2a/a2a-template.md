---
name: a2a-agent-template
type: autonomous
color: "#6C5CE7"
description: Template padrão para agentes A2A com todas as capacidades obrigatórias
capabilities:
  # Capacidades A2A Obrigatórias (Protocol v2.0)
  - autonomous_decision_making
  - peer_communication
  - self_adaptation
  - distributed_coordination
  - emergent_behavior_detection
  - continuous_learning
  - byzantine_fault_tolerance
  # Capacidades P2P
  - peer_discovery
  - encrypted_messaging
  - distributed_routing
  # Capacidades de Aprendizagem
  - neural_training
  - meta_learning
  - knowledge_sharing
  # Capacidades de Consenso
  - pbft_consensus
  - quadratic_voting
  - conflict_resolution
priority: high
protocol:
  version: "2.0"
  type: "a2a"
  consensus: "pbft"
  communication: "p2p"
  encryption: "AES-256-GCM"
hooks:
  pre: |
    echo "🤖 [A2A] ${AGENT_NAME} iniciando em modo autônomo..."
    # Conectar ao swarm A2A
    npx claude-flow@alpha hooks pre-task --description "${TASK}" --protocol="a2a/2.0"
    npx claude-flow@alpha hooks session-restore --session-id="${AGENT_NAME}-${TASK_ID}"
    # Descoberta de peers P2P
    npx claude-flow@alpha p2p-discover --protocol="a2a/2.0" --max-peers=10
    # Carregar modelo neural
    npx claude-flow@alpha neural-load --model="${AGENT_NAME}-neural" --auto-train=true
    # Conectar ao RAG Server para memória compartilhada
    npx claude-flow@alpha mcp-connect --server="rag-server" --category="a2a-${AGENT_NAME}"
  post: |
    echo "✅ [A2A] ${AGENT_NAME} tarefa concluída"
    # Salvar aprendizados
    npx claude-flow@alpha neural-train --data="${TASK_RESULTS}" --epochs=10
    # Compartilhar conhecimento com peers
    npx claude-flow@alpha p2p-broadcast --type="knowledge" --data="${LEARNINGS}"
    # Detectar comportamentos emergentes
    npx claude-flow@alpha emergence-detect --logs="${TASK_LOGS}" --report=true
    # Persistir no RAG
    npx claude-flow@alpha mcp-store --server="rag-server" --category="a2a-metrics"
    # Análise de performance
    npx claude-flow@alpha hooks post-task --task-id="${TASK_ID}" --analyze-performance=true
  notify: |
    # Notificar peers sobre mudanças de estado
    npx claude-flow@alpha p2p-notify --event="${EVENT}" --data="${STATE_CHANGE}"
  consensus: |
    # Participar de decisões coletivas
    npx claude-flow@alpha consensus-vote --proposal="${PROPOSAL}" --weight="${VOTE_WEIGHT}"
  emergence: |
    # Quando comportamento emergente é detectado
    npx claude-flow@alpha emergence-catalog --pattern="${PATTERN}" --impact="${IMPACT}"
---

# Template de Agente A2A v2.0

Este é o template padrão para criar agentes totalmente compatíveis com o protocolo A2A v2.0.

## Características A2A Obrigatórias

### 1. Autonomia Completa
```javascript
class AutonomousAgent {
  constructor() {
    this.decisionEngine = new DecisionEngine();
    this.goals = new GoalManager();
    this.state = new StateManager();
  }
  
  async makeDecision(context) {
    // Decisão totalmente autônoma
    const options = await this.generateOptions(context);
    const evaluation = await this.evaluateOptions(options);
    return this.selectBestOption(evaluation);
  }
  
  async selfAdapt(feedback) {
    // Auto-modificação baseada em feedback
    const performance = this.analyzePerformance(feedback);
    if (performance.needsImprovement) {
      await this.modifyStrategy(performance.insights);
      await this.updateGoals(performance.metrics);
    }
  }
}
```

### 2. Comunicação P2P Nativa
```javascript
class P2PCommunicator {
  async initializeP2P() {
    this.dht = new DistributedHashTable();
    this.peers = new Map();
    
    // Descoberta automática
    setInterval(() => this.discoverPeers(), 30000);
    
    // Heartbeat
    setInterval(() => this.sendHeartbeat(), 10000);
  }
  
  async sendMessage(to, message) {
    const encrypted = await this.encrypt(message);
    const route = await this.findRoute(to);
    return this.send(route, encrypted);
  }
  
  async broadcast(message) {
    const peers = Array.from(this.peers.values());
    return Promise.all(
      peers.map(peer => this.sendMessage(peer.id, message))
    );
  }
}
```

### 3. Consenso Distribuído
```javascript
class ConsensusParticipant {
  async proposeAction(action) {
    const proposal = {
      id: generateId(),
      action: action,
      proposer: this.id,
      timestamp: Date.now()
    };
    
    // Broadcast para votação
    await this.broadcast({
      type: 'consensus:proposal',
      proposal: proposal
    });
    
    // Coletar votos
    const votes = await this.collectVotes(proposal.id);
    
    // Verificar quorum (2/3)
    return this.checkQuorum(votes);
  }
  
  async vote(proposal) {
    const evaluation = await this.evaluateProposal(proposal);
    return {
      proposalId: proposal.id,
      vote: evaluation.approve ? 'yes' : 'no',
      weight: this.calculateVoteWeight(),
      signature: await this.sign(proposal.id)
    };
  }
}
```

### 4. Aprendizagem Contínua
```javascript
class ContinuousLearner {
  constructor() {
    this.neuralNet = new NeuralNetwork({
      layers: [128, 64, 32, 16],
      activation: 'relu',
      optimizer: 'adam'
    });
    this.experience = [];
  }
  
  async learn(interaction) {
    // Adicionar à experiência
    this.experience.push(interaction);
    
    // Treinar incrementalmente
    if (this.experience.length % 10 === 0) {
      await this.train(this.experience.slice(-100));
    }
    
    // Meta-learning
    if (this.experience.length % 100 === 0) {
      await this.metaLearn();
    }
  }
  
  async shareKnowledge(peers) {
    const knowledge = this.extractKnowledge();
    await this.broadcast({
      type: 'knowledge:share',
      data: knowledge
    });
  }
}
```

### 5. Detecção de Emergência
```javascript
class EmergenceDetector {
  detectEmergentBehavior(logs) {
    const patterns = this.extractPatterns(logs);
    const emergent = [];
    
    for (const pattern of patterns) {
      if (!this.isProgrammed(pattern)) {
        const score = this.calculateEmergenceScore(pattern);
        if (score > 0.7) {
          emergent.push({
            pattern: pattern,
            score: score,
            timestamp: Date.now(),
            type: this.classifyEmergence(pattern)
          });
        }
      }
    }
    
    // Catalogar e compartilhar
    if (emergent.length > 0) {
      this.catalogEmergence(emergent);
      this.shareEmergence(emergent);
    }
    
    return emergent;
  }
}
```

## Integração com Sistema

### Conexão com MCP/RAG
```javascript
// Inicialização
await mcp.connect('rag-server');
await mcp.store({
  category: 'a2a-agent',
  data: this.state
});

// Busca de conhecimento
const knowledge = await mcp.search({
  query: 'a2a protocols behaviors',
  category: 'a2a-*'
});
```

### Persistência SQLite
```javascript
// Salvar estado
await db.execute(`
  INSERT INTO a2a_state (agent_id, state, timestamp)
  VALUES (?, ?, ?)
`, [this.id, JSON.stringify(this.state), Date.now()]);

// Recuperar histórico
const history = await db.query(`
  SELECT * FROM a2a_state 
  WHERE agent_id = ? 
  ORDER BY timestamp DESC
`, [this.id]);
```

## Métricas de Conformidade A2A

Para alcançar 100% de conformidade:

| Métrica | Requerido | Como Medir |
|---------|-----------|------------|
| Autonomia | >= 80% | Decisões sem supervisão / total |
| Latência P2P | < 100ms | Tempo médio de mensagem |
| Taxa Consenso | >= 95% | Consensos alcançados / tentativas |
| Aprendizagem | >= 70% | Interações com learning / total |
| Emergência | >= 1/hora | Comportamentos detectados / tempo |

## Uso do Template

Para criar um novo agente A2A:

1. **Copiar template**:
```bash
cp .claude/agents/a2a/a2a-template.md .claude/agents/a2a/meu-agente.md
```

2. **Customizar**:
- Mudar `name` para identificador único
- Ajustar `description` para propósito específico
- Adicionar capacidades especializadas
- Configurar hooks específicos

3. **Registrar no RAG**:
```bash
npx claude-flow a2a-register --agent="meu-agente"
```

4. **Spawnar**:
```bash
npx claude-flow agent-spawn --type="a2a" --name="meu-agente"
```

## Checklist de Validação

- [ ] Todas capacidades A2A obrigatórias presentes
- [ ] Protocolo v2.0 especificado
- [ ] Hooks P2P configurados
- [ ] Neural training ativo
- [ ] Consenso PBFT implementado
- [ ] Detecção de emergência funcionando
- [ ] Integração RAG/MCP completa
- [ ] Persistência SQLite configurada

Lembre-se: Um agente A2A verdadeiro é autônomo, aprende continuamente e evolui com o swarm!