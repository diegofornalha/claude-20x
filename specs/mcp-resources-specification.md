# MCP Resources Specification - SPARC A2A Integration

## Visão Geral

Esta especificação define os MCP Resources estruturados que permitem acesso aos recursos SPARC, Memory Bank e Batchtools através do protocolo MCP (Model Context Protocol). Os resources fornecem uma interface padronizada para que clientes MCP possam descobrir e acessar funcionalidades do sistema A2A.

## Resource Categories

### 1. SPARC Workflow Resources

#### sparc://workflow/{contextId}
**Descrição**: Acesso ao estado completo de um workflow SPARC
**Formato**: JSON com histórico de fases e artefatos
```json
{
  "contextId": "string",
  "currentPhase": "specification|pseudocode|architecture|refinement|completion",
  "phases": {
    "specification": {...},
    "pseudocode": {...},
    "architecture": {...},
    "refinement": {...},
    "completion": {...}
  },
  "artifacts": [],
  "metadata": {
    "startTime": "ISO8601",
    "agentType": "researcher|coder|analyst|coordinator",
    "batchtoolsEnabled": true
  }
}
```

#### sparc://phase/{phase}/template
**Descrição**: Templates para cada fase SPARC
**Formato**: JSON com estrutura e orientações
```json
{
  "phase": "specification",
  "template": {
    "requirements": "...",
    "goals": "...",
    "constraints": "...",
    "methodology": "..."
  },
  "guidelines": "...",
  "examples": [],
  "validation": {}
}
```

#### sparc://agent/{agentType}/capabilities
**Descrição**: Capacidades específicas de cada tipo de agente
**Formato**: JSON com skills e especializações### 2. Memory Bank Resources

#### memory://namespace/{namespace}/keys
**Descrição**: Lista de chaves disponíveis em um namespace
**Formato**: JSON array com metadados
```json
{
  "namespace": "sparc-workflow",
  "keys": [
    {
      "key": "task:123:specification",
      "created": "ISO8601",
      "accessed": "ISO8601",
      "size": 1024,
      "ttl": 3600
    }
  ],
  "stats": {
    "total": 50,
    "size": 10240,
    "oldestEntry": "ISO8601"
  }
}
```

#### memory://data/{namespace}/{key}
**Descrição**: Dados armazenados em uma chave específica
**Formato**: JSON com valor e metadados
```json
{
  "key": "task:123:specification",
  "value": {...},
  "metadata": {
    "namespace": "sparc-workflow",
    "created": "ISO8601",
    "accessed": "ISO8601",
    "accessCount": 5,
    "ttl": 3600
  }
}
```

#### memory://search/{namespace}?pattern={pattern}
**Descrição**: Busca por padrão em um namespace
**Formato**: JSON com resultados paginados
```json
{
  "pattern": "task:*:specification",
  "namespace": "sparc-workflow", 
  "results": [
    {
      "key": "task:123:specification",
      "score": 0.95,
      "preview": "...",
      "metadata": {...}
    }
  ],
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 10
  }
}
```### 3. Batchtools Optimization Resources

#### batchtools://metrics/performance
**Descrição**: Métricas de performance das otimizações
**Formato**: JSON com estatísticas detalhadas
```json
{
  "overall": {
    "enabled": true,
    "optimizationsApplied": 1250,
    "averageSpeedup": 2.3,
    "memoryReduction": 0.15
  },
  "byType": {
    "concurrent_processing": {
      "count": 500,
      "averageSpeedup": 3.2,
      "successRate": 0.98
    },
    "parallel_content_processing": {
      "count": 400,
      "averageSpeedup": 2.1,
      "successRate": 0.95
    },
    "resource_optimization": {
      "count": 350,
      "memoryReduction": 0.25,
      "successRate": 0.99
    }
  },
  "timestamp": "ISO8601"
}
```

#### batchtools://queue/status
**Descrição**: Status da fila de operações em batch
**Formato**: JSON com informações da fila
```json
{
  "queueSize": 15,
  "activeBatches": 3,
  "maxConcurrency": 5,
  "operations": [
    {
      "id": "batch_001",
      "type": "file_operations",
      "priority": "high",
      "estimatedDuration": 2000,
      "startTime": "ISO8601"
    }
  ],
  "throughput": {
    "operationsPerSecond": 12.5,
    "averageLatency": 150
  }
}
```

#### batchtools://config/settings
**Descrição**: Configurações atuais do sistema batchtools
**Formato**: JSON com parâmetros configuráveis
```json
{
  "enabled": true,
  "maxConcurrency": 5,
  "resourceMonitoring": true,
  "thresholds": {
    "memoryUsage": 0.8,
    "cpuUsage": 0.8,
    "queueSize": 100
  },
  "optimizationStrategies": [
    "concurrent_processing",
    "parallel_content_processing", 
    "resource_optimization"
  ]
}
```### 4. A2A Protocol Resources  

#### a2a://agents/registry
**Descrição**: Registro de todos os agentes A2A disponíveis
**Formato**: JSON com agent cards e status
```json
{
  "agents": [
    {
      "agentType": "researcher",
      "url": "http://localhost:8001",
      "status": "healthy",
      "capabilities": [...],
      "lastSeen": "ISO8601",
      "agentCard": {...}
    }
  ],
  "discovery": {
    "lastScan": "ISO8601",
    "totalAgents": 4,
    "healthyAgents": 4
  }
}
```

#### a2a://tasks/{taskId}
**Descrição**: Informações detalhadas de uma task A2A
**Formato**: JSON com estado completo da task
```json
{
  "taskId": "task_123",
  "contextId": "ctx_456", 
  "status": {
    "state": "working",
    "timestamp": "ISO8601",
    "message": {...}
  },
  "history": [...],
  "artifacts": [...],
  "metadata": {
    "sparcPhase": "architecture",
    "batchtoolsOptimized": true,
    "agentType": "coder"
  }
}
```

#### a2a://streams/{streamId}
**Descrição**: Dados de stream SSE ativo
**Formato**: JSON com metadados do stream
```json
{
  "streamId": "stream_789",
  "connectionId": "conn_abc",
  "status": "active",
  "events": [
    {
      "type": "sparc_phase_started",
      "timestamp": "ISO8601",
      "data": {...}
    }
  ],
  "metadata": {
    "startTime": "ISO8601",
    "totalEvents": 25,
    "clientInfo": "..."
  }
}
```## Resource Discovery Patterns

### Namespace-based Discovery
```
mcp://claude-20x/sparc/{resource-path}
mcp://claude-20x/memory/{resource-path}
mcp://claude-20x/batchtools/{resource-path}
mcp://claude-20x/a2a/{resource-path}
```

### Dynamic Resource Generation
- Resources são gerados dinamicamente baseados no estado atual
- Cache TTL de 30 segundos para recursos estáticos
- Atualização em tempo real para recursos dinâmicos

### Resource Metadata
Todos os resources incluem metadados padrão:
```json
{
  "resourceId": "unique-identifier",
  "type": "sparc|memory|batchtools|a2a",
  "lastModified": "ISO8601",
  "cachePolicy": "static|dynamic|realtime",
  "permissions": ["read", "write", "execute"],
  "schema": "json-schema-url"
}
```

## Integration Patterns

### 1. SPARC-MCP Bridge
- Workflows SPARC expostos como MCP resources
- Atualização automática conforme progresso das fases
- Artefatos disponíveis via resource URIs

### 2. Memory-MCP Bridge  
- Namespaces do Memory Bank mapeados para resource paths
- Busca e descoberta via MCP resource queries
- Persistência cross-protocol

### 3. Batchtools-MCP Bridge
- Métricas e configurações expostas como resources
- Controle de otimizações via MCP tool calls
- Monitoramento em tempo real

### 4. A2A-MCP Bridge
- Tasks A2A acessíveis via MCP resources
- Streams SSE expostos como resources dinâmicos
- Agent registry disponível para descoberta

## Security and Access Control

### Resource Permissions
- **Read**: Acesso aos dados do resource
- **Write**: Modificação do resource (quando aplicável)
- **Execute**: Trigger de ações relacionadas ao resource

### Authentication
- Resources protegidos por tokens de acesso
- Namespaces isolados por agente/contexto
- Rate limiting baseado em resource type

### Privacy
- Dados sensíveis filtrados automaticamente
- Logs de acesso para auditoria
- Expiração automática de resources temporários