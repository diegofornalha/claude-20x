/**
 * Claude Flow A2A Bridge
 * 
 * Ponte entre Claude Flow e Sistema A2A
 * Garante que Claude Flow siga padrão A2A e comunique com agentes A2A
 */

import axios from 'axios';
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

export interface ClaudeFlowTask {
  id: string;
  type: string;
  description: string;
  payload: any;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export class ClaudeFlowA2ABridge {
  private a2aServerUrl: string;
  private claudeFlowAgentId: string;
  private isRegistered: boolean = false;

  constructor(a2aServerUrl: string = 'http://localhost:8080') {
    this.a2aServerUrl = a2aServerUrl;
    this.claudeFlowAgentId = 'claude_flow_orchestrator';
    this.registerWithA2ASystem();
  }

  /**
   * Registra Claude Flow como agente A2A
   */
  private async registerWithA2ASystem(): Promise<void> {
    try {
      const registrationData = {
        agent_name: this.claudeFlowAgentId,
        capabilities: {
          skills: ['task_orchestration', 'memory_management', 'terminal_control', 'mcp_integration'],
          supported_tasks: ['orchestrate_workflow', 'manage_memory', 'execute_commands', 'coordinate_agents'],
          max_concurrent_tasks: 20
        }
      };

      await axios.post(`${this.a2aServerUrl}/api/agents/register`, registrationData);
      this.isRegistered = true;
      
      console.log(`🤖 [Claude Flow A2A] Registrado como agente A2A: ${this.claudeFlowAgentId}`);
      
      // Registrar na memória A2A
      await this.storeMemoryA2A(
        'Claude Flow registrado como agente A2A',
        'system_integration',
        this.claudeFlowAgentId,
        { registration_time: Date.now(), capabilities: registrationData.capabilities }
      );
      
    } catch (error) {
      console.error('❌ [Claude Flow A2A] Erro ao registrar com sistema A2A:', error);
      this.isRegistered = false;
    }
  }

  /**
   * Converte tarefa Claude Flow para protocolo A2A
   */
  async delegateTaskToA2A(task: ClaudeFlowTask, targetAgent?: string): Promise<A2AResponse> {
    if (!this.isRegistered) {
      throw new Error('Claude Flow não está registrado no sistema A2A');
    }

    const a2aRequest: A2ARequest = {
      id: uuidv4(),
      method: this.mapTaskTypeToA2AMethod(task.type),
      params: {
        ...task.payload,
        original_task_id: task.id,
        description: task.description,
        priority: task.priority
      },
      agent_target: targetAgent,
      timestamp: Date.now()
    };

    try {
      const response = await axios.post(`${this.a2aServerUrl}/api/tasks`, {
        type: a2aRequest.method,
        title: `Claude Flow: ${task.description}`,
        description: `Tarefa delegada pelo Claude Flow Orchestrator`,
        payload: a2aRequest.params,
        priority: task.priority
      });

      console.log(`🔄 [Claude Flow A2A] Tarefa delegada: ${task.id} → ${response.data.task_id}`);
      
      return {
        id: a2aRequest.id,
        result: {
          a2a_task_id: response.data.task_id,
          delegated_to: targetAgent || 'coordinator_agent',
          status: 'delegated'
        },
        timestamp: Date.now()
      };
      
    } catch (error) {
      return {
        id: a2aRequest.id,
        error: `Erro ao delegar para A2A: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        timestamp: Date.now()
      };
    }
  }

  /**
   * Mapeia tipos de tarefa Claude Flow para métodos A2A
   */
  private mapTaskTypeToA2AMethod(taskType: string): string {
    const mapping: Record<string, string> = {
      'organize_project': 'organize_files',
      'analyze_code': 'analyze_structure',
      'manage_memory': 'memory_search',
      'execute_command': 'execute_task',
      'coordinate_agents': 'coordinate_tasks',
      'default': 'execute_task'
    };

    return mapping[taskType] || mapping['default'];
  }

  /**
   * Busca agentes A2A disponíveis
   */
  async getAvailableA2AAgents(): Promise<any[]> {
    try {
      const response = await axios.get(`${this.a2aServerUrl}/api/agents`);
      return response.data.registered_agents || [];
    } catch (error) {
      console.error('❌ [Claude Flow A2A] Erro ao buscar agentes:', error);
      return [];
    }
  }

  /**
   * Encontra melhor agente A2A para tarefa
   */
  async findBestAgentForTask(taskType: string): Promise<string | null> {
    const agents = await this.getAvailableA2AAgents();
    
    // Mapeamento de tipos de tarefa para agentes preferidos
    const agentPreferences: Record<string, string[]> = {
      'organize_project': ['guardian_agent'],
      'analyze_code': ['analyzer_agent', 'guardian_agent'],
      'manage_memory': ['memory_agent'],
      'coordinate_agents': ['coordinator_agent']
    };

    const preferredAgents = agentPreferences[taskType] || [];
    
    for (const preferredAgent of preferredAgents) {
      const found = agents.find(agent => agent.name === preferredAgent);
      if (found) {
        return found.name;
      }
    }

    // Se não encontrou agente específico, usar coordinator
    return 'coordinator_agent';
  }

  /**
   * Armazena informação na memória A2A
   */
  async storeMemoryA2A(content: string, category: string, agentSource: string, metadata: any = {}): Promise<void> {
    try {
      await axios.post(`${this.a2aServerUrl}/api/memory`, {
        content,
        category,
        agent_source: agentSource,
        metadata: {
          ...metadata,
          source_system: 'claude_flow',
          timestamp: Date.now()
        }
      });
    } catch (error) {
      console.error('❌ [Claude Flow A2A] Erro ao armazenar memória:', error);
    }
  }

  /**
   * Busca informações na memória A2A
   */
  async searchMemoryA2A(query: string, limit: number = 10): Promise<any[]> {
    try {
      const response = await axios.get(`${this.a2aServerUrl}/api/memory/search`, {
        params: { query, limit }
      });
      return response.data.entries || [];
    } catch (error) {
      console.error('❌ [Claude Flow A2A] Erro ao buscar memória:', error);
      return [];
    }
  }

  /**
   * Monitora compliance A2A do Claude Flow
   */
  async reportComplianceToGuardian(): Promise<void> {
    try {
      const complianceData = {
        agent_id: this.claudeFlowAgentId,
        a2a_registered: this.isRegistered,
        follows_a2a_protocol: true,
        memory_integration: true,
        last_check: Date.now()
      };

      await this.storeMemoryA2A(
        `Claude Flow A2A Compliance Check: ${this.isRegistered ? 'COMPLIANT' : 'NON-COMPLIANT'}`,
        'a2a_compliance',
        this.claudeFlowAgentId,
        complianceData
      );

      console.log(`📊 [Claude Flow A2A] Compliance reportado ao Guardian`);
      
    } catch (error) {
      console.error('❌ [Claude Flow A2A] Erro ao reportar compliance:', error);
    }
  }

  /**
   * Integra MCP servers com sistema A2A
   */
  async integrateMCPWithA2A(mcpServerInfo: any): Promise<void> {
    try {
      await this.storeMemoryA2A(
        `MCP Server integrado via Claude Flow: ${mcpServerInfo.name}`,
        'mcp_integration', 
        this.claudeFlowAgentId,
        {
          mcp_server: mcpServerInfo,
          integration_type: 'claude_flow_bridge',
          capabilities: mcpServerInfo.capabilities || []
        }
      );

      console.log(`🔗 [Claude Flow A2A] MCP Server ${mcpServerInfo.name} integrado com A2A`);
      
    } catch (error) {
      console.error('❌ [Claude Flow A2A] Erro ao integrar MCP:', error);
    }
  }

  /**
   * Status da integração A2A
   */
  getIntegrationStatus() {
    return {
      a2a_server_url: this.a2aServerUrl,
      agent_id: this.claudeFlowAgentId,
      registered: this.isRegistered,
      compliance_monitoring: true,
      memory_integration: true,
      mcp_bridge: true
    };
  }
}

export default ClaudeFlowA2ABridge;