import { FastifyRequest, FastifyReply } from 'fastify';
import { JsonRpcRequest, JsonRpcResponse, JsonRpcError } from '../types';
import { JsonRpcRouter } from '../router/JsonRpcRouter';
import { SSEManager } from '../sse/SSEManager';
import { TaskManager } from '../tasks/TaskManager';
import { AgentCardService } from '../agents/AgentCardService';
import { Logger } from '../utils/Logger';

interface A2AServerServices {
  jsonRpcRouter: JsonRpcRouter;
  sseManager: SSEManager;
  taskManager: TaskManager;
  agentCardService: AgentCardService;
  [key: string]: any;
}

export class A2AServer {
  private logger: Logger;

  constructor(public services: A2AServerServices) {
    this.logger = new Logger('A2AServer');
  }

  async handleJsonRpcRequest(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      // Parse JSON-RPC request
      const jsonRpcRequest = this.parseJsonRpcRequest(request.body);
      
      // Validate request
      const validation = this.validateJsonRpcRequest(jsonRpcRequest);
      if (!validation.isValid) {
        const errorResponse = this.createErrorResponse(
          jsonRpcRequest?.id || null,
          -32600,
          'Invalid Request',
          validation.errors
        );
        reply.send(errorResponse);
        return;
      }

      // Route request
      const result = await this.services.jsonRpcRouter.route(jsonRpcRequest);
      
      // Handle SSE streaming for message/stream
      if (jsonRpcRequest.method === 'message/stream' && result.streamingEnabled) {
        const streamUrl = `/stream/${result.id}`;
        const response = this.createSuccessResponse(jsonRpcRequest.id, {
          ...result,
          streamUrl
        });
        reply.send(response);
        return;
      }

      // Send regular JSON-RPC response
      const response = this.createSuccessResponse(jsonRpcRequest.id, result);
      reply.send(response);

    } catch (error) {
      this.logger.error('JSON-RPC request error:', error);
      const errorResponse = this.createErrorResponse(
        null,
        -32603,
        'Internal error',
        error instanceof Error ? error.message : 'Unknown error'
      );
      reply.send(errorResponse);
    }
  }

  async handleSSEConnection(requestId: string, request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      await this.services.sseManager.handleSSERequest(requestId, request, reply);
      this.logger.info(`SSE connection established: ${requestId}`);
    } catch (error) {
      this.logger.error('SSE connection error:', error);
      reply.code(500).send({ error: 'Failed to establish SSE connection' });
    }
  }

  async getHealthStatus(): Promise<any> {
    const memUsage = process.memoryUsage();
    const uptime = process.uptime();
    
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime,
      memory: {
        used: memUsage.heapUsed,
        total: memUsage.heapTotal,
        percentage: (memUsage.heapUsed / memUsage.heapTotal) * 100
      },
      services: {
        taskManager: {
          activeTasks: this.services.taskManager.getActiveTaskCount(),
          metrics: this.services.taskManager.getMetrics()
        },
        sseManager: {
          activeConnections: this.services.sseManager.getConnectionCount()
        },
        memoryBank: await this.checkMemoryBankHealth(),
        batchtools: this.services.batchtoolsOptimizer?.getMetrics() || { status: 'not_configured' }
      }
    };
  }

  async getMetrics(): Promise<any> {
    const taskMetrics = this.services.taskManager.getMetrics();
    const batchtoolsMetrics = this.services.batchtoolsOptimizer.getMetrics();
    const agentHealth = await this.services.agentCardService.getAgentHealth();

    return {
      server: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpu: process.cpuUsage()
      },
      tasks: taskMetrics,
      batchtools: batchtoolsMetrics,
      agent: agentHealth,
      sse: {
        activeConnections: this.services.sseManager.getConnectionCount(),
        connections: this.services.sseManager.getActiveConnections()
      },
      timestamp: new Date().toISOString()
    };
  }

  async getAgentCard(): Promise<any> {
    return await this.services.agentCardService.getAgentCard();
  }  async shutdown(): Promise<void> {
    this.logger.info('Shutting down A2A server...');

    try {
      // Close all SSE connections
      this.services.sseManager.closeAllConnections();
      
      // Cancel all running tasks
      const activeTasks = await this.services.taskManager.listTasks({ status: 'working' });
      for (const task of activeTasks) {
        await this.services.taskManager.cancelTask(task.id);
      }

      // Cleanup completed tasks
      await this.services.taskManager.cleanupCompletedTasks(1); // 1 hour

      this.logger.info('A2A server shutdown completed');
    } catch (error) {
      this.logger.error('Error during shutdown:', error);
      throw error;
    }
  }

  private parseJsonRpcRequest(body: any): JsonRpcRequest {
    if (!body) {
      throw new Error('Empty request body');
    }

    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (error) {
        throw new Error('Invalid JSON');
      }
    }

    return body as JsonRpcRequest;
  }

  private validateJsonRpcRequest(request: JsonRpcRequest): { isValid: boolean; errors?: string[] } {
    const errors: string[] = [];

    if (!request) {
      errors.push('Request is null or undefined');
      return { isValid: false, errors };
    }

    if (request.jsonrpc !== '2.0') {
      errors.push('Invalid JSON-RPC version');
    }

    if (!request.method || typeof request.method !== 'string') {
      errors.push('Missing or invalid method');
    }

    if (request.id !== null && request.id !== undefined && 
        typeof request.id !== 'string' && typeof request.id !== 'number') {
      errors.push('Invalid id format');
    }

    return { isValid: errors.length === 0, errors };
  }  private createSuccessResponse(id: string | number | null, result: any): JsonRpcResponse {
    return {
      jsonrpc: '2.0',
      id,
      result
    };
  }

  private createErrorResponse(id: string | number | null, code: number, message: string, data?: any): JsonRpcResponse {
    return {
      jsonrpc: '2.0',
      id,
      error: {
        code,
        message,
        data
      }
    };
  }

  private async checkMemoryBankHealth(): Promise<any> {
    try {
      const isHealthy = await this.services.memoryBank.ping();
      return {
        status: isHealthy ? 'healthy' : 'unhealthy',
        connected: isHealthy
      };
    } catch (error) {
      return {
        status: 'error',
        connected: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}