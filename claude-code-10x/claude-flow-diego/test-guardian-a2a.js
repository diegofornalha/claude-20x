#!/usr/bin/env node

/**
 * Teste simplificado do Guardian A2A aprimorado
 * Testa as funcionalidades principais sem TypeScript complexo
 */

const fs = require('fs').promises;
const path = require('path');
const chokidar = require('chokidar');

class SimpleGuardianA2ATest {
  constructor() {
    this.a2aProjects = new Map();
    this.codexPath = path.join(__dirname, '../..');
  }

  async testA2ADiscovery() {
    console.log('🔍 Testando descoberta de projetos A2A...');
    
    const searchPaths = [
      path.join(this.codexPath, 'agents'),
      path.join(this.codexPath, 'claude-code-10x'),
      path.join(this.codexPath, 'a2a_servers'),
      path.join(this.codexPath, 'ui')
    ];

    for (const searchPath of searchPaths) {
      console.log(`   Escaneando: ${searchPath}`);
      
      try {
        const exists = await this.pathExists(searchPath);
        if (exists) {
          await this.scanForA2AProjects(searchPath);
        } else {
          console.log(`   ⚠️ Caminho não existe: ${searchPath}`);
        }
      } catch (error) {
        console.log(`   ❌ Erro ao escanear ${searchPath}:`, error.message);
      }
    }

    console.log(`\n📊 Resultado da descoberta:`);
    console.log(`   Projetos A2A encontrados: ${this.a2aProjects.size}`);
    
    for (const [projectPath, projectInfo] of this.a2aProjects.entries()) {
      console.log(`   📦 ${projectInfo.name} (${projectPath})`);
      console.log(`      Agent Card: ${projectInfo.hasAgentCard ? '✅' : '❌'}`);
      console.log(`      Agentes: ${projectInfo.hasAgents ? '✅' : '❌'}`);
      console.log(`      Servidor A2A: ${projectInfo.hasA2AServer ? '✅' : '❌'}`);
    }

    return this.a2aProjects.size > 0;
  }

  async scanForA2AProjects(dir) {
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        if (entry.isDirectory() && !this.shouldIgnoreDir(entry.name)) {
          const projectPath = path.join(dir, entry.name);
          const isA2A = await this.isA2AProject(projectPath);
          
          if (isA2A) {
            const projectInfo = await this.getA2AProjectInfo(projectPath);
            this.a2aProjects.set(projectPath, projectInfo);
            console.log(`   📦 Projeto A2A encontrado: ${entry.name}`);
          }
        }
      }
    } catch (error) {
      console.log(`   ❌ Erro ao escanear ${dir}:`, error.message);
    }
  }

  async isA2AProject(projectPath) {
    // Verificar indicadores de projeto A2A
    const a2aIndicators = [
      '.well-known/agent.json',
      'agent.json',
      'a2a-config.json',
      'agents/',
      'a2a_servers/'
    ];
    
    for (const indicator of a2aIndicators) {
      const indicatorPath = path.join(projectPath, indicator);
      if (await this.pathExists(indicatorPath)) {
        return true;
      }
    }
    
    // Verificar se há arquivos com padrões A2A
    try {
      const files = await fs.readdir(projectPath);
      const hasA2AFiles = files.some(file => 
        file.includes('a2a') || 
        file.includes('agent') ||
        file.endsWith('_agent.ts') ||
        file.endsWith('_agent.py')
      );
      
      return hasA2AFiles;
    } catch {
      return false;
    }
  }

  async getA2AProjectInfo(projectPath) {
    const info = {
      path: projectPath,
      name: path.basename(projectPath),
      lastScanned: new Date().toISOString(),
      hasAgentCard: false,
      hasAgents: false,
      hasA2AServer: false,
      complianceScore: 0
    };
    
    // Verificar Agent Card
    const agentCardPath = path.join(projectPath, '.well-known', 'agent.json');
    if (await this.pathExists(agentCardPath)) {
      info.hasAgentCard = true;
    }
    
    // Verificar agentes
    const agentsPath = path.join(projectPath, 'agents');
    if (await this.pathExists(agentsPath)) {
      info.hasAgents = true;
    }
    
    // Verificar servidor A2A (busca por arquivos server)
    try {
      const files = await this.getAllFiles(projectPath);
      const serverFiles = files.filter(f => {
        const fileName = path.basename(f);
        return fileName.includes('server') && 
               (fileName.endsWith('.ts') || fileName.endsWith('.js') || fileName.endsWith('.py'));
      });
      info.hasA2AServer = serverFiles.length > 0;
    } catch {
      info.hasA2AServer = false;
    }
    
    return info;
  }

  async getAllFiles(dir, maxDepth = 3, currentDepth = 0) {
    const files = [];
    
    if (currentDepth >= maxDepth) return files;
    
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory() && !this.shouldIgnoreDir(entry.name)) {
          const subFiles = await this.getAllFiles(fullPath, maxDepth, currentDepth + 1);
          files.push(...subFiles);
        } else if (entry.isFile()) {
          files.push(fullPath);
        }
      }
    } catch {
      // Ignorar erros de permissão
    }
    
    return files;
  }

  async pathExists(p) {
    try {
      await fs.access(p);
      return true;
    } catch {
      return false;
    }
  }

  shouldIgnoreDir(dirName) {
    const ignoreDirs = [
      'node_modules', '.git', 'dist', 'build', '.next', 
      '__pycache__', '.cache', '.vscode', '.idea', 'coverage'
    ];
    return dirName.startsWith('.') || ignoreDirs.includes(dirName);
  }

  async testA2ACompliance() {
    console.log('\n🔍 Testando compliance A2A...');
    
    const complianceResults = [];
    
    for (const [projectPath, projectInfo] of this.a2aProjects.entries()) {
      const score = await this.calculateA2ACompliance(projectPath, projectInfo);
      complianceResults.push({
        project: projectInfo.name,
        path: projectPath,
        score: score,
        compliant: score >= 80
      });
    }
    
    if (complianceResults.length > 0) {
      const totalProjects = complianceResults.length;
      const compliantProjects = complianceResults.filter(r => r.compliant).length;
      const avgScore = complianceResults.reduce((sum, r) => sum + r.score, 0) / totalProjects;
      
      console.log(`\n📊 Compliance A2A do Ecossistema:`);
      console.log(`   Projetos compliant: ${compliantProjects}/${totalProjects}`);
      console.log(`   Score médio: ${avgScore.toFixed(1)}%`);
      
      complianceResults.forEach(result => {
        const status = result.compliant ? '✅' : '❌';
        console.log(`   ${status} ${result.project}: ${result.score.toFixed(1)}%`);
      });
      
      return avgScore;
    } else {
      console.log('   ⚠️ Nenhum projeto A2A encontrado para testar compliance');
      return 0;
    }
  }

  async calculateA2ACompliance(projectPath, projectInfo) {
    let score = 0;
    const maxScore = 100;
    
    // Agent Card (25 pontos)
    if (projectInfo.hasAgentCard) {
      score += 25;
    }
    
    // Estrutura de agentes (25 pontos)
    if (projectInfo.hasAgents) {
      score += 25;
    }
    
    // Servidor A2A (25 pontos)
    if (projectInfo.hasA2AServer) {
      score += 25;
    }
    
    // Documentação A2A (25 pontos)
    const hasA2ADocs = await this.checkA2ADocumentation(projectPath);
    if (hasA2ADocs) {
      score += 25;
    }
    
    return score;
  }

  async checkA2ADocumentation(projectPath) {
    // Verificar README menciona A2A
    const readmePath = path.join(projectPath, 'README.md');
    if (await this.pathExists(readmePath)) {
      try {
        const readmeContent = await fs.readFile(readmePath, 'utf-8');
        if (readmeContent.toLowerCase().includes('a2a') || 
            readmeContent.toLowerCase().includes('agent-to-agent')) {
          return true;
        }
      } catch {
        // Ignorar erro
      }
    }
    
    // Verificar documentação A2A em docs/
    const docsPath = path.join(projectPath, 'docs');
    if (await this.pathExists(docsPath)) {
      try {
        const docFiles = await fs.readdir(docsPath);
        const hasA2ADocs = docFiles.some(file => 
          file.toLowerCase().includes('a2a') && file.endsWith('.md')
        );
        return hasA2ADocs;
      } catch {
        // Ignorar erro
      }
    }
    
    return false;
  }

  async runTests() {
    console.log('🤖 Testando Guardian A2A Aprimorado');
    console.log('====================================');
    
    try {
      // Teste 1: Descoberta de projetos A2A
      const discoverySuccess = await this.testA2ADiscovery();
      
      if (discoverySuccess) {
        // Teste 2: Compliance A2A
        const avgCompliance = await this.testA2ACompliance();
        
        console.log('\n✅ Testes concluídos com sucesso!');
        console.log(`📊 Resumo:`);
        console.log(`   Projetos A2A descobertos: ${this.a2aProjects.size}`);
        console.log(`   Compliance médio: ${avgCompliance.toFixed(1)}%`);
        
        return true;
      } else {
        console.log('\n⚠️ Nenhum projeto A2A foi descoberto');
        return false;
      }
      
    } catch (error) {
      console.error('\n❌ Erro durante os testes:', error);
      return false;
    }
  }
}

// Executar testes se script for chamado diretamente
if (require.main === module) {
  const tester = new SimpleGuardianA2ATest();
  
  tester.runTests().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  });
}

module.exports = SimpleGuardianA2ATest;