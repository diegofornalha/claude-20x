# 🤖 Integração A2A: Agentes ↔ Specialist

Demonstração prática de como os agentes A2A se integram com o MCP A2A Specialist.

## 🎯 **Arquitetura Completa**

```
┌─────────────────────────────────────────────────────────────┐
│                    CLAUDE-20X ECOSYSTEM                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  🔧 MCP SERVERS:                                           │
│  ┌───────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │ Context7      │  │ neo4j-memory    │  │ a2a-specialist│ │
│  │ (Knowledge)   │  │ (Graph Memory)  │  │ (A2A Protocol)│ │
│  └───────────────┘  └─────────────────┘  └──────────────┘ │
│                                 ▲                ▲         │
│                                 │                │         │
│  🤖 A2A AGENTS:                │                │         │
│  ┌───────────────┐              │                │         │
│  │a2a-agent-     │──────────────┼────────────────┘         │
│  │template       │              │                          │
│  │(Starlette)    │              │                          │
│  └───────────────┘              │                          │
│                                 │                          │
│  ┌───────────────┐              │                          │
│  │a2a-server-    │──────────────┼──────────────────────────┤
│  │starlette      │              │                          │
│  │(Python ASGI)  │              │                          │
│  └───────────────┘              │                          │
│                                 │                          │
│  ┌───────────────┐              │                          │
│  │a2a-agent-     │──────────────┘                          │
│  │official       │                                         │
│  │(SDK)          │                                         │
│  └───────────────┘                                         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 📋 **Agentes A2A Registrados**

### 1. **a2a-agent-template** 
- **Tipo**: Template padrão
- **Capacidades**: 16 capacidades A2A completas
- **Framework**: Starlette + Uvicorn
- **Status**: ✅ Registrado (Node ID: 349)

### 2. **a2a-server-starlette**
- **Tipo**: Servidor Python ASGI
- **Capacidades**: 7 capacidades A2A core
- **Framework**: Starlette + Uvicorn
- **Status**: ✅ Registrado (Node ID: 1050)

### 3. **a2a-agent-official**
- **Tipo**: SDK oficial A2A
- **Capacidades**: 7 capacidades A2A core
- **Framework**: A2AStarletteApplication
- **Status**: ✅ Registrado (Node ID: 516)

## 🔄 **Fluxo de Integração**

### Passo 1: Registro de Agente
```javascript
// O agente A2A se registra no specialist
await mcp_a2a_specialist_register_agent({
  agent_card: {
    name: "meu-agente-a2a",
    description: "Agente autônomo especializado",
    capabilities: [
      "autonomous_decision_making",
      "peer_communication", 
      "continuous_learning"
    ],
    endpoints: {
      decide: "/decide",
      learn: "/learn",
      consensus: "/consensus"
    }
  }
});
```

### Passo 2: Descoberta de Peers
```javascript
// Descobrir outros agentes A2A por capacidade
const peers = await mcp_a2a_specialist_discover_agents({
  capability: "autonomous_decision_making"
});

console.log(`Encontrados ${peers.agents.length} agentes autônomos`);
```

### Passo 3: Delegação de Tarefas
```javascript
// Delegar tarefa para agente específico
const task = await mcp_a2a_specialist_delegate_task({
  task: {
    id: "task_001",
    type: "data_analysis", 
    agent_id: "coordinator",
    payload: { data: "...", priority: "high" }
  },
  target_agent: "a2a-agent-template"
});
```

### Passo 4: Monitoramento
```javascript
// Obter analytics do ecossistema A2A
const analytics = await mcp_a2a_specialist_get_analytics();

/*
{
  total_agents: 3,
  total_tasks: 5,
  agent_statuses: ["online", "busy"],
  task_statuses: ["pending", "completed"]
}
*/
```

## 🚀 **Executando um Agente A2A**

### Opção 1: Template Python
```bash
cd .claude/agents/a2a/

# Ativar ambiente
uv venv
source .venv/bin/activate

# Instalar dependências
uv pip install -r requirements.txt

# Executar agente
AGENT_NAME=template-01 \
AGENT_TYPE=autonomous \
PORT=8000 \
python a2a_server.py
```

### Opção 2: SDK Oficial
```bash
# Com configuração customizada
AGENT_NAME=official-01 \
TASK_STORE_TYPE=sqlite \
JWT_SECRET=my-secret \
PORT=8001 \
python a2a_agent_official.py
```

### Opção 3: Via Uvicorn
```bash
# Produção com workers
uvicorn a2a_server:app \
  --host 0.0.0.0 \
  --port 8000 \
  --workers 4 \
  --loop uvloop
```

## 🧪 **Testando a Integração**

### 1. Verificar Saúde do Agente
```bash
curl http://localhost:8000/health
# Response: {"status": "healthy", "agent_id": "agent_xxx", "uptime": 120}
```

### 2. Solicitar Decisão Autônoma
```bash
curl -X POST http://localhost:8000/decide \
  -H "Content-Type: application/json" \
  -d '{"context": {"task": "optimize", "priority": "high"}}'
```

### 3. Enviar Dados para Aprendizagem
```bash
curl -X POST http://localhost:8000/learn \
  -H "Content-Type: application/json" \
  -d '{"data": {"pattern": "efficiency", "score": 0.95}}'
```

### 4. Participar de Consenso
```bash
curl -X POST http://localhost:8000/consensus \
  -H "Content-Type: application/json" \
  -d '{"proposal": {"id": "prop_001", "action": "scale_up"}}'
```

### 5. WebSocket (Comunicação P2P)
```bash
# Instalar wscat se necessário: npm install -g wscat
wscat -c ws://localhost:8000/ws

# Enviar handshake
{"peer_id": "test-peer", "type": "hello"}
```

### 6. Server-Sent Events
```bash
curl -N http://localhost:8000/stream/events
# Stream contínuo de eventos em tempo real
```

## 📊 **Monitoramento via MCP**

### Dashboard de Agentes
```javascript
// Obter status de todos os agentes
const agents = await mcp_a2a_specialist_discover_agents();

// Network de conexões
const network = await mcp_a2a_specialist_get_agent_network({
  agent_id: "a2a-agent-template",
  depth: 2
});

// Métricas gerais
const analytics = await mcp_a2a_specialist_get_a2a_analytics();
```

### Validação de Compliance
```javascript
// Verificar se agente está compatível com A2A
const validation = await mcp_a2a_specialist_validate_agent_card({
  agent_card: {
    name: "new-agent",
    capabilities: ["autonomous_decision_making"]
  }
});

if (!validation.compliant) {
  console.log("Issues:", validation.issues);
}
```

## 🎯 **Cenários de Uso**

### 1. **Swarm Autônomo**
```bash
# Spawnar 3 agentes A2A
for i in {1..3}; do
  AGENT_NAME=swarm-agent-$i \
  PORT=$((8000 + $i)) \
  python a2a_server.py &
done

# Todos se registram automaticamente no specialist
# Descobrem uns aos outros via P2P
# Formam consenso distribuído
```

### 2. **Orquestração de Tarefas**
```javascript
// Delegate complex task to swarm
const task = {
  id: "complex_analysis",
  type: "data_processing",
  subtasks: [
    "data_extraction",
    "pattern_recognition", 
    "decision_synthesis"
  ]
};

const result = await mcp_a2a_specialist_delegate_task({
  task: task,
  target_agent: "coordinator-agent"
});
```

### 3. **Aprendizagem Distribuída**
```bash
# Cada agente aprende independentemente
# Conhecimento é compartilhado via P2P
# Emergent behaviors são detectados
# Patterns são catalogados no Neo4j
```

## 🔧 **Configuração Avançada**

### Environment Variables
```bash
# Agente
export AGENT_NAME=production-agent
export AGENT_TYPE=coordinator
export HOST=0.0.0.0
export PORT=8000

# Task Store
export TASK_STORE_TYPE=redis
export REDIS_URL=redis://localhost:6379

# Segurança
export JWT_SECRET=production-secret
export SSL_KEY=/path/to/key.pem
export SSL_CERT=/path/to/cert.pem

# Logs
export LOG_LEVEL=INFO
export LOG_FORMAT=json
```

### Docker Compose
```yaml
version: '3.8'

services:
  a2a-coordinator:
    build: .claude/agents/a2a/
    ports: ["8000:8000"]
    environment:
      - AGENT_NAME=coordinator
      - AGENT_TYPE=coordinator
    
  a2a-worker-1:
    build: .claude/agents/a2a/
    ports: ["8001:8000"]
    environment:
      - AGENT_NAME=worker-1
      - AGENT_TYPE=worker
    
  redis:
    image: redis:alpine
    ports: ["6379:6379"]
```

## ✅ **Status Atual**

- **✅ MCP A2A Specialist**: Ativo e funcional
- **✅ Agentes A2A**: 3 registrados no sistema
- **✅ Neo4j Integration**: Dados persistidos via MCP
- **✅ Capacity Discovery**: Funcionando
- **✅ Task Delegation**: Implementado
- **✅ Analytics**: Métricas disponíveis

## 🎉 **Próximos Passos**

1. **Executar agentes A2A localmente**
2. **Testar comunicação P2P entre agentes**
3. **Implementar consenso distribuído real**
4. **Monitorar comportamentos emergentes**
5. **Escalar swarm A2A**

---

**🤖 O ecossistema A2A está pronto para agentes autônomos verdadeiramente distribuídos!**
