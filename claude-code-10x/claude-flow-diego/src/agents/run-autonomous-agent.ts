#!/usr/bin/env ts-node

/**
 * Script para executar o Agente Autônomo de Melhoria
 * 
 * Uso: npx ts-node examples/run-autonomous-agent.ts
 */

import { runAutonomousImprovement } from './autonomous-improvement-agent-simple';

async function main() {
  console.log('🤖 Claude Flow - Agente Autônomo de Melhoria\n');
  
  // Tarefa: Adicionar ferramentas GitHub faltantes
  const improvementTask = `
Adicione as seguintes ferramentas GitHub ao arquivo /Users/agents/Desktop/claude-code-10x/mcp-run-ts-tools/src/tools/github/index.ts:

1. search_repositories - Buscar repositórios
2. get_file_contents - Obter conteúdo de arquivos
3. fork_repository - Fazer fork de repositórios  
4. create_branch - Criar branches
5. merge_pull_request - Fazer merge de pull requests

Requisitos:
- Mantenha o padrão TypeScript existente com schemas Zod
- Adicione os tipos necessários
- Implemente handlers com tratamento de erro apropriado
- Atualize as exportações
- Siga o mesmo padrão das ferramentas existentes

IMPORTANTE: Execute as mudanças de forma incremental e teste cada adição.
`;

  try {
    // Executar agente autônomo
    await runAutonomousImprovement(
      improvementTask,
      '/Users/agents/Desktop/claude-code-10x/mcp-run-ts-tools'
    );
    
    console.log('\n🎉 Processo concluído com sucesso!');
  } catch (error) {
    console.error('\n❌ Erro:', error);
    process.exit(1);
  }
}

// Executar
main().catch(console.error);