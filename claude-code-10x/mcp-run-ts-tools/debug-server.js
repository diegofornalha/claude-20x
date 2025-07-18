#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

const server = new Server(
  {
    name: 'debug-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'debug_tool',
      description: 'Ferramenta de debug',
      inputSchema: {
        type: 'object',
        properties: {
          message: {
            type: 'string',
            description: 'Mensagem',
          },
        },
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  
  console.error('[DEBUG-SERVER] Tool called:', name);
  console.error('[DEBUG-SERVER] Args:', JSON.stringify(args));
  
  if (name === 'debug_tool') {
    const response = {
      content: [
        {
          type: 'text',
          text: `Debug tool executed! Args: ${JSON.stringify(args)}`,
        },
      ],
    };
    
    console.error('[DEBUG-SERVER] Returning:', JSON.stringify(response));
    return response;
  }
  
  throw new Error(`Tool not found: ${name}`);
});

async function main() {
  console.error('Starting debug server...');
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Debug server running');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});