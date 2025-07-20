#!/usr/bin/env node
/**
 * SPARC A2A JSON-RPC Server with Batchtools and Memory Bank Integration
 * 
 * Este servidor implementa o protocolo A2A (Agent to Agent) via JSON-RPC 2.0
 * com integração completa do workflow SPARC, otimização Batchtools e Memory Bank
 */

import fastify from 'fastify';
import cors from '@fastify/cors';
import { A2AServer } from './server/A2AServer';
import { JsonRpcRouter } from './router/JsonRpcRouter';
import { SSEManager } from './sse/SSEManager';
import { TaskManager } from './tasks/TaskManager';
import { AgentCardService } from './agents/AgentCardService';
import { SPARCIntegrator } from './sparc/SPARCIntegrator';
import { BatchtoolsOptimizer } from './batchtools/BatchtoolsOptimizer';
import { MemoryBankClient } from './memory/MemoryBankClient';
import { Logger } from './utils/Logger';

interface ServerConfig {
  port: number;
  host: string;
  enableCors: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  taskManager: {
    maxConcurrentTasks: number;
    taskTimeout: number;
    enableStateHistory: boolean;
  };
  sse: {
    pingInterval: number;
    connectionTimeout: number;
  };
}

class SPARCAgentA2AServer {
  private app: any;
  private logger: Logger;
  private a2aServer!: A2AServer;
  private config: ServerConfig;

  constructor(config: Partial<ServerConfig> = {}) {
    this.logger = new Logger('SPARCAgentA2AServer');
    this.config = this.createDefaultConfig(config);
    this.app = fastify({ 
      logger: this.config.logLevel === 'debug',
      disableRequestLogging: this.config.logLevel !== 'debug'
    });
    
    this.setupApp();
  }

  private createDefaultConfig(overrides: Partial<ServerConfig>): ServerConfig {
    return {
      port: 3000,
      host: '0.0.0.0',
      enableCors: true,
      logLevel: 'info',
      taskManager: {
        maxConcurrentTasks: 10,
        taskTimeout: 300000, // 5 minutes
        enableStateHistory: true
      },
      sse: {
        pingInterval: 30000, // 30 seconds
        connectionTimeout: 300000 // 5 minutes
      },
      ...overrides
    };
  }

  private setupApp(): void {
    // Enable CORS
    if (this.config.enableCors) {
      this.app.register(cors, {
        origin: true,
        credentials: true
      });
    }

    // Initialize services
    const services = this.initializeServices();
    this.a2aServer = new A2AServer(services);

    // Register routes
    this.registerRoutes();

    // Setup error handling
    this.setupErrorHandling();

    // Setup shutdown handlers
    this.setupShutdownHandlers();
  }

  private initializeServices() {
    this.logger.info('Initializing A2A services...');

    // Core services
    const taskManager = new TaskManager(this.config.taskManager);
    const sseManager = new SSEManager(this.config.sse);
    const agentCardService = new AgentCardService();
    const sparcIntegrator = new SPARCIntegrator();
    const batchtoolsOptimizer = new BatchtoolsOptimizer();
    const memoryBank = new MemoryBankClient();

    // Router with all services
    const jsonRpcRouter = new JsonRpcRouter({
      taskManager,
      sseManager,
      sparcIntegrator,
      batchtoolsOptimizer,
      memoryBank,
      agentCardService
    });

    return {
      jsonRpcRouter,
      sseManager,
      taskManager,
      agentCardService,
      sparcIntegrator,
      batchtoolsOptimizer,
      memoryBank
    };
  }

  private registerRoutes(): void {
    // A2A JSON-RPC endpoint
    this.app.post('/jsonrpc', async (request: any, reply: any) => {
      return this.a2aServer.handleJsonRpcRequest(request, reply);
    });

    // SSE streaming endpoint
    this.app.get('/stream/:requestId', async (request: any, reply: any) => {
      const { requestId } = request.params;
      return this.a2aServer.handleSSEConnection(requestId, request, reply);
    });

    // Agent Card endpoint (A2A discovery)
    this.app.get('/.well-known/agent.json', async (request: any, reply: any) => {
      const agentCard = await this.a2aServer.getAgentCard();
      return reply.send(agentCard);
    });

    // Health check endpoint
    this.app.get('/health', async (request: any, reply: any) => {
      const health = await this.a2aServer.getHealthStatus();
      return reply.send(health);
    });

    // Metrics endpoint
    this.app.get('/metrics', async (request: any, reply: any) => {
      const metrics = await this.a2aServer.getMetrics();
      return reply.send(metrics);
    });

    // SPARC endpoints
    this.app.post('/sparc/execute', async (request: any, reply: any) => {
      const { phase, task, options } = request.body;
      const result = await this.a2aServer.services.sparcIntegrator.executePhase(phase, task, options);
      return reply.send({ result });
    });

    this.app.get('/sparc/capabilities', async (request: any, reply: any) => {
      const capabilities = await this.a2aServer.services.sparcIntegrator.getCapabilities();
      return reply.send(capabilities);
    });

    // Memory Bank endpoints
    this.app.post('/memory/store', async (request: any, reply: any) => {
      const { key, value, options } = request.body;
      await this.a2aServer.services.memoryBank.store(key, value, options);
      return reply.send({ stored: true, key });
    });

    this.app.get('/memory/retrieve/:key', async (request: any, reply: any) => {
      const { key } = request.params;
      const { namespace } = request.query;
      const value = await this.a2aServer.services.memoryBank.retrieve(key, { namespace });
      return reply.send({ key, value, found: value !== null });
    });

    this.app.get('/memory/stats', async (request: any, reply: any) => {
      const stats = await this.a2aServer.services.memoryBank.getStats();
      return reply.send(stats);
    });

    // Tasks endpoints
    this.app.get('/tasks/:taskId', async (request: any, reply: any) => {
      const { taskId } = request.params;
      const task = await this.a2aServer.services.taskManager.getTask(taskId);
      if (!task) {
        return reply.code(404).send({ error: 'Task not found' });
      }
      return reply.send(task);
    });

    this.app.get('/tasks', async (request: any, reply: any) => {
      const { contextId, status, limit } = request.query;
      const tasks = await this.a2aServer.services.taskManager.listTasks({
        contextId,
        status,
        limit: limit ? parseInt(limit) : undefined
      });
      return reply.send({ tasks });
    });

    // Batchtools endpoints
    this.app.get('/batchtools/metrics', async (request: any, reply: any) => {
      const metrics = this.a2aServer.services.batchtoolsOptimizer.getMetrics();
      return reply.send(metrics);
    });

    this.app.post('/batchtools/optimize', async (request: any, reply: any) => {
      const { operations } = request.body;
      const optimized = await this.a2aServer.services.batchtoolsOptimizer.optimizeBatch(operations);
      return reply.send({ optimized });
    });
  }

  private setupErrorHandling(): void {
    this.app.setErrorHandler((error: any, request: any, reply: any) => {
      this.logger.error('Request error:', error);
      
      // JSON-RPC error response
      if (request.url === '/jsonrpc') {
        const jsonRpcError = {
          jsonrpc: '2.0',
          id: request.body?.id || null,
          error: {
            code: -32603,
            message: 'Internal error',
            data: error.message
          }
        };
        return reply.code(500).send(jsonRpcError);
      }

      // Regular HTTP error
      return reply.code(500).send({
        error: 'Internal Server Error',
        message: error.message,
        timestamp: new Date().toISOString()
      });
    });

    // Handle 404s
    this.app.setNotFoundHandler((request: any, reply: any) => {
      return reply.code(404).send({
        error: 'Not Found',
        path: request.url,
        timestamp: new Date().toISOString()
      });
    });
  }

  private setupShutdownHandlers(): void {
    const shutdown = async (signal: string) => {
      this.logger.info(`Received ${signal}, shutting down gracefully...`);
      
      try {
        await this.a2aServer.shutdown();
        await this.app.close();
        this.logger.info('Server shutdown completed');
        process.exit(0);
      } catch (error) {
        this.logger.error('Error during shutdown:', error);
        process.exit(1);
      }
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  }

  async start(): Promise<void> {
    try {
      await this.app.listen({ 
        port: this.config.port, 
        host: this.config.host 
      });
      
      this.logger.info(`🚀 SPARC A2A Server started successfully!`);
      this.logger.info(`📍 Server running at: http://${this.config.host}:${this.config.port}`);
      this.logger.info(`🔗 Agent Card: http://${this.config.host}:${this.config.port}/.well-known/agent.json`);
      this.logger.info(`📊 Health Check: http://${this.config.host}:${this.config.port}/health`);
      this.logger.info(`📈 Metrics: http://${this.config.host}:${this.config.port}/metrics`);
      this.logger.info(`🎯 JSON-RPC Endpoint: http://${this.config.host}:${this.config.port}/jsonrpc`);
      this.logger.info(`📡 Streaming: http://${this.config.host}:${this.config.port}/stream/:requestId`);
      
      this.logger.info('🔧 Available integrations:');
      this.logger.info('  ✓ SPARC Workflow Engine');
      this.logger.info('  ✓ Batchtools Optimization');
      this.logger.info('  ✓ Memory Bank Client');
      this.logger.info('  ✓ Server-Sent Events');
      this.logger.info('  ✓ A2A Protocol Compliance');

    } catch (error) {
      this.logger.error('Failed to start server:', error);
      process.exit(1);
    }
  }
}

// CLI interface
if (require.main === module) {
  const config: Partial<ServerConfig> = {
    port: parseInt(process.env.PORT || '3000'),
    host: process.env.HOST || '0.0.0.0',
    logLevel: (process.env.LOG_LEVEL as any) || 'info'
  };

  const server = new SPARCAgentA2AServer(config);
  server.start().catch(error => {
    console.error('Failed to start server:', error);
    process.exit(1);
  });
}

export { SPARCAgentA2AServer };