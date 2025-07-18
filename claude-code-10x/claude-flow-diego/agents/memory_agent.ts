/**
 * Memory Agent - Agente de Memória A2A
 * 
 * Responsável por gerenciar memória e contexto entre agentes no protocolo A2A
 */

import { v4 as uuidv4 } from 'uuid';

export interface MemoryEntry {
  id: string;
  content: string;
  category: string;
  agent_source: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

export interface MemoryQuery {
  query: string;
  category?: string;
  agent_filter?: string;
  limit?: number;
}

export interface MemorySearchResult {
  entries: MemoryEntry[];
  total_found: number;
  query_time: number;
}

export class MemoryAgent {
  private agentId: string;
  private memories: Map<string, MemoryEntry> = new Map();
  private categories: Set<string> = new Set();

  constructor(agentId: string = 'memory_agent') {
    this.agentId = agentId;
    console.log(`🧠 [A2A] Memory Agent iniciado: ${this.agentId}`);
    
    // Inicializar com algumas memórias do sistema
    this.initializeSystemMemories();
  }

  /**
   * Armazena uma nova memória
   */
  async storeMemory(content: string, category: string, agentSource: string, metadata?: Record<string, any>): Promise<string> {
    const memoryId = uuidv4();
    const memory: MemoryEntry = {
      id: memoryId,
      content,
      category,
      agent_source: agentSource,
      timestamp: Date.now(),
      metadata: metadata || {}
    };

    this.memories.set(memoryId, memory);
    this.categories.add(category);

    console.log(`🧠 [A2A] Memória armazenada: ${memoryId} (${category}) por ${agentSource}`);
    return memoryId;
  }

  /**
   * Busca memórias baseado em query
   */
  async searchMemories(query: MemoryQuery): Promise<MemorySearchResult> {
    const startTime = Date.now();
    const results: MemoryEntry[] = [];

    const searchTerm = query.query.toLowerCase();
    
    for (const memory of this.memories.values()) {
      // Filtro por categoria se especificado
      if (query.category && memory.category !== query.category) {
        continue;
      }

      // Filtro por agente se especificado
      if (query.agent_filter && memory.agent_source !== query.agent_filter) {
        continue;
      }

      // Busca no conteúdo
      if (memory.content.toLowerCase().includes(searchTerm)) {
        results.push(memory);
      }
    }

    // Ordenar por timestamp (mais recente primeiro)
    results.sort((a, b) => b.timestamp - a.timestamp);

    // Aplicar limite se especificado
    const limitedResults = query.limit ? results.slice(0, query.limit) : results;

    const queryTime = Date.now() - startTime;

    return {
      entries: limitedResults,
      total_found: results.length,
      query_time: queryTime
    };
  }

  /**
   * Obtém memória por ID
   */
  async getMemoryById(memoryId: string): Promise<MemoryEntry | null> {
    return this.memories.get(memoryId) || null;
  }

  /**
   * Lista todas as categorias disponíveis
   */
  getCategories(): string[] {
    return Array.from(this.categories).sort();
  }

  /**
   * Obtém memórias por categoria
   */
  async getMemoriesByCategory(category: string, limit?: number): Promise<MemoryEntry[]> {
    const results: MemoryEntry[] = [];
    
    for (const memory of this.memories.values()) {
      if (memory.category === category) {
        results.push(memory);
      }
    }

    // Ordenar por timestamp
    results.sort((a, b) => b.timestamp - a.timestamp);
    
    return limit ? results.slice(0, limit) : results;
  }

  /**
   * Obtém memórias por agente
   */
  async getMemoriesByAgent(agentName: string, limit?: number): Promise<MemoryEntry[]> {
    const results: MemoryEntry[] = [];
    
    for (const memory of this.memories.values()) {
      if (memory.agent_source === agentName) {
        results.push(memory);
      }
    }

    results.sort((a, b) => b.timestamp - a.timestamp);
    
    return limit ? results.slice(0, limit) : results;
  }

  /**
   * Remove memória por ID
   */
  async deleteMemory(memoryId: string): Promise<boolean> {
    const deleted = this.memories.delete(memoryId);
    if (deleted) {
      console.log(`🗑️ [A2A] Memória removida: ${memoryId}`);
    }
    return deleted;
  }

  /**
   * Atualiza memória existente
   */
  async updateMemory(memoryId: string, updates: Partial<MemoryEntry>): Promise<boolean> {
    const memory = this.memories.get(memoryId);
    if (!memory) {
      return false;
    }

    const updatedMemory = { ...memory, ...updates, id: memoryId };
    this.memories.set(memoryId, updatedMemory);
    
    console.log(`📝 [A2A] Memória atualizada: ${memoryId}`);
    return true;
  }

  /**
   * Obtém estatísticas da memória
   */
  getStats() {
    const agentCounts: Record<string, number> = {};
    const categoryCounts: Record<string, number> = {};

    for (const memory of this.memories.values()) {
      agentCounts[memory.agent_source] = (agentCounts[memory.agent_source] || 0) + 1;
      categoryCounts[memory.category] = (categoryCounts[memory.category] || 0) + 1;
    }

    return {
      total_memories: this.memories.size,
      total_categories: this.categories.size,
      agent_distribution: agentCounts,
      category_distribution: categoryCounts,
      oldest_memory: this.getOldestMemory()?.timestamp,
      newest_memory: this.getNewestMemory()?.timestamp
    };
  }

  /**
   * Obtém memória mais antiga
   */
  private getOldestMemory(): MemoryEntry | null {
    let oldest: MemoryEntry | null = null;
    
    for (const memory of this.memories.values()) {
      if (!oldest || memory.timestamp < oldest.timestamp) {
        oldest = memory;
      }
    }
    
    return oldest;
  }

  /**
   * Obtém memória mais recente
   */
  private getNewestMemory(): MemoryEntry | null {
    let newest: MemoryEntry | null = null;
    
    for (const memory of this.memories.values()) {
      if (!newest || memory.timestamp > newest.timestamp) {
        newest = memory;
      }
    }
    
    return newest;
  }

  /**
   * Exporta todas as memórias
   */
  async exportMemories(): Promise<MemoryEntry[]> {
    return Array.from(this.memories.values()).sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Importa memórias de backup
   */
  async importMemories(memories: MemoryEntry[]): Promise<number> {
    let imported = 0;
    
    for (const memory of memories) {
      this.memories.set(memory.id, memory);
      this.categories.add(memory.category);
      imported++;
    }
    
    console.log(`📥 [A2A] Importadas ${imported} memórias`);
    return imported;
  }

  /**
   * Inicializa memórias do sistema
   */
  private initializeSystemMemories(): void {
    // Memórias sobre o sistema A2A
    this.storeMemory(
      'Sistema A2A inicializado com Coordinator Agent e Memory Agent',
      'system_init',
      'memory_agent',
      { version: '1.0.0', components: ['coordinator', 'memory'] }
    );

    this.storeMemory(
      'Estrutura A2A criada: agents/, a2a_servers/, mcp/, .well-known/',
      'a2a_structure',
      'guardian_agent',
      { folders_created: 4, compliance: true }
    );

    this.storeMemory(
      'Agent Card A2A configurado em .well-known/agent.json',
      'a2a_config',
      'guardian_agent',
      { file: '.well-known/agent.json', format: 'json' }
    );
  }

  /**
   * Status do agente de memória
   */
  getStatus() {
    return {
      agent_id: this.agentId,
      total_memories: this.memories.size,
      categories: this.categories.size,
      uptime: Date.now(),
      capabilities: {
        memory_storage: true,
        memory_search: true,
        category_management: true,
        export_import: true
      }
    };
  }
}

// Instância global do agente de memória
export const memoryAgent = new MemoryAgent();

export default MemoryAgent;