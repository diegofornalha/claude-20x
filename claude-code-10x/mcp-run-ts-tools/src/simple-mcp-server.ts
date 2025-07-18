#!/usr/bin/env node
/**
 * Servidor MCP Simples para Debug
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  ListToolsRequestSchema,
  CallToolRequestSchema
} from '@modelcontextprotocol/sdk/types.js';

const server = new Server(
  {
    name: 'simple-mem0-test',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Lista de ferramentas
const tools = [
  {
    name: 'test_memory',
    description: 'Ferramenta de teste simples',
    inputSchema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          description: 'Mensagem de teste'
        }
      },
      required: []
    }
  }
];

// Handler para listar ferramentas
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools };
});

// Handler para executar ferramentas
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  
  console.error(`[DEBUG] Ferramenta chamada: ${name}`);
  console.error(`[DEBUG] Argumentos:`, args);
  
  if (name === 'test_memory') {
    // Retornar exatamente o que o MCP espera
    const result = {
      content: [
        {
          type: 'text',
          text: 'Teste executado com sucesso!'
        }
      ]
    };
    
    console.error(`[DEBUG] Retornando:`, JSON.stringify(result));
    
    return { toolResult: result };
  }
  
  throw new Error(`Ferramenta não encontrada: ${name}`);
});

// Iniciar servidor
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('[simple-mem0-test] Servidor iniciado');
}

main().catch((error) => {
  console.error('Erro:', error);
  process.exit(1);
});