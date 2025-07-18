/**
 * Ponte de comunicação entre Claude Flow e DiegoTools MCP
 * Usa Mem0 como Memory Manager nativo
 */

import { spawn, ChildProcess } from 'child_process';
import { EventEmitter } from 'events';
import { MCP_CONFIG, MCP_TOOLS } from './mcp-integration';

interface MCPMessage {
  jsonrpc: '2.0';
  id?: string | number;
  method?: string;
  params?: any;
  result?: any;
  error?: any;
}

export class MCPBridge extends EventEmitter {
  private process: ChildProcess | null = null;
  private messageId = 0;
  private pendingRequests = new Map<string | number, {
    resolve: (value: any) => void;
    reject: (error: any) => void;
  }>();

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.process = spawn(MCP_CONFIG.DiegoTools.path, [], {
        env: { ...process.env, ...MCP_CONFIG.DiegoTools.env },
        stdio: ['pipe', 'pipe', 'pipe']
      });

      this.process.stdout?.on('data', (data) => {
        this.handleMessage(data.toString());
      });

      this.process.stderr?.on('data', (data) => {
        console.error('MCP Error:', data.toString());
      });

      this.process.on('error', (error) => {
        reject(error);
      });

      this.process.on('close', (code) => {
        console.log(`MCP process exited with code ${code}`);
      });

      // Aguardar inicialização
      setTimeout(() => resolve(), 1000);
    });
  }

  async callTool(toolName: string, params: any): Promise<any> {
    const id = ++this.messageId;
    
    const message: MCPMessage = {
      jsonrpc: '2.0',
      id,
      method: 'tools/call',
      params: {
        name: toolName,
        arguments: params
      }
    };

    return new Promise((resolve, reject) => {
      this.pendingRequests.set(id, { resolve, reject });
      this.sendMessage(message);
      
      // Timeout de 30 segundos
      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          reject(new Error(`Timeout calling tool: ${toolName}`));
        }
      }, 30000);
    });
  }

  // Métodos específicos para Mem0 (Memory Manager)
  async addMemory(userId: string, content: string, metadata?: any): Promise<any> {
    return this.callTool(MCP_TOOLS.MEMORY_ADD, {
      user_id: userId,
      content,
      metadata,
      category: metadata?.category || 'general'
    });
  }

  async searchMemory(userId: string, query: string, limit = 10): Promise<any> {
    return this.callTool(MCP_TOOLS.MEMORY_SEARCH, {
      user_id: userId,
      query,
      limit
    });
  }

  async listMemories(userId: string, limit = 50): Promise<any> {
    return this.callTool(MCP_TOOLS.MEMORY_LIST, {
      user_id: userId,
      limit
    });
  }

  async deleteMemory(userId: string, memoryId?: string): Promise<any> {
    return this.callTool(MCP_TOOLS.MEMORY_DELETE, {
      user_id: userId,
      memory_id: memoryId
    });
  }

  // Método genérico para executar qualquer ferramenta
  async executeTool(toolName: string, args: any = {}): Promise<any> {
    return this.callTool(toolName, args);
  }

  // Métodos para outras ferramentas
  async navigate(url: string): Promise<any> {
    return this.callTool(MCP_TOOLS.WEB_NAVIGATE, { url });
  }

  async screenshot(path: string, fullPage = false): Promise<any> {
    return this.callTool(MCP_TOOLS.WEB_SCREENSHOT, { path, fullPage });
  }

  async createGithubIssue(owner: string, repo: string, title: string, body?: string): Promise<any> {
    return this.callTool(MCP_TOOLS.GITHUB_CREATE_ISSUE, {
      owner,
      repo,
      title,
      body
    });
  }

  async gitStatus(detailed = false): Promise<any> {
    return this.callTool(MCP_TOOLS.GIT_STATUS, { detailed });
  }

  private sendMessage(message: MCPMessage): void {
    if (!this.process?.stdin) {
      throw new Error('MCP process not connected');
    }
    
    const data = JSON.stringify(message) + '\n';
    this.process.stdin.write(data);
  }

  private handleMessage(data: string): void {
    try {
      const lines = data.trim().split('\n');
      for (const line of lines) {
        if (line) {
          const message: MCPMessage = JSON.parse(line);
          
          if (message.id && this.pendingRequests.has(message.id)) {
            const { resolve, reject } = this.pendingRequests.get(message.id)!;
            this.pendingRequests.delete(message.id);
            
            if (message.error) {
              reject(new Error(message.error.message));
            } else {
              resolve(message.result);
            }
          }
          
          // Emitir eventos para mensagens não solicitadas
          if (message.method) {
            this.emit(message.method, message.params);
          }
        }
      }
    } catch (error) {
      console.error('Error parsing MCP message:', error);
    }
  }

  disconnect(): void {
    if (this.process) {
      this.process.kill();
      this.process = null;
    }
  }
}