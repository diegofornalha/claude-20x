# Como Rodar o Agente HelloWorld

Este documento descreve os passos exatos que foram executados para rodar o agente HelloWorld no projeto A2A.

## Pré-requisitos

- UI-Mesop-Py rodando na porta 12000
- Python 3.12+ instalado
- UV package manager instalado

## Passos Executados

### 1. Verificar se o agente já estava rodando

```bash
# Verificar processos ativos
ps aux | grep -E "(helloworld|main_helloworld)" | grep -v grep

# Verificar PIDs antigos
cat /Users/agents/Desktop/claude-20x/agents/helloworld/helloworld.pid
cat /Users/agents/Desktop/claude-20x/run-a2a/helloworld.pid

# Verificar se os processos estavam ativos
ps -p 73089 2>/dev/null | grep -v PID
ps -p 23896 2>/dev/null | grep -v PID
```

**Resultado**: Nenhum processo ativo encontrado.

### 2. Instalar dependências do agente

```bash
cd /Users/agents/Desktop/claude-20x/agents/helloworld
uv sync
```

**Resultado**: 
- Ambiente virtual criado em `.venv`
- 74 pacotes instalados com sucesso
- Principais dependências: a2a-sdk, fastapi, uvicorn, langgraph

### 3. Executar o agente HelloWorld

```bash
cd /Users/agents/Desktop/claude-20x/agents/helloworld
nohup uv run python main_helloworld.py > helloworld.log 2>&1 & echo $!
```

**Resultado**: 
- Processo iniciado com PID 18690
- Servidor rodando em http://localhost:9999

### 4. Verificar que o agente está funcionando

```bash
# Verificar logs
tail -20 helloworld.log

# Testar endpoint do agent card
curl -s http://localhost:9999/.well-known/agent.json | jq
```

**Saída dos logs**:
```
INFO:agent:🤖 HelloWorld Agent initialized
INFO:agent_executor:✅ HelloWorldAgentExecutor initialized with TaskStatusUpdateEvent support
INFO:     Started server process [18690]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://localhost:9999 (Press CTRL+C to quit)
👋 Iniciando Hello World Agent na porta 9999...
🌐 URL: http://localhost:9999/
📊 Testing: A2A Protocol
```

**Agent Card retornado**:
```json
{
  "capabilities": {
    "streaming": true
  },
  "defaultInputModes": ["text"],
  "defaultOutputModes": ["text"],
  "description": "Simple test agent for A2A protocol",
  "name": "Hello World Agent",
  "protocolVersion": "0.2.5",
  "skills": [{
    "description": "Simple Hello World agent for testing A2A protocol communication.",
    "examples": ["hello", "hi", "hello world", "test"],
    "id": "hello_world",
    "name": "Hello World",
    "tags": ["hello", "world", "test", "a2a"]
  }],
  "url": "http://localhost:9999/",
  "version": "1.0.0"
}
```

### 5. Atualizar arquivo PID centralizado

```bash
echo "18690" > /Users/agents/Desktop/claude-20x/run-a2a/helloworld.pid
```

### 6. Verificar integração com a UI

```bash
# Listar agentes disponíveis na UI
curl -s -X POST http://localhost:12000/agent/list -H "Content-Type: application/json" -d '{}' | jq
```

**Resultado**: O agente HelloWorld aparece na lista com status `local_enabled` e `is_online: true`.

## Estrutura do Agente

O agente HelloWorld está localizado em:
```
/Users/agents/Desktop/claude-20x/agents/helloworld/
├── main_helloworld.py    # Arquivo principal
├── agent.py              # Classe do agente
├── agent_executor.py     # Executor das tarefas
├── a2a-config.json      # Configuração A2A
└── helloworld.log       # Logs de execução
```

## Portas Utilizadas

- **9999**: Agente HelloWorld
- **12000**: UI Mesop (já estava rodando)

## Configuração Centralizada

O sistema usa uma configuração centralizada em `/Users/agents/Desktop/claude-20x/run-a2a/config/agents.json` que define:
- Nome: HelloWorld Agent
- ID: helloworld
- Porta: 9999
- Comando: `uv run python main_helloworld.py`
- Auto-restart: habilitado

## Como Parar o Agente

```bash
# Usando o PID
kill 18690

# Ou verificar e matar por nome
ps aux | grep main_helloworld
kill <PID>
```

## Solução de Problemas

1. **Porta já em uso**: Verifique com `lsof -i :9999`
2. **Dependências faltando**: Execute `uv sync` novamente
3. **Logs de erro**: Verifique `helloworld.log`
4. **Agente não aparece na UI**: O registro é automático via discovery

## Observações

- O agente se registra automaticamente na UI quando iniciado
- A comunicação usa o protocolo A2A padrão
- O endpoint `/task/submit` não está implementado nesta versão simples
- A integração com a UI permite enviar mensagens através da interface web