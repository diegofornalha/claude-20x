#!/usr/bin/env tsx

/**
 * Versão simplificada do MCP Improvement Agent
 * Funciona sem necessidade de conexão MCP para análise inicial
 */

import * as fs from 'fs';
import * as path from 'path';

const PROJECT_PATH = '/Users/phiz/Desktop/claude-code-10x/mcp-run-ts-tools';

interface FileAnalysis {
  file: string;
  lines: number;
  issues: string[];
  recommendations: string[];
}

function analyzeFile(filePath: string): FileAnalysis {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').length;
  const issues: string[] = [];
  const recommendations: string[] = [];

  // Análise básica
  if (lines > 500) {
    issues.push(`Arquivo muito grande (${lines} linhas)`);
    recommendations.push('Refatorar em módulos menores');
  }

  if (content.includes('console.log') && !content.includes('// console.log')) {
    issues.push('Console.log não comentado encontrado');
    recommendations.push('Usar sistema de logging estruturado');
  }

  if (!content.includes('/**') && !content.includes('//')) {
    issues.push('Falta documentação');
    recommendations.push('Adicionar JSDoc e comentários');
  }

  return { file: filePath, lines, issues, recommendations };
}

async function analyzeProject() {
  console.log('🔍 Analisando MCP-Run-TS-Tools...\n');

  // 1. Verificar estrutura
  console.log('📂 Estrutura do Projeto:');
  const dirs = ['src', 'src/tools', 'docs', 'tests'];
  dirs.forEach(dir => {
    const exists = fs.existsSync(path.join(PROJECT_PATH, dir));
    console.log(`  ${exists ? '✅' : '❌'} ${dir}`);
  });

  // 2. Analisar arquivos principais
  console.log('\n📄 Análise de Arquivos:');
  const mainFiles = [
    'src/index.ts',
    'src/types.ts',
    'src/schemas.ts',
    'src/utils.ts',
    'src/handlers.ts'
  ];

  const analyses: FileAnalysis[] = [];
  mainFiles.forEach(file => {
    const filePath = path.join(PROJECT_PATH, file);
    if (fs.existsSync(filePath)) {
      const analysis = analyzeFile(filePath);
      analyses.push(analysis);
      
      console.log(`\n  ${file}:`);
      console.log(`    Linhas: ${analysis.lines}`);
      if (analysis.issues.length > 0) {
        console.log(`    Issues:`);
        analysis.issues.forEach(issue => console.log(`      - ${issue}`));
      }
    }
  });

  // 3. Verificar ferramentas
  console.log('\n🛠️  Ferramentas Implementadas:');
  const toolsDir = path.join(PROJECT_PATH, 'src/tools');
  if (fs.existsSync(toolsDir)) {
    const tools = fs.readdirSync(toolsDir).filter(f => fs.statSync(path.join(toolsDir, f)).isDirectory());
    tools.forEach(tool => {
      const indexPath = path.join(toolsDir, tool, 'index.ts');
      const exists = fs.existsSync(indexPath);
      console.log(`  ${exists ? '✅' : '❌'} ${tool}`);
    });
  }

  // 4. Verificar testes
  console.log('\n🧪 Cobertura de Testes:');
  const hasTests = fs.existsSync(path.join(PROJECT_PATH, 'tests')) || 
                   fs.existsSync(path.join(PROJECT_PATH, 'src/__tests__'));
  console.log(`  ${hasTests ? '✅ Testes encontrados' : '❌ Sem testes'}`);

  // 5. Verificar documentação
  console.log('\n📚 Documentação:');
  const docs = ['README.md', 'CHANGELOG.md', 'docs/'];
  docs.forEach(doc => {
    const exists = fs.existsSync(path.join(PROJECT_PATH, doc));
    console.log(`  ${exists ? '✅' : '❌'} ${doc}`);
  });

  // 6. Melhorias prioritárias
  console.log('\n🎯 Melhorias Prioritárias:\n');
  
  const priorities = [
    {
      title: 'Refatorar index.ts monolítico',
      type: 'CRÍTICO',
      effort: '4h',
      description: 'Arquivo com 1140 linhas precisa ser dividido em módulos'
    },
    {
      title: 'Implementar testes',
      type: 'ALTO',
      effort: '8h',
      description: 'Adicionar Jest e criar testes unitários'
    },
    {
      title: 'Sistema de logging',
      type: 'ALTO',
      effort: '3h',
      description: 'Substituir console.log por Winston ou similar'
    },
    {
      title: 'Documentação completa',
      type: 'MÉDIO',
      effort: '4h',
      description: 'README principal e documentação de API'
    },
    {
      title: 'Configuração centralizada',
      type: 'MÉDIO',
      effort: '2h',
      description: 'Criar arquivo de configuração único'
    }
  ];

  priorities.forEach((priority, index) => {
    console.log(`${index + 1}. [${priority.type}] ${priority.title}`);
    console.log(`   Esforço: ${priority.effort}`);
    console.log(`   ${priority.description}\n`);
  });

  // Salvar relatório
  const report = {
    timestamp: new Date().toISOString(),
    analyses,
    priorities,
    summary: {
      totalFiles: analyses.length,
      totalIssues: analyses.reduce((sum, a) => sum + a.issues.length, 0),
      criticalFiles: analyses.filter(a => a.lines > 500).length
    }
  };

  const reportPath = path.join(PROJECT_PATH, 'improvement-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n📄 Relatório salvo em: ${reportPath}`);
}

// Executar análise
analyzeProject().catch(console.error);