/**
 * Simple Memory Adapter - Armazenamento em arquivo JSON sem embeddings
 * Solução alternativa ao ChromaDB para simplicidade
 */

import express from 'express';
import cors from 'cors';
import * as fs from 'fs/promises';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

interface MemoryEntry {
  id: string;
  user_id: string;
  content: string;
  metadata: any;
  category?: string;
  tags?: string[];
  created_at: string;
  updated_at: string;
}

interface MemoryStore {
  memories: Map<string, MemoryEntry[]>;
  totalCount: number;
}

export class SimpleMemoryAdapter {
  private app: express.Application;
  private port: number;
  private dataPath: string;
  private store: MemoryStore;

  constructor(port: number = 3002, dataPath: string = '/data/memory-store.json') {
    this.app = express();
    this.port = port;
    this.dataPath = dataPath;
    this.store = {
      memories: new Map(),
      totalCount: 0
    };
    
    this.setupMiddleware();
    this.loadData();
    this.setupRoutes();
  }

  private setupMiddleware(): void {
    this.app.use(cors());
    this.app.use(express.json());
  }

  private async loadData(): Promise<void> {
    try {
      const data = await fs.readFile(this.dataPath, 'utf-8');
      const parsed = JSON.parse(data);
      this.store.memories = new Map(Object.entries(parsed.memories || {}));
      this.store.totalCount = parsed.totalCount || 0;
      console.log(`📁 Loaded ${this.store.totalCount} memories from disk`);
    } catch (error) {
      console.log('📝 Starting with empty memory store');
      await this.ensureDataDir();
    }
  }

  private async saveData(): Promise<void> {
    try {
      await this.ensureDataDir();
      const data = {
        memories: Object.fromEntries(this.store.memories),
        totalCount: this.store.totalCount,
        lastUpdated: new Date().toISOString()
      };
      await fs.writeFile(this.dataPath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('❌ Error saving memory store:', error);
    }
  }

  private async ensureDataDir(): Promise<void> {
    const dir = path.dirname(this.dataPath);
    await fs.mkdir(dir, { recursive: true });
  }

  private setupRoutes(): void {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({ 
        status: 'healthy',
        service: 'simple-memory-adapter',
        memory_count: this.store.totalCount,
        users_count: this.store.memories.size,
        timestamp: new Date().toISOString()
      });
    });

    // MCP Memory Add
    this.app.post('/mcp/add_memory', async (req, res) => {
      try {
        const { content, user_id, metadata, category, tags } = req.body;
        
        if (!content || !user_id) {
          return res.status(400).json({ error: 'Missing required fields: content, user_id' });
        }

        const memory: MemoryEntry = {
          id: uuidv4(),
          user_id,
          content,
          metadata: metadata || {},
          category,
          tags,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        // Adicionar à store
        if (!this.store.memories.has(user_id)) {
          this.store.memories.set(user_id, []);
        }
        this.store.memories.get(user_id)!.push(memory);
        this.store.totalCount++;

        // Salvar no disco
        await this.saveData();

        res.json({
          id: memory.id,
          content: memory.content,
          user_id: memory.user_id,
          created_at: memory.created_at,
          metadata: memory.metadata
        });

      } catch (error) {
        console.error('Erro ao adicionar memória:', error);
        res.status(500).json({ error: 'Failed to add memory', details: error.message });
      }
    });

    // MCP Memory Search
    this.app.post('/mcp/search_memory', async (req, res) => {
      try {
        const { query, user_id, limit = 10 } = req.body;
        
        const userMemories = this.store.memories.get(user_id) || [];
        
        // Busca simples por substring (case insensitive)
        const results = userMemories
          .filter(m => 
            m.content.toLowerCase().includes(query.toLowerCase()) ||
            (m.category && m.category.toLowerCase().includes(query.toLowerCase())) ||
            (m.tags && m.tags.some(t => t.toLowerCase().includes(query.toLowerCase())))
          )
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, limit);

        res.json({
          results: results.map(m => ({
            id: m.id,
            content: m.content,
            metadata: m.metadata,
            score: 1.0 // Simulado - sem score real
          })),
          total: results.length
        });

      } catch (error) {
        console.error('Erro ao buscar memórias:', error);
        res.status(500).json({ error: 'Failed to search memories', details: error.message });
      }
    });

    // MCP List Memories
    this.app.get('/mcp/list_memories/:user_id', async (req, res) => {
      try {
        const { user_id } = req.params;
        const limit = parseInt(req.query.limit as string) || 50;
        
        const userMemories = this.store.memories.get(user_id) || [];
        const sorted = userMemories
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, limit);

        res.json({
          memories: sorted,
          total: userMemories.length
        });

      } catch (error) {
        console.error('Erro ao listar memórias:', error);
        res.status(500).json({ error: 'Failed to list memories', details: error.message });
      }
    });

    // MCP Delete Memories
    this.app.delete('/mcp/delete_memories', async (req, res) => {
      try {
        const { user_id, memory_id } = req.body;
        
        if (!user_id) {
          return res.status(400).json({ error: 'Missing required field: user_id' });
        }

        if (memory_id) {
          // Deletar memória específica
          const userMemories = this.store.memories.get(user_id) || [];
          const index = userMemories.findIndex(m => m.id === memory_id);
          
          if (index >= 0) {
            userMemories.splice(index, 1);
            this.store.totalCount--;
            await this.saveData();
            res.json({ success: true, deleted: 1 });
          } else {
            res.status(404).json({ error: 'Memory not found' });
          }
        } else {
          // Deletar todas as memórias do usuário
          const count = this.store.memories.get(user_id)?.length || 0;
          this.store.memories.delete(user_id);
          this.store.totalCount -= count;
          await this.saveData();
          res.json({ success: true, deleted: count });
        }

      } catch (error) {
        console.error('Erro ao deletar memórias:', error);
        res.status(500).json({ error: 'Failed to delete memories', details: error.message });
      }
    });

    // Estatísticas
    this.app.get('/stats', (req, res) => {
      const users = Array.from(this.store.memories.keys());
      const stats = users.map(user_id => ({
        user_id,
        memory_count: this.store.memories.get(user_id)?.length || 0
      }));

      res.json({
        total_memories: this.store.totalCount,
        total_users: users.length,
        users: stats
      });
    });

    // Fallback
    this.app.use((req, res) => {
      res.status(404).json({ 
        error: 'Endpoint not found',
        available_endpoints: [
          'POST /mcp/add_memory',
          'POST /mcp/search_memory', 
          'GET /mcp/list_memories/:user_id',
          'DELETE /mcp/delete_memories',
          'GET /stats',
          'GET /health'
        ]
      });
    });
  }

  start(): void {
    this.app.listen(this.port, () => {
      console.log(`🚀 Simple Memory Adapter rodando na porta ${this.port}`);
      console.log(`💾 Armazenando dados em: ${this.dataPath}`);
      console.log(`📊 ${this.store.totalCount} memórias carregadas`);
    });

    // Auto-save a cada 30 segundos
    setInterval(() => {
      this.saveData();
    }, 30000);
  }
}

// Se executado diretamente
if (require.main === module) {
  const adapter = new SimpleMemoryAdapter(
    parseInt(process.env.PORT || '3002'),
    process.env.DATA_PATH || '/data/memory-store.json'
  );
  adapter.start();
}