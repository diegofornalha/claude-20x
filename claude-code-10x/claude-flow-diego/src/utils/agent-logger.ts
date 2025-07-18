/**
 * Helper para logging de agentes sem dependência circular
 */

import { AgentType } from '../core/agent-types';

// Interface simples para evitar importar o agent-log completo
interface LogFunction {
  start: (agentName: string, agentType: AgentType, taskId: string, description: string, metadata?: any) => Promise<void>;
  end: (agentName: string, taskId: string, status: 'completed' | 'error', error?: string, metadata?: any) => Promise<void>;
}

// Será inicializado depois que o agent-log estiver pronto
let logAgent: LogFunction | null = null;

export function setLogAgent(logger: LogFunction) {
  logAgent = logger;
}

export async function logStart(agentName: string, agentType: AgentType, taskId: string, description: string, metadata?: any) {
  if (logAgent) {
    try {
      await logAgent.start(agentName, agentType, taskId, description, metadata);
    } catch (error) {
      console.warn('⚠️ Erro ao registrar início no AgentLog:', error);
    }
  }
}

export async function logEnd(agentName: string, taskId: string, status: 'completed' | 'error', error?: string, metadata?: any) {
  if (logAgent) {
    try {
      await logAgent.end(agentName, taskId, status, error, metadata);
    } catch (error) {
      console.warn('⚠️ Erro ao registrar fim no AgentLog:', error);
    }
  }
}