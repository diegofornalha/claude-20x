/**
 * Agent Log Conversational - Sistema OSS com formato de conversa estruturada
 * 
 * Nova versão que usa o bridge OSS para armazenar logs como conversas estruturadas,
 * permitindo análise de padrões de comportamento e interações entre agentes.
 */

import { BaseAgent, AgentType } from '../core/base-agent';
import { GuardianMemoryManagerOSS } from '../utils/guardian-memory-oss';
import express from 'express';
import cors from 'cors';

interface ConversationalMessage {
  role: 'system' | 'agent' | 'task' | 'result' | 'error' | 'context';
  content: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

interface AgentConversation {
  agentName: string;
  agentType: AgentType;
  taskId: string;
  startTime: Date;
  endTime?: Date;
  messages: ConversationalMessage[];
  status: 'in_progress' | 'completed' | 'error';
  metadata?: Record<string, any>;
}

interface ConversationalStats {
  totalConversations: number;
  avgMessagesPerConversation: number;
  mostActiveAgent: string;
  commonPatterns: string[];
  errorPatterns: string[];
}

export class AgentLogConversational {
  private memory: GuardianMemoryManagerOSS;
  private activeConversations: Map<string, AgentConversation> = new Map();
  private app?: express.Application;

  constructor(bridgeUrl: string = 'http://localhost:3002') {
    this.memory = new GuardianMemoryManagerOSS(bridgeUrl);
  }

  /**
   * Inicia uma nova conversa de agente
   */
  async startConversation(
    agentName: string,
    agentType: AgentType,
    taskId: string,
    taskDescription: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    const conversation: AgentConversation = {
      agentName,
      agentType,
      taskId,
      startTime: new Date(),
      messages: [
        {
          role: 'system',
          content: `Iniciando execução do agente ${agentName}`,
          timestamp: new Date().toISOString(),
          metadata: { agentType, action: 'start' }
        },
        {
          role: 'task',
          content: taskDescription,
          timestamp: new Date().toISOString(),
          metadata: { taskId, complexity: metadata?.complexity }
        }
      ],
      status: 'in_progress',
      metadata: {
        ...metadata,
        conversational_format: true,
        oss_bridge: true
      }
    };

    this.activeConversations.set(taskId, conversation);

    // Registrar interação no bridge OSS
    await this.memory.recordAgentInteraction(
      agentName,
      taskId,
      'start',
      taskDescription,
      metadata
    );

    console.log(`💬 Conversa iniciada: ${agentName} → ${taskId}`);
  }

  /**
   * Adiciona mensagem à conversa ativa
   */
  async addMessage(
    taskId: string,
    role: ConversationalMessage['role'],
    content: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    const conversation = this.activeConversations.get(taskId);
    if (!conversation) {
      console.warn(`⚠️ Conversa não encontrada: ${taskId}`);
      return;
    }

    const message: ConversationalMessage = {
      role,
      content,
      timestamp: new Date().toISOString(),
      metadata
    };

    conversation.messages.push(message);
    console.log(`💬 Mensagem adicionada: ${role} → ${content.substring(0, 50)}...`);
  }

  /**
   * Adiciona contexto sobre o progresso da tarefa
   */
  async addProgress(
    taskId: string,
    progressDescription: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.addMessage(taskId, 'agent', `Progresso: ${progressDescription}`, metadata);
    
    // Registrar progresso no bridge
    const conversation = this.activeConversations.get(taskId);
    if (conversation) {
      await this.memory.recordAgentInteraction(
        conversation.agentName,
        taskId,
        'progress',
        progressDescription,
        metadata
      );
    }
  }

  /**
   * Adiciona informação contextual
   */
  async addContext(
    taskId: string,
    contextInfo: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.addMessage(taskId, 'context', contextInfo, metadata);
  }

  /**
   * Finaliza conversa com sucesso
   */
  async completeConversation(
    taskId: string,
    result?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    const conversation = this.activeConversations.get(taskId);
    if (!conversation) {
      console.warn(`⚠️ Conversa não encontrada para completar: ${taskId}`);
      return;
    }

    conversation.endTime = new Date();
    conversation.status = 'completed';

    // Adicionar mensagem de resultado
    if (result) {
      await this.addMessage(taskId, 'result', result, metadata);
    }

    // Mensagem de finalização
    await this.addMessage(taskId, 'system', `Execução completada com sucesso`, {
      duration: conversation.endTime.getTime() - conversation.startTime.getTime(),
      totalMessages: conversation.messages.length,
      status: 'completed'
    });

    // Salvar conversa completa no bridge OSS
    await this.memory.addConversation(conversation.messages, {
      agentName: conversation.agentName,
      agentType: conversation.agentType,
      taskId,
      duration: conversation.endTime.getTime() - conversation.startTime.getTime(),
      totalMessages: conversation.messages.length,
      status: 'completed'
    });

    // Registrar finalização
    await this.memory.recordAgentInteraction(
      conversation.agentName,
      taskId,
      'complete',
      result || 'Tarefa completada',
      metadata
    );

    // Limpar da memória ativa
    this.activeConversations.delete(taskId);
    
    console.log(`✅ Conversa completada: ${conversation.agentName} → ${taskId}`);
  }

  /**
   * Finaliza conversa com erro
   */
  async errorConversation(
    taskId: string,
    error: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    const conversation = this.activeConversations.get(taskId);
    if (!conversation) {
      console.warn(`⚠️ Conversa não encontrada para erro: ${taskId}`);
      return;
    }

    conversation.endTime = new Date();
    conversation.status = 'error';

    // Adicionar mensagem de erro
    await this.addMessage(taskId, 'error', error, metadata);

    // Mensagem de finalização com erro
    await this.addMessage(taskId, 'system', `Execução falhou: ${error}`, {
      duration: conversation.endTime.getTime() - conversation.startTime.getTime(),
      totalMessages: conversation.messages.length,
      status: 'error'
    });

    // Salvar conversa com erro
    await this.memory.addConversation(conversation.messages, {
      agentName: conversation.agentName,
      agentType: conversation.agentType,
      taskId,
      duration: conversation.endTime.getTime() - conversation.startTime.getTime(),
      totalMessages: conversation.messages.length,
      status: 'error',
      error
    });

    // Registrar erro
    await this.memory.recordAgentInteraction(
      conversation.agentName,
      taskId,
      'error',
      error,
      metadata
    );

    this.activeConversations.delete(taskId);
    
    console.log(`❌ Conversa com erro: ${conversation.agentName} → ${taskId}`);
  }

  /**
   * Obtém estatísticas conversacionais
   */
  async getConversationalStats(): Promise<ConversationalStats | null> {
    try {
      const stats = await this.memory.getMemoryStats();
      if (!stats) return null;

      // Análise básica - em uma implementação real, faria queries específicas
      return {
        totalConversations: stats.total_memories || 0,
        avgMessagesPerConversation: 5.2, // Placeholder
        mostActiveAgent: 'Universal Organization Guardian',
        commonPatterns: [
          'Análise de organização → Correções → Verificação',
          'Início → Progresso → Resultado → Finalização'
        ],
        errorPatterns: [
          'Falha de permissão → Retry → Sucesso',
          'Timeout → Fragmentação → Retry'
        ]
      };
    } catch (error) {
      console.error('❌ Erro ao obter estatísticas conversacionais:', error);
      return null;
    }
  }

  /**
   * Busca conversas por padrões
   */
  async searchConversationPatterns(pattern: string): Promise<any[]> {
    return await this.memory.searchMemories(`conversa ${pattern}`, 10);
  }

  /**
   * Inicia API REST opcional
   */
  async startAPI(port: number = 3004): Promise<void> {
    this.app = express();
    this.app.use(cors());
    this.app.use(express.json());

    // Health check
    this.app.get('/health', async (req, res) => {
      const bridgeHealth = await this.memory.checkBridgeHealth();
      res.json({
        status: bridgeHealth.healthy ? 'healthy' : 'degraded',
        service: 'agent-log-conversational',
        bridge_status: bridgeHealth.healthy,
        active_conversations: this.activeConversations.size,
        timestamp: new Date().toISOString()
      });
    });

    // Estatísticas conversacionais
    this.app.get('/stats/conversational', async (req, res) => {
      const stats = await this.getConversationalStats();
      res.json(stats);
    });

    // Buscar padrões
    this.app.get('/search/patterns', async (req, res) => {
      const { pattern } = req.query;
      if (!pattern) {
        return res.status(400).json({ error: 'Pattern parameter required' });
      }
      
      const results = await this.searchConversationPatterns(pattern as string);
      res.json(results);
    });

    // Conversas ativas
    this.app.get('/conversations/active', (req, res) => {
      const active = Array.from(this.activeConversations.values()).map(conv => ({
        agentName: conv.agentName,
        taskId: conv.taskId,
        startTime: conv.startTime,
        messageCount: conv.messages.length,
        status: conv.status
      }));
      res.json(active);
    });

    // Bridge stats proxy
    this.app.get('/stats/bridge', async (req, res) => {
      const stats = await this.memory.getMemoryStats();
      res.json(stats);
    });

    this.app.listen(port, () => {
      console.log(`\n💬 Agent Log Conversational API iniciada!`);
      console.log(`📡 Porta: ${port}`);
      console.log(`🔗 Bridge OSS conectado`);
      console.log(`📊 Endpoints: /health, /stats/conversational, /search/patterns`);
      console.log(`💚 Health: http://localhost:${port}/health\n`);
    });
  }
}

// Singleton instance para compatibilidade
export const conversationalLog = new AgentLogConversational();

// Funções de conveniência para compatibilidade com AgentLog original
export async function startConversationalLog(
  agentName: string,
  agentType: AgentType,
  taskId: string,
  taskDescription: string,
  metadata?: Record<string, any>
): Promise<void> {
  return await conversationalLog.startConversation(agentName, agentType, taskId, taskDescription, metadata);
}

export async function completeConversationalLog(
  taskId: string,
  result?: string,
  metadata?: Record<string, any>
): Promise<void> {
  return await conversationalLog.completeConversation(taskId, result, metadata);
}

export async function errorConversationalLog(
  taskId: string,
  error: string,
  metadata?: Record<string, any>
): Promise<void> {
  return await conversationalLog.errorConversation(taskId, error, metadata);
}

export async function addProgress(
  taskId: string,
  progressDescription: string,
  metadata?: Record<string, any>
): Promise<void> {
  return await conversationalLog.addProgress(taskId, progressDescription, metadata);
}

// Executar API se chamado diretamente
if (require.main === module) {
  const port = parseInt(process.env.AGENT_LOG_API_PORT || '3004');
  
  conversationalLog.startAPI(port).catch(error => {
    console.error('❌ Erro ao iniciar Agent Log Conversational API:', error);
    process.exit(1);
  });
}