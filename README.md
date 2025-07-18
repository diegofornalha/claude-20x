# A2A (Agent-to-Agent) Protocol - Sistema Unificado

## 📋 Visão Geral

O sistema A2A (Agent-to-Agent) é uma arquitetura unificada para comunicação entre agentes inteligentes, baseada em protocolos HTTP padronizados e otimizada para performance com cache Redis distribuído. Este projeto implementa um servidor base reutilizável que elimina duplicação de código e fornece recursos enterprise-grade.

## 🏗️ Arquitetura do Sistema

### Componentes Principais

```
┌─────────────────────────────────────────────┐
│                 A2A Sistema                 │
├─────────────────────────────────────────────┤
│  🔧 BaseA2AServer.js                       │
│  └── Servidor base unificado               │
│                                             │
│  ⚡ CacheMiddleware.js                      │
│  └── Sistema de cache inteligente          │
│                                             │
│  📡 RedisCache.js                          │
│  └── Cache distribuído com pooling         │
│                                             │
│  ⚙️ config/a2a-unified.json               │
│  └── Configuração centralizada             │
└─────────────────────────────────────────────┘
```

### Protocolo A2A v1.0

O protocolo A2A define 4 endpoints principais obrigatórios:

| Endpoint | Método | Descrição | Cache |
|----------|--------|-----------|-------|
| `/discover` | GET | Descobre capacidades do agente | ✅ 1min |
| `/communicate` | POST | Comunicação direta com agente | ❌ |
| `/delegate` | POST | Delegação de tarefas | ❌ |
| `/health` | GET | Status de saúde do agente | ✅ 30s |

### Endpoints Adicionais

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/agent.json` | GET | Carta do agente (metadados) |
| `/cache/stats` | GET | Estatísticas de cache |
| `/cache/invalidate` | POST | Invalidação de cache |
| `/cache/warmup` | POST | Pre-aquecimento de cache |
| `/metrics` | GET | Métricas de performance |
| `/info` | GET | Informações do servidor |

## 🚀 Quick Start

### 1. Configuração Básica

```javascript
const BaseA2AServer = require('./BaseA2AServer');

// Seu agente deve implementar os métodos do protocolo A2A
const meuAgente = {
  name: 'MeuAgente',
  
  async discover() {
    return {
      name: 'MeuAgente',
      capabilities: ['processo-texto', 'análise-dados'],
      version: '1.0.0'
    };
  },

  async communicate(message) {
    // Processar comunicação
    return { response: 'Mensagem processada' };
  },

  async delegate(task) {
    // Executar tarefa delegada
    return { result: 'Tarefa concluída' };
  },

  async health() {
    return { status: 'healthy', timestamp: new Date().toISOString() };
  }
};

// Criar e iniciar servidor
const server = new BaseA2AServer(meuAgente, 8080);
server.start();
```

### 2. Configuração Avançada com Cache

```javascript
const server = new BaseA2AServer(meuAgente, 8080, {
  enableCache: true,
  corsOrigin: '*',
  cacheTTL: 300,
  enableCompression: true,
  enableCacheWarmup: true,
  redis: {
    host: 'localhost',
    port: 6379,
    password: null,
    db: 0
  }
});
```

## ⚙️ Configuração

### Arquivo Central: `/config/a2a-unified.json`

O sistema usa um arquivo de configuração centralizado que gerencia 10 agentes:

```json
{
  "version": "1.0",
  "global_defaults": {
    "enabled": true,
    "protocol_version": "1.0",
    "discovery": {
      "auto_register": true,
      "registry_url": "http://localhost:8080/api/agents",
      "heartbeat_interval": 30000
    },
    "communication": {
      "transport": "http",
      "format": "json",
      "timeout": 30000
    }
  },
  "agents": [...]
}
```

### Variáveis de Ambiente

```bash
# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=sua_senha
REDIS_DB=0

# Server Configuration  
A2A_PORT=8080
```

## 🔧 Recursos Avançados

### 1. Sistema de Cache Inteligente

- **Cache por endpoint**: TTL diferenciado por tipo de endpoint
- **Cache keys fingerprinting**: Chaves únicas baseadas em headers e parâmetros
- **Invalidação seletiva**: Limpar cache por padrões específicos
- **Warmup automático**: Pre-carregar endpoints críticos na inicialização

```javascript
// Invalidar cache específico
POST /cache/invalidate
{
  "pattern": "discovery" // ou "health", "all"
}

// Aquecer cache
POST /cache/warmup
```

### 2. Monitoramento e Métricas

```javascript
// Estatísticas do servidor
GET /metrics
{
  "server": {
    "uptime": 3600,
    "requests": 1250,
    "errors": 2,
    "errorRate": "0.16%"
  },
  "cache": {
    "hitRate": "87.5%",
    "hits": 875,
    "misses": 125
  }
}
```

### 3. Performance e Segurança

- **Compressão gzip**: Reduz tráfego de rede
- **Headers de segurança**: XSS protection, content type sniffing
- **Rate limiting**: Proteção contra abuso
- **Graceful shutdown**: Encerramento limpo do servidor

## 📊 Agentes Configurados

O sistema atual gerencia 10 agentes especializados:

1. **helloworld_agent** - Agente de demonstração
2. **a2a_mcp_agent** - Integração MCP
3. **memory_agent** - Gerenciamento de memória
4. **agent_cards_agent** - Cartas de agentes
5. **components_agent** - Componentes UI
6. **hosts_agent** - Gerenciamento de hosts
7. **pages_agent** - Páginas da aplicação
8. **scripts_agent** - Scripts utilitários
9. **state_agent** - Gerenciamento de estado
10. **utils_agent** - Utilitários gerais

## 🔄 Migração de Servidor Legacy

### Passo 1: Análise do Servidor Atual
```bash
# Identificar métodos implementados
grep -n "app\." seu-servidor-atual.js

# Verificar endpoints customizados
grep -n "router\|get\|post" seu-servidor-atual.js
```

### Passo 2: Adaptar seu Agente
```javascript
// Antes (servidor legacy)
app.get('/custom-endpoint', handler);

// Depois (BaseA2AServer)
class MeuAgente {
  async discover() { /* implementar */ }
  async communicate(data) { /* implementar */ }
  async delegate(task) { /* implementar */ }
  async health() { /* implementar */ }
}
```

### Passo 3: Migrar Configuração
```javascript
// Mover configurações para /config/a2a-unified.json
// Atualizar variáveis de ambiente
// Testar endpoints com cache habilitado
```

## 🐛 Troubleshooting

### Problemas Comuns

**1. Redis não conecta**
```bash
# Verificar se Redis está rodando
redis-cli ping

# Verificar logs do servidor
tail -f logs/server.log
```

**2. Cache não funciona**
```javascript
// Verificar health do cache
GET /cache/stats

// Limpar cache se necessário
POST /cache/invalidate {"pattern": "all"}
```

**3. Performance lenta**
```javascript
// Verificar métricas
GET /metrics

// Verificar se compressão está habilitada
// Verificar TTL do cache
```

## 📚 API Reference

### BaseA2AServer Constructor

```javascript
new BaseA2AServer(agent, port, options)
```

**Parâmetros:**
- `agent` (Object) - Instância do agente implementando protocolo A2A
- `port` (Number) - Porta do servidor (padrão: 8080)
- `options` (Object) - Opções de configuração

**Options:**
- `enableCache` (Boolean) - Habilitar cache Redis (padrão: true)
- `corsOrigin` (String) - Configuração CORS (padrão: '*')
- `cacheTTL` (Number) - TTL padrão em segundos (padrão: 300)
- `enableLogging` (Boolean) - Logs de requisições (padrão: true)
- `enableCompression` (Boolean) - Compressão gzip (padrão: true)
- `redis` (Object) - Configurações do Redis

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob licença MIT. Veja o arquivo `LICENSE` para detalhes.

## 🆘 Suporte

- **Issues**: Reporte bugs no GitHub Issues
- **Documentação**: Consulte `/docs` para documentação detalhada
- **Comunidade**: Discord/Slack para discussões

---

**Desenvolvido com ❤️ pela equipe A2A Protocol**