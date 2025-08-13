# A2A Agent - SDK Oficial

Implementação de agente A2A usando o SDK oficial com `A2AStarletteApplication`.

## 🚀 Stack Tecnológica Oficial

- **Gerenciador de Pacotes**: `uv` (ultrarrápido, substitui pip)
- **Framework**: `Starlette` (ASGI assíncrono)
- **Servidor**: `Uvicorn` (ASGI de alta performance)
- **SDK**: `a2a-sdk` (SDK oficial do protocolo A2A)

## 📦 Instalação com uv

```bash
# Instalar uv (se ainda não tiver)
curl -LsSf https://astral.sh/uv/install.sh | sh

# Criar ambiente virtual com uv
uv venv

# Ativar ambiente
source .venv/bin/activate  # Linux/Mac
# ou
.venv\Scripts\activate  # Windows

# Instalar dependências com uv
uv pip sync

# Ou instalar diretamente do pyproject.toml
uv pip install -e .

# Para desenvolvimento
uv pip install -e ".[dev]"

# Para ML/AI features
uv pip install -e ".[ml]"
```

## 🏗️ Estrutura do Projeto

```
.claude/agents/a2a/
├── pyproject.toml           # Configuração do projeto e dependências
├── uv.lock                  # Lock file do uv (gerado automaticamente)
├── a2a_agent_official.py    # Implementação com SDK oficial
├── a2a_server.py           # Implementação alternativa detalhada
├── requirements.txt        # Dependências (compatibilidade pip)
└── README.md              # Este arquivo
```

## 🔧 Configuração

### Variáveis de Ambiente

```bash
# Básicas
AGENT_NAME=my-agent
AGENT_TYPE=autonomous
HOST=0.0.0.0
PORT=8000
WORKERS=4

# Task Store
TASK_STORE_TYPE=sqlite  # memory, sqlite, redis
SQLITE_PATH=./.a2a/tasks.db
REDIS_URL=redis://localhost:6379

# Segurança
JWT_SECRET=your-secret-key
SSL_KEY=/path/to/key.pem
SSL_CERT=/path/to/cert.pem

# Ambiente
ENV=development  # development, production
LOG_LEVEL=INFO
LOG_FORMAT=json
```

### Arquivo .env

```bash
# Criar arquivo .env
cat > .env << EOF
AGENT_NAME=a2a-agent-01
AGENT_TYPE=coordinator
PORT=8000
TASK_STORE_TYPE=sqlite
ENV=development
EOF
```

## 🎯 Uso do SDK Oficial

### Executar Agente

```python
from a2a_agent_official import create_agent

# Criar agente com configuração padrão
agent = create_agent("my-agent")

# Executar servidor
agent.run(host="0.0.0.0", port=8000)
```

### Linha de Comando

```bash
# Executar diretamente
python a2a_agent_official.py

# Com uv
uv run python a2a_agent_official.py

# Com uvicorn
uvicorn a2a_agent_official:app --host 0.0.0.0 --port 8000 --loop uvloop

# Desenvolvimento com reload
uvicorn a2a_agent_official:app --reload --loop uvloop

# Produção com workers
uvicorn a2a_agent_official:app --workers 4 --loop uvloop
```

## 📚 Componentes do SDK A2A

### A2AStarletteApplication

Classe principal que fornece:
- Roteamento ASGI automático
- Middleware de segurança
- Lifecycle hooks
- Integração com componentes A2A

### TaskStore

Gerenciamento de tarefas com backends:
- `InMemoryTaskStore` - Para desenvolvimento
- `SQLiteTaskStore` - Persistência local
- `RedisTaskStore` - Distribuído/produção

### Handlers

- `DecisionHandler` - Tomada de decisão autônoma
- `LearningHandler` - Aprendizagem contínua
- `AdaptationHandler` - Auto-adaptação
- `ConsensusHandler` - Consenso distribuído
- `MessageHandler` - Comunicação P2P

### Componentes

- `PeerDiscovery` - Descoberta de peers
- `KnowledgeBase` - Base de conhecimento
- `EmergenceDetector` - Detecção de emergência
- `A2AMetrics` - Métricas e observabilidade

## 🧪 Testes

### Teste Manual

```bash
# Info do agente
curl http://localhost:8000/

# Status
curl http://localhost:8000/status

# Decisão
curl -X POST http://localhost:8000/decide \
  -H "Content-Type: application/json" \
  -d '{"context": {"task": "analyze", "priority": "high"}}'

# Aprendizagem
curl -X POST http://localhost:8000/learn \
  -H "Content-Type: application/json" \
  -d '{"data": {"pattern": "example", "score": 0.95}}'

# WebSocket
wscat -c ws://localhost:8000/ws

# SSE
curl -N http://localhost:8000/stream/events
```

### Testes Automatizados

```bash
# Executar testes com pytest
uv run pytest

# Com coverage
uv run pytest --cov

# Testes específicos
uv run pytest tests/test_handlers.py
```

## 🐳 Docker

```dockerfile
FROM python:3.11-slim

# Instalar uv
RUN pip install uv

WORKDIR /app

# Copiar arquivos de configuração
COPY pyproject.toml uv.lock ./

# Instalar dependências com uv
RUN uv pip sync

# Copiar código
COPY . .

# Executar
CMD ["uvicorn", "a2a_agent_official:app", "--host", "0.0.0.0", "--port", "8000", "--loop", "uvloop"]
```

### Docker Compose

```yaml
version: '3.8'

services:
  a2a-agent:
    build: .
    ports:
      - "8000:8000"
    environment:
      - AGENT_NAME=agent-01
      - TASK_STORE_TYPE=redis
      - REDIS_URL=redis://redis:6379
    depends_on:
      - redis
  
  redis:
    image: redis:alpine
    ports:
      - "6379:6379"
```

## 📊 Métricas e Monitoramento

### Prometheus

```bash
# Métricas disponíveis em
http://localhost:8000/metrics
```

### Grafana Dashboard

```json
{
  "dashboard": {
    "title": "A2A Agent Metrics",
    "panels": [
      {
        "title": "Decisions per Minute",
        "targets": [
          {
            "expr": "rate(a2a_decisions_total[1m])"
          }
        ]
      },
      {
        "title": "P2P Connections",
        "targets": [
          {
            "expr": "a2a_peers_connected"
          }
        ]
      }
    ]
  }
}
```

## 🔒 Segurança

### TLS/SSL

```bash
# Gerar certificados para desenvolvimento
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes

# Executar com TLS
SSL_KEY=key.pem SSL_CERT=cert.pem python a2a_agent_official.py
```

### JWT Authentication

```python
from a2a_sdk.security import create_jwt_token, verify_jwt_token

# Criar token
token = create_jwt_token({"agent_id": "agent-01"})

# Verificar token
payload = verify_jwt_token(token)
```

## 📖 Documentação Adicional

- [SDK A2A Documentation](https://docs.a2aprotocol.ai/sdk)
- [Starlette Documentation](https://www.starlette.io)
- [Uvicorn Documentation](https://www.uvicorn.org)
- [uv Documentation](https://github.com/astral-sh/uv)

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

MIT License - veja [LICENSE](LICENSE) para detalhes.

## 🆘 Suporte

- Issues: [GitHub Issues](https://github.com/a2aprotocol/a2a-agent/issues)
- Discord: [A2A Community](https://discord.gg/a2aprotocol)
- Email: support@a2aprotocol.ai