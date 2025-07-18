/**
 * Task Manager - Gerenciador de Tarefas A2A
 * 
 * Responsável por gerenciar o ciclo de vida das tarefas no protocolo A2A
 */

import { v4 as uuidv4 } from 'uuid';
import { coordinatorAgent } from './coordinator_agent';
import { memoryAgent } from './memory_agent';

export interface Task {
  id: string;
  type: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  assigned_agent?: string;
  created_at: number;
  started_at?: number;
  completed_at?: number;
  payload: any;
  result?: any;
  error?: string;
  metadata?: Record<string, any>;
}

export interface TaskEvent {
  task_id: string;
  event_type: 'created' | 'assigned' | 'started' | 'progress' | 'completed' | 'failed';
  timestamp: number;
  details: any;
  agent_source?: string;
}

export interface TaskQueue {
  priority: string;
  tasks: Task[];
  max_concurrent: number;
  active_count: number;
}

export class TaskManager {
  private tasks: Map<string, Task> = new Map();
  private taskEvents: Map<string, TaskEvent[]> = new Map();
  private queues: Map<string, TaskQueue> = new Map();
  private activeWorkers: Map<string, string> = new Map(); // agentId -> taskId

  constructor() {
    console.log(`📋 [A2A] Task Manager iniciado`);
    this.initializeQueues();
  }

  /**
   * Inicializa as filas de tarefas por prioridade
   */
  private initializeQueues(): void {
    const priorities = ['critical', 'high', 'medium', 'low'];
    const maxConcurrent = { critical: 10, high: 5, medium: 3, low: 2 };

    for (const priority of priorities) {
      this.queues.set(priority, {
        priority,
        tasks: [],
        max_concurrent: maxConcurrent[priority as keyof typeof maxConcurrent],
        active_count: 0
      });
    }
  }

  /**
   * Cria uma nova tarefa
   */
  async createTask(
    type: string,
    title: string,
    description: string,
    payload: any,
    priority: Task['priority'] = 'medium',
    metadata?: Record<string, any>
  ): Promise<string> {
    const taskId = uuidv4();
    
    const task: Task = {
      id: taskId,
      type,
      title,
      description,
      status: 'pending',
      priority,
      created_at: Date.now(),
      payload,
      metadata: metadata || {}
    };

    this.tasks.set(taskId, task);
    this.addTaskToQueue(task);
    this.logTaskEvent(taskId, 'created', { type, title, priority });

    // Salvar na memória
    await memoryAgent.storeMemory(
      `Tarefa criada: ${title} (${type})`,
      'task_management',
      'task_manager',
      { task_id: taskId, type, priority }
    );

    console.log(`📋 [A2A] Tarefa criada: ${taskId} - ${title} (${priority})`);
    
    // Tentar processar a fila
    this.processQueue(priority);
    
    return taskId;
  }

  /**
   * Adiciona tarefa à fila apropriada
   */
  private addTaskToQueue(task: Task): void {
    const queue = this.queues.get(task.priority);
    if (queue) {
      queue.tasks.push(task);
    }
  }

  /**
   * Processa a fila de tarefas de uma prioridade específica
   */
  private async processQueue(priority: string): Promise<void> {
    const queue = this.queues.get(priority);
    if (!queue || queue.active_count >= queue.max_concurrent) {
      return;
    }

    const pendingTasks = queue.tasks.filter(t => t.status === 'pending');
    if (pendingTasks.length === 0) {
      return;
    }

    const task = pendingTasks[0];
    await this.assignAndExecuteTask(task);
  }

  /**
   * Atribui e executa uma tarefa
   */
  private async assignAndExecuteTask(task: Task): Promise<void> {
    // Encontrar agente apropriado
    const bestAgent = coordinatorAgent.findBestAgent(task.type);
    if (!bestAgent) {
      await this.failTask(task.id, 'Nenhum agente disponível para este tipo de tarefa');
      return;
    }

    // Atribuir tarefa
    task.assigned_agent = bestAgent;
    task.status = 'in_progress';
    task.started_at = Date.now();

    this.activeWorkers.set(bestAgent, task.id);
    
    const queue = this.queues.get(task.priority);
    if (queue) {
      queue.active_count++;
    }

    this.logTaskEvent(task.id, 'assigned', { agent: bestAgent });
    this.logTaskEvent(task.id, 'started', { started_at: task.started_at });

    console.log(`🚀 [A2A] Tarefa ${task.id} atribuída para ${bestAgent}`);

    try {
      // Executar tarefa via coordinator
      const response = await coordinatorAgent.delegateTask({
        task_id: task.id,
        task_type: task.type,
        payload: task.payload,
        priority: this.priorityToNumber(task.priority),
        agent_target: bestAgent
      });

      if (response.error) {
        await this.failTask(task.id, response.error);
      } else {
        await this.completeTask(task.id, response.result);
      }
    } catch (error) {
      await this.failTask(task.id, error instanceof Error ? error.message : String(error));
    } finally {
      // Liberar worker
      this.activeWorkers.delete(bestAgent);
      if (queue) {
        queue.active_count--;
      }
      
      // Processar próxima tarefa na fila
      setTimeout(() => this.processQueue(task.priority), 100);
    }
  }

  /**
   * Marca tarefa como concluída
   */
  async completeTask(taskId: string, result: any): Promise<boolean> {
    const task = this.tasks.get(taskId);
    if (!task) {
      return false;
    }

    task.status = 'completed';
    task.completed_at = Date.now();
    task.result = result;

    this.logTaskEvent(taskId, 'completed', { result, completed_at: task.completed_at });

    // Salvar na memória
    await memoryAgent.storeMemory(
      `Tarefa concluída: ${task.title}`,
      'task_completion',
      'task_manager',
      { task_id: taskId, duration: (task.completed_at - task.started_at!) }
    );

    console.log(`✅ [A2A] Tarefa concluída: ${taskId} - ${task.title}`);
    return true;
  }

  /**
   * Marca tarefa como falhou
   */
  async failTask(taskId: string, error: string): Promise<boolean> {
    const task = this.tasks.get(taskId);
    if (!task) {
      return false;
    }

    task.status = 'failed';
    task.completed_at = Date.now();
    task.error = error;

    this.logTaskEvent(taskId, 'failed', { error, failed_at: task.completed_at });

    // Salvar na memória
    await memoryAgent.storeMemory(
      `Tarefa falhou: ${task.title} - ${error}`,
      'task_failure',
      'task_manager',
      { task_id: taskId, error }
    );

    console.log(`❌ [A2A] Tarefa falhou: ${taskId} - ${error}`);
    return true;
  }

  /**
   * Cancela uma tarefa
   */
  async cancelTask(taskId: string, reason?: string): Promise<boolean> {
    const task = this.tasks.get(taskId);
    if (!task || task.status === 'completed') {
      return false;
    }

    task.status = 'cancelled';
    task.completed_at = Date.now();
    task.error = reason || 'Tarefa cancelada';

    this.logTaskEvent(taskId, 'failed', { reason: 'cancelled', cancelled_at: task.completed_at });

    console.log(`🚫 [A2A] Tarefa cancelada: ${taskId} - ${reason || 'Sem motivo'}`);
    return true;
  }

  /**
   * Obtém informações de uma tarefa
   */
  getTask(taskId: string): Task | null {
    return this.tasks.get(taskId) || null;
  }

  /**
   * Lista tarefas por status
   */
  getTasksByStatus(status: Task['status']): Task[] {
    return Array.from(this.tasks.values()).filter(t => t.status === status);
  }

  /**
   * Lista tarefas por agente
   */
  getTasksByAgent(agentName: string): Task[] {
    return Array.from(this.tasks.values()).filter(t => t.assigned_agent === agentName);
  }

  /**
   * Obtém histórico de eventos de uma tarefa
   */
  getTaskEvents(taskId: string): TaskEvent[] {
    return this.taskEvents.get(taskId) || [];
  }

  /**
   * Registra evento de tarefa
   */
  private logTaskEvent(taskId: string, eventType: TaskEvent['event_type'], details: any): void {
    const event: TaskEvent = {
      task_id: taskId,
      event_type: eventType,
      timestamp: Date.now(),
      details,
      agent_source: 'task_manager'
    };

    if (!this.taskEvents.has(taskId)) {
      this.taskEvents.set(taskId, []);
    }
    
    this.taskEvents.get(taskId)!.push(event);
  }

  /**
   * Converte prioridade para número (para coordinator)
   */
  private priorityToNumber(priority: Task['priority']): number {
    const map = { critical: 4, high: 3, medium: 2, low: 1 };
    return map[priority];
  }

  /**
   * Obtém estatísticas das tarefas
   */
  getStats() {
    const statusCounts: Record<string, number> = {};
    const typeCounts: Record<string, number> = {};
    const agentCounts: Record<string, number> = {};

    for (const task of this.tasks.values()) {
      statusCounts[task.status] = (statusCounts[task.status] || 0) + 1;
      typeCounts[task.type] = (typeCounts[task.type] || 0) + 1;
      
      if (task.assigned_agent) {
        agentCounts[task.assigned_agent] = (agentCounts[task.assigned_agent] || 0) + 1;
      }
    }

    const queueStats: Record<string, any> = {};
    for (const [priority, queue] of this.queues.entries()) {
      queueStats[priority] = {
        total_tasks: queue.tasks.length,
        active_count: queue.active_count,
        max_concurrent: queue.max_concurrent
      };
    }

    return {
      total_tasks: this.tasks.size,
      status_distribution: statusCounts,
      type_distribution: typeCounts,
      agent_distribution: agentCounts,
      queue_stats: queueStats,
      active_workers: this.activeWorkers.size
    };
  }

  /**
   * Status do task manager
   */
  getStatus() {
    return {
      manager_id: 'task_manager',
      total_tasks: this.tasks.size,
      active_workers: this.activeWorkers.size,
      queue_count: this.queues.size,
      uptime: Date.now(),
      capabilities: {
        task_creation: true,
        task_assignment: true,
        queue_management: true,
        event_tracking: true
      }
    };
  }
}

// Instância global do task manager
export const taskManager = new TaskManager();

export default TaskManager;