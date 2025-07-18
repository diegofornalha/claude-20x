/**
 * Coordinator Agent - Agente Coordenador A2A
 * 
 * Responsável por coordenar tarefas entre diferentes agentes no protocolo A2A
 */

import { v4 as uuidv4 } from 'uuid';

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

export interface TaskRequest {
  task_id: string;
  task_type: string;
  payload: any;
  priority: number;
  agent_target?: string;
}

export interface AgentCapabilities {
  skills: string[];
  supported_tasks: string[];
  max_concurrent_tasks: number;
}

export class CoordinatorAgent {
  private agentId: string;
  private registeredAgents: Map<string, AgentCapabilities> = new Map();
  private activeTasks: Map<string, TaskRequest> = new Map();

  constructor(agentId: string = 'coordinator_agent') {
    this.agentId = agentId;
    console.log(`🤖 [A2A] Coordinator Agent iniciado: ${this.agentId}`);
  }

  /**
   * Registra um agente no sistema A2A
   */
  registerAgent(agentName: string, capabilities: AgentCapabilities): void {
    this.registeredAgents.set(agentName, capabilities);
    console.log(`🔗 [A2A] Agente registrado: ${agentName} com ${capabilities.skills.length} habilidades`);
  }

  /**
   * Encontra o melhor agente para uma tarefa específica
   */
  findBestAgent(taskType: string): string | null {
    for (const [agentName, capabilities] of this.registeredAgents.entries()) {
      if (capabilities.supported_tasks.includes(taskType)) {
        return agentName;
      }
    }
    return null;
  }

  /**
   * Delega uma tarefa para um agente específico
   */
  async delegateTask(taskRequest: TaskRequest): Promise<A2AResponse> {
    const taskId = taskRequest.task_id || uuidv4();
    
    // Encontrar agente apropriado se não especificado
    let targetAgent = taskRequest.agent_target;
    if (!targetAgent) {
      targetAgent = this.findBestAgent(taskRequest.task_type);
      if (!targetAgent) {
        return {
          id: taskId,
          error: `Nenhum agente encontrado para tarefa tipo: ${taskRequest.task_type}`,
          timestamp: Date.now()
        };
      }
    }

    // Registrar tarefa ativa
    this.activeTasks.set(taskId, { ...taskRequest, task_id: taskId, agent_target: targetAgent });

    console.log(`📋 [A2A] Delegando tarefa ${taskId} para ${targetAgent}: ${taskRequest.task_type}`);

    // Simular processamento da tarefa
    try {
      const result = await this.processTask(taskRequest, targetAgent);
      
      // Remover tarefa ativa
      this.activeTasks.delete(taskId);
      
      return {
        id: taskId,
        result,
        timestamp: Date.now()
      };
    } catch (error) {
      this.activeTasks.delete(taskId);
      return {
        id: taskId,
        error: error instanceof Error ? error.message : String(error),
        timestamp: Date.now()
      };
    }
  }

  /**
   * Processa uma tarefa com o agente especificado
   */
  private async processTask(task: TaskRequest, agentName: string): Promise<any> {
    // Simular processamento baseado no tipo de tarefa
    switch (task.task_type) {
      case 'analyze_code':
        return {
          analysis: 'Código analisado com sucesso',
          issues: 0,
          score: 95
        };
      
      case 'organize_files':
        return {
          organized_files: 12,
          created_folders: 3,
          score_improvement: 15
        };
      
      case 'memory_search':
        return {
          results: [
            { id: '1', content: 'Resultado da busca em memória', relevance: 0.9 }
          ]
        };
      
      default:
        return {
          message: `Tarefa ${task.task_type} processada por ${agentName}`,
          status: 'completed'
        };
    }
  }

  /**
   * Lista agentes registrados
   */
  listAgents(): Array<{ name: string; capabilities: AgentCapabilities }> {
    return Array.from(this.registeredAgents.entries()).map(([name, capabilities]) => ({
      name,
      capabilities
    }));
  }

  /**
   * Lista tarefas ativas
   */
  getActiveTasks(): TaskRequest[] {
    return Array.from(this.activeTasks.values());
  }

  /**
   * Cria uma requisição A2A padrão
   */
  createA2ARequest(method: string, params: any, agentTarget?: string): A2ARequest {
    return {
      id: uuidv4(),
      method,
      params,
      agent_target: agentTarget,
      timestamp: Date.now()
    };
  }

  /**
   * Status do coordenador
   */
  getStatus() {
    return {
      agent_id: this.agentId,
      registered_agents: this.registeredAgents.size,
      active_tasks: this.activeTasks.size,
      uptime: Date.now(),
      capabilities: {
        coordination: true,
        task_delegation: true,
        agent_discovery: true
      }
    };
  }
}

// Instância global do coordenador (padrão Singleton para A2A)
export const coordinatorAgent = new CoordinatorAgent();

// Registrar agentes padrão do sistema
coordinatorAgent.registerAgent('guardian_agent', {
  skills: ['organization', 'file_management', 'a2a_compliance'],
  supported_tasks: ['organize_files', 'analyze_structure', 'apply_fixes'],
  max_concurrent_tasks: 5
});

coordinatorAgent.registerAgent('memory_agent', {
  skills: ['memory_management', 'data_storage', 'search'],
  supported_tasks: ['memory_search', 'store_memory', 'analyze_patterns'],
  max_concurrent_tasks: 10
});

coordinatorAgent.registerAgent('analyzer_agent', {
  skills: ['code_analysis', 'performance_analysis', 'security_analysis'],
  supported_tasks: ['analyze_code', 'performance_check', 'security_scan'],
  max_concurrent_tasks: 3
});

export default CoordinatorAgent;