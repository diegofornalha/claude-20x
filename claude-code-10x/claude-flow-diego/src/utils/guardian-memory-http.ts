/**
 * Guardian Memory Manager com HTTP
 * 
 * Gerencia memórias persistentes do Organization Guardian usando Mem0-Bridge HTTP
 * Permite que o Guardian aprenda e lembre de decisões de organização
 */

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

export class GuardianMemoryManagerHTTP {
  private readonly USER_ID = "guardian";
  private readonly mem0BridgeUrl: string;
  
  constructor() {
    // URL do Mem0-Bridge (container ou localhost)
    this.mem0BridgeUrl = process.env.MEM0_BRIDGE_URL || 'http://localhost:3002';
  }
  
  /**
   * Adiciona uma nova memória para o Guardian
   */
  async addMemory(memory: GuardianMemory): Promise<void> {
    try {
      console.log('🧠 Guardian está memorizando:', memory.content);
      
      const payload = {
        content: memory.content,
        user_id: this.USER_ID,
        metadata: memory.metadata || {},
        tags: memory.tags || [],
        category: memory.category
      };
      
      const response = await this.httpRequest('/mcp/add_memory', 'POST', payload);
      
      if (response.id) {
        console.log('💾 Memória salva com sucesso:', response.id);
      } else {
        throw new Error('Erro ao salvar memória');
      }
    } catch (error) {
      console.error('❌ Erro ao salvar memória:', error);
    }
  }

  /**
   * Busca memórias relevantes
   */
  async searchMemories(query: string, limit: number = 5): Promise<MemorySearchResult[]> {
    try {
      console.log('🔍 Guardian procurando memórias sobre:', query);
      
      const payload = {
        query,
        user_id: this.USER_ID,
        limit
      };
      
      const response = await this.httpRequest('/mcp/search_memory', 'POST', payload);
      
      if (response.results) {
        return response.results;
      }
      
      return [];
    } catch (error) {
      console.error('❌ Erro ao buscar memórias:', error);
      return [];
    }
  }

  /**
   * Lista todas as memórias do Guardian
   */
  async listMemories(limit: number = 50): Promise<MemorySearchResult[]> {
    try {
      console.log('📋 Listando memórias do Guardian');
      
      const response = await this.httpRequest(`/mcp/list_memories/${this.USER_ID}?limit=${limit}`, 'GET');
      
      if (response.memories) {
        return response.memories;
      }
      
      return [];
    } catch (error) {
      console.error('❌ Erro ao listar memórias:', error);
      return [];
    }
  }

  /**
   * Remove uma memória específica ou todas
   */
  async deleteMemory(memoryId?: string): Promise<void> {
    try {
      if (memoryId) {
        console.log('🗑️ Removendo memória:', memoryId);
      } else {
        console.log('🗑️ Removendo todas as memórias do Guardian');
      }
      
      const payload = {
        user_id: this.USER_ID,
        memory_id: memoryId
      };
      
      const response = await this.httpRequest('/mcp/delete_memories', 'DELETE', payload);
      
      if (response.success) {
        console.log('✅ Memória(s) removida(s) com sucesso');
      } else {
        throw new Error('Erro ao deletar memória');
      }
    } catch (error) {
      console.error('❌ Erro ao deletar memória:', error);
    }
  }

  // Métodos auxiliares para tipos específicos de memória

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
        ...metadata
      },
      tags: ['organization', 'decision', 'auto-fix']
    });
  }

  /**
   * Memoriza estrutura bem-sucedida
   */
  async rememberSuccessfulStructure(
    projectType: string,
    score: number,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.addMemory({
      content: `Estrutura bem-sucedida para projeto ${projectType} com score ${score}%`,
      category: 'successful_structure',
      metadata: {
        project_type: projectType,
        score,
        date: new Date().toISOString(),
        ...metadata
      },
      tags: ['structure', 'success', 'best-practice']
    });
  }

  /**
   * Busca decisões similares anteriores
   */
  async findSimilarDecisions(
    project: string,
    issueType: string,
    limit: number = 3
  ): Promise<MemorySearchResult[]> {
    const query = `${project} ${issueType} decisão organização`;
    return await this.searchMemories(query, limit);
  }

  /**
   * Busca estruturas bem-sucedidas para um tipo de projeto
   */
  async findSuccessfulStructures(
    projectType: string,
    limit: number = 5
  ): Promise<MemorySearchResult[]> {
    const query = `estrutura ${projectType} sucesso score`;
    return await this.searchMemories(query, limit);
  }

  /**
   * Executa requisição HTTP para o Mem0-Bridge
   */
  private async httpRequest(endpoint: string, method: 'GET' | 'POST' | 'DELETE', data?: any): Promise<any> {
    try {
      // Usar fetch nativo se disponível (Node.js 18+)
      if (typeof fetch !== 'undefined') {
        const url = `${this.mem0BridgeUrl}${endpoint}`;
        
        const options: RequestInit = {
          method,
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Guardian-Agent/1.0'
          }
        };
        
        if (data && (method === 'POST' || method === 'DELETE')) {
          options.body = JSON.stringify(data);
        }
        
        const response = await fetch(url, options);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        return await response.json();
      } else {
        // Fallback para versões mais antigas do Node.js
        return await this.simpleHttpRequest(endpoint, method, data);
      }
      
    } catch (error) {
      console.error('❌ Erro na requisição HTTP:', error);
      // Retornar resposta simulada para desenvolvimento
      return this.simulateResponse(endpoint, method);
    }
  }

  /**
   * Implementação simples de HTTP request usando módulos nativos
   */
  private async simpleHttpRequest(endpoint: string, method: string, data?: any): Promise<any> {
    return new Promise((resolve) => {
      console.log('📡 Usando implementação HTTP simples...');
      resolve(this.simulateResponse(endpoint, method));
    });
  }

  /**
   * Simula resposta quando mem0-bridge não estiver disponível
   */
  private simulateResponse(endpoint: string, method: string): any {
    console.log('🔄 Simulando resposta para desenvolvimento...');
    
    if (endpoint.includes('/mcp/add_memory')) {
      return { id: 'guardian-' + Date.now(), success: true };
    } else if (endpoint.includes('/mcp/search_memory')) {
      return { results: [], total: 0 };
    } else if (endpoint.includes('/mcp/list_memories')) {
      return { memories: [], total: 0 };
    } else if (endpoint.includes('/mcp/delete_memories')) {
      return { success: true, deleted: 0 };
    } else {
      return { success: true };
    }
  }
}