/**
 * Exemplo: Workflow de Desenvolvimento com MCP
 * Demonstra uso de Git e GitHub tools
 */

import { Orchestrator } from '../core/index';
import { mcpAgentTemplates } from '../mcp/mcp-templates';

async function runDevWorkflow() {
  console.log('🚀 Iniciando Workflow de Desenvolvimento\n');
  
  const orchestrator = new Orchestrator();
  
  try {
    // Inicializar
    await orchestrator.initialize();
    
    // Criar agentes
    console.log('📦 Criando agentes de desenvolvimento...\n');
    
    const gitManager = orchestrator.createAgent({
      ...mcpAgentTemplates.gitManager,
      name: 'Git Manager Pro'
    });
    
    const githubManager = orchestrator.createAgent({
      ...mcpAgentTemplates.githubManager,  
      name: 'GitHub Manager Pro'
    });
    
    // Status do sistema
    const status = orchestrator.getStatus();
    console.log('📊 Status do Sistema:');
    console.log(`- Agentes: ${status.agents.length}`);
    console.log(`- Tarefas: ${status.tasks.total}\n`);
    
    // Criar tarefas
    console.log('📝 Criando tarefas de desenvolvimento...\n');
    
    // Task 1: Verificar status do Git
    const gitStatusTask = orchestrator.createTask(
      'Verificar status do repositório Git',
      {
        assignTo: gitManager.id,
        metadata: { detailed: true }
      }
    );
    
    // Task 2: Criar issue no GitHub
    const issueTask = orchestrator.createTask(
      'Criar issue sobre integração MCP',
      {
        assignTo: githubManager.id,
        metadata: {
          issue: {
            owner: 'ruvnet',
            repo: 'test-repo',
            title: 'Teste: Integração Claude Flow + MCP',
            body: 'Issue criada automaticamente via Claude Flow MCP'
          }
        }
      }
    );
    
    // Aguardar um pouco para ver execução
    console.log('⏳ Executando tarefas...\n');
    
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Status final
    const finalStatus = orchestrator.getStatus();
    console.log('\n📊 Status Final:');
    console.log(`- Tarefas processadas: ${finalStatus.tasks.total}`);
    
    // Shutdown
    await orchestrator.shutdown();
    console.log('\n✅ Workflow concluído!');
    
  } catch (error) {
    console.error('❌ Erro:', error);
    await orchestrator.shutdown();
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  runDevWorkflow();
}