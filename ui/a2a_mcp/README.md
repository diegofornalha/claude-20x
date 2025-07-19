# A2a Mcp

cd ui && GOOGLE_API_KEY="AIzaSyDeyRoAZwxeA7_XcXwz4aTKurPBAWsnYY0" uv run main.py

## 🤖 Agent-to-Agent (A2A) Integration

Este projeto é totalmente compatível com o protocolo **Agent2Agent (A2A)** para interoperabilidade universal entre agentes AI.

### 🌐 Especificações A2A

- **Protocol Version**: 1.0
- **Agent ID**: `a2a_mcp_agent`
- **Compliance Level**: A2A 1.0 Full
- **Interoperability**: Universal (LangGraph, CrewAI, Semantic Kernel, MCP)

### 📋 Funcionalidades A2A

- ✅ **Discovery**: Descoberta automática de agentes
- ✅ **Communication**: Comunicação inter-agentes
- ✅ **Cooperation**: Cooperação e delegação de tarefas
- ✅ **Multimodal**: Suporte a diferentes tipos de dados
- ✅ **Real-time**: Comunicação em tempo real

### 🚀 Como Usar

#### Iniciar o Agente A2A
```bash
node a2a-server.js
```

#### Descobrir o Agente
```bash
curl http://localhost:8888/discover
```

#### Comunicar com o Agente
```bash
curl -X POST http://localhost:8888/communicate \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello from another agent"}'
```

#### Delegar Tarefa
```bash
curl -X POST http://localhost:8888/delegate \
  -H "Content-Type: application/json" \
  -d '{"task": "process_data", "payload": {...}}'
```

### 🔧 Configuração

A configuração A2A está em `a2a-config.json` e pode ser ajustada conforme necessário.

### 📖 Documentação Oficial

- [A2A Protocol Specification](https://a2aproject.github.io/A2A/latest/)
- [A2A Documentation](https://a2aprotocol.ai/docs/)

### 🏗️ Arquitetura

```
a2a_mcp/
├── .well-known/
│   └── agent.json          # Agent Card A2A
├── agents/
│   ├── a2a_mcp_agent.js   # Implementação do agente
│   └── index.js            # Exports
├── a2a-server.js           # Servidor A2A
├── a2a-config.json         # Configuração A2A
└── README.md               # Esta documentação
```

---
*Powered by Agent2Agent Protocol - Universal AI Interoperability*