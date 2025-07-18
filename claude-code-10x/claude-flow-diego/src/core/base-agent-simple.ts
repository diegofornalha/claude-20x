/**
 * Base class simplificada para agentes sem logging automático
 * Para evitar dependências circulares
 */

import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import { MCPBridge } from '../mcp/mcp-bridge';
import { AgentType, AgentStatus } from './agent-types';

export interface Task {
  id: string;
  description: string;
  type?: string;
  params?: Record<string, any>;
  priority?: number;
  dependencies?: string[];
  metadata?: Record<string, any>;
  result?: any;
  error?: Error;
  status?: 'pending' | 'running' | 'completed' | 'failed';
  startTime?: Date;
  endTime?: Date;
  duration?: number;
}

export interface AgentConfig {
  name: string;
  type: AgentType;
  description?: string;
  tools?: string[];
  systemPrompt?: string;
  maxConcurrentTasks?: number;
  enableLogging?: boolean;
}

export abstract class BaseAgent extends EventEmitter {
  public readonly id: string;
  public readonly name: string;
  public readonly type: AgentType;
  public readonly description: string;
  protected config: AgentConfig;
  protected status: AgentStatus = AgentStatus.IDLE;
  protected mcp: MCPBridge;
  protected currentTasks: Map<string, Task> = new Map();
  protected completedTasks: number = 0;
  protected enableLogging: boolean;

  constructor(config: AgentConfig, mcpBridge?: MCPBridge) {
    super();
    this.id = `agent_${config.type}_${uuidv4().substring(0, 8)}`;
    this.name = config.name;
    this.type = config.type;
    this.description = config.description || '';
    this.config = config;
    this.mcp = mcpBridge || new MCPBridge();
    this.enableLogging = config.enableLogging !== false;
  }

  /**
   * Processa uma tarefa
   */
  async processTask(task: Task): Promise<any> {
    if (!task.id) {
      task.id = `task_${uuidv4().substring(0, 8)}`;
    }

    // Atualizar status
    this.status = AgentStatus.WORKING;
    task.status = 'running';
    task.startTime = new Date();
    this.currentTasks.set(task.id, task);

    // Emitir evento
    this.emit('task:started', {
      agent: this.id,
      agentName: this.name,
      task: task.id,
      description: task.description,
      timestamp: task.startTime
    });

    try {
      // Executar tarefa (implementada pela classe derivada)
      const result = await this.executeTask(task);
      
      // Atualizar tarefa
      task.result = result;
      task.status = 'completed';
      task.endTime = new Date();
      task.duration = task.endTime.getTime() - task.startTime.getTime();

      // Emitir evento
      this.emit('task:completed', {
        agent: this.id,
        agentName: this.name,
        task: task.id,
        result,
        duration: task.duration,
        timestamp: task.endTime
      });

      // Limpar e atualizar contadores
      this.currentTasks.delete(task.id);
      this.completedTasks++;
      
      if (this.currentTasks.size === 0) {
        this.status = AgentStatus.IDLE;
      }

      return result;

    } catch (error) {
      // Atualizar tarefa com erro
      task.error = error as Error;
      task.status = 'failed';
      task.endTime = new Date();
      task.duration = task.endTime.getTime() - task.startTime.getTime();

      // Emitir evento
      this.emit('task:failed', {
        agent: this.id,
        agentName: this.name,
        task: task.id,
        error: error instanceof Error ? error.message : String(error),
        duration: task.duration,
        timestamp: task.endTime
      });

      // Limpar e atualizar status
      this.currentTasks.delete(task.id);
      
      if (this.currentTasks.size === 0) {
        this.status = AgentStatus.IDLE;
      }

      throw error;
    }
  }

  /**
   * Método abstrato que deve ser implementado pelas classes derivadas
   */
  abstract executeTask(task: Task): Promise<any>;

  /**
   * Verifica se pode processar mais tarefas
   */
  canProcessMore(): boolean {
    const maxConcurrent = this.config.maxConcurrentTasks || 3;
    return this.currentTasks.size < maxConcurrent;
  }

  /**
   * Retorna o status atual
   */
  getStatus(): AgentStatus {
    return this.status;
  }

  /**
   * Retorna tarefas em execução
   */
  getCurrentTasks(): Task[] {
    return Array.from(this.currentTasks.values());
  }

  /**
   * Retorna estatísticas
   */
  getStats() {
    return {
      id: this.id,
      name: this.name,
      type: this.type,
      status: this.status,
      currentTasks: this.currentTasks.size,
      completedTasks: this.completedTasks
    };
  }
}