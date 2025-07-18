#!/usr/bin/env node

/**
 * CLI do Claude Flow
 * Interface de linha de comando para gerenciar agentes e workflows
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { config } from 'dotenv';
import { Orchestrator } from './orchestrator';
import { mcpAgentTemplates } from '../mcp/mcp-templates';
import { ClaudeSpawner } from '../utils/claude-spawn';
import { MCPBridge } from '../mcp/mcp-bridge';

// Carregar variáveis de ambiente
config();

const program = new Command();

program
  .name('claude-flow')
  .description('Sistema de orquestração de agentes Claude com DiegoTools MCP')
  .version('1.0.0');

// Comando: claude spawn
program
  .command('claude')
  .description('Gerenciar instâncias Claude')
  .command('spawn <instruction>')
  .description('Criar nova instância Claude com configuração específica')
  .option('-n, --name <name>', 'Nome da instância')
  .option('-m, --mode <mode>', 'Modo de operação (researcher|implementer|analyst|coordinator)')
  .option('-r, --research', 'Ativar modo pesquisa')
  .option('-p, --parallel', 'Ativar processamento paralelo')
  .option('-c, --coverage <number>', 'Porcentagem de cobertura', parseInt)
  .option('--commit-strategy <strategy>', 'Estratégia de commit (atomic|feature|monolithic)')
  .option('-t, --tools <tools...>', 'Ferramentas MCP disponíveis')
  .option('--timeout <seconds>', 'Timeout em segundos', parseInt)
  .action(async (instruction, options) => {
    console.log(chalk.blue('🚀 Iniciando Claude spawn...'));
    
    try {
      const mcpBridge = new MCPBridge();
      await mcpBridge.connect();
      
      const spawner = new ClaudeSpawner(mcpBridge);
      
      // Configurar listeners
      spawner.on('output', ({ output }) => {
        console.log(chalk.gray(output));
      });
      
      spawner.on('error', ({ error }) => {
        console.error(chalk.red(error));
      });
      
      // Criar instância
      const instance = await spawner.spawn({
        name: options.name || 'claude-instance',
        instruction,
        mode: options.mode,
        research: options.research,
        parallel: options.parallel,
        coverage: options.coverage,
        commitStrategy: options.commitStrategy,
        tools: options.tools || [],
        timeout: options.timeout
      });
      
      console.log(chalk.green(`✅ Instância criada: ${instance.name} (${instance.id})`));
      
    } catch (error) {
      console.error(chalk.red('❌ Erro:'), error);
      process.exit(1);
    }
  });

// Comando: agent
const agentCmd = program
  .command('agent')
  .description('Gerenciar agentes');

agentCmd
  .command('create <template>')
  .description('Criar agente usando template')
  .option('-n, --name <name>', 'Nome customizado do agente')
  .action(async (template, options) => {
    console.log(chalk.blue('🤖 Criando agente...'));
    
    try {
      const orchestrator = new Orchestrator();
      await orchestrator.initialize();
      
      // Buscar template
      const templateConfig = mcpAgentTemplates[template as keyof typeof mcpAgentTemplates];
      if (!templateConfig) {
        console.error(chalk.red(`Template não encontrado: ${template}`));
        console.log(chalk.yellow('Templates disponíveis:'), Object.keys(mcpAgentTemplates));
        process.exit(1);
      }
      
      // Criar cópia do config para permitir modificações
      const agentConfig = { ...templateConfig };
      
      // Customizar nome se fornecido
      if (options.name) {
        agentConfig.name = options.name;
      }
      
      const agent = orchestrator.createAgent(agentConfig);
      console.log(chalk.green(`✅ Agente criado: ${agent.name} (${agent.id})`));
      
      // Manter processo ativo
      process.on('SIGINT', async () => {
        await orchestrator.shutdown();
        process.exit(0);
      });
      
    } catch (error) {
      console.error(chalk.red('❌ Erro:'), error);
      process.exit(1);
    }
  });

agentCmd
  .command('list-templates')
  .description('Listar templates de agentes disponíveis')
  .action(() => {
    console.log(chalk.blue('📋 Templates disponíveis:\n'));
    
    for (const [key, config] of Object.entries(mcpAgentTemplates)) {
      console.log(chalk.yellow(`${key}:`));
      console.log(`  Nome: ${config.name}`);
      console.log(`  Tipo: ${config.type}`);
      console.log(`  Descrição: ${config.description}`);
      console.log(`  Ferramentas: ${config.tools.length} ferramentas`);
      console.log();
    }
  });

// Comando: workflow
program
  .command('workflow <name>')
  .description('Executar workflow')
  .option('-c, --config <path>', 'Caminho para arquivo de configuração')
  .action(async (name, options) => {
    console.log(chalk.blue(`🔄 Executando workflow: ${name}`));
    
    try {
      // TODO: Implementar execução de workflows
      console.log(chalk.yellow('⚠️  Funcionalidade em desenvolvimento'));
      
    } catch (error) {
      console.error(chalk.red('❌ Erro:'), error);
      process.exit(1);
    }
  });

// Comando: status
program
  .command('status')
  .description('Ver status do sistema')
  .action(async () => {
    console.log(chalk.blue('📊 Status do Sistema\n'));
    
    try {
      const orchestrator = new Orchestrator();
      await orchestrator.initialize();
      
      const status = orchestrator.getStatus();
      
      console.log(chalk.yellow('Agentes:'));
      if (status.agents.length === 0) {
        console.log('  Nenhum agente ativo');
      } else {
        for (const agent of status.agents) {
          console.log(`  ${agent.name} (${agent.id})`);
          console.log(`    Status: ${agent.status}`);
          console.log(`    Capacidade: ${agent.capacity}`);
        }
      }
      
      console.log(chalk.yellow('\nTarefas:'));
      console.log(`  Total: ${status.tasks.total}`);
      console.log(`  Na fila: ${status.tasks.queued}`);
      console.log(`  Processando: ${status.tasks.processing}`);
      
      await orchestrator.shutdown();
      
    } catch (error) {
      console.error(chalk.red('❌ Erro:'), error);
      process.exit(1);
    }
  });

// Comando: memory
const memoryCmd = program
  .command('memory')
  .description('Gerenciar memória (Mem0)');

memoryCmd
  .command('search <query>')
  .description('Buscar na memória')
  .option('-u, --user <userId>', 'ID do usuário', 'default_user')
  .option('-l, --limit <number>', 'Limite de resultados', '10')
  .action(async (query, options) => {
    console.log(chalk.blue('🔍 Buscando na memória...'));
    
    try {
      const mcpBridge = new MCPBridge();
      await mcpBridge.connect();
      
      const results = await mcpBridge.searchMemory(
        options.user,
        query,
        parseInt(options.limit)
      );
      
      if (results && results.results) {
        console.log(chalk.green(`\n✅ ${results.results.length} resultados encontrados:\n`));
        
        for (const result of results.results) {
          console.log(chalk.yellow('---'));
          console.log(result.memory);
          if (result.metadata) {
            console.log(chalk.gray(`Metadata: ${JSON.stringify(result.metadata)}`));
          }
        }
      } else {
        console.log(chalk.yellow('Nenhum resultado encontrado'));
      }
      
      mcpBridge.disconnect();
      
    } catch (error) {
      console.error(chalk.red('❌ Erro:'), error);
      process.exit(1);
    }
  });

memoryCmd
  .command('add <content>')
  .description('Adicionar memória')
  .option('-u, --user <userId>', 'ID do usuário', 'default_user')
  .option('-c, --category <category>', 'Categoria')
  .option('-m, --metadata <json>', 'Metadata JSON')
  .action(async (content, options) => {
    console.log(chalk.blue('💾 Adicionando memória...'));
    
    try {
      const mcpBridge = new MCPBridge();
      await mcpBridge.connect();
      
      let metadata = {};
      if (options.metadata) {
        try {
          metadata = JSON.parse(options.metadata);
        } catch (e) {
          console.error(chalk.red('Metadata inválido'));
          process.exit(1);
        }
      }
      
      const result = await mcpBridge.addMemory(
        options.user,
        content,
        { ...metadata, category: options.category }
      );
      
      console.log(chalk.green('✅ Memória adicionada com sucesso'));
      
      mcpBridge.disconnect();
      
    } catch (error) {
      console.error(chalk.red('❌ Erro:'), error);
      process.exit(1);
    }
  });

// Processar comandos
program.parse(process.argv);