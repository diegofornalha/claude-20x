#!/usr/bin/env node

/**
 * Teste simples do Guardian Agent com Sequential Thinking autônomo
 */

interface SequentialThought {
  thought: string;
  nextThoughtNeeded: boolean;
  thoughtNumber: number;
  totalThoughts: number;
}

interface TestReport {
  score: number;
  issues: Array<{
    type: string;
    severity: string;
    description: string;
    points: number;
  }>;
}

class TestGuardian {
  constructor(private projectPath: string) {}

  /**
   * Decisão autônoma usando Sequential Thinking
   */
  async autonomousDecisionWithSequentialThinking(report: TestReport): Promise<void> {
    console.log('\n' + '='.repeat(60));
    console.log('🧠 GUARDIAN PENSAMENTO SEQUENCIAL - DECISÃO AUTÔNOMA');
    console.log('='.repeat(60));

    // Pensamento 1: Analisar situação
    await this.sequentialThought({
      thought: `Analisando score atual de ${report.score}% com ${report.issues.length} problemas. 
               Preciso avaliar se os problemas são seguros para correção automática.`,
      nextThoughtNeeded: true,
      thoughtNumber: 1,
      totalThoughts: 4
    });

    // Pensamento 2: Avaliar riscos
    const highRiskIssues = report.issues.filter(i => i.severity === 'critical');
    const mediumRiskIssues = report.issues.filter(i => i.severity === 'major');
    
    await this.sequentialThought({
      thought: `Análise de risco: ${highRiskIssues.length} críticos, ${mediumRiskIssues.length} importantes. 
               Problemas de organização são geralmente seguros para correção automática.`,
      nextThoughtNeeded: true,
      thoughtNumber: 2,
      totalThoughts: 4
    });

    // Pensamento 3: Avaliar benefícios vs riscos
    const totalPoints = report.issues.reduce((sum, issue) => sum + issue.points, 0);
    
    await this.sequentialThought({
      thought: `Benefícios: +${totalPoints} pontos levando a 100% de organização. 
               Riscos: Mínimos, apenas movimentação/limpeza de arquivos. 
               Decisão: PROCEDER com correções automáticas.`,
      nextThoughtNeeded: true,
      thoughtNumber: 3,
      totalThoughts: 4
    });

    // Pensamento 4: Executar decisão
    await this.sequentialThought({
      thought: `Executando correções automáticas baseado na análise de risco-benefício. 
               Guardian possui backup automático e pode reverter mudanças se necessário.`,
      nextThoughtNeeded: false,
      thoughtNumber: 4,
      totalThoughts: 4
    });

    console.log('\n✅ Decisão autônoma: APLICAR CORREÇÕES');
    console.log('🔧 Iniciando correções automáticas...\n');
    
    // Simular aplicação de correções
    console.log('📁 Movendo arquivo config.yml → config/');
    console.log('📁 Movendo arquivo docs.md → docs/');
    console.log('✅ 2 correções aplicadas');
    console.log('📊 Score atualizado: 85% → 100%');
  }

  /**
   * Simula uma etapa de pensamento sequencial
   */
  private async sequentialThought(thought: SequentialThought): Promise<void> {
    console.log(`\n🤔 Pensamento ${thought.thoughtNumber}/${thought.totalThoughts}:`);
    console.log(`   ${thought.thought}`);
    
    // Simular tempo de processamento
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (thought.nextThoughtNeeded) {
      console.log('   ⏭️  Próximo pensamento...');
    } else {
      console.log('   ✅ Análise concluída.');
    }
  }

  async testAutonomousMode(): Promise<void> {
    console.log('🚀 Testando Guardian Agent Autônomo');
    console.log(`📁 Projeto: ${this.projectPath}`);
    
    // Simular relatório de organização
    const mockReport: TestReport = {
      score: 85,
      issues: [
        {
          type: 'wrong-location',
          severity: 'major',
          description: 'config.yml deveria estar em /config',
          points: 8
        },
        {
          type: 'wrong-location', 
          severity: 'minor',
          description: 'docs.md deveria estar em /docs',
          points: 7
        }
      ]
    };

    await this.autonomousDecisionWithSequentialThinking(mockReport);
    
    console.log('\n🎉 Teste concluído! Guardian funcionando em modo autônomo.');
  }
}

// Executar teste
if (require.main === module) {
  const projectPath = process.argv[2] || process.cwd();
  const guardian = new TestGuardian(projectPath);
  
  guardian.testAutonomousMode().catch(error => {
    console.error('❌ Erro no teste:', error);
    process.exit(1);
  });
}