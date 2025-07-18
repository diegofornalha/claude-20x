/**
 * ⚠️ DEPRECATED: Templates de Agentes (MCP Legacy)
 * 
 * Este arquivo está DEPRECIADO. Use o novo sistema A2A:
 * → ./a2a-template-agents.ts
 * 
 * Templates de referência para criação de novos agentes
 * Use estes templates como base para criar agentes especializados
 */

import { createMCPAgent } from '../mcp/mcp-templates';
import { AgentType } from '../core/base-agent';
import { MCP_TOOLS } from '../mcp/mcp-integration';

export const templateAgents = {
  /**
   * 📝 Agent Log - Sistema de Logging de Agentes
   * Registra todas as execuções de agentes para rastreamento e análise
   */
  agentLog: createMCPAgent(
    'Agent Log',
    AgentType.ANALYST,
    [
      MCP_TOOLS.MEMORY_ADD,        // Registrar logs
      MCP_TOOLS.MEMORY_SEARCH,     // Buscar histórico
      MCP_TOOLS.MEMORY_LIST        // Listar todos os logs
    ],
    'sequential'
  )
};

/**
 * Agentes Especializados já existentes no projeto:
 * 
 * ORGANIZAÇÃO:
 * - Universal Organization Guardian - Mantém código organizado
 * - Source Code Organizer Agent - Organiza estrutura de arquivos
 * 
 * AUTOMAÇÃO:
 * - Auto Commit Agent - Commits automáticos com padrões
 * - Auto Push Agent - Push automático para repositório
 * 
 * ANÁLISE:
 * - Guardian Agent Analyzer - Analisa performance de agentes
 * - Task Timer Agent - Monitora tempo de execução
 * - Agent Log - Sistema de logging centralizado
 * 
 * MELHORIA:
 * - Autonomous Improvement Agent - Melhora código autonomamente
 * 
 * Use os agentes especializados acima ao invés de criar duplicações
 */