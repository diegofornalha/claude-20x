# 🔍 Service Discovery - Guia Completo

## 🤔 O que é Service Discovery?

**Service Discovery** é um sistema que automaticamente **descobre**, **registra** e **monitora** todos os serviços/agentes rodando na sua infraestrutura. 

### 🏢 Analogia: Como uma Recepcionista de um Prédio Empresarial

Imagine um prédio com 50 empresas. A recepcionista sabe:
- **Quais empresas estão no prédio** (quais serviços existem)
- **Em que andar cada uma está** (em que porta/endereço)
- **Se estão abertas ou fechadas** (status online/offline)
- **Como contatar cada uma** (endpoints disponíveis)
- **O que cada empresa faz** (capacidades/funcionalidades)

## 🎯 Problema que Resolve no Claude-20x

Seu projeto tem **muitos agentes e serviços**:
```
🤖 HelloWorld Agent (porta ?)
🤖 Marvin Agent (porta ?)  
🤖 Gemini Agent (porta ?)
🌐 UI Service (porta ?)
📊 Analytics Service (porta ?)
🔧 A2A Inspector (porta ?)
📊 Central Logger (porta ?)
```

**Sem Service Discovery:** 🤯
- Você precisa lembrar todas as portas manualmente
- Se um serviço muda de porta, você precisa atualizar tudo
- Não sabe se um serviço está funcionando
- Difícil fazer load balancing
- Difícil escalar automaticamente

**Com Service Discovery:** ✨
- Sistema descobre automaticamente todos os serviços
- Monitora saúde de cada um em tempo real
- Registra automaticamente novos serviços
- Fornece APIs para consultar tudo
- Permite load balancing inteligente

## 🔧 Como Funciona no Claude-20x

### 1. 🕵️ Auto-Discovery (Descoberta Automática)
O sistema executa **3 estratégias simultâneas**:

#### A) **Port Scanning** - Varredura de Portas
```python
# Varre portas conhecidas onde agentes costumam rodar
scan_ranges = [
    ("localhost", range(3000, 4000)),  # Portas comuns
    ("localhost", range(5000, 6000)),  # Portas A2A  
    ("localhost", range(8000, 9000)),  # Portas alternativas
]
```

#### B) **Config-based Discovery** - Leitura de Configurações
```python
# Busca automaticamente por arquivos a2a-config.json
config_files = project_root.rglob("a2a-config.json")
# Extrai informações de porta, host, capabilities
```

#### C) **Protocol Detection** - Detecção de Protocolos
```python
# Testa endpoints A2A padrão
endpoints = ["/agent/card", "/.well-known/agent.json", "/health"]
# Se responder, é um agente A2A válido
```

### 2. 💓 Health Monitoring (Monitoramento de Saúde)
```python
# A cada 30 segundos verifica se cada serviço está vivo
async def health_check_agent(agent_id):
    response = await session.get(agent.health_endpoint)
    if response.status == 200:
        agent.status = ONLINE
    else:
        agent.status = OFFLINE
```

### 3. 📋 Registry Centralizado
```python
# Mantém registro de todos os serviços descobertos
registry = {
    "localhost:5555": {
        "name": "HelloWorld Agent",
        "type": "a2a", 
        "status": "online",
        "capabilities": ["chat", "greeting"],
        "last_seen": "2025-07-18T19:30:00Z"
    }
}
```

## 🌐 APIs Disponíveis

### GET /agents - Listar Todos os Agentes
```bash
curl http://localhost:8002/agents
```
**Resposta:**
```json
{
  "agents": [
    {
      "id": "localhost:5555",
      "name": "HelloWorld Agent", 
      "type": "a2a",
      "host": "localhost",
      "port": 5555,
      "url": "http://localhost:5555",
      "status": "online",
      "capabilities": ["chat", "greeting"],
      "last_seen": "2025-07-18T19:30:00Z"
    }
  ],
  "count": 1
}
```

### GET /agents/{id} - Detalhes de Agente Específico
```bash
curl http://localhost:8002/agents/localhost:5555
```

### POST /discover - Forçar Nova Descoberta
```bash
curl -X POST http://localhost:8002/discover?force=true
```

### GET /stats - Estatísticas do Sistema
```bash
curl http://localhost:8002/stats
```
**Resposta:**
```json
{
  "total_agents": 5,
  "by_status": {
    "online": 4,
    "offline": 1
  },
  "by_type": {
    "a2a": 3,
    "web": 1, 
    "analytics": 1
  }
}
```

### POST /agents/{id}/health - Verificar Saúde
```bash
curl -X POST http://localhost:8002/agents/localhost:5555/health
```

## 💼 Casos de Uso Práticos

### 1. 🔄 Load Balancing Automático
```python
# Obter todos os agentes saudáveis de um tipo
healthy_chat_agents = discovery.get_agents_by_type("a2a")
healthy_agents = [a for a in healthy_chat_agents if a.status == "online"]

# Distribuir requisições entre eles
selected_agent = random.choice(healthy_agents)
```

### 2. 🚀 Auto-Scaling
```python
# Se muitos agentes offline, criar novos
if len(healthy_agents) < min_required:
    spawn_new_agent()
```

### 3. 🔍 Debugging e Monitoramento
```python
# Ver rapidamente quais serviços estão com problema
offline_services = discovery.get_agents_by_status("offline")
```

### 4. 🌐 API Gateway Dinâmico
```python
# Rotear requisições baseado em descoberta automática
if request.path.startswith("/chat"):
    agents = discovery.get_agents_by_capability("chat")
    forward_to(random.choice(agents))
```

## 🎬 Exemplo de Descoberta Automática

Quando você inicia um novo agente em qualquer porta:

```bash
# 1. Você inicia um novo agente
python agent.py --port 3005

# 2. Service Discovery detecta automaticamente:
[Discovery] 🔍 Novo serviço detectado em localhost:3005
[Discovery] 🤖 Tipo: a2a
[Discovery] ✅ Adicionado ao registry: "New Agent"
[Discovery] 💓 Health check: ONLINE

# 3. Agora está disponível via API:
GET /agents -> inclui o novo agente
```

## 🔧 Integração com Outros Sistemas

### Com Central Logger:
```python
# Service Discovery automaticamente reporta descobertas para o logger
logger.log(INFO, "SERVICE_DISCOVERY", f"Discovered new agent: {agent.name}")
```

### Com Load Balancer:
```python
# Atualiza automaticamente lista de targets
load_balancer.update_targets(discovery.get_healthy_agents())
```

### Com Monitoring:
```python
# Gera métricas automáticas
metrics.gauge("services.total", len(registry))
metrics.gauge("services.healthy", len(healthy_agents))
```

## 🎯 Benefícios Reais

### ✅ **Antes do Service Discovery:**
```python
# Código hardcoded e frágil
AGENTS = {
    "chat": "http://localhost:5555",
    "analytics": "http://localhost:5000"  
}
# Se muda porta, quebra tudo!
```

### 🚀 **Depois do Service Discovery:**
```python
# Código dinâmico e resiliente  
chat_agents = discovery.get_agents_by_capability("chat")
healthy_agent = discovery.select_healthy_agent(chat_agents)
# Funciona sempre, mesmo se portas mudarem!
```

---

**🎯 Resumo:** Service Discovery é como ter um "Google Maps" dos seus serviços - sempre sabe onde tudo está, se está funcionando, e como chegar lá!