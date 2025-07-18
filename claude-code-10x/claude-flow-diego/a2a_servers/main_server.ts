/**
 * A2A Main Server - Servidor Principal A2A
 * 
 * Servidor HTTP/WebSocket para comunicação entre agentes no protocolo A2A
 */

import express from 'express';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import cors from 'cors';
import { coordinatorAgent } from '../agents/coordinator_agent';
import { memoryAgent } from '../agents/memory_agent';
import { taskManager } from '../agents/task_manager';

export interface A2AServerConfig {
  port: number;
  host: string;
  enableWebSocket: boolean;
  enableCors: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

export interface ConnectedAgent {
  id: string;
  name: string;
  websocket?: WebSocket;
  lastSeen: number;
  capabilities: string[];
}

export class A2AServer {
  private app: express.Application;
  private server: any;
  private wss?: WebSocketServer;
  private connectedAgents: Map<string, ConnectedAgent> = new Map();
  private config: A2AServerConfig;

  constructor(config: Partial<A2AServerConfig> = {}) {
    this.config = {
      port: 8080,
      host: '0.0.0.0',
      enableWebSocket: true,
      enableCors: true,
      logLevel: 'info',
      ...config
    };

    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
    this.setupServer();
    
    console.log(`🌐 [A2A] Servidor configurado na porta ${this.config.port}`);
  }

  /**
   * Configura middleware do Express
   */
  private setupMiddleware(): void {
    if (this.config.enableCors) {
      this.app.use(cors());
    }
    
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));

    // Middleware de logging
    this.app.use((req, res, next) => {
      if (this.config.logLevel === 'debug') {
        console.log(`[A2A Server] ${req.method} ${req.path}`);
      }
      next();
    });

    // Health check
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        timestamp: Date.now(),
        version: '1.0.0',
        uptime: process.uptime()
      });
    });
  }

  /**
   * Configura rotas da API REST
   */
  private setupRoutes(): void {
    // Rotas do Agent Card (A2A Discovery)
    this.app.get('/.well-known/agent.json', (req, res) => {
      res.json({
        name: 'claude_flow_main_agent',
        description: 'Claude Flow Main A2A Agent Server',
        url: `http://${this.config.host}:${this.config.port}`,
        version: '1.0.0',
        capabilities: {
          can_stream: true,
          can_push_notifications: true,
          can_state_transition_history: true,
          authentication: 'none',
          default_input_modes: ['text', 'json'],
          default_output_modes: ['text', 'json']
        },
        skills: [
          {
            id: 'TASK_COORDINATION',
            name: 'task_coordination',
            description: 'Coordinate tasks between multiple agents'
          },
          {
            id: 'MEMORY_MANAGEMENT',
            name: 'memory_management',
            description: 'Store and retrieve agent memories'
          },
          {
            id: 'AGENT_DISCOVERY',
            name: 'agent_discovery',
            description: 'Discover and register agents in the network'
          }
        ]
      });
    });

    // Rotas do Coordinator
    this.app.post('/api/tasks', async (req, res) => {
      try {
        const { type, title, description, payload, priority = 'medium', metadata } = req.body;
        
        const taskId = await taskManager.createTask(type, title, description, payload, priority, metadata);
        
        res.json({
          success: true,
          task_id: taskId,
          message: 'Tarefa criada com sucesso'
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : 'Erro interno'
        });
      }
    });

    this.app.get('/api/tasks/:taskId', (req, res) => {
      const task = taskManager.getTask(req.params.taskId);
      if (!task) {
        return res.status(404).json({
          success: false,
          error: 'Tarefa não encontrada'
        });
      }
      
      res.json({
        success: true,
        task
      });
    });

    this.app.get('/api/tasks', (req, res) => {
      const { status, agent, limit } = req.query;
      
      let tasks = Array.from(taskManager['tasks'].values());
      
      if (status) {
        tasks = tasks.filter(t => t.status === status);
      }
      
      if (agent) {
        tasks = tasks.filter(t => t.assigned_agent === agent);
      }
      
      if (limit) {
        tasks = tasks.slice(0, parseInt(limit as string));
      }
      
      res.json({
        success: true,
        tasks: tasks.sort((a, b) => b.created_at - a.created_at)
      });
    });

    // Rotas de Memória
    this.app.post('/api/memory', async (req, res) => {
      try {
        const { content, category, agent_source, metadata } = req.body;
        
        const memoryId = await memoryAgent.storeMemory(content, category, agent_source, metadata);
        
        res.json({
          success: true,
          memory_id: memoryId,
          message: 'Memória armazenada com sucesso'
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : 'Erro interno'
        });
      }
    });

    this.app.get('/api/memory/search', async (req, res) => {
      try {
        const { query, category, agent_filter, limit } = req.query;
        
        const searchResult = await memoryAgent.searchMemories({
          query: query as string,
          category: category as string,
          agent_filter: agent_filter as string,
          limit: limit ? parseInt(limit as string) : undefined
        });
        
        res.json({
          success: true,
          ...searchResult
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : 'Erro interno'
        });
      }
    });

    this.app.get('/api/memory/:memoryId', async (req, res) => {
      const memory = await memoryAgent.getMemoryById(req.params.memoryId);
      if (!memory) {
        return res.status(404).json({
          success: false,
          error: 'Memória não encontrada'
        });
      }
      
      res.json({
        success: true,
        memory
      });
    });

    // Rotas de Agentes
    this.app.get('/api/agents', (req, res) => {
      const agents = coordinatorAgent.listAgents();
      const connectedAgents = Array.from(this.connectedAgents.values());
      
      res.json({
        success: true,
        registered_agents: agents,
        connected_agents: connectedAgents,
        total_registered: agents.length,
        total_connected: connectedAgents.length
      });
    });

    this.app.post('/api/agents/register', (req, res) => {
      try {
        const { agent_name, capabilities } = req.body;
        
        coordinatorAgent.registerAgent(agent_name, capabilities);
        
        res.json({
          success: true,
          message: `Agente ${agent_name} registrado com sucesso`
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : 'Erro interno'
        });
      }
    });

    // Rotas de Status e Estatísticas
    this.app.get('/api/status', (req, res) => {
      res.json({
        success: true,
        server: {
          host: this.config.host,
          port: this.config.port,
          uptime: process.uptime(),
          memory_usage: process.memoryUsage(),
          connected_agents: this.connectedAgents.size
        },
        coordinator: coordinatorAgent.getStatus(),
        memory: memoryAgent.getStatus(),
        task_manager: taskManager.getStatus()
      });
    });

    this.app.get('/api/stats', (req, res) => {
      res.json({
        success: true,
        coordinator_stats: coordinatorAgent.getStatus(),
        memory_stats: memoryAgent.getStats(),
        task_stats: taskManager.getStats(),
        server_stats: {
          connected_agents: this.connectedAgents.size,
          total_connections: Array.from(this.connectedAgents.values()).length,
          uptime: process.uptime()
        }
      });
    });
  }

  /**
   * Configura servidor HTTP e WebSocket
   */
  private setupServer(): void {
    this.server = createServer(this.app);

    if (this.config.enableWebSocket) {
      this.wss = new WebSocketServer({ server: this.server });
      this.setupWebSocket();
    }
  }

  /**
   * Configura WebSocket para comunicação em tempo real
   */
  private setupWebSocket(): void {
    if (!this.wss) return;

    this.wss.on('connection', (ws: WebSocket, req) => {
      console.log(`🔗 [A2A] Nova conexão WebSocket de ${req.socket.remoteAddress}`);

      // Solicitar identificação do agente
      ws.send(JSON.stringify({
        type: 'identify_request',
        message: 'Por favor, identifique-se enviando seus dados de agente'
      }));

      ws.on('message', async (data) => {
        try {
          const message = JSON.parse(data.toString());
          await this.handleWebSocketMessage(ws, message);
        } catch (error) {
          ws.send(JSON.stringify({
            type: 'error',
            error: 'Mensagem JSON inválida'
          }));
        }
      });

      ws.on('close', () => {
        this.handleAgentDisconnection(ws);
      });

      ws.on('error', (error) => {
        console.error(`❌ [A2A] Erro WebSocket:`, error);
      });
    });
  }

  /**
   * Processa mensagens WebSocket
   */
  private async handleWebSocketMessage(ws: WebSocket, message: any): Promise<void> {
    switch (message.type) {
      case 'agent_identify':
        this.handleAgentIdentification(ws, message);
        break;
        
      case 'task_request':
        await this.handleTaskRequest(ws, message);
        break;
        
      case 'memory_store':
        await this.handleMemoryStore(ws, message);
        break;
        
      case 'heartbeat':
        this.handleHeartbeat(ws, message);
        break;
        
      default:
        ws.send(JSON.stringify({
          type: 'error',
          error: `Tipo de mensagem desconhecido: ${message.type}`
        }));
    }
  }

  /**
   * Identifica agente conectado via WebSocket
   */
  private handleAgentIdentification(ws: WebSocket, message: any): void {
    const { agent_id, agent_name, capabilities } = message.data;
    
    const agent: ConnectedAgent = {
      id: agent_id,
      name: agent_name,
      websocket: ws,
      lastSeen: Date.now(),
      capabilities: capabilities || []
    };
    
    this.connectedAgents.set(agent_id, agent);
    
    ws.send(JSON.stringify({
      type: 'identification_confirmed',
      agent_id,
      server_info: {
        name: 'Claude Flow A2A Server',
        version: '1.0.0',
        capabilities: ['task_coordination', 'memory_management', 'agent_discovery']
      }
    }));
    
    console.log(`✅ [A2A] Agente identificado: ${agent_name} (${agent_id})`);
  }

  /**
   * Processa requisição de tarefa via WebSocket
   */
  private async handleTaskRequest(ws: WebSocket, message: any): Promise<void> {
    try {
      const { type, title, description, payload, priority } = message.data;
      const taskId = await taskManager.createTask(type, title, description, payload, priority);
      
      ws.send(JSON.stringify({
        type: 'task_created',
        task_id: taskId,
        message: 'Tarefa criada com sucesso'
      }));
    } catch (error) {
      ws.send(JSON.stringify({
        type: 'error',
        error: error instanceof Error ? error.message : 'Erro ao criar tarefa'
      }));
    }
  }

  /**
   * Processa armazenamento de memória via WebSocket
   */
  private async handleMemoryStore(ws: WebSocket, message: any): Promise<void> {
    try {
      const { content, category, agent_source, metadata } = message.data;
      const memoryId = await memoryAgent.storeMemory(content, category, agent_source, metadata);
      
      ws.send(JSON.stringify({
        type: 'memory_stored',
        memory_id: memoryId,
        message: 'Memória armazenada com sucesso'
      }));
    } catch (error) {
      ws.send(JSON.stringify({
        type: 'error',
        error: error instanceof Error ? error.message : 'Erro ao armazenar memória'
      }));
    }
  }

  /**
   * Processa heartbeat de agente
   */
  private handleHeartbeat(ws: WebSocket, message: any): void {
    const agentId = message.agent_id;
    const agent = this.connectedAgents.get(agentId);
    
    if (agent) {
      agent.lastSeen = Date.now();
      ws.send(JSON.stringify({
        type: 'heartbeat_ack',
        timestamp: Date.now()
      }));
    }
  }

  /**
   * Lida com desconexão de agente
   */
  private handleAgentDisconnection(ws: WebSocket): void {
    for (const [agentId, agent] of this.connectedAgents.entries()) {
      if (agent.websocket === ws) {
        this.connectedAgents.delete(agentId);
        console.log(`🔌 [A2A] Agente desconectado: ${agent.name} (${agentId})`);
        break;
      }
    }
  }

  /**
   * Inicia o servidor
   */
  async start(): Promise<void> {
    return new Promise((resolve) => {
      this.server.listen(this.config.port, this.config.host, () => {
        console.log(`🚀 [A2A] Servidor iniciado em http://${this.config.host}:${this.config.port}`);
        console.log(`🔗 [A2A] WebSocket ${this.config.enableWebSocket ? 'habilitado' : 'desabilitado'}`);
        console.log(`📋 [A2A] Agent Card disponível em: /.well-known/agent.json`);
        resolve();
      });
    });
  }

  /**
   * Para o servidor
   */
  async stop(): Promise<void> {
    return new Promise((resolve) => {
      if (this.wss) {
        this.wss.close();
      }
      
      this.server.close(() => {
        console.log(`🛑 [A2A] Servidor parado`);
        resolve();
      });
    });
  }

  /**
   * Envia broadcast para todos os agentes conectados
   */
  broadcast(message: any): void {
    const messageStr = JSON.stringify(message);
    
    for (const agent of this.connectedAgents.values()) {
      if (agent.websocket && agent.websocket.readyState === WebSocket.OPEN) {
        agent.websocket.send(messageStr);
      }
    }
  }

  /**
   * Obtém informações do servidor
   */
  getServerInfo() {
    return {
      config: this.config,
      connected_agents: this.connectedAgents.size,
      uptime: process.uptime(),
      memory_usage: process.memoryUsage()
    };
  }
}

// Para uso como executável
if (require.main === module) {
  const server = new A2AServer({
    port: parseInt(process.env.A2A_PORT || '8080'),
    host: process.env.A2A_HOST || '0.0.0.0',
    logLevel: (process.env.A2A_LOG_LEVEL as any) || 'info'
  });
  
  server.start().then(() => {
    console.log('🎉 [A2A] Sistema A2A completamente iniciado!');
  }).catch((error) => {
    console.error('❌ [A2A] Erro ao iniciar servidor:', error);
    process.exit(1);
  });
  
  // Graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\n🛑 [A2A] Parando servidor...');
    await server.stop();
    process.exit(0);
  });
}

export default A2AServer;