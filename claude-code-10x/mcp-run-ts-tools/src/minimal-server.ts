#!/usr/bin/env node

/**
 * MCP Server Minimal com 3 Tools: Agents, Browser e Puppeteer
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import * as dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

// Definições básicas das tools
const tools = [
  {
    name: 'puppeteer_navigate',
    description: 'Navegar para uma URL usando Puppeteer',
    inputSchema: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'URL para navegar' }
      },
      required: ['url']
    }
  },
  {
    name: 'puppeteer_screenshot',
    description: 'Tirar screenshot da página atual',
    inputSchema: {
      type: 'object', 
      properties: {
        path: { type: 'string', description: 'Caminho para salvar o screenshot' },
        fullPage: { type: 'boolean', description: 'Screenshot da página inteira' }
      },
      required: ['path']
    }
  },
  {
    name: 'browser_open_url',
    description: 'Abrir URL no navegador padrão',
    inputSchema: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'URL para abrir' }
      },
      required: ['url']
    }
  },
  {
    name: 'agents_list',
    description: 'Listar agentes disponíveis',
    inputSchema: {
      type: 'object',
      properties: {
        type: { type: 'string', description: 'Tipo de agente para filtrar' }
      }
    }
  }
];

// Criar servidor MCP
const server = new Server(
  {
    name: 'diego-tools-mcp-minimal',
    version: '2.0.0',
  },
  {
    capabilities: {
      tools: {}
    }
  }
);

// Handler para listar tools
server.setRequestHandler('tools/list', async () => {
  return { tools };
});

// Handler para executar tools
server.setRequestHandler('tools/call', async (request) => {
  const { name, arguments: args } = request.params;
  
  console.error(`🔧 Executando tool: ${name}`, args);
  
  // Implementações básicas para teste
  switch (name) {
    case 'puppeteer_navigate':
      return {
        content: [
          { type: 'text', text: `Navegando para: ${args.url}` }
        ]
      };
      
    case 'puppeteer_screenshot':
      return {
        content: [
          { type: 'text', text: `Screenshot salvo em: ${args.path}` }
        ]
      };
      
    case 'browser_open_url':
      return {
        content: [
          { type: 'text', text: `Abrindo no navegador: ${args.url}` }
        ]
      };
      
    case 'agents_list':
      return {
        content: [
          { 
            type: 'text', 
            text: 'Agentes disponíveis:\n- Organization Guardian\n- Auto-commit Agent\n- Code Analyzer' 
          }
        ]
      };
      
    default:
      return {
        content: [
          { type: 'text', text: `Tool não encontrada: ${name}` }
        ],
        isError: true
      };
  }
});

// Iniciar servidor
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('🚀 MCP Server Minimal iniciado com 3 tools essenciais');
}

main().catch(console.error);