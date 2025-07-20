import { EventEmitter } from 'events';
import { Task, TaskStatus, Message, Artifact, TaskMetadata } from '../types';
import { Logger } from '../utils/Logger';

interface TaskManagerConfig {
  maxConcurrentTasks?: number;
  taskTimeout?: number;
  enableStateHistory?: boolean;
}

interface TaskCreateOptions {
  contextId: string;
  message: Message;
  metadata?: TaskMetadata;
}

interface TaskListOptions {
  contextId?: string;
  status?: string;
  limit?: number;
}

export class TaskManager extends EventEmitter {
  private tasks: Map<string, Task> = new Map();
  private activeTasks: Set<string> = new Set();
  private taskHistory: Map<string, TaskStatus[]> = new Map();
  private logger: Logger;

  constructor(private config: TaskManagerConfig) {
    super();
    this.logger = new Logger('TaskManager');
  }

  async createTask(options: TaskCreateOptions): Promise<Task> {
    const taskId = this.generateTaskId();
    const timestamp = new Date().toISOString();
    
    const task: Task = {
      id: taskId,
      contextId: options.contextId,
      status: {
        state: 'submitted',
        timestamp
      },
      history: [options.message],
      kind: 'task',
      metadata: options.metadata
    };

    this.tasks.set(taskId, task);
    
    if (this.config.enableStateHistory) {
      this.taskHistory.set(taskId, [task.status]);
    }

    this.logger.info(`Task created: ${taskId}`);
    this.emit('task_created', task);
    
    return task;
  }  async startTask(taskId: string): Promise<void> {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new Error(`Task not found: ${taskId}`);
    }

    if (task.status.state !== 'submitted') {
      throw new Error(`Task ${taskId} is not in submitted state`);
    }

    // Check concurrent task limit
    if (this.config.maxConcurrentTasks && this.activeTasks.size >= this.config.maxConcurrentTasks) {
      throw new Error('Maximum concurrent tasks exceeded');
    }

    await this.updateTaskStatus(taskId, 'working');
    this.activeTasks.add(taskId);

    // Set task timeout if configured
    if (this.config.taskTimeout) {
      setTimeout(() => {
        this.handleTaskTimeout(taskId);
      }, this.config.taskTimeout);
    }

    this.logger.info(`Task started: ${taskId}`);
    this.emit('task_started', task);
  }

  async completeTask(taskId: string, result?: any): Promise<void> {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new Error(`Task not found: ${taskId}`);
    }

    await this.updateTaskStatus(taskId, 'completed', result);
    this.activeTasks.delete(taskId);

    this.logger.info(`Task completed: ${taskId}`);
    this.emit('task_completed', task);
  }

  async failTask(taskId: string, error: any): Promise<void> {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new Error(`Task not found: ${taskId}`);
    }

    await this.updateTaskStatus(taskId, 'failed', error);
    this.activeTasks.delete(taskId);

    this.logger.error(`Task failed: ${taskId}`, error);
    this.emit('task_failed', task);
  }  async cancelTask(taskId: string): Promise<void> {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new Error(`Task not found: ${taskId}`);
    }

    if (task.status.state === 'completed' || task.status.state === 'failed') {
      throw new Error(`Cannot cancel task in ${task.status.state} state`);
    }

    await this.updateTaskStatus(taskId, 'canceled');
    this.activeTasks.delete(taskId);

    this.logger.info(`Task canceled: ${taskId}`);
    this.emit('task_canceled', task);
  }

  async getTask(taskId: string): Promise<Task | null> {
    return this.tasks.get(taskId) || null;
  }

  async listTasks(options: TaskListOptions = {}): Promise<Task[]> {
    let tasks = Array.from(this.tasks.values());

    // Filter by contextId
    if (options.contextId) {
      tasks = tasks.filter(task => task.contextId === options.contextId);
    }

    // Filter by status
    if (options.status) {
      tasks = tasks.filter(task => task.status.state === options.status);
    }

    // Apply limit
    if (options.limit && options.limit > 0) {
      tasks = tasks.slice(0, options.limit);
    }

    return tasks;
  }

  async addMessage(taskId: string, message: Message): Promise<void> {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new Error(`Task not found: ${taskId}`);
    }

    task.history.push(message);
    this.logger.debug(`Message added to task ${taskId}`);
    this.emit('task_message_added', { task, message });
  }  async addArtifact(taskId: string, artifact: Artifact): Promise<void> {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new Error(`Task not found: ${taskId}`);
    }

    if (!task.artifacts) {
      task.artifacts = [];
    }

    task.artifacts.push(artifact);
    this.logger.debug(`Artifact added to task ${taskId}: ${artifact.name}`);
    this.emit('task_artifact_added', { task, artifact });
  }

  getTaskHistory(taskId: string): TaskStatus[] {
    return this.taskHistory.get(taskId) || [];
  }

  getActiveTaskCount(): number {
    return this.activeTasks.size;
  }

  getMetrics() {
    const allTasks = Array.from(this.tasks.values());
    const statusCounts = allTasks.reduce((acc, task) => {
      acc[task.status.state] = (acc[task.status.state] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total: allTasks.length,
      active: this.activeTasks.size,
      statusBreakdown: statusCounts,
      averageTaskDuration: this.calculateAverageTaskDuration(),
      timestamp: new Date().toISOString()
    };
  }

  private async updateTaskStatus(taskId: string, state: TaskStatus['state'], data?: any): Promise<void> {
    const task = this.tasks.get(taskId);
    if (!task) return;

    const newStatus: TaskStatus = {
      state,
      timestamp: new Date().toISOString(),
      message: data ? { 
        role: 'system', 
        parts: [{ kind: 'text', text: JSON.stringify(data) }], 
        messageId: `status_${Date.now()}` 
      } : undefined
    };

    task.status = newStatus;

    if (this.config.enableStateHistory) {
      const history = this.taskHistory.get(taskId) || [];
      history.push(newStatus);
      this.taskHistory.set(taskId, history);
    }

    this.emit('task_status_changed', { taskId, status: newStatus });
  }  private handleTaskTimeout(taskId: string): void {
    const task = this.tasks.get(taskId);
    if (!task) return;

    if (task.status.state === 'working') {
      this.failTask(taskId, { error: 'Task timeout', timeout: this.config.taskTimeout });
    }
  }

  private generateTaskId(): string {
    return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private calculateAverageTaskDuration(): number {
    const completedTasks = Array.from(this.tasks.values()).filter(
      task => task.status.state === 'completed' || task.status.state === 'failed'
    );

    if (completedTasks.length === 0) return 0;

    const durations = completedTasks.map(task => {
      const history = this.taskHistory.get(task.id) || [task.status];
      const start = history[0]?.timestamp;
      const end = task.status.timestamp;
      
      if (!start || !end) return 0;
      
      return new Date(end).getTime() - new Date(start).getTime();
    });

    return durations.reduce((acc, duration) => acc + duration, 0) / durations.length;
  }

  // Cleanup methods
  async cleanupCompletedTasks(olderThanHours: number = 24): Promise<number> {
    const cutoffTime = new Date(Date.now() - olderThanHours * 60 * 60 * 1000);
    let cleaned = 0;

    for (const [taskId, task] of this.tasks.entries()) {
      if ((task.status.state === 'completed' || task.status.state === 'failed') &&
          new Date(task.status.timestamp) < cutoffTime) {
        this.tasks.delete(taskId);
        this.taskHistory.delete(taskId);
        cleaned++;
      }
    }

    this.logger.info(`Cleaned up ${cleaned} completed tasks`);
    return cleaned;
  }
}