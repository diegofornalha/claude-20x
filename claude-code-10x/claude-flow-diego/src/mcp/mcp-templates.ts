/**
 * Templates de agentes que usam apenas ferramentas MCP
 * Sem dependência de Claude API ou respostas simuladas
 */

import { MCPDirectAgentConfig } from '../agents/mcp-direct-agent';
import { AgentType } from '../core/base-agent-with-logging';
import { MCP_TOOLS, TOOL_GROUPS } from './mcp-integration';

export const mcpAgentTemplates = {
  /**
   * Navegador Web - Usa Puppeteer para automação web
   */
  webNavigator: {
    name: 'Navegador Web',
    type: AgentType.RESEARCHER,
    description: 'Navega em sites e captura informações',
    tools: [
      MCP_TOOLS.WEB_NAVIGATE,
      MCP_TOOLS.WEB_SCREENSHOT,
      MCP_TOOLS.WEB_CLICK,
      MCP_TOOLS.WEB_GET_CONTENT,
      MCP_TOOLS.MEMORY_ADD
    ],
    executeStrategy: 'sequential'
  } as MCPDirectAgentConfig,

  /**
   * Gerenciador Git - Controle de versão
   */
  gitManager: {
    name: 'Gerenciador Git',
    type: AgentType.IMPLEMENTER,
    description: 'Executa operações Git',
    tools: [
      MCP_TOOLS.GIT_STATUS,
      MCP_TOOLS.GIT_COMMIT,
      MCP_TOOLS.GIT_PUSH,
      MCP_TOOLS.GIT_PULL,
      MCP_TOOLS.MEMORY_ADD
    ],
    executeStrategy: 'sequential'
  } as MCPDirectAgentConfig,

  /**
   * Gerenciador GitHub - Issues e PRs
   */
  githubManager: {
    name: 'Gerenciador GitHub',
    type: AgentType.IMPLEMENTER,
    description: 'Gerencia repositórios GitHub',
    tools: [
      MCP_TOOLS.GITHUB_CREATE_ISSUE,
      MCP_TOOLS.GITHUB_LIST_ISSUES,
      MCP_TOOLS.GITHUB_CREATE_PR,
      MCP_TOOLS.GITHUB_CREATE_REPO,
      MCP_TOOLS.MEMORY_ADD
    ],
    executeStrategy: 'parallel'
  } as MCPDirectAgentConfig,

  /**
   * Gerenciador de Memória - Mem0
   */
  memoryManager: {
    name: 'Gerenciador de Memória',
    type: AgentType.ANALYST,
    description: 'Gerencia memória persistente com Mem0',
    tools: TOOL_GROUPS.memory,
    executeStrategy: 'sequential'
  } as MCPDirectAgentConfig,

  /**
   * Agente de Automação Completa
   */
  automationAgent: {
    name: 'Agente de Automação',
    type: AgentType.COORDINATOR,
    description: 'Executa automações complexas com múltiplas ferramentas',
    tools: [
      ...TOOL_GROUPS.web,
      ...TOOL_GROUPS.git,
      ...TOOL_GROUPS.memory
    ],
    executeStrategy: 'sequential'
  } as MCPDirectAgentConfig
};

/**
 * Criar agente MCP customizado
 */
export function createMCPAgent(
  name: string,
  type: AgentType,
  tools: string[],
  executeStrategy: 'sequential' | 'parallel' = 'sequential'
): MCPDirectAgentConfig {
  return {
    name,
    type,
    description: `Agente customizado: ${name}`,
    tools,
    executeStrategy
  };
}