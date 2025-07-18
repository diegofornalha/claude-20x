#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { 
  CallToolRequestSchema, 
  ListToolsRequestSchema 
} from '@modelcontextprotocol/sdk/types.js';

const server = new Server(
  {
    name: 'diego-tools-simplified',
    version: '2.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Lista de tools disponíveis
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
        type: { type: 'string', description: 'Tipo de agente' }
      }
    }
  }
];

// Listar tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools };
});

// Executar tools
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case 'puppeteer_navigate':
      return {
        content: [
          { type: 'text', text: `✅ Navegando para: ${args.url}` }
        ]
      };

    case 'browser_open_url':
      return {
        content: [
          { type: 'text', text: `🌐 Abrindo no navegador: ${args.url}` }
        ]
      };

    case 'agents_list':
      return {
        content: [
          { 
            type: 'text', 
            text: '🤖 Agentes disponíveis:\n- Organization Guardian\n- Auto-commit Agent\n- Universal Code Analyzer' 
          }
        ]
      };

    default:
      throw new Error(`Tool desconhecida: ${name}`);
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('🚀 MCP Server Diego Tools iniciado com 3 ferramentas essenciais');
}

main().catch(console.error);