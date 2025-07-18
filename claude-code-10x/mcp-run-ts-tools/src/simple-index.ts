#!/usr/bin/env node

/**
 * MCP Server Simplificado com 3 Tools: Agents, Browser e Puppeteer
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import * as dotenv from 'dotenv';

// Importar apenas as 3 tools mantidas
import { puppeteerTools } from './tools/puppeteer/index.js';
import { browserTools } from './tools/browser/index.js';
import { agentsTools } from './tools/agents/index.js';

// Carregar variáveis de ambiente
dotenv.config();

// Combinar todas as tools
const allTools = [
  ...puppeteerTools,
  ...browserTools,
  ...agentsTools
];

// Criar servidor MCP
const server = new Server(
  {
    name: 'diego-tools-mcp-simplified',
    version: '2.0.0',
  },
  {
    capabilities: {
      tools: {}
    }
  }
);

// Registrar todas as tools
allTools.forEach(tool => {
  server.setRequestHandler('tools/call', async (request) => {
    const { name, arguments: args } = request.params;
    
    if (tool.name === name) {
      try {
        const result = await tool.handler(args || {});
        return result;
      } catch (error) {
        console.error(`Erro ao executar tool ${name}:`, error);
        return {
          success: false,
          error: error.message || 'Erro desconhecido',
          content: [{ type: 'text', text: `Erro: ${error.message}` }]
        };
      }
    }
  });
});

// Listar tools disponíveis
server.setRequestHandler('tools/list', async () => {
  return {
    tools: allTools.map(tool => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema
    }))
  };
});

// Iniciar servidor
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('🚀 MCP Server Simplificado iniciado com 3 tools: agents, browser e puppeteer');
}

main().catch(console.error);