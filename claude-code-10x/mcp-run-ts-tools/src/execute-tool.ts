#!/usr/bin/env node
/**
 * Execute Tool - Script para executar ferramentas MCP diretamente
 */

import * as dotenv from 'dotenv';
import { 
  handleNavigate,
  handleScreenshot,
  handleClick,
  handleType 
} from './tools/puppeteer/index.js';

import { 
  handleOpenUrl 
} from './tools/browser/index.js';

import { 
  handleListAgents,
  handleGetAgentDetails,
  handleAnalyzeAgent,
  handleSearchAgents 
} from './tools/agents/index.js';

// Carregar variáveis de ambiente
dotenv.config();

interface ToolExecutionRequest {
  tool: string;
  params: any;
}

async function executeTool(request: ToolExecutionRequest) {
  try {
    let result;
    
    switch (request.tool) {
      case 'mem0_add_memory':
        result = await handleAddMemory(request.params);
        break;
      case 'mem0_search_memory':
        result = await handleSearchMemory(request.params);
        break;
      case 'mem0_list_memories':
        result = await handleListMemories(request.params);
        break;
      case 'mem0_delete_memories':
        result = await handleDeleteMemories(request.params);
        break;
      default:
        throw new Error(`Ferramenta não encontrada: ${request.tool}`);
    }
    
    // Retornar resultado como JSON
    console.log(JSON.stringify({
      success: true,
      data: result
    }));
  } catch (error: any) {
    console.error(JSON.stringify({
      success: false,
      error: error.message || 'Erro desconhecido'
    }));
    process.exit(1);
  }
}

// Executar se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  const input = process.argv[2];
  
  if (!input) {
    console.error('Uso: execute-tool \'{"tool": "nome_da_ferramenta", "params": {...}}\'');
    process.exit(1);
  }
  
  try {
    const request = JSON.parse(input);
    executeTool(request);
  } catch (error) {
    console.error('Erro ao parsear entrada:', error);
    process.exit(1);
  }
}