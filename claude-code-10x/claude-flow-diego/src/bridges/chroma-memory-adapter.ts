/**
 * Chroma Memory Adapter - Ponte direta para Chroma DB
 * 
 * Implementa compatibilidade MCP usando ChromaDB diretamente
 */

import express from 'express';
import cors from 'cors';
import { ChromaClient, DefaultEmbeddingFunction } from 'chromadb';
import { v4 as uuidv4 } from 'uuid';

interface MCPMemoryRequest {
  content: string;
  user_id: string;
  metadata?: any;
  category?: string;
  tags?: string[];
}

interface MCPSearchRequest {
  query: string;
  user_id: string;
  limit?: number;
  filters?: any;
}

export class ChromaMemoryAdapter {
  private app: express.Application;
  private chromaClient: ChromaClient;
  private port: number;
  private collection: any;

  constructor(chromaUrl: string = 'http://chroma-db:8000', port: number = 3002) {
    this.app = express();
    this.port = port;
    
    // Inicializar cliente Chroma
    this.chromaClient = new ChromaClient({
      path: chromaUrl
    });
    
    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware(): void {
    this.app.use(cors());
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));

    // Log requests
    this.app.use((req, res, next) => {
      console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
      next();
    });
  }

  private async ensureCollection(): Promise<void> {
    if (!this.collection) {
      try {
        // Tentar obter collection existente
        this.collection = await this.chromaClient.getCollection({
          name: 'claude_flow_memories'
        });
      } catch (error) {
        // Se não existir, criar nova
        this.collection = await this.chromaClient.createCollection({
          name: 'claude_flow_memories',
          metadata: { 
            description: 'Claude Flow Agent Memories',
            created_at: new Date().toISOString()
          },
          embeddingFunction: new DefaultEmbeddingFunction()
        });
        console.log('✅ Collection criada: claude_flow_memories');
      }
    }
  }

  private setupRoutes(): void {
    // Health check
    this.app.get('/health', async (req, res) => {
      try {
        // Verificar conexão com Chroma
        await this.chromaClient.heartbeat();
        await this.ensureCollection();
        
        res.json({
          status: 'healthy',
          service: 'chroma-memory-adapter',
          chroma_connected: true,
          collection_ready: !!this.collection,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        res.json({
          status: 'degraded',
          service: 'chroma-memory-adapter',
          chroma_connected: false,
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    });

    // MCP Memory Add
    this.app.post('/mcp/add_memory', async (req, res) => {
      try {
        const { content, user_id, metadata, category, tags }: MCPMemoryRequest = req.body;
        
        await this.ensureCollection();
        
        const id = uuidv4();
        // Chroma aceita apenas string, number, boolean ou null em metadata
        const enrichedMetadata = {
          user_id,
          category: category || 'general',
          tags_json: JSON.stringify(tags || []),
          source: 'mcp-bridge',
          created_at: new Date().toISOString(),
          // Converter metadata complexa para strings
          ...(metadata ? Object.fromEntries(
            Object.entries(metadata).map(([key, value]) => [
              key, 
              typeof value === 'object' ? JSON.stringify(value) : String(value)
            ])
          ) : {})
        };

        await this.collection.add({
          ids: [id],
          documents: [content],
          metadatas: [enrichedMetadata]
        });
        
        res.json({
          id,
          content,
          user_id,
          created_at: enrichedMetadata.created_at,
          metadata: enrichedMetadata
        });

      } catch (error) {
        console.error('Erro no add_memory:', error);
        res.status(500).json({
          error: 'Failed to add memory',
          details: error.message
        });
      }
    });

    // MCP Memory Search
    this.app.post('/mcp/search_memory', async (req, res) => {
      try {
        const { query, user_id, limit = 10, filters }: MCPSearchRequest = req.body;

        await this.ensureCollection();

        // Preparar filtros
        const searchFilters = {
          user_id: { $eq: user_id },
          ...filters
        };

        const results = await this.collection.query({
          queryTexts: [query],
          nResults: limit,
          where: searchFilters
        });
        
        // Converter resultados para formato MCP
        const mcpResults = [];
        if (results.ids && results.ids[0]) {
          for (let i = 0; i < results.ids[0].length; i++) {
            mcpResults.push({
              id: results.ids[0][i],
              content: results.documents[0][i],
              score: results.distances ? 1 - results.distances[0][i] : 1, // Converter distância para score
              created_at: results.metadatas[0][i]?.created_at,
              metadata: results.metadatas[0][i]
            });
          }
        }

        res.json({
          results: mcpResults,
          total: mcpResults.length
        });

      } catch (error) {
        console.error('Erro no search_memory:', error);
        res.status(500).json({
          error: 'Failed to search memories',
          details: error.message
        });
      }
    });

    // MCP Memory List
    this.app.get('/mcp/list_memories/:user_id', async (req, res) => {
      try {
        const { user_id } = req.params;
        const { limit = 50 } = req.query;

        await this.ensureCollection();

        const results = await this.collection.get({
          where: { user_id: { $eq: user_id } },
          limit: Number(limit)
        });

        // Converter para formato MCP
        const mcpMemories = [];
        if (results.ids) {
          for (let i = 0; i < results.ids.length; i++) {
            mcpMemories.push({
              id: results.ids[i],
              content: results.documents[i],
              created_at: results.metadatas[i]?.created_at,
              metadata: results.metadatas[i]
            });
          }
        }

        res.json({
          memories: mcpMemories,
          total: mcpMemories.length,
          user_id
        });

      } catch (error) {
        console.error('Erro no list_memories:', error);
        res.status(500).json({
          error: 'Failed to list memories',
          details: error.message
        });
      }
    });

    // MCP Memory Delete
    this.app.delete('/mcp/delete_memories', async (req, res) => {
      try {
        const { user_id, memory_id } = req.body;

        await this.ensureCollection();

        if (memory_id) {
          // Deletar memória específica
          await this.collection.delete({
            ids: [memory_id]
          });
          res.json({ 
            message: 'Memory deleted successfully',
            deleted_id: memory_id 
          });
        } else {
          // Deletar todas as memórias do usuário
          await this.collection.delete({
            where: { user_id: { $eq: user_id } }
          });
          res.json({ 
            message: 'All memories deleted successfully',
            user_id 
          });
        }

      } catch (error) {
        console.error('Erro no delete_memories:', error);
        res.status(500).json({
          error: 'Failed to delete memories',
          details: error.message
        });
      }
    });

    // Agent Conversation (novo recurso OSS)
    this.app.post('/oss/add_conversation', async (req, res) => {
      try {
        const { messages, user_id, metadata } = req.body;

        await this.ensureCollection();
        
        const id = uuidv4();
        const conversationText = messages.map((msg: any) => 
          `${msg.role}: ${msg.content}`
        ).join('\n');

        const enrichedMetadata = {
          ...metadata,
          user_id,
          type: 'conversation',
          messages_count: messages.length,
          source: 'conversational',
          created_at: new Date().toISOString()
        };

        await this.collection.add({
          ids: [id],
          documents: [conversationText],
          metadatas: [enrichedMetadata]
        });
        
        res.json({
          id,
          conversation_id: id,
          messages_count: messages.length,
          user_id,
          created_at: enrichedMetadata.created_at
        });

      } catch (error) {
        console.error('Erro no add_conversation:', error);
        res.status(500).json({
          error: 'Failed to add conversation',
          details: error.message
        });
      }
    });

    // Stats and Analytics
    this.app.get('/stats', async (req, res) => {
      try {
        await this.ensureCollection();
        
        const count = await this.collection.count();
        
        res.json({
          adapter_status: 'active',
          chroma_connected: true,
          total_memories: count,
          collection_name: 'claude_flow_memories',
          adapter_info: {
            version: '1.0.0',
            uptime: process.uptime(),
            memory_usage: process.memoryUsage()
          }
        });

      } catch (error) {
        res.json({
          adapter_status: 'active',
          chroma_connected: false,
          error: error.message
        });
      }
    });

    // Fallback
    this.app.use('*', (req, res) => {
      res.status(404).json({
        error: 'Endpoint not found',
        available_endpoints: [
          'POST /mcp/add_memory',
          'POST /mcp/search_memory', 
          'GET /mcp/list_memories/:user_id',
          'DELETE /mcp/delete_memories',
          'POST /oss/add_conversation',
          'GET /stats',
          'GET /health'
        ]
      });
    });
  }

  async start(): Promise<void> {
    return new Promise((resolve) => {
      this.app.listen(this.port, () => {
        console.log(`\n🔗 Chroma Memory Adapter iniciado!`);
        console.log(`📡 Porta: ${this.port}`);
        console.log(`🗄️ Collection: claude_flow_memories`);
        console.log(`📋 Endpoints MCP: /mcp/*`);
        console.log(`✨ Recursos OSS: /oss/*`);
        console.log(`💚 Health: http://localhost:${this.port}/health\n`);
        resolve();
      });
    });
  }

  async stop(): Promise<void> {
    console.log('🛑 Parando Chroma Memory Adapter...');
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  const chromaUrl = process.env.CHROMA_URL || 'http://chroma-db:8000';
  const port = parseInt(process.env.MCP_BRIDGE_PORT || '3002');
  
  const adapter = new ChromaMemoryAdapter(chromaUrl, port);
  
  adapter.start().catch(error => {
    console.error('❌ Erro ao iniciar adapter:', error);
    process.exit(1);
  });

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    await adapter.stop();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    await adapter.stop();
    process.exit(0);
  });
}