# PRP-001: Distinção entre Tipos de Agentes no Projeto

## Metadata
- **PRP ID**: PRP-001
- **Título**: Distinção entre Agentes Claude Flow e Agentes A2A
- **Categoria**: PRPs-agentic
- **Status**: Ativo
- **Data**: 2025-08-04
- **Autor**: Sistema de Documentação

## Problema

Existem dois tipos completamente diferentes de "agentes" no projeto que podem causar confusão:
1. Agentes de coordenação do Claude Flow
2. Agentes do protocolo A2A (Agent-to-Agent)

Esta ambiguidade pode levar a:
- Confusão ao referenciar "agentes" em conversas
- Erros ao tentar usar ferramentas incorretas
- Mistura de conceitos e protocolos incompatíveis
- Dificuldade na manutenção e evolução do projeto

## Resolução

### 1. Definições Claras

#### 🤖 Agentes Claude Flow
- **Definição**: Agentes de coordenação interna do Claude Code
- **Localização**: `/Users/agents/Desktop/claude-20x/.conductor/nuuk/.claude/agents`
- **Protocolo**: Sistema proprietário Claude Flow com metodologia SPARC
- **Servidor MCP**: `claude-flow` e `ruv-swarm`
- **Função Principal**: Orquestrar e coordenar tarefas do Claude Code

#### 🌐 Agentes A2A
- **Definição**: Agentes independentes seguindo protocolo Google A2A
- **Localização**: `/Users/agents/Desktop/claude-20x/.conductor/nuuk/agents`
- **Protocolo**: A2A (Agent-to-Agent Protocol) da Google
- **Interface**: Mesop UI rodando em http://localhost:12000
- **Função Principal**: Comunicação inter-agentes usando padrão aberto

### 2. Estrutura de Diretórios

```
/Users/agents/Desktop/claude-20x/.conductor/nuuk/
├── .claude/
│   └── agents/              # 🤖 Agentes Claude Flow
│       ├── sparc-agents/
│       ├── swarm-configs/
│       └── coordination/
└── agents/                  # 🌐 Agentes A2A
    ├── context7/
    ├── ultrathink/
    └── [outros agentes A2A]/
```

### 3. Convenções de Nomenclatura

Para evitar ambiguidade, sempre use:
- **"Claude Flow agents"** ou **"CF agents"** para agentes de coordenação
- **"A2A agents"** ou **"Google agents"** para agentes do protocolo A2A
- Evite usar apenas "agentes" sem contexto

### 4. Comandos e Ferramentas

#### Para Claude Flow Agents:
```bash
# Listar agentes disponíveis
npx claude-flow sparc modes

# Spawnar agentes de coordenação
Task("agent-type", "instructions", "subagent_type")

# Usar ferramentas MCP
mcp__claude-flow__agent_spawn
mcp__ruv-swarm__agent_spawn
```

#### Para A2A Agents:
```bash
# Interface UI
http://localhost:12000

# SDK Python
import a2a

# Comunicação via protocolo A2A
POST /message/send
```

## Protocolo de Ação

### Ao trabalhar com agentes:

1. **Identifique o tipo**:
   - Verifique o diretório base
   - Confirme o protocolo utilizado
   - Use a nomenclatura correta

2. **Use as ferramentas apropriadas**:
   - Claude Flow: Use Task tool e MCP tools
   - A2A: Use SDKs A2A e interface Mesop

3. **Mantenha separação clara**:
   - Não misture protocolos
   - Não confunda diretórios
   - Documente sempre o tipo ao criar novos agentes

## Exemplos Práticos

### ❌ Incorreto:
```bash
# Tentando usar ferramenta Claude Flow com agente A2A
Task("context7", "process data", "analyzer")  # ERRO!
```

### ✅ Correto:
```bash
# Claude Flow agent
Task("analyzer", "analyze codebase", "code-analyzer")

# A2A agent (via SDK)
client = a2a.Client("http://localhost:12000/agents/context7")
response = client.send_message("process data")
```

## Benefícios

1. **Clareza**: Elimina ambiguidade nas comunicações
2. **Eficiência**: Uso correto de ferramentas apropriadas
3. **Manutenibilidade**: Facilita evolução independente de cada sistema
4. **Integração**: Permite bridges claras quando necessário

## Referências

- [Claude Flow Documentation](https://github.com/ruvnet/claude-flow)
- [Google A2A Protocol](https://google.github.io/A2A/)
- [MCP Documentation](https://modelcontextprotocol.io/)

---

**Status**: Este PRP está ativo e deve ser consultado sempre que houver dúvidas sobre tipos de agentes no projeto.