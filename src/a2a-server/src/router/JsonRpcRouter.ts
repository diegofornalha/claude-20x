import { JsonRpcRequest, JsonRpcResponse, Message, Task } from '../types';
import { TaskManager } from '../tasks/TaskManager';
import { SSEManager } from '../sse/SSEManager';
import { SPARCIntegrator } from '../sparc/SPARCIntegrator';
import { BatchtoolsOptimizer } from '../batchtools/BatchtoolsOptimizer';
import { MemoryBankClient } from '../memory/MemoryBankClient';
import { AgentCardService } from '../agents/AgentCardService';
import { Logger } from '../utils/Logger';

interface RouterServices {
  taskManager: TaskManager;
  sseManager: SSEManager;
  sparcIntegrator: SPARCIntegrator;
  batchtoolsOptimizer: BatchtoolsOptimizer;
  memoryBank: MemoryBankClient;
  agentCardService: AgentCardService;
}

export class JsonRpcRouter {
  private logger: Logger;

  constructor(private services: RouterServices) {
    this.logger = new Logger('JsonRpcRouter');
  }

  async route(request: JsonRpcRequest): Promise<any> {
    this.logger.debug(`Routing request: ${request.method}`);

    switch (request.method) {
      case 'message/send':
        return await this.handleMessageSend(request);
      case 'message/stream':
        return await this.handleMessageStream(request);
      case 'tasks/get':
        return await this.handleTasksGet(request);
      case 'tasks/submit':
        return await this.handleTasksSubmit(request);
      case 'tasks/cancel':
        return await this.handleTasksCancel(request);
      case 'tasks/list':
        return await this.handleTasksList(request);
      case 'sparc/execute':
        return await this.handleSparcExecute(request);
      case 'memory/store':
        return await this.handleMemoryStore(request);
      case 'memory/retrieve':
        return await this.handleMemoryRetrieve(request);
      case 'agent/capabilities':
        return await this.handleAgentCapabilities(request);
      default:
        throw new Error(`Unknown method: ${request.method}`);
    }
  }  // A2A Protocol: message/send handler
  private async handleMessageSend(request: JsonRpcRequest): Promise<any> {
    const { message, contextId } = request.params;
    
    // Validate message structure
    if (!message || !message.parts) {
      throw new Error('Invalid message structure');
    }

    // Process with SPARC integration
    const processedMessage = await this.services.sparcIntegrator.processMessage(message, contextId);
    
    // Apply batchtools optimization if applicable
    const optimizedMessage = await this.services.batchtoolsOptimizer.optimizeMessage(processedMessage);
    
    // Store in memory bank
    await this.services.memoryBank.store(`message:${message.messageId}`, optimizedMessage);
    
    return {
      messageId: message.messageId,
      status: 'processed',
      timestamp: new Date().toISOString(),
      sparcPhase: processedMessage.metadata?.sparcPhase,
      optimizations: optimizedMessage.metadata?.optimizations
    };
  }

  // A2A Protocol: message/stream handler
  private async handleMessageStream(request: JsonRpcRequest): Promise<any> {
    const { message, contextId, enableStreaming = true } = request.params;
    const requestId = `stream_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    if (enableStreaming) {
      // Create SSE connection for streaming
      this.services.sseManager.createConnection(requestId);
      
      // Process message asynchronously with streaming updates
      this.processMessageWithStreaming(message, contextId, requestId);
      
      return {
        id: requestId,
        streamingEnabled: true,
        status: 'streaming_started',
        timestamp: new Date().toISOString()
      };
    } else {
      // Fall back to regular message/send behavior
      return await this.handleMessageSend(request);
    }
  }  // A2A Protocol: tasks/submit handler
  private async handleTasksSubmit(request: JsonRpcRequest): Promise<any> {
    const { message, contextId, metadata = {} } = request.params;
    
    // Create task with SPARC workflow integration
    const task = await this.services.taskManager.createTask({
      contextId,
      message,
      metadata: {
        ...metadata,
        sparcPhase: metadata.sparcPhase || 'specification',
        batchtoolsEnabled: true
      }
    });
    
    // Start task execution
    await this.services.taskManager.startTask(task.id);
    
    return {
      taskId: task.id,
      status: task.status,
      timestamp: new Date().toISOString()
    };
  }

  // A2A Protocol: tasks/get handler
  private async handleTasksGet(request: JsonRpcRequest): Promise<any> {
    const { taskId } = request.params;
    const task = await this.services.taskManager.getTask(taskId);
    
    if (!task) {
      throw new Error(`Task not found: ${taskId}`);
    }
    
    return task;
  }

  // A2A Protocol: tasks/cancel handler
  private async handleTasksCancel(request: JsonRpcRequest): Promise<any> {
    const { taskId } = request.params;
    await this.services.taskManager.cancelTask(taskId);
    
    return {
      taskId,
      status: 'canceled',
      timestamp: new Date().toISOString()
    };
  }  // A2A Protocol: tasks/list handler
  private async handleTasksList(request: JsonRpcRequest): Promise<any> {
    const { contextId, status, limit = 50 } = request.params || {};
    const tasks = await this.services.taskManager.listTasks({
      contextId,
      status,
      limit
    });
    
    return {
      tasks,
      count: tasks.length,
      timestamp: new Date().toISOString()
    };
  }

  // SPARC Integration: sparc/execute handler
  private async handleSparcExecute(request: JsonRpcRequest): Promise<any> {
    const { phase, task, mode = 'standard' } = request.params;
    
    // Execute SPARC phase with batchtools optimization
    const result = await this.services.sparcIntegrator.executePhase(phase, task, {
      mode,
      enableBatchtools: true,
      enableMemoryPersistence: true
    });
    
    return result;
  }

  // Memory Bank: memory/store handler
  private async handleMemoryStore(request: JsonRpcRequest): Promise<any> {
    const { key, value, namespace, ttl } = request.params;
    await this.services.memoryBank.store(key, value, { namespace, ttl });
    
    return {
      key,
      stored: true,
      timestamp: new Date().toISOString()
    };
  }

  // Memory Bank: memory/retrieve handler
  private async handleMemoryRetrieve(request: JsonRpcRequest): Promise<any> {
    const { key, namespace } = request.params;
    const value = await this.services.memoryBank.retrieve(key, { namespace });
    
    return {
      key,
      value,
      found: value !== null,
      timestamp: new Date().toISOString()
    };
  }  // Agent Discovery: agent/capabilities handler
  private async handleAgentCapabilities(request: JsonRpcRequest): Promise<any> {
    const agentCard = await this.services.agentCardService.getAgentCard();
    const capabilities = await this.services.sparcIntegrator.getCapabilities();
    
    return {
      ...agentCard,
      capabilities,
      runtime: {
        sparcEnabled: true,
        batchtoolsEnabled: true,
        memoryBankEnabled: true,
        sseEnabled: true
      },
      timestamp: new Date().toISOString()
    };
  }

  // Streaming message processing (async)
  private async processMessageWithStreaming(message: Message, contextId: string, requestId: string): Promise<void> {
    try {
      const connection = this.services.sseManager.getConnection(requestId);
      if (!connection) return;

      // Send processing started event
      connection.sendEvent({
        type: 'processing_started',
        data: { messageId: message.messageId, phase: 'initialization' }
      });

      // Process with SPARC phases
      const phases = ['specification', 'pseudocode', 'architecture', 'refinement', 'completion'];
      
      for (const phase of phases) {
        connection.sendEvent({
          type: 'sparc_phase_started',
          data: { phase, messageId: message.messageId }
        });

        const phaseResult = await this.services.sparcIntegrator.executePhase(phase, message, {
          contextId,
          enableBatchtools: true
        });

        connection.sendEvent({
          type: 'sparc_phase_completed',
          data: { phase, result: phaseResult, messageId: message.messageId }
        });
      }

      // Send final completion event
      connection.sendEvent({
        type: 'processing_completed',
        data: { messageId: message.messageId, status: 'completed' }
      });

    } catch (error) {
      const connection = this.services.sseManager.getConnection(requestId);
      if (connection) {
        connection.sendEvent({
          type: 'processing_error',
          data: { 
            messageId: message.messageId, 
            error: error instanceof Error ? error.message : 'Unknown error' 
          }
        });
      }
      this.logger.error('Streaming processing error:', error);
    }
  }
}