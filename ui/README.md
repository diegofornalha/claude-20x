# A2A Python Example UI

Uma interface web para visualizar e gerenciar agentes A2A (Agent-to-Agent) usando Mesop.

## Características

- Descoberta automática de agentes em localhost
- Interface web interativa
- Suporte a múltiplos agentes A2A
- Comunicação em tempo real

## Execução

```bash
uv run python main.py
```

## Agentes Suportados

O sistema descobre automaticamente agentes rodando nas portas padrão:
- 9999: HelloWorld Agent (sempre ativo)
- 10000: Porta padrão A2A
- 10030: Marvin Agent
- 10100: MCP Server
- 11000: Agent genérico

## Endpoints

- Interface web: http://localhost:12000
- Agentes disponíveis: http://localhost:9999/.well-known/agent.json