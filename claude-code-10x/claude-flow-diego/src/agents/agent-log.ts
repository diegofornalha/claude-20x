/**
 * Agent Log & Analytics - Sistema Unificado de Logging, Análise e API
 * 
 * Sistema completo que inclui:
 * - Registro de execuções de agentes na memória persistente
 * - Análise de performance e estatísticas
 * - API REST opcional para acesso remoto
 * - Suporte a modo mock para desenvolvimento
 * 
 * Uso standalone: import { agentLog, logAgent } from './agent-log'
 * Uso com API: import { startAgentLogAPI } from './agent-log'
 */

import { BaseAgent, Task } from '../core/base-agent-simple';
import { AgentType } from '../core/agent-types';
import { createAgentMemory, MemoryNamespaces } from './memory-enhanced-agents';
import express from 'express';
import cors from 'cors';

interface AgentExecutionLog {
  agentName: string;
  agentType: AgentType;
  taskId: string;
  taskDescription: string;
  taskType?: string;
  complexity?: 'simple' | 'medium' | 'complex';
  startTime: Date;
  endTime?: Date;
  duration?: number;
  status: 'started' | 'completed' | 'error';
  error?: string;
  metadata?: Record<string, any>;
  gitContext?: {
    filesChanged: number;
    insertions: number;
    deletions: number;
    branch: string;
  };
}

interface AgentStats {
  totalExecutions: number;
  lastExecution: Date;
  averageDuration: number;
  minDuration: number;
  maxDuration: number;
  successRate: number;
  errorCount: number;
}

interface TaskStatistics {
  taskType: string;
  complexity: 'simple' | 'medium' | 'complex';
  averageDuration: number;
  minDuration: number;
  maxDuration: number;
  executionCount: number;
  successRate: number;
}

class AgentLog extends BaseAgent {
  private memory;
  private executionCache: Map<string, AgentExecutionLog[]> = new Map();
  private USE_MOCK = process.env.AGENT_LOG_MOCK === 'true';
  
  constructor() {
    super({
      name: 'Agent Log',
      type: AgentType.ANALYST,
      description: 'Registra e analisa execuções de agentes',
      enableLogging: false // Evitar loop infinito
    });
    
    this.memory = createAgentMemory('AgentLog');
  }
  
  /**
   * Registra o início de uma execução de agente
   */
  async logAgentStart(
    agentName: string,
    agentType: AgentType,
    taskId: string,
    taskDescription: string,
    metadata?: any
  ): Promise<void> {
    const log: AgentExecutionLog = {
      agentName,
      agentType,
      taskId,
      taskDescription,
      taskType: metadata?.taskType,
      complexity: metadata?.complexity || 'medium',
      startTime: new Date(),
      status: 'started',
      metadata
    };
    
    // Armazenar no cache local
    if (!this.executionCache.has(agentName)) {
      this.executionCache.set(agentName, []);
    }
    this.executionCache.get(agentName)!.push(log);
    
    // Persistir na memória
    await this.memory.remember(
      `${agentName} iniciou ${taskDescription}`,
      {
        category: 'execution-log',
        tags: ['start', agentName, agentType],
        ...log
      }
    );
    
    console.log(`[AgentLog] ${agentName} iniciou: ${taskDescription}`);
  }
  
  /**
   * Registra o fim de uma execução de agente
   */
  async logAgentEnd(
    agentName: string,
    taskId: string,
    status: 'completed' | 'error',
    error?: string,
    metadata?: any
  ): Promise<void> {
    const logs = this.executionCache.get(agentName) || [];
    const log = logs.find(l => l.taskId === taskId && l.status === 'started');
    
    if (!log) {
      console.warn(`[AgentLog] Nenhuma execução iniciada encontrada para ${agentName}:${taskId}`);
      return;
    }
    
    // Atualizar log
    log.endTime = new Date();
    log.duration = log.endTime.getTime() - log.startTime.getTime();
    log.status = status;
    log.error = error;
    if (metadata) {
      log.metadata = { ...log.metadata, ...metadata };
    }
    
    // Persistir conclusão
    await this.memory.remember(
      `${agentName} ${status === 'completed' ? 'completou' : 'falhou'}: ${log.taskDescription} (${log.duration}ms)`,
      {
        category: 'execution-log',
        tags: ['end', agentName, status],
        ...log
      }
    );
    
    console.log(`[AgentLog] ${agentName} ${status}: ${log.taskDescription} (${log.duration}ms)`);
  }
  
  /**
   * Obter última execução de um agente
   */
  async getLastExecution(agentName: string): Promise<AgentExecutionLog | null> {
    const results = await this.memory.recall(`${agentName} execução`);
    
    if (!results.results || results.results.length === 0) {
      return null;
    }
    
    // Ordenar por data e pegar a mais recente
    const sorted = results.results
      .filter(r => r.metadata?.agentName === agentName)
      .sort((a, b) => new Date(b.metadata.startTime).getTime() - new Date(a.metadata.startTime).getTime());
    
    return sorted[0]?.metadata || null;
  }
  
  /**
   * Obter histórico de execuções de um agente
   */
  async getAgentHistory(agentName: string, limit: number = 50): Promise<AgentExecutionLog[]> {
    try {
      const results = await this.memory.recall(`${agentName} execução`);
      
      if (!results || !results.results || !Array.isArray(results.results)) {
        // Usar cache local se a memória não funcionar
        const localHistory = this.executionCache.get(agentName) || [];
        return localHistory.slice(0, limit);
      }
      
      return results.results
        .filter(r => r.metadata?.agentName === agentName)
        .map(r => r.metadata)
        .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
        .slice(0, limit);
    } catch (error) {
      console.warn(`Erro ao obter histórico de ${agentName}:`, error);
      // Fallback para cache local
      const localHistory = this.executionCache.get(agentName) || [];
      return localHistory.slice(0, limit);
    }
  }
  
  /**
   * Obter estatísticas de um agente
   */
  async getAgentStats(agentName: string): Promise<AgentStats | null> {
    const history = await this.getAgentHistory(agentName, 1000);
    
    if (history.length === 0) {
      return null;
    }
    
    const completedExecutions = history.filter(h => h.status === 'completed' && h.duration);
    const errorCount = history.filter(h => h.status === 'error').length;
    
    const durations = completedExecutions.map(h => h.duration!);
    const averageDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
    const minDuration = Math.min(...durations);
    const maxDuration = Math.max(...durations);
    
    return {
      totalExecutions: history.length,
      lastExecution: new Date(history[0].startTime),
      averageDuration: Math.round(averageDuration),
      minDuration,
      maxDuration,
      successRate: (completedExecutions.length / history.length) * 100,
      errorCount
    };
  }
  
  /**
   * Listar todos os agentes registrados
   */
  async listAllAgents(): Promise<string[]> {
    try {
      const memories = await this.memory.listMemories(1000);
      
      const agentNames = new Set<string>();
      
      // Verificar se memories e memories.memories existem
      if (memories && memories.memories && Array.isArray(memories.memories)) {
        memories.memories.forEach(m => {
          if (m.metadata?.agentName) {
            agentNames.add(m.metadata.agentName);
          }
        });
      }
      
      // Se não há dados na memória, usar cache de execução local
      for (const [agentName] of this.executionCache) {
        agentNames.add(agentName);
      }
      
      return Array.from(agentNames).sort();
    } catch (error) {
      console.warn('Erro ao listar agentes da memória, usando cache local:', error);
      return Array.from(this.executionCache.keys()).sort();
    }
  }
  
  /**
   * Obter estatísticas por tipo de tarefa
   */
  async getTaskStatistics(taskType?: string): Promise<TaskStatistics[]> {
    try {
      const allMemories = await this.memory.listMemories(1000);
      const memories = (allMemories && allMemories.memories && Array.isArray(allMemories.memories)) 
        ? allMemories.memories 
        : [];
        
      const executions = memories
        .filter(m => m.metadata?.taskType && m.metadata?.status === 'completed' && m.metadata?.duration);
    
    const statsMap = new Map<string, TaskStatistics>();
    
    executions.forEach(exec => {
      const key = `${exec.metadata.taskType}-${exec.metadata.complexity || 'medium'}`;
      const type = exec.metadata.taskType;
      const complexity = exec.metadata.complexity || 'medium';
      
      if (taskType && type !== taskType) return;
      
      if (!statsMap.has(key)) {
        statsMap.set(key, {
          taskType: type,
          complexity,
          averageDuration: 0,
          minDuration: Infinity,
          maxDuration: 0,
          executionCount: 0,
          successRate: 0
        });
      }
      
      const stats = statsMap.get(key)!;
      stats.executionCount++;
      stats.minDuration = Math.min(stats.minDuration, exec.metadata.duration);
      stats.maxDuration = Math.max(stats.maxDuration, exec.metadata.duration);
      stats.averageDuration = ((stats.averageDuration * (stats.executionCount - 1)) + exec.metadata.duration) / stats.executionCount;
    });
    
    return Array.from(statsMap.values()).sort((a, b) => b.executionCount - a.executionCount);
    } catch (error) {
      console.warn('Erro ao obter estatísticas de tarefas:', error);
      return [];
    }
  }
  
  /**
   * Estimar duração de uma tarefa baseado no histórico
   */
  async estimateTaskDuration(taskType: string, complexity: 'simple' | 'medium' | 'complex' = 'medium'): Promise<{
    estimate: number;
    confidence: number;
    basedOnSamples: number;
  }> {
    const stats = await this.getTaskStatistics(taskType);
    const relevantStats = stats.find(s => s.taskType === taskType && s.complexity === complexity);
    
    if (!relevantStats || relevantStats.executionCount < 3) {
      // Estimativas padrão se não houver dados suficientes
      const defaultEstimates = {
        simple: 5000,
        medium: 15000,
        complex: 30000
      };
      
      return {
        estimate: defaultEstimates[complexity],
        confidence: 0.3,
        basedOnSamples: relevantStats?.executionCount || 0
      };
    }
    
    // Calcular estimativa com margem de segurança
    const estimate = Math.round(relevantStats.averageDuration * 1.2); // 20% de margem
    const confidence = Math.min(0.9, relevantStats.executionCount / 10); // Confiança máxima com 10+ amostras
    
    return {
      estimate,
      confidence,
      basedOnSamples: relevantStats.executionCount
    };
  }
  
  /**
   * Gerar relatório completo do pipeline
   */
  async generatePipelineReport(hours: number = 24): Promise<any> {
    try {
      const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);
      const allMemories = await this.memory.listMemories(1000);
      
      const memories = (allMemories && allMemories.memories && Array.isArray(allMemories.memories)) 
        ? allMemories.memories 
        : [];
      
      const recentExecutions = memories
        .filter(m => m.metadata?.startTime && new Date(m.metadata.startTime) > cutoffTime)
        .map(m => m.metadata);
    
    const agentStats = new Map<string, any>();
    const taskStats = await this.getTaskStatistics();
    
    // Coletar estatísticas por agente
    for (const agentName of await this.listAllAgents()) {
      const stats = await this.getAgentStats(agentName);
      if (stats) {
        agentStats.set(agentName, stats);
      }
    }
    
    return {
      reportGeneratedAt: new Date().toISOString(),
      period: {
        hours,
        from: cutoffTime.toISOString(),
        to: new Date().toISOString()
      },
      summary: {
        totalExecutions: recentExecutions.length,
        uniqueAgents: new Set(recentExecutions.map(e => e.agentName)).size,
        successRate: recentExecutions.length > 0 
          ? (recentExecutions.filter(e => e.status === 'completed').length / recentExecutions.length) * 100
          : 0,
        totalDuration: recentExecutions.reduce((sum, e) => sum + (e.duration || 0), 0)
      },
      agentPerformance: Array.from(agentStats.entries()).map(([name, stats]) => ({
        agentName: name,
        ...stats
      })),
      taskStatistics: taskStats,
      recentErrors: recentExecutions
        .filter(e => e.status === 'error')
        .slice(0, 10)
        .map(e => ({
          agentName: e.agentName,
          task: e.taskDescription,
          error: e.error,
          timestamp: e.startTime
        }))
    };
    } catch (error) {
      console.error('Erro ao gerar relatório do pipeline:', error);
      return {
        reportGeneratedAt: new Date().toISOString(),
        error: 'Erro ao gerar relatório',
        summary: {
          totalExecutions: 0,
          uniqueAgents: 0,
          successRate: 0,
          totalDuration: 0
        },
        agentPerformance: [],
        taskStatistics: [],
        recentErrors: []
      };
    }
  }
  
  /**
   * Publicar evento de execução
   */
  private async publishExecutionEvent(
    event: 'start' | 'end',
    agentName: string,
    status: string,
    duration?: number
  ): Promise<void> {
    await this.memory.shareWith(
      MemoryNamespaces.GLOBAL,
      `[AgentLog] ${event}: ${agentName} - ${status}${duration ? ` (${duration}ms)` : ''}`,
      {
        category: 'agent-execution-event',
        event,
        agentName,
        status,
        duration,
        timestamp: new Date().toISOString()
      }
    );
  }

  /**
   * Implementação obrigatória do BaseAgent
   */
  async executeTask(task: Task): Promise<any> {
    switch (task.type) {
      case 'generate_report':
        return await this.generatePipelineReport(task.params?.hours || 24);
      
      case 'get_agent_stats':
        return await this.getAgentStats(task.params?.agentName);
      
      case 'list_agents':
        return await this.listAllAgents();
      
      default:
        return {
          message: 'AgentLog está pronto para registrar execuções',
          availableMethods: [
            'logAgentStart',
            'logAgentEnd',
            'getLastExecution',
            'getAgentHistory',
            'getAgentStats',
            'generatePipelineReport'
          ]
        };
    }
  }
}

// Instância singleton para uso global
export const agentLog = new AgentLog();

// Helper para facilitar o uso
export const logAgent = {
  start: (agentName: string, agentType: AgentType, taskId: string, description: string, metadata?: any) =>
    agentLog.logAgentStart(agentName, agentType, taskId, description, metadata),
  
  end: (agentName: string, taskId: string, status: 'completed' | 'error', error?: string, metadata?: any) =>
    agentLog.logAgentEnd(agentName, taskId, status, error, metadata),
  
  getLastExecution: (agentName: string) =>
    agentLog.getLastExecution(agentName),
  
  getHistory: (agentName: string, limit?: number) =>
    agentLog.getAgentHistory(agentName, limit),
  
  getStats: (agentName: string) =>
    agentLog.getAgentStats(agentName),
  
  generateReport: (hours?: number) =>
    agentLog.generatePipelineReport(hours)
};

/**
 * API REST Opcional
 * Para iniciar: startAgentLogAPI(3001)
 */
export function startAgentLogAPI(port: number = 3001) {
  const app = express();
  app.use(cors());
  app.use(express.json());

  // Dados mock para desenvolvimento
  const mockData = {
    agents: ['Code Scout', 'Deploy Bot', 'Quality Analyst'],
    stats: {
      totalExecutions: 42,
      lastExecution: new Date(),
      averageDuration: 3500,
      minDuration: 1200,
      maxDuration: 8900,
      successRate: 92.5,
      errorCount: 3
    }
  };

  // Health check
  app.get('/health', (req, res) => {
    res.json({ 
      status: 'ok', 
      service: 'Agent Log API',
      mode: agentLog['USE_MOCK'] ? 'mock' : 'production',
      timestamp: new Date().toISOString() 
    });
  });

  // Estatísticas de agente
  app.get('/stats/:agentName', async (req, res) => {
    try {
      if (agentLog['USE_MOCK']) {
        return res.json({
          agentName: req.params.agentName,
          ...mockData.stats
        });
      }
      
      const stats = await agentLog.getAgentStats(req.params.agentName);
      if (!stats) {
        return res.status(404).json({ error: 'Agent not found' });
      }
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Histórico de agente
  app.get('/history/:agentName', async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      
      if (agentLog['USE_MOCK']) {
        return res.json({
          agentName: req.params.agentName,
          history: Array(5).fill(null).map((_, i) => ({
            taskId: `task-${i}`,
            taskDescription: `Tarefa exemplo ${i}`,
            startTime: new Date(Date.now() - i * 3600000),
            endTime: new Date(Date.now() - i * 3600000 + 3500),
            duration: 3500,
            status: i === 4 ? 'error' : 'completed'
          }))
        });
      }
      
      const history = await agentLog.getAgentHistory(req.params.agentName, limit);
      res.json({
        agentName: req.params.agentName,
        history,
        total: history.length
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Estatísticas por tipo de tarefa
  app.get('/task-stats/:taskType?', async (req, res) => {
    try {
      if (agentLog['USE_MOCK']) {
        return res.json({
          taskType: req.params.taskType || 'all',
          statistics: [{
            taskType: req.params.taskType || 'deployment',
            complexity: 'medium',
            averageDuration: 5500,
            minDuration: 3000,
            maxDuration: 8000,
            executionCount: 15,
            successRate: 93.3
          }]
        });
      }
      
      const stats = await agentLog.getTaskStatistics(req.params.taskType);
      res.json({
        taskType: req.params.taskType || 'all',
        statistics: stats
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Relatório do pipeline
  app.get('/pipeline-report', async (req, res) => {
    try {
      const hours = parseInt(req.query.hours as string) || 24;
      
      if (agentLog['USE_MOCK']) {
        return res.json({
          reportGeneratedAt: new Date().toISOString(),
          period: { hours, from: new Date(Date.now() - hours * 3600000), to: new Date() },
          summary: {
            totalExecutions: 42,
            uniqueAgents: 5,
            successRate: 92.5,
            totalDuration: 147000
          },
          agentPerformance: mockData.agents.map(name => ({
            agentName: name,
            ...mockData.stats
          }))
        });
      }
      
      const report = await agentLog.generatePipelineReport(hours);
      res.json(report);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Lista todos os agentes
  app.get('/agents', async (req, res) => {
    try {
      if (agentLog['USE_MOCK']) {
        return res.json({ agents: mockData.agents });
      }
      
      const agents = await agentLog.listAllAgents();
      res.json({ agents, total: agents.length });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Registrar início de execução
  app.post('/log/start', async (req, res) => {
    try {
      const { agentName, agentType, taskId, taskDescription, metadata } = req.body;
      
      if (!agentName || !agentType || !taskId || !taskDescription) {
        return res.status(400).json({ error: 'Missing required fields' });
      }
      
      await agentLog.logAgentStart(agentName, agentType, taskId, taskDescription, metadata);
      res.json({ success: true, message: 'Execution logged' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Registrar fim de execução
  app.post('/log/end', async (req, res) => {
    try {
      const { agentName, taskId, status, error, metadata } = req.body;
      
      if (!agentName || !taskId || !status) {
        return res.status(400).json({ error: 'Missing required fields' });
      }
      
      await agentLog.logAgentEnd(agentName, taskId, status, error, metadata);
      res.json({ success: true, message: 'Execution end logged' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Estimativa de duração
  app.get('/estimate/:taskType', async (req, res) => {
    try {
      const complexity = (req.query.complexity as string) || 'medium';
      
      if (agentLog['USE_MOCK']) {
        return res.json({
          taskType: req.params.taskType,
          complexity,
          estimate: 5000,
          confidence: 0.75,
          basedOnSamples: 10
        });
      }
      
      const estimate = await agentLog.estimateTaskDuration(
        req.params.taskType, 
        complexity as 'simple' | 'medium' | 'complex'
      );
      
      res.json({
        taskType: req.params.taskType,
        complexity,
        ...estimate
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  const server = app.listen(port, () => {
    console.log(`🚀 Agent Log API rodando na porta ${port}`);
    console.log(`📊 Dashboard: http://localhost:${port}/health`);
    console.log(`🔧 Modo: ${agentLog['USE_MOCK'] ? 'Mock' : 'Produção'}`);
    
    // Relatório periódico
    setInterval(async () => {
      try {
        const report = await agentLog.generatePipelineReport(1);
        console.log(`\n📊 Relatório Periódico (última hora):`);
        console.log(`   Total de execuções: ${report.summary.totalExecutions}`);
        console.log(`   Taxa de sucesso: ${report.summary.successRate.toFixed(1)}%`);
        console.log(`   Agentes ativos: ${report.summary.uniqueAgents}`);
      } catch (error) {
        console.error('Erro ao gerar relatório periódico:', error);
      }
    }, 300000); // A cada 5 minutos
  });

  return server;
}

// Configurar o logger helper
import { setLogAgent } from '../utils/agent-logger';
setLogAgent(logAgent);

// Auto-start da API se configurado
if (process.env.AGENT_LOG_API_PORT) {
  startAgentLogAPI(parseInt(process.env.AGENT_LOG_API_PORT));
}