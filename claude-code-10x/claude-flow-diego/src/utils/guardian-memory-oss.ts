/**
 * Guardian Memory Manager OSS
 * 
 * Nova versão que usa Chroma DB local via bridge
 * Mantém compatibilidade com GuardianMemoryManager original
 */

import axios from 'axios';

interface GuardianMemory {
  content: string;
  metadata?: {
    project?: string;
    project_type?: string;
    action?: string;
    score?: number;
    date?: string;
    [key: string]: any;
  };
  tags?: string[];
  category?: string;
}

interface MemorySearchResult {
  id: string;
  content: string;
  metadata?: Record<string, any>;
  score?: number;
}

export class GuardianMemoryManagerOSS {
  private readonly USER_ID = "guardian";
  private readonly bridgeUrl: string;
  
  constructor(bridgeUrl: string = 'http://localhost:3002') {
    this.bridgeUrl = bridgeUrl;
  }
  
  /**
   * Adiciona uma nova memória para o Guardian
   */
  async addMemory(memory: GuardianMemory): Promise<void> {
    try {
      console.log('🧠 Guardian OSS está memorizando:', memory.content);
      
      const response = await axios.post(`${this.bridgeUrl}/mcp/add_memory`, {
        content: memory.content,
        user_id: this.USER_ID,
        metadata: memory.metadata || {},
        tags: memory.tags || [],
        category: memory.category
      });
      
      if (response.data?.id) {
        console.log('💾 Memória OSS salva com sucesso:', response.data.id);
      }
    } catch (error: any) {
      console.error('❌ Erro ao salvar memória OSS:', error.message);
      
      // Fallback para versão antiga se bridge não disponível
      if (error.code === 'ECONNREFUSED') {
        console.warn('⚠️ Bridge OSS indisponível, usando fallback...');
        // Aqui poderia chamar a versão original como fallback
      }
    }
  }

  /**
   * Busca memórias relevantes
   */
  async searchMemories(query: string, limit: number = 5): Promise<MemorySearchResult[]> {
    try {
      console.log('🔍 Guardian OSS procurando memórias sobre:', query);
      
      const response = await axios.post(`${this.bridgeUrl}/mcp/search_memory`, {
        query,
        user_id: this.USER_ID,
        limit
      });
      
      return response.data?.results || [];
    } catch (error: any) {
      console.error('❌ Erro ao buscar memórias OSS:', error.message);
      return [];
    }
  }

  /**
   * Lista todas as memórias do Guardian
   */
  async listMemories(limit: number = 50): Promise<MemorySearchResult[]> {
    try {
      console.log('📋 Listando memórias do Guardian OSS');
      
      const response = await axios.get(`${this.bridgeUrl}/mcp/list_memories/${this.USER_ID}`, {
        params: { limit }
      });
      
      return response.data?.memories || [];
    } catch (error: any) {
      console.error('❌ Erro ao listar memórias OSS:', error.message);
      return [];
    }
  }

  /**
   * Remove uma memória específica ou todas
   */
  async deleteMemory(memoryId?: string): Promise<void> {
    try {
      if (memoryId) {
        console.log('🗑️ Removendo memória OSS:', memoryId);
      } else {
        console.log('🗑️ Removendo todas as memórias do Guardian OSS');
      }
      
      await axios.delete(`${this.bridgeUrl}/mcp/delete_memories`, {
        data: {
          user_id: this.USER_ID,
          memory_id: memoryId
        }
      });
      
      console.log('✅ Memória(s) OSS removida(s) com sucesso');
    } catch (error: any) {
      console.error('❌ Erro ao deletar memória OSS:', error.message);
    }
  }

  // Métodos auxiliares para tipos específicos de memória (idênticos ao original)

  /**
   * Memoriza uma decisão de organização
   */
  async rememberOrganizationDecision(
    project: string,
    action: string,
    description: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.addMemory({
      content: `[${project}] ${action}: ${description}`,
      category: 'organization_decision',
      metadata: {
        project,
        action,
        date: new Date().toISOString(),
        source: 'guardian_oss',
        ...metadata
      },
      tags: ['decision', 'organization', project, 'oss']
    });
  }

  /**
   * Memoriza uma estrutura bem-sucedida
   */
  async rememberSuccessfulStructure(
    projectType: string,
    score: number,
    structure: string
  ): Promise<void> {
    await this.addMemory({
      content: `Estrutura ${projectType} alcançou ${score}% de organização: ${structure}`,
      category: 'successful_structure',
      metadata: {
        project_type: projectType,
        score,
        date: new Date().toISOString(),
        source: 'guardian_oss'
      },
      tags: ['structure', 'success', projectType, `score_${score}`, 'oss']
    });
  }

  /**
   * Memoriza um padrão aprendido
   */
  async rememberLearnedPattern(
    pattern: string,
    context: string,
    type: 'exception' | 'rule' | 'preference'
  ): Promise<void> {
    await this.addMemory({
      content: `Padrão aprendido: ${pattern}. Contexto: ${context}`,
      category: 'learned_pattern',
      metadata: {
        pattern_type: type,
        date: new Date().toISOString(),
        source: 'guardian_oss'
      },
      tags: ['pattern', type, 'oss']
    });
  }

  /**
   * Busca decisões anteriores similares
   */
  async findSimilarDecisions(
    project: string,
    issueType: string
  ): Promise<MemorySearchResult[]> {
    const query = `${project} ${issueType} organização decisão`;
    return await this.searchMemories(query, 3);
  }

  /**
   * Busca estruturas bem-sucedidas para um tipo de projeto
   */
  async findSuccessfulStructures(
    projectType: string
  ): Promise<MemorySearchResult[]> {
    const query = `estrutura ${projectType} score 100 organização`;
    return await this.searchMemories(query, 5);
  }

  /**
   * Memoriza análise de agentes
   */
  async rememberAgentAnalysis(
    analysis: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.addMemory({
      content: `Análise de agentes: ${analysis}`,
      category: 'agent_analysis',
      metadata: {
        date: new Date().toISOString(),
        source: 'guardian_oss',
        ...metadata
      },
      tags: ['agents', 'analysis', 'optimization', 'oss']
    });
  }

  /**
   * Funcionalidades NOVAS do OSS - não disponíveis na versão original
   */

  /**
   * Adiciona uma conversa completa (novo recurso OSS)
   */
  async addConversation(messages: Array<{role: string, content: string}>, metadata?: any): Promise<void> {
    try {
      console.log('💬 Guardian OSS memorizando conversa com', messages.length, 'mensagens');
      
      const response = await axios.post(`${this.bridgeUrl}/oss/add_conversation`, {
        messages,
        user_id: this.USER_ID,
        metadata: {
          date: new Date().toISOString(),
          source: 'guardian_oss',
          ...metadata
        }
      });
      
      if (response.data?.id) {
        console.log('💾 Conversa OSS salva com sucesso:', response.data.id);
      }
    } catch (error: any) {
      console.error('❌ Erro ao salvar conversa OSS:', error.message);
    }
  }

  /**
   * Memoriza interação entre agentes
   */
  async recordAgentInteraction(
    agentName: string,
    taskId: string,
    interactionType: 'start' | 'progress' | 'complete' | 'error',
    content: string,
    metadata?: any
  ): Promise<void> {
    try {
      console.log(`🤖 Registrando interação ${interactionType} do agente ${agentName}`);
      
      await axios.post(`${this.bridgeUrl}/oss/agent_interaction`, {
        agent_name: agentName,
        task_id: taskId,
        interaction_type: interactionType,
        content,
        metadata: {
          date: new Date().toISOString(),
          source: 'guardian_oss',
          ...metadata
        }
      });
      
      console.log(`✅ Interação ${interactionType} registrada para ${agentName}`);
    } catch (error: any) {
      console.error('❌ Erro ao registrar interação OSS:', error.message);
    }
  }

  /**
   * Verifica status do bridge OSS
   */
  async checkBridgeHealth(): Promise<{healthy: boolean, details?: any}> {
    try {
      const response = await axios.get(`${this.bridgeUrl}/health`);
      return {
        healthy: response.data.status === 'healthy',
        details: response.data
      };
    } catch (error) {
      return {
        healthy: false,
        details: { error: error.message }
      };
    }
  }

  /**
   * Obtém estatísticas do sistema de memória
   */
  async getMemoryStats(): Promise<any> {
    try {
      const response = await axios.get(`${this.bridgeUrl}/stats`);
      return response.data;
    } catch (error: any) {
      console.error('❌ Erro ao obter estatísticas OSS:', error.message);
      return null;
    }
  }
}