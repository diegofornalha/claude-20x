/**
 * Guardian Memory Manager
 * 
 * Gerencia memórias persistentes do Organization Guardian usando Mem0-Bridge
 * Permite que o Guardian aprenda e lembre de decisões de organização
 */

import * as path from 'path';
import * as dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

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

export class GuardianMemoryManager {
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
      
      const toolData = {
        tool: 'mem0_list_memories',
        params: {
          user_id: this.USER_ID,
          limit
        }
      };
      
      const result = await this.executeMCPTool(toolData);
      
      if (result.success && result.data?.memories) {
        return result.data.memories;
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
      
      const toolData = {
        tool: 'mem0_delete_memories',
        params: {
          user_id: this.USER_ID,
          memory_id: memoryId
        }
      };
      
      const result = await this.executeMCPTool(toolData);
      
      if (result.success) {
        console.log('✅ Memória(s) removida(s) com sucesso');
      } else {
        throw new Error(result.error || 'Erro ao deletar memória');
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
      tags: ['decision', 'organization', project]
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
        date: new Date().toISOString()
      },
      tags: ['structure', 'success', projectType, `score_${score}`]
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
        date: new Date().toISOString()
      },
      tags: ['pattern', type]
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
        ...metadata
      },
      tags: ['agents', 'analysis', 'optimization']
    });
  }
  
  /**
   * Executa ferramenta MCP
   */
  private async executeMCPTool(toolData: any): Promise<any> {
    try {
      // Verificar se MEM0_API_KEY está configurada
      if (!process.env.MEM0_API_KEY) {
        console.warn('⚠️ MEM0_API_KEY não configurada - memória persistente desabilitada');
        console.log('Para habilitar memória persistente, configure MEM0_API_KEY no arquivo .env');
        return { success: false, error: 'MEM0_API_KEY não configurada' };
      }
      
      // Executar ferramenta via comando
      const jsonData = JSON.stringify(toolData).replace(/'/g, "'\\'''");
      const command = `cd "${this.mcpToolsPath}" && npm run execute-tool -- '${jsonData}'`;
      
      const output = execSync(command, {
        encoding: 'utf8',
        env: { ...process.env }
      });
      
      // Parse do resultado
      try {
        const lines = output.split('\n').filter(line => line.trim());
        const jsonLine = lines.find(line => {
          try {
            JSON.parse(line);
            return true;
          } catch {
            return false;
          }
        });
        
        if (jsonLine) {
          const result = JSON.parse(jsonLine);
          if (result.success && result.data) {
            // Extrair dados da resposta MCP
            return { 
              success: true, 
              data: result.data.data || result.data 
            };
          }
          return result;
        }
      } catch (parseError) {
        console.error('Erro ao parsear resposta:', output);
      }
      
      return { success: true, data: output };
    } catch (error: any) {
      console.error('Erro executando MCP:', error.message);
      return { 
        success: false, 
        error: error.message || 'Erro ao executar ferramenta MCP' 
      };
    }
  }
}