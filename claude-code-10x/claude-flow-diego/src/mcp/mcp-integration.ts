/**
 * Configuração de integração com DiegoTools MCP
 * Memory Manager = Mem0 MCP (não precisa de implementação local)
 */

import path from 'path';

export const MCP_CONFIG = {
  DiegoTools: {
    path: path.resolve(__dirname, '../../../mcp-run-ts-tools/run.sh'),
    transport: 'stdio',
    env: {
      GITHUB_TOKEN: process.env.GITHUB_TOKEN || '',
      MEM0_API_KEY: process.env.MEM0_API_KEY || '',
      MEM0_BASE_URL: process.env.MEM0_BASE_URL || 'https://api.mem0.ai'
    }
  }
};

// Mapeamento de ferramentas MCP disponíveis
export const MCP_TOOLS = {
  // Puppeteer
  WEB_NAVIGATE: 'puppeteer_navigate',
  WEB_SCREENSHOT: 'puppeteer_screenshot',
  WEB_CLICK: 'puppeteer_click',
  WEB_TYPE: 'puppeteer_type',
  WEB_GET_CONTENT: 'puppeteer_get_content',
  
  // GitHub
  GITHUB_CREATE_ISSUE: 'github_create_issue',
  GITHUB_LIST_ISSUES: 'github_list_issues',
  GITHUB_CREATE_PR: 'github_create_pr',
  GITHUB_CREATE_REPO: 'github_create_repo',
  GITHUB_PUSH_FILES: 'github_push_files',
  GITHUB_COMMIT: 'github_commit',
  
  // Git
  GIT_STATUS: 'git_status',
  GIT_COMMIT: 'git_commit',
  GIT_PUSH: 'git_push',
  GIT_PULL: 'git_pull',
  
  // Mem0 - NOSSO MEMORY MANAGER!
  MEMORY_ADD: 'mem0_add_memory',
  MEMORY_SEARCH: 'mem0_search_memory',
  MEMORY_LIST: 'mem0_list_memories',
  MEMORY_DELETE: 'mem0_delete_memories'
};

// Agrupamento de ferramentas por categoria
export const TOOL_GROUPS = {
  web: [
    MCP_TOOLS.WEB_NAVIGATE,
    MCP_TOOLS.WEB_SCREENSHOT,
    MCP_TOOLS.WEB_CLICK,
    MCP_TOOLS.WEB_TYPE,
    MCP_TOOLS.WEB_GET_CONTENT
  ],
  github: [
    MCP_TOOLS.GITHUB_CREATE_ISSUE,
    MCP_TOOLS.GITHUB_LIST_ISSUES,
    MCP_TOOLS.GITHUB_CREATE_PR,
    MCP_TOOLS.GITHUB_CREATE_REPO,
    MCP_TOOLS.GITHUB_PUSH_FILES
  ],
  git: [
    MCP_TOOLS.GIT_STATUS,
    MCP_TOOLS.GIT_COMMIT,
    MCP_TOOLS.GIT_PUSH,
    MCP_TOOLS.GIT_PULL
  ],
  memory: [
    MCP_TOOLS.MEMORY_ADD,
    MCP_TOOLS.MEMORY_SEARCH,
    MCP_TOOLS.MEMORY_LIST,
    MCP_TOOLS.MEMORY_DELETE
  ]
};