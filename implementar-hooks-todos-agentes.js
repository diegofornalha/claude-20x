#!/usr/bin/env node

/**
 * Script para implementar hooks em todos os agentes do Claude Flow
 * Este script configura hooks automáticos para coordenação de swarm
 */

const { execSync } = require('child_process');

// Lista completa de agentes principais (8 categorias principais)
const AGENT_CATEGORIES = {
  'Core Development': [
    'coder',
    'reviewer', 
    'tester',
    'planner',
    'researcher'
  ],
  'Swarm Coordination': [
    'hierarchical-coordinator',
    'mesh-coordinator',
    'adaptive-coordinator',
    'task-orchestrator',
    'memory-coordinator'
  ],
  'Specialized Development': [
    'backend-dev',
    'mobile-dev',
    'ml-developer',
    'cicd-engineer',
    'api-docs',
    'system-architect',
    'code-analyzer'
  ],
  'GitHub Management': [
    'pr-manager',
    'code-review-swarm',
    'issue-tracker',
    'release-manager',
    'workflow-automation'
  ],
  'SPARC Methodology': [
    'sparc-coord',
    'sparc-coder',
    'specification',
    'pseudocode',
    'architecture',
    'refinement'
  ],
  'Testing & Validation': [
    'tdd-london-swarm',
    'production-validator'
  ],
  'Performance': [
    'perf-analyzer',
    'performance-benchmarker',
    'bottleneck-analyzer'
  ],
  'Consensus & Distributed': [
    'byzantine-coordinator',
    'raft-manager',
    'gossip-coordinator',
    'consensus-builder',
    'crdt-synchronizer'
  ]
};

// Configuração de hooks para cada tipo de agente
const HOOK_CONFIGS = {
  // Hooks para agentes de desenvolvimento
  'coder': {
    'pre-task': '--load-context true --prepare-resources true',
    'pre-edit': '--auto-assign-agents true --validate-syntax true',
    'post-edit': '--format true --update-memory true --train-neural true',
    'notify': '--level info --telemetry true',
    'post-task': '--analyze-performance true --export-metrics true'
  },
  
  // Hooks para agentes de teste
  'tester': {
    'pre-task': '--load-context true --prepare-test-env true',
    'pre-edit': '--auto-assign-agents true --test-coverage true',
    'post-edit': '--format true --update-memory true --validate-tests true',
    'notify': '--level success --telemetry true',
    'post-task': '--analyze-performance true --coverage-report true'
  },
  
  // Hooks para coordenadores
  'coordinator': {
    'pre-task': '--load-context true --topology-optimize true',
    'notify': '--level progress --broadcast true',
    'post-task': '--analyze-performance true --swarm-metrics true',
    'session-end': '--generate-summary true --persist-state true'
  },
  
  // Hooks padrão para todos os agentes
  'default': {
    'pre-task': '--load-context true --auto-spawn-agents false',
    'notify': '--level info --telemetry true',
    'post-edit': '--update-memory true',
    'post-task': '--analyze-performance true',
    'session-end': '--export-metrics true'
  }
};

// Função para executar comando
function executeCommand(cmd, description) {
  console.log(`\n📌 ${description}`);
  console.log(`   Comando: ${cmd}`);
  try {
    const output = execSync(cmd, { encoding: 'utf8' });
    console.log(`   ✅ Sucesso`);
    if (output) console.log(`   Output: ${output.trim()}`);
    return true;
  } catch (error) {
    console.log(`   ❌ Erro: ${error.message}`);
    return false;
  }
}

// Função para configurar hooks de um agente
function configureAgentHooks(agentType, hookConfig) {
  console.log(`\n🤖 Configurando hooks para: ${agentType}`);
  console.log('━'.repeat(50));
  
  let successCount = 0;
  let totalHooks = 0;
  
  for (const [hookName, hookParams] of Object.entries(hookConfig)) {
    totalHooks++;
    const cmd = `npx claude-flow@alpha hooks ${hookName} --agent-type ${agentType} ${hookParams}`;
    const success = executeCommand(
      cmd,
      `Hook ${hookName} para ${agentType}`
    );
    if (success) successCount++;
  }
  
  console.log(`\n   📊 Resultado: ${successCount}/${totalHooks} hooks configurados`);
  return { agentType, successCount, totalHooks };
}

// Função principal
async function main() {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║     🔄 IMPLEMENTAÇÃO DE HOOKS EM TODOS OS AGENTES       ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  
  const results = [];
  let totalAgents = 0;
  let successfulAgents = 0;
  
  // Processar cada categoria
  for (const [category, agents] of Object.entries(AGENT_CATEGORIES)) {
    console.log(`\n\n📁 CATEGORIA: ${category}`);
    console.log('═'.repeat(60));
    
    for (const agent of agents) {
      totalAgents++;
      
      // Determinar configuração de hooks
      let hookConfig = HOOK_CONFIGS.default;
      
      if (HOOK_CONFIGS[agent]) {
        hookConfig = { ...HOOK_CONFIGS.default, ...HOOK_CONFIGS[agent] };
      } else if (agent.includes('coordinator')) {
        hookConfig = { ...HOOK_CONFIGS.default, ...HOOK_CONFIGS.coordinator };
      } else if (agent.includes('test')) {
        hookConfig = { ...HOOK_CONFIGS.default, ...HOOK_CONFIGS.tester };
      } else if (agent.includes('cod')) {
        hookConfig = { ...HOOK_CONFIGS.default, ...HOOK_CONFIGS.coder };
      }
      
      const result = configureAgentHooks(agent, hookConfig);
      results.push(result);
      
      if (result.successCount === result.totalHooks) {
        successfulAgents++;
      }
    }
  }
  
  // Relatório final
  console.log('\n\n');
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║                    📊 RELATÓRIO FINAL                    ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  
  console.log(`\n📈 ESTATÍSTICAS GERAIS:`);
  console.log(`   Total de Agentes: ${totalAgents}`);
  console.log(`   Agentes Configurados: ${successfulAgents}`);
  console.log(`   Taxa de Sucesso: ${((successfulAgents/totalAgents)*100).toFixed(1)}%`);
  
  console.log(`\n📋 DETALHAMENTO POR CATEGORIA:`);
  
  for (const [category, agents] of Object.entries(AGENT_CATEGORIES)) {
    const categoryResults = results.filter(r => agents.includes(r.agentType));
    const categorySuccess = categoryResults.filter(r => r.successCount === r.totalHooks).length;
    
    console.log(`\n   ${category}:`);
    console.log(`   ├── Agentes: ${agents.length}`);
    console.log(`   ├── Configurados: ${categorySuccess}`);
    console.log(`   └── Status: ${categorySuccess === agents.length ? '✅ Completo' : '⚠️ Parcial'}`);
  }
  
  // Salvar configuração
  console.log(`\n\n💾 SALVANDO CONFIGURAÇÃO...`);
  
  const configCmd = `npx claude-flow@alpha config save --hooks-enabled true --agents-configured ${totalAgents}`;
  executeCommand(configCmd, 'Salvando configuração de hooks');
  
  // Testar configuração
  console.log(`\n\n🧪 TESTANDO CONFIGURAÇÃO...`);
  
  const testCmd = `npx claude-flow@alpha hooks test --random-agent --verify`;
  executeCommand(testCmd, 'Testando hooks aleatório');
  
  console.log('\n\n✨ IMPLEMENTAÇÃO CONCLUÍDA!');
  console.log('\nPróximos passos:');
  console.log('1. Execute: npx claude-flow@alpha swarm init');
  console.log('2. Spawne agentes com: npx claude-flow@alpha agent spawn [tipo]');
  console.log('3. Os hooks serão executados automaticamente!');
  
  // Criar arquivo de demonstração
  createDemoScript();
}

// Criar script de demonstração
function createDemoScript() {
  const demoScript = `#!/usr/bin/env node

/**
 * Demonstração de Hooks em Ação
 * Execute este script para ver todos os hooks funcionando
 */

const { execSync } = require('child_process');

async function runDemo() {
  console.log('🎯 DEMONSTRAÇÃO DE HOOKS DO CLAUDE FLOW');
  console.log('═'.repeat(50));
  
  // 1. Inicializar swarm
  console.log('\\n1️⃣ Inicializando Swarm...');
  execSync('npx claude-flow@alpha swarm init --topology mesh --max-agents 4', { stdio: 'inherit' });
  
  // 2. Spawnar agentes
  console.log('\\n2️⃣ Criando Agentes...');
  const agents = ['coder', 'tester', 'reviewer', 'task-orchestrator'];
  
  for (const agent of agents) {
    console.log(\`   Spawning \${agent}...\`);
    execSync(\`npx claude-flow@alpha agent spawn --type \${agent}\`, { stdio: 'inherit' });
  }
  
  // 3. Executar tarefa com hooks
  console.log('\\n3️⃣ Executando Tarefa com Hooks...');
  execSync('npx claude-flow@alpha task orchestrate "Criar API REST com testes"', { stdio: 'inherit' });
  
  // 4. Monitorar hooks
  console.log('\\n4️⃣ Monitorando Hooks em Tempo Real...');
  execSync('npx claude-flow@alpha hooks monitor --real-time --duration 30', { stdio: 'inherit' });
  
  // 5. Gerar relatório
  console.log('\\n5️⃣ Gerando Relatório...');
  execSync('npx claude-flow@alpha hooks report --format detailed', { stdio: 'inherit' });
  
  console.log('\\n✅ Demonstração Concluída!');
}

runDemo().catch(console.error);
`;

  require('fs').writeFileSync('demo-hooks.js', demoScript);
  console.log('\n📝 Script de demonstração criado: demo-hooks.js');
  console.log('   Execute com: node demo-hooks.js');
}

// Executar
main().catch(console.error);