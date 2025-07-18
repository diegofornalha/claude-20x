/**
 * A2A Template Agents
 * Templates compatíveis com Agent-to-Agent Architecture
 * Use estes templates para criar agentes A2A padronizados
 */

import { v4 as uuidv4 } from 'uuid';

// Interfaces A2A padrão
export interface A2ARequest {
  id: string;
  method: string;
  params: any;
  agent_target?: string;
  timestamp: number;
}

export interface A2AResponse {
  id: string;
  result?: any;
  error?: string;
  timestamp: number;
}

export interface A2AAgentCapabilities {
  skills: string[];
  supported_tasks: string[];
  max_concurrent_tasks: number;
  can_stream: boolean;
  can_push_notifications: boolean;
  authentication: 'none' | 'bearer' | 'basic';
  default_input_modes: string[];
  default_output_modes: string[];
}

export abstract class BaseA2AAgent {
  protected agentId: string;
  protected agentName: string;
  protected capabilities: A2AAgentCapabilities;
  protected isActive: boolean = false;

  constructor(
    agentName: string,
    capabilities: A2AAgentCapabilities,
    agentId?: string
  ) {
    this.agentId = agentId || uuidv4();
    this.agentName = agentName;
    this.capabilities = capabilities;
    
    console.log(`🤖 [A2A] ${this.agentName} iniciado (${this.agentId})`);
  }

  /**
   * Processa uma requisição A2A
   */
  abstract processRequest(request: A2ARequest): Promise<A2AResponse>;

  /**
   * Retorna as capacidades do agente
   */
  getCapabilities(): A2AAgentCapabilities {
    return { ...this.capabilities };
  }

  /**
   * Gera Agent Card compatível com A2A
   */
  generateAgentCard(): any {
    return {
      name: this.agentName.toLowerCase().replace(/\s+/g, '_'),
      description: `${this.agentName} with A2A protocol support`,
      url: `http://localhost:8080/agents/${this.agentId}`,
      version: '1.0.0',
      capabilities: {
        can_stream: this.capabilities.can_stream,
        can_push_notifications: this.capabilities.can_push_notifications,
        can_state_transition_history: true,
        authentication: this.capabilities.authentication,
        default_input_modes: this.capabilities.default_input_modes,
        default_output_modes: this.capabilities.default_output_modes
      },
      skills: this.capabilities.skills.map(skill => ({
        id: skill.toUpperCase().replace(/\s+/g, '_'),
        name: skill.toLowerCase().replace(/\s+/g, '_'),
        description: `${skill} capability for agent-to-agent communication`
      }))
    };
  }

  /**
   * Inicia o agente
   */
  async start(): Promise<void> {
    this.isActive = true;
    console.log(`✅ [A2A] ${this.agentName} ativo`);
  }

  /**
   * Para o agente
   */
  async stop(): Promise<void> {
    this.isActive = false;
    console.log(`🛑 [A2A] ${this.agentName} parado`);
  }

  /**
   * Delega tarefa para outro agente via Coordinator
   */
  protected async delegateToAgent(
    targetAgent: string,
    method: string,
    params: any
  ): Promise<A2AResponse> {
    const request: A2ARequest = {
      id: uuidv4(),
      method,
      params,
      agent_target: targetAgent,
      timestamp: Date.now()
    };

    // Aqui seria a chamada real para o Coordinator
    console.log(`🔄 [A2A] ${this.agentName} delegando para ${targetAgent}: ${method}`);
    
    return {
      id: request.id,
      result: { delegated: true, target: targetAgent },
      timestamp: Date.now()
    };
  }
}

/**
 * 📝 Template: Agent Logger A2A
 * Agente especializado em logging compatível com A2A
 */
export class A2ALoggerAgent extends BaseA2AAgent {
  private logs: Map<string, any[]> = new Map();

  constructor() {
    super('A2A Logger Agent', {
      skills: ['logging', 'monitoring', 'analytics'],
      supported_tasks: ['log_event', 'search_logs', 'generate_report'],
      max_concurrent_tasks: 10,
      can_stream: true,
      can_push_notifications: false,
      authentication: 'none',
      default_input_modes: ['text', 'json'],
      default_output_modes: ['text', 'json']
    });
  }

  async processRequest(request: A2ARequest): Promise<A2AResponse> {
    try {
      switch (request.method) {
        case 'log_event':
          return await this.logEvent(request);
        case 'search_logs':
          return await this.searchLogs(request);
        case 'generate_report':
          return await this.generateReport(request);
        default:
          return {
            id: request.id,
            error: `Método não suportado: ${request.method}`,
            timestamp: Date.now()
          };
      }
    } catch (error) {
      return {
        id: request.id,
        error: error instanceof Error ? error.message : 'Erro interno',
        timestamp: Date.now()
      };
    }
  }

  private async logEvent(request: A2ARequest): Promise<A2AResponse> {
    const { agent_id, event_type, data } = request.params;
    
    if (!this.logs.has(agent_id)) {
      this.logs.set(agent_id, []);
    }
    
    const logEntry = {
      timestamp: Date.now(),
      event_type,
      data,
      request_id: request.id
    };
    
    this.logs.get(agent_id)?.push(logEntry);
    
    return {
      id: request.id,
      result: { logged: true, entry_id: logEntry.timestamp },
      timestamp: Date.now()
    };
  }

  private async searchLogs(request: A2ARequest): Promise<A2AResponse> {
    const { agent_id, event_type, limit = 10 } = request.params;
    
    let logs = this.logs.get(agent_id) || [];
    
    if (event_type) {
      logs = logs.filter(log => log.event_type === event_type);
    }
    
    return {
      id: request.id,
      result: {
        logs: logs.slice(-limit),
        total: logs.length
      },
      timestamp: Date.now()
    };
  }

  private async generateReport(request: A2ARequest): Promise<A2AResponse> {
    const { agent_id } = request.params;
    const logs = this.logs.get(agent_id) || [];
    
    const report = {
      agent_id,
      total_events: logs.length,
      event_types: [...new Set(logs.map(log => log.event_type))],
      first_event: logs[0]?.timestamp,
      last_event: logs[logs.length - 1]?.timestamp
    };
    
    return {
      id: request.id,
      result: report,
      timestamp: Date.now()
    };
  }
}

/**
 * 🔧 Template: Task Coordinator A2A
 * Agente coordenador de tarefas compatível com A2A
 */
export class A2ATaskCoordinatorAgent extends BaseA2AAgent {
  private activeTasks: Map<string, any> = new Map();

  constructor() {
    super('A2A Task Coordinator', {
      skills: ['task_coordination', 'delegation', 'monitoring'],
      supported_tasks: ['create_task', 'assign_task', 'track_task'],
      max_concurrent_tasks: 50,
      can_stream: true,
      can_push_notifications: true,
      authentication: 'none',
      default_input_modes: ['text', 'json'],
      default_output_modes: ['text', 'json']
    });
  }

  async processRequest(request: A2ARequest): Promise<A2AResponse> {
    try {
      switch (request.method) {
        case 'create_task':
          return await this.createTask(request);
        case 'assign_task':
          return await this.assignTask(request);
        case 'track_task':
          return await this.trackTask(request);
        default:
          return {
            id: request.id,
            error: `Método não suportado: ${request.method}`,
            timestamp: Date.now()
          };
      }
    } catch (error) {
      return {
        id: request.id,
        error: error instanceof Error ? error.message : 'Erro interno',
        timestamp: Date.now()
      };
    }
  }

  private async createTask(request: A2ARequest): Promise<A2AResponse> {
    const { title, description, type, priority = 'medium' } = request.params;
    
    const taskId = uuidv4();
    const task = {
      id: taskId,
      title,
      description,
      type,
      priority,
      status: 'created',
      created_at: Date.now(),
      assigned_agent: null
    };
    
    this.activeTasks.set(taskId, task);
    
    return {
      id: request.id,
      result: { task_id: taskId, status: 'created' },
      timestamp: Date.now()
    };
  }

  private async assignTask(request: A2ARequest): Promise<A2AResponse> {
    const { task_id, agent_target } = request.params;
    
    const task = this.activeTasks.get(task_id);
    if (!task) {
      return {
        id: request.id,
        error: `Tarefa não encontrada: ${task_id}`,
        timestamp: Date.now()
      };
    }
    
    task.assigned_agent = agent_target;
    task.status = 'assigned';
    task.assigned_at = Date.now();
    
    // Delegar para agente específico
    await this.delegateToAgent(agent_target, 'execute_task', {
      task_id,
      task_details: task
    });
    
    return {
      id: request.id,
      result: { task_id, assigned_to: agent_target },
      timestamp: Date.now()
    };
  }

  private async trackTask(request: A2ARequest): Promise<A2AResponse> {
    const { task_id } = request.params;
    
    const task = this.activeTasks.get(task_id);
    if (!task) {
      return {
        id: request.id,
        error: `Tarefa não encontrada: ${task_id}`,
        timestamp: Date.now()
      };
    }
    
    return {
      id: request.id,
      result: task,
      timestamp: Date.now()
    };
  }
}

/**
 * Factory para criar agentes A2A rapidamente
 */
export class A2AAgentFactory {
  static createLogger(): A2ALoggerAgent {
    return new A2ALoggerAgent();
  }

  static createTaskCoordinator(): A2ATaskCoordinatorAgent {
    return new A2ATaskCoordinatorAgent();
  }

  static createCustomAgent(
    name: string,
    capabilities: A2AAgentCapabilities,
    processFunction: (request: A2ARequest) => Promise<A2AResponse>
  ): BaseA2AAgent {
    return new (class extends BaseA2AAgent {
      constructor() {
        super(name, capabilities);
      }

      async processRequest(request: A2ARequest): Promise<A2AResponse> {
        return processFunction(request);
      }
    })();
  }
}

/**
 * Exemplo de uso:
 * 
 * const logger = A2AAgentFactory.createLogger();
 * await logger.start();
 * 
 * const coordinator = A2AAgentFactory.createTaskCoordinator();
 * await coordinator.start();
 * 
 * // Criar agente customizado
 * const customAgent = A2AAgentFactory.createCustomAgent(
 *   'Custom Agent',
 *   { skills: ['custom'], supported_tasks: ['custom_task'], ... },
 *   async (request) => ({ id: request.id, result: 'custom response', timestamp: Date.now() })
 * );
 */