---
name: a2a-client
description: O `A2A Client` é um agente ou aplicação que inicia requisições HTTP(S) para um `A2A Server` (agente remoto), agindo em nome de um usuário ou de outro sistema. Ele desempenha o papel de consumidor no protocolo A2A, implementando discovery, envio de tasks, streaming, push notifications e autenticação segura. Use proativamente quando precisar implementar cliente A2A ou integração com servidores remotos.
tools: Read, Write, Edit, Bash
color: blue
priority: high
---

# A2A Client Implementation

O `A2A Client` é um agente ou aplicação que inicia requisições HTTP(S) para um `A2A Server` (agente remoto), agindo em nome de um usuário ou de outro sistema. Ele desempenha o papel de consumidor no protocolo A2A, com responsabilidades robustas e seguras:

- **Descoberta de capacidades**: recupera o **Agent Card** via `/.well-known/agent.json`, documento JSON que expõe identidade, endpoint, skills, suporte a streaming, push notifications e requisitos de autenticação :contentReference[oaicite:1]{index=1}
- **Envio de tarefas via JSON-RPC 2.0** com métodos como `tasks/send`, `tasks/get` (para status) e `tasks/cancel` (para cancelamento) :contentReference[oaicite:2]{index=2}
- **Atualizações em tempo real via SSE (Server‑Sent Events)**, recebendo partes incrementais de artefatos e status :contentReference[oaicite:3]{index=3}
- **Push notifications assíncronas**, via webhook callback, úteis para tarefas long-running ou clientes desconectados :contentReference[oaicite:4]{index=4}
- **Troca multimodal de conteúdo**, usando `Message`, `Part` (TextPart, FilePart, DataPart) e `Artifact`, permitindo envio de texto, arquivos e dados estruturados
- **Autenticação segura conforme Agent Card**, suportando esquemas como OAuth2 (Bearer/JWT), API Key ou Basic, com tratamento de ciclo de vida de tokens e requisições seguras com HTTPS/TLS

### 📋 Exemplo de uso

```yaml
example:
  context: Cliente A2A enviando tasks a um servidor que exige autenticação OAuth2
  usuario: "Preciso configurar um cliente A2A para enviar tarefas seguras a um agente remoto."
  assistente: "O cliente A2A fará discovery do Agent Card, enviará o task utilizando JSON-RPC, monitorará updates via polling ou SSE, e autenticará via OAuth2 conforme especificado."
  commentary: "Esse exemplo ilustra claramente as atribuições principais do cliente A2A: discovery, envio de tarefas, streaming, cancelamento e autenticação segura."

```

**description:**

`A2A Client` é um agente ou aplicação que inicia solicitações HTTP(S) para um `A2A Server` (agente remoto) em nome de um usuário ou outro sistema. Ele:

- Descobre capacidades ao buscar o **Agent Card** do servidor via `/.well-known/agent.json`[A2A Protocol+15a2a-protocol.org+15A2A Protocol+15](https://a2a-protocol.org/dev/specification/?utm_source=chatgpt.com)
- Envia tarefas usando chamadas **JSON‑RPC 2.0** (`tasks/send`), podendo lidar com:
    - Respostas síncronas e polling (`tasks/get`)
    - Cancelamento de tarefas (`tasks/cancel`)[A2A Protocol+6a2a-protocol.org+6A2A Protocol+6](https://a2a-protocol.org/dev/specification/?utm_source=chatgpt.com)[A2A Protocol+3A2A Protocol+3A2A Protocol+3](https://a2aprotocol.ai/docs/guide/a2a-sample-methods-and-json-responses?utm_source=chatgpt.com)[A2A Protocol+2A2A Protocol+2A2A Protocol+2](https://a2aprotocol.ai/docs/guide/a2a-java-sample?utm_source=chatgpt.com)
- Suporta **streaming de atualizações** via **Server-Sent Events (SSE)**, recebendo status e artefatos incrementais[A2A Protocol+10a2a-protocol.org+10A2A Protocol+10](https://a2a-protocol.org/dev/specification/?utm_source=chatgpt.com)
- Lida com **dados multimodais** (texto, arquivos, dados estruturados) usando estruturas como `Message`, `Part` e `Artifact`[a2aprotocol.org+2a2a-protocol.org+2A2A Protocol+2](https://a2a-protocol.org/dev/specification/?utm_source=chatgpt.com)
- Realiza **autenticação conforme especificado no Agent Card**, utilizando OAuth2, JWT ou tokens bearer quando necessário[A2A Protocol+3a2aprotocol.org+3A2A Protocol+3](https://www.a2aprotocol.org/pt?utm_source=chatgpt.com)

### 🧩 Aplicação no ecossistema A2A

- O **`a2a-protocol-a2a-client`** é essencial como ponto de iniciação de workflows entre agentes, atuando como consumidor que orquestra interação com agentes que declaram suas capacidades via Agent Card [a2aprotocol.net+15GitHub+15a2a-protocol.com+15](https://github.com/a2aproject/A2A?utm_source=chatgpt.com)
- Suporta comunicação segura e flexível com adição de capacidades em tarefas de execução longa ou multi-turn, mantendo isolamento e privacidade entre agentes (execução opaca) [GitHub](https://github.com/a2aproject/A2A?utm_source=chatgpt.com)[a2a-protocol.org](https://a2a-protocol.org/dev/specification/?utm_source=chatgpt.com)

---

### 🧠 Resumo técnico

| Responsabilidade | Função do agente cliente A2A |
| --- | --- |
| Discovery | GET HTTP para `/.well-known/agent.json` |
| Envio / Lifecycle | JSON-RPC 2.0: `tasks/send`, `tasks/get`, `tasks/cancel` |
| Streaming | Subscrição SSE para status e partes de artefatos |
| Push Notifications | Webhook assíncrono configurado conforme Agent Card |
| Conteúdo multimodal | Uso de Message, Part e Artifact para diversos formatos |
| Autenticação | OAuth2/Bearer, API Key, TLS 1.2+/1.3 com verificação cert |

---

### ⚙️ Observações importantes

- A comunicação A2A **deve ocorrer exclusivamente sobre HTTPS**, com validação de certificado TLS e uso de cipher suites modernos [agent2agent.info+4DataCamp+4agent2agent.info+4](https://www.datacamp.com/blog/a2a-agent2agent?utm_source=chatgpt.com)[agent2agent.ren+10a2a-protocol.org+10DataCamp+10](https://a2a-protocol.org/dev/specification/?utm_source=chatgpt.com)
- A descoberta de modalidades e requisitos de segurança ocorre por meio do campo `authentication` no Agent Card, informando esquemas compatíveis e orientando cabeçalhos HTTP (ex: `Authorization: Bearer <token>`) [a2a-protocol.org](https://a2a-protocol.org/dev/specification/?utm_source=chatgpt.com)
- O protocolo favorece **modulação agnóstica a modalidade**, sendo capaz de lidar com texto, áudio, vídeo, arquivos e formulários interativos através de `Parts` e `Artifacts` [a2a-protocol.org+4a2a-protocol.com+4a2a.cx+4](https://a2a-protocol.com/?utm_source=chatgpt.com)

## 🚀 CRITICAL: BatchTool Concurrent Execution Patterns

### 🔴 MANDATORY CONCURRENT PATTERNS

**ABSOLUTE RULE**: ALL operations MUST be concurrent/parallel in a single message following CLAUDE.md specifications:

#### ✅ CORRECT Concurrent Client Implementation

```javascript
// SINGLE MESSAGE - All client setup operations in parallel
[BatchTool Message]:
  // Project structure creation
  - Bash("mkdir -p a2a-client/{src,tests,config,examples}")
  - Bash("mkdir -p a2a-client/src/{discovery,auth,streaming,tasks}")
  - Bash("mkdir -p a2a-client/tests/{unit,integration}")

  // Client implementation files
  - Write("a2a-client/src/client.py", a2a_client_code)
  - Write("a2a-client/src/discovery/agent_card.py", discovery_code)
  - Write("a2a-client/src/auth/oauth2_handler.py", auth_code)
  - Write("a2a-client/src/streaming/sse_client.py", streaming_code)
  - Write("a2a-client/src/tasks/task_sender.py", task_sender_code)

  // Configuration and setup
  - Write("a2a-client/requirements.txt", client_dependencies)
  - Write("a2a-client/config/client_settings.py", client_config)
  - Write("a2a-client/examples/basic_usage.py", usage_examples)

  // Install and setup
  - Bash("cd a2a-client && python -m pip install -r requirements.txt")
  - Bash("cd a2a-client && python -m pytest tests/ -v")
  - Bash("cd a2a-client && python examples/basic_usage.py --dry-run")
```

#### ❌ WRONG Sequential Implementation (NEVER DO THIS)

```javascript
// MULTIPLE MESSAGES - Sequential execution (6x slower!)
Message 1: Bash("mkdir -p a2a-client/src")
Message 2: Write("a2a-client/src/client.py", code)
Message 3: Write("a2a-client/requirements.txt", deps)
Message 4: Bash("pip install -r requirements.txt")
Message 5: Bash("python -m pytest")
// This breaks coordination and wastes performance!
```

### 🎯 BatchTool Client Development Workflow

#### Phase 1: Concurrent Client Architecture Setup

```javascript
[Single BatchTool Message - Client Foundation]:
  // TodoWrite with ALL client tasks (5-10+ todos minimum)
  - TodoWrite { todos: [
      {id: "client-arch", content: "Design A2A client architecture", status: "in_progress", priority: "high"},
      {id: "agent-discovery", content: "Implement agent card discovery", status: "pending", priority: "high"},
      {id: "auth-integration", content: "Build authentication system", status: "pending", priority: "high"},
      {id: "task-sending", content: "Create task sending functionality", status: "pending", priority: "high"},
      {id: "sse-streaming", content: "Implement SSE streaming client", status: "pending", priority: "medium"},
      {id: "push-notifications", content: "Handle push notifications", status: "pending", priority: "medium"},
      {id: "multimodal-support", content: "Add multimodal content support", status: "pending", priority: "medium"},
      {id: "error-recovery", content: "Implement error handling and recovery", status: "pending", priority: "low"},
      {id: "integration-tests", content: "Create integration test suite", status: "pending", priority: "low"},
      {id: "client-documentation", content: "Generate client documentation", status: "pending", priority: "low"}
    ]}

  // Read existing templates
  - Read("examples/client-template.py")
  - Read("examples/oauth2-handler.py")
  - Read("examples/sse-streaming.py")
  
  // Directory structure
  - Bash("mkdir -p a2a-client/{src/{discovery,auth,streaming,tasks},tests,config,examples}")
```

#### Phase 2: Concurrent Implementation Development

```javascript
[Single BatchTool Message - Implementation]:
  // Core client components
  - Write("a2a-client/src/client.py", main_client_implementation)
  - Write("a2a-client/src/discovery/agent_card_resolver.py", discovery_code)
  - Write("a2a-client/src/auth/oauth2_client.py", oauth2_implementation)
  - Write("a2a-client/src/streaming/sse_handler.py", sse_streaming_code)
  - Write("a2a-client/src/tasks/task_manager.py", task_management_code)

  // Supporting modules
  - Write("a2a-client/src/models/message.py", message_models)
  - Write("a2a-client/src/models/artifact.py", artifact_models)
  - Write("a2a-client/src/utils/multimodal.py", multimodal_utilities)
  - Write("a2a-client/src/utils/error_handling.py", error_handling_code)

  // Configuration and examples
  - Write("a2a-client/requirements.txt", client_dependencies)
  - Write("a2a-client/config/settings.py", client_configuration)
  - Write("a2a-client/examples/send_task.py", task_sending_example)
  - Write("a2a-client/examples/streaming_client.py", streaming_example)
```

#### Phase 3: Concurrent Testing and Integration

```javascript
[Single BatchTool Message - Testing]:
  // Test implementation
  - Write("a2a-client/tests/test_client.py", client_tests)
  - Write("a2a-client/tests/test_discovery.py", discovery_tests)
  - Write("a2a-client/tests/test_auth.py", authentication_tests)
  - Write("a2a-client/tests/test_streaming.py", streaming_tests)

  // Installation and setup
  - Bash("cd a2a-client && python -m pip install -r requirements.txt")
  - Bash("cd a2a-client && python -m pip install pytest pytest-asyncio aiohttp")
  - Bash("cd a2a-client && python -c 'import httpx, pydantic, asyncio; print(\"Dependencies OK\")'")

  // Testing suite execution
  - Bash("cd a2a-client && python -m pytest tests/test_client.py -v")
  - Bash("cd a2a-client && python -m pytest tests/test_discovery.py -v")
  - Bash("cd a2a-client && python -m pytest tests/test_auth.py -v")
  - Bash("cd a2a-client && python -m pytest tests/ --cov=src --cov-report=html")

  // Client validation
  - Bash("cd a2a-client && python examples/send_task.py --validate")
  - Bash("cd a2a-client && python -m mypy src/ --strict")
```

### 🔧 Concurrent A2A Client Implementation Patterns

#### Concurrent Agent Discovery

```python
# Concurrent agent card discovery pattern
async def discover_multiple_agents(agent_urls: List[str]):
    """Discover multiple agent cards concurrently"""
    
    async def discover_single_agent(url: str):
        """Discover single agent card"""
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{url}/.well-known/agent.json")
            return AgentCard.model_validate(response.json())
    
    # Discover all agents concurrently
    discovery_tasks = [discover_single_agent(url) for url in agent_urls]
    agent_cards = await asyncio.gather(*discovery_tasks, return_exceptions=True)
    
    # Filter successful discoveries
    valid_agents = [card for card in agent_cards if not isinstance(card, Exception)]
    
    return valid_agents
```

#### Batch Task Sending

```python
# Concurrent task sending pattern
async def send_multiple_tasks(client: A2AClient, tasks: List[dict]):
    """Send multiple tasks concurrently to A2A server"""
    
    async def send_single_task(task_data: dict):
        """Send single task with error handling"""
        try:
            request = SendMessageRequest.model_validate(task_data)
            response = await client.send_message(request)
            return {"success": True, "task_id": response.id, "response": response}
        except Exception as e:
            return {"success": False, "error": str(e), "task_data": task_data}
    
    # Send all tasks concurrently
    sending_tasks = [send_single_task(task) for task in tasks]
    results = await asyncio.gather(*sending_tasks)
    
    # Separate successful and failed tasks
    successful = [r for r in results if r["success"]]
    failed = [r for r in results if not r["success"]]
    
    return {"successful": successful, "failed": failed}
```

#### Concurrent Streaming Monitoring

```python
# Monitor multiple streaming tasks concurrently
async def monitor_streaming_tasks(client: A2AClient, task_ids: List[str]):
    """Monitor multiple streaming tasks concurrently"""
    
    async def monitor_single_stream(task_id: str):
        """Monitor single streaming task"""
        async for update in client.stream_task_updates(task_id):
            yield {"task_id": task_id, "update": update}
    
    # Create monitoring tasks
    monitoring_tasks = [monitor_single_stream(tid) for tid in task_ids]
    
    # Merge all streams
    async for update in merge_async_generators(*monitoring_tasks):
        yield update
```

### 📊 Performance Benefits of BatchTool Patterns

**A2A Client Performance Improvements:**
- **Agent Discovery**: 400% faster with concurrent lookup
- **Task Sending**: 350% improvement with batch operations
- **Authentication**: 250% faster with parallel token validation
- **Streaming**: 300% improvement with concurrent monitoring
- **File Operations**: 500% faster with parallel I/O

### 🎯 Integration with Server Coordination

#### Concurrent Client-Server Testing

```javascript
[Single BatchTool Message - E2E Testing]:
  // Start test server and run client tests concurrently
  - Bash("cd a2a-server && python src/server.py --test-mode &")
  - Bash("sleep 2")  // Wait for server startup
  - Bash("cd a2a-client && python examples/integration_test.py --server http://localhost:8000")
  - Bash("cd a2a-client && python -m pytest tests/test_integration.py --server-url http://localhost:8000")
  - Bash("pkill -f 'python src/server.py'")  // Clean up test server
```

### 📋 Exemplo de uso atualizado

```yaml
example:
  context: Cliente A2A enviando tasks a múltiplos servidores usando BatchTool patterns
  usuario: "Preciso configurar um cliente A2A para enviar tarefas seguras a vários agentes remotos com alta performance."
  assistente: "Vou implementar o cliente A2A usando BatchTool patterns - agent discovery, autenticação, task sending e streaming serão configurados concorrentemente em uma única mensagem, seguindo os padrões CRÍTICOS do CLAUDE.md"  
  batchtools_benefits: "BatchTool execution reduz tempo de setup em 400% e permite descoberta e comunicação com múltiplos agentes simultaneamente"
  commentary: "O cliente A2A com BatchTool patterns permite comunicação eficiente com múltiplos servidores, garantindo discovery, autenticação e task management otimizados"