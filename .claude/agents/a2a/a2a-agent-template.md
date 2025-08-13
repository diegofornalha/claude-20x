---
name: a2a-agent-template
type: autonomous
color: "#6C5CE7"
description: Template padrão para agentes A2A com Starlette/ASGI/Uvicorn (SDK Oficial)
capabilities:
  # Capacidades A2A Obrigatórias (Protocol v2.0)
  - autonomous_decision_making
  - peer_communication
  - self_adaptation
  - distributed_coordination
  - emergent_behavior_detection
  - continuous_learning
  - byzantine_fault_tolerance
  # Capacidades ASGI/Async
  - async_processing
  - websocket_support
  - sse_streaming
  - http2_push
priority: high
protocol:
  version: "2.0"
  type: "a2a"
  server: "uvicorn"
  framework: "starlette"
  async: true
hooks:
  pre: |
    echo "🚀 [A2A] Iniciando agente com Uvicorn/ASGI..."
    # Iniciar servidor ASGI
    npx claude-flow@alpha a2a-server --mode=uvicorn --host=0.0.0.0 --port=${PORT:-8000}
    # Configurar async runtime
    npx claude-flow@alpha async-init --runtime=uvloop --workers=${WORKERS:-4}
  post: |
    echo "✅ [A2A] Servidor ASGI finalizado"
    # Graceful shutdown
    npx claude-flow@alpha a2a-server --shutdown --timeout=30
---

# Template A2A com Starlette/ASGI/Uvicorn (SDK Oficial)

Este template implementa o padrão oficial do SDK A2A usando Starlette (ASGI), Uvicorn e async nativo.

## Implementação ASGI/Starlette

### 1. Servidor Base A2A
```python
from starlette.applications import Starlette
from starlette.routing import Route, WebSocketRoute
from starlette.responses import JSONResponse, StreamingResponse
from starlette.middleware.cors import CORSMiddleware
import uvicorn
import asyncio
from typing import AsyncIterator

class A2AAgent:
    """Agente A2A com servidor ASGI nativo"""
    
    def __init__(self, name: str):
        self.name = name
        self.app = Starlette(
            debug=False,
            routes=self._setup_routes(),
            middleware=self._setup_middleware()
        )
        self.peers = {}
        self.state = {}
        
    def _setup_routes(self):
        """Define rotas REST e WebSocket do agente"""
        return [
            # REST API
            Route('/', self.index, methods=['GET']),
            Route('/status', self.status, methods=['GET']),
            Route('/decide', self.decide, methods=['POST']),
            Route('/learn', self.learn, methods=['POST']),
            Route('/consensus', self.consensus, methods=['POST']),
            
            # WebSocket para P2P
            WebSocketRoute('/ws', self.websocket_endpoint),
            
            # Server-Sent Events para streaming
            Route('/stream', self.stream_events, methods=['GET']),
        ]
    
    def _setup_middleware(self):
        """Configura middleware ASGI"""
        return [
            (CORSMiddleware, {
                'allow_origins': ['*'],
                'allow_methods': ['*'],
                'allow_headers': ['*'],
            })
        ]
    
    async def index(self, request):
        """Endpoint principal"""
        return JSONResponse({
            'agent': self.name,
            'protocol': 'a2a/2.0',
            'server': 'uvicorn',
            'framework': 'starlette',
            'async': True
        })
    
    async def status(self, request):
        """Status do agente"""
        return JSONResponse({
            'status': 'active',
            'peers': len(self.peers),
            'state': self.state,
            'capabilities': await self.get_capabilities()
        })
    
    async def decide(self, request):
        """Tomada de decisão autônoma (async)"""
        data = await request.json()
        
        # Processamento assíncrono
        decision = await self.autonomous_decision(data)
        
        return JSONResponse({
            'decision': decision,
            'confidence': decision.get('confidence', 0),
            'reasoning': decision.get('reasoning', '')
        })
    
    async def learn(self, request):
        """Aprendizagem contínua (async)"""
        data = await request.json()
        
        # Neural training assíncrono
        result = await self.neural_train(data)
        
        # Compartilhar conhecimento com peers
        asyncio.create_task(self.share_knowledge(result))
        
        return JSONResponse({
            'learned': True,
            'metrics': result
        })
    
    async def consensus(self, request):
        """Participação em consenso distribuído"""
        proposal = await request.json()
        
        # Votação assíncrona
        vote = await self.cast_vote(proposal)
        
        # Broadcast para peers via WebSocket
        await self.broadcast_vote(vote)
        
        return JSONResponse({
            'vote': vote,
            'proposal_id': proposal.get('id')
        })
    
    async def websocket_endpoint(self, websocket):
        """WebSocket para comunicação P2P em tempo real"""
        await websocket.accept()
        peer_id = None
        
        try:
            # Handshake P2P
            message = await websocket.receive_json()
            peer_id = message.get('peer_id')
            self.peers[peer_id] = websocket
            
            # Loop de mensagens
            while True:
                message = await websocket.receive_json()
                await self.handle_p2p_message(peer_id, message)
                
        except Exception as e:
            print(f"WebSocket error: {e}")
        finally:
            if peer_id and peer_id in self.peers:
                del self.peers[peer_id]
            await websocket.close()
    
    async def stream_events(self, request):
        """Server-Sent Events para streaming de dados"""
        async def event_generator():
            while True:
                # Gerar eventos emergentes
                event = await self.detect_emergent_behavior()
                if event:
                    yield f"data: {json.dumps(event)}\n\n"
                await asyncio.sleep(1)
        
        return StreamingResponse(
            event_generator(),
            media_type="text/event-stream"
        )
    
    async def autonomous_decision(self, context):
        """Decisão autônoma assíncrona"""
        # Avaliar opções em paralelo
        options = await asyncio.gather(
            self.evaluate_option_1(context),
            self.evaluate_option_2(context),
            self.evaluate_option_3(context)
        )
        
        # Selecionar melhor opção
        best_option = max(options, key=lambda x: x['score'])
        
        return {
            'action': best_option['action'],
            'confidence': best_option['score'],
            'reasoning': best_option['reasoning']
        }
    
    async def neural_train(self, data):
        """Treinamento neural assíncrono"""
        # Simular treinamento pesado
        await asyncio.sleep(0.1)  # Placeholder para operação real
        
        return {
            'epochs': 10,
            'loss': 0.01,
            'accuracy': 0.99
        }
    
    async def share_knowledge(self, knowledge):
        """Compartilhar conhecimento com peers (async)"""
        tasks = []
        for peer_id, ws in self.peers.items():
            tasks.append(ws.send_json({
                'type': 'knowledge_share',
                'data': knowledge
            }))
        
        if tasks:
            await asyncio.gather(*tasks, return_exceptions=True)
    
    async def handle_p2p_message(self, peer_id, message):
        """Processar mensagem P2P"""
        msg_type = message.get('type')
        
        if msg_type == 'consensus':
            await self.handle_consensus(message)
        elif msg_type == 'knowledge':
            await self.integrate_knowledge(message)
        elif msg_type == 'emergency':
            await self.handle_emergency(message)
    
    async def detect_emergent_behavior(self):
        """Detectar comportamentos emergentes"""
        # Análise assíncrona de padrões
        patterns = await self.analyze_patterns()
        
        for pattern in patterns:
            if pattern['score'] > 0.8:
                return {
                    'type': 'emergent',
                    'pattern': pattern['name'],
                    'confidence': pattern['score']
                }
        
        return None
    
    def run(self, host='0.0.0.0', port=8000):
        """Iniciar servidor Uvicorn"""
        uvicorn.run(
            self.app,
            host=host,
            port=port,
            loop='uvloop',  # Performance máxima
            access_log=False,
            workers=4
        )
```

### 2. Cliente A2A Async
```python
import httpx
import asyncio
from typing import Optional

class A2AClient:
    """Cliente async para comunicação com agentes A2A"""
    
    def __init__(self, base_url: str):
        self.base_url = base_url
        self.client = httpx.AsyncClient(
            timeout=30.0,
            http2=True  # HTTP/2 para melhor performance
        )
    
    async def get_status(self):
        """Obter status do agente"""
        response = await self.client.get(f"{self.base_url}/status")
        return response.json()
    
    async def request_decision(self, context: dict):
        """Solicitar decisão ao agente"""
        response = await self.client.post(
            f"{self.base_url}/decide",
            json=context
        )
        return response.json()
    
    async def submit_learning(self, data: dict):
        """Enviar dados para aprendizagem"""
        response = await self.client.post(
            f"{self.base_url}/learn",
            json=data
        )
        return response.json()
    
    async def propose_consensus(self, proposal: dict):
        """Propor ação para consenso"""
        response = await self.client.post(
            f"{self.base_url}/consensus",
            json=proposal
        )
        return response.json()
    
    async def connect_websocket(self):
        """Conectar via WebSocket para P2P"""
        import websockets
        
        ws_url = self.base_url.replace('http', 'ws') + '/ws'
        async with websockets.connect(ws_url) as websocket:
            # Handshake
            await websocket.send(json.dumps({
                'peer_id': 'client-' + str(uuid.uuid4())
            }))
            
            # Loop de recepção
            async for message in websocket:
                data = json.loads(message)
                await self.handle_ws_message(data)
    
    async def stream_events(self):
        """Consumir stream de eventos (SSE)"""
        async with self.client.stream(
            'GET',
            f"{self.base_url}/stream"
        ) as response:
            async for line in response.aiter_lines():
                if line.startswith('data: '):
                    data = json.loads(line[6:])
                    yield data
```

### 3. Orquestrador de Swarm A2A
```python
class A2ASwarmOrchestrator:
    """Orquestrador para múltiplos agentes A2A"""
    
    def __init__(self):
        self.agents = {}
        self.topology = 'hierarchical'
    
    async def spawn_agent(self, name: str, port: int):
        """Spawnar novo agente A2A"""
        agent = A2AAgent(name)
        
        # Iniciar em processo separado
        process = await asyncio.create_subprocess_exec(
            'uvicorn',
            f'{name}:app',
            '--host', '0.0.0.0',
            '--port', str(port),
            '--loop', 'uvloop',
            '--workers', '4'
        )
        
        self.agents[name] = {
            'process': process,
            'port': port,
            'url': f'http://localhost:{port}'
        }
        
        return agent
    
    async def orchestrate_task(self, task: dict):
        """Orquestrar tarefa entre agentes"""
        # Distribuir subtarefas
        subtasks = self.decompose_task(task)
        
        # Executar em paralelo
        results = await asyncio.gather(*[
            self.assign_subtask(agent, subtask)
            for agent, subtask in zip(self.agents.values(), subtasks)
        ])
        
        # Consolidar resultados
        return self.consolidate_results(results)
    
    async def enable_p2p_mesh(self):
        """Habilitar comunicação P2P entre todos os agentes"""
        for agent1 in self.agents.values():
            for agent2 in self.agents.values():
                if agent1 != agent2:
                    await self.connect_peers(agent1, agent2)
```

### 4. Configuração de Deploy
```yaml
# docker-compose.yml para A2A swarm
version: '3.8'

services:
  a2a-coordinator:
    image: a2a:latest
    ports:
      - "8000:8000"
    environment:
      - AGENT_NAME=coordinator
      - AGENT_TYPE=coordinator
      - UVICORN_WORKERS=4
      - UVICORN_LOOP=uvloop
    command: uvicorn main:app --host 0.0.0.0 --port 8000 --loop uvloop

  a2a-worker-1:
    image: a2a:latest
    ports:
      - "8001:8000"
    environment:
      - AGENT_NAME=worker-1
      - AGENT_TYPE=worker
    command: uvicorn main:app --host 0.0.0.0 --port 8000 --loop uvloop

  a2a-worker-2:
    image: a2a:latest
    ports:
      - "8002:8000"
    environment:
      - AGENT_NAME=worker-2
      - AGENT_TYPE=worker
    command: uvicorn main:app --host 0.0.0.0 --port 8000 --loop uvloop
```

### 5. Requirements
```txt
# requirements.txt
starlette==0.27.0
uvicorn[standard]==0.24.0
uvloop==0.19.0
httpx==0.25.0
websockets==12.0
asyncio==3.4.3
```

## Integração com Claude Flow e SDK Oficial

### Pontos de Integração Críticos

1. **EventQueue para comunicação assíncrona** (não TaskResult)
2. **RequestContext com skill e parameters**
3. **uvloop para performance máxima**
4. **HTTP/2 support via httpx**

### Comandos de Execução

```bash
# Iniciar agente A2A com Uvicorn
npx claude-flow a2a-start \
  --server=uvicorn \
  --framework=starlette \
  --async=true \
  --workers=4 \
  --loop=uvloop

# Testar endpoints
npx claude-flow a2a-test \
  --endpoint=http://localhost:8000 \
  --test-async=true \
  --test-websocket=true \
  --test-sse=true

# Monitor de performance
npx claude-flow a2a-monitor \
  --metrics=async \
  --latency=true \
  --throughput=true
```

### Implementação com SDK Oficial A2A

```python
# Exemplo correto com SDK oficial
from a2a.server.agent_execution import AgentExecutor, RequestContext
from a2a.server.events.event_queue import EventQueue
from a2a.types import TaskStatus, TaskStatusUpdateEvent
from a2a.utils import new_agent_text_message

class MyA2AExecutor(AgentExecutor):
    async def execute(self, context: RequestContext, event_queue: EventQueue) -> None:
        # Extrair informações do contexto
        skill = context.skill
        parameters = context.parameters
        task_id = context.task_id
        
        # Notificar início
        await event_queue.put(TaskStatusUpdateEvent(
            task_id=task_id,
            status=TaskStatus.IN_PROGRESS
        ))
        
        # Processar skill
        if skill == "search":
            result = await self.search(parameters)
            # Enviar resultado
            await event_queue.put(new_agent_text_message(
                task_id=task_id,
                text=result
            ))
        
        # Marcar como completo
        await event_queue.put(TaskStatusUpdateEvent(
            task_id=task_id,
            status=TaskStatus.COMPLETED
        ))
```

## Métricas de Conformidade

| Métrica | Padrão Oficial | Status |
|---------|---------------|--------|
| Framework | Starlette | ✅ |
| Server | Uvicorn | ✅ |
| Async | Nativo Python | ✅ |
| Protocol | ASGI | ✅ |
| WebSocket | Sim | ✅ |
| SSE | Sim | ✅ |
| HTTP/2 | Sim | ✅ |

Lembre-se: Este template segue o padrão oficial do SDK A2A com Starlette/ASGI/Uvicorn!