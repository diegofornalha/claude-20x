#!/usr/bin/env node
/**
 * DiegoTools MCP Server - Versão Refatorada
 * 
 * Servidor simplificado que delega todas as operações para módulos específicos
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  ListToolsRequestSchema,
  CallToolRequestSchema
} from '@modelcontextprotocol/sdk/types.js';

// Importar todas as ferramentas e handlers dos módulos
import { 
  allTools, 
  toolHandlers,
  startBrowserCleanup 
} from './tools/index.js';

// Importar sistema de logging
import { logger, replaceConsoleWithLogger } from './utils/logger.js';

// Importar configuração centralizada
import { serverConfig, validateRequiredConfig } from './config/index.js';

// Carregar variáveis de ambiente (já feito em config)
// dotenv.config();

// Substituir console por logger estruturado
replaceConsoleWithLogger();

// Criar instância do servidor
const server = new Server(
  {
    name: serverConfig.name,
    version: serverConfig.version,
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

/**
 * Handler para listar todas as ferramentas disponíveis
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  // Simplesmente retorna todas as ferramentas importadas
  return { tools: allTools };
});

/**
 * Handler para executar ferramentas
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  
  // Buscar handler da ferramenta
  const handler = toolHandlers[name as keyof typeof toolHandlers];
  
  if (!handler) {
    throw new Error(`Ferramenta não encontrada: ${name}`);
  }
  
  try {
    // Log da execução
    const toolLogger = logger.forTool(name);
    toolLogger.info('Executando ferramenta', args);
    
    // Executar handler da ferramenta (cast para any devido aos tipos diferentes)
    const result = await (handler as any)(args || {});
    
    toolLogger.debug('Ferramenta executada com sucesso');
    
    // Retornar resultado
    // O MCP espera que toolResult contenha diretamente o campo content
    toolLogger.debug('Resultado da ferramenta:', result);
    
    // Log detalhado para debug
    console.error(`[DEBUG] Tool ${name} result:`, JSON.stringify(result));
    console.error(`[DEBUG] Result has content?`, !!(result && result.content));
    console.error(`[DEBUG] Content is array?`, Array.isArray(result?.content));
    
    if (result && result.content) {
      console.error(`[DEBUG] Returning content directly:`, JSON.stringify(result));
      return result;
    } else if (result && typeof result === 'object') {
      // Se não houver content mas for um objeto válido, criar content
      toolLogger.warn('Resultado sem campo content, criando automaticamente');
      return {
        content: [{
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }],
        ...result  // Preservar outros campos como success, data, etc
      };
    } else {
      // Fallback para resultados simples
      return {
        content: [{
          type: 'text',
          text: String(result)
        }]
      };
    }
  } catch (error) {
    // Tratamento de erro
    const toolLogger = logger.forTool(name);
    toolLogger.error('Erro ao executar ferramenta', error as Error, args);
    
    return {
      content: [{
        type: 'text',
        text: `Erro ao executar ${name}: ${error instanceof Error ? error.message : String(error)}`
      }],
      isError: true,
    };
  }
});

/**
 * Gerenciamento de shutdown gracioso
 */
async function handleShutdown() {
  logger.info('Encerrando servidor...');
  
  // Limpar recursos do Puppeteer
  // startBrowserCleanup já gerencia seu próprio cleanup
  
  process.exit(0);
}

// Handlers de sinal
process.on('SIGINT', handleShutdown);
process.on('SIGTERM', handleShutdown);

/**
 * Função principal
 */
async function main() {
  // Preservar logs MCP importantes no console.error original
  console.error(`[${serverConfig.name}] Iniciando servidor v${serverConfig.version}...`);
  
  logger.info(`Iniciando servidor v${serverConfig.version}...`);
  
  // Verificar configurações obrigatórias
  const missingVars = validateRequiredConfig();
  
  if (missingVars.length > 0) {
    logger.warn(`Variáveis de ambiente faltando: ${missingVars.join(', ')}`);
    console.error(`[${serverConfig.name}] ⚠️  Variáveis de ambiente faltando: ${missingVars.join(', ')}`);
    console.error(`[${serverConfig.name}] Algumas funcionalidades podem não funcionar corretamente.`);
  }
  
  // Iniciar limpeza automática do browser
  if (startBrowserCleanup) {
    startBrowserCleanup();
    logger.debug('Sistema de limpeza do browser iniciado');
  }
  
  // Criar transporte stdio
  const transport = new StdioServerTransport();
  
  // Conectar e iniciar servidor
  await server.connect(transport);
  
  logger.info(`Servidor iniciado com ${allTools.length} ferramentas`);
  console.error(`[${serverConfig.name}] ✅ Servidor iniciado com ${allTools.length} ferramentas`);
  console.error(`[${serverConfig.name}] Aguardando conexões...`);
}

// Iniciar servidor
main().catch((error) => {
  logger.error('Erro fatal ao iniciar servidor', error);
  console.error(`[${serverConfig.name}] Erro fatal:`, error);
  process.exit(1);
});