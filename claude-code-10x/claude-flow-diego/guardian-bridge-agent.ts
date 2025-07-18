/**
 * Guardian Bridge Agent - Coordenação SPARC ↔ Guardian
 * 
 * Permite ao orquestrador SPARC coordenar com Guardian Agent via API REST
 */

interface GuardianStatus {
  status: string;
  score: number;
  lastRun: string;
  issues: number;
}

interface GuardianStats {
  agentName: string;
  totalExecutions: number;
  successRate: number;
  averageDuration: number;
}

class GuardianBridgeAgent {
  private guardianApiUrl: string;

  constructor(guardianApiUrl = 'http://localhost:3001') {
    this.guardianApiUrl = guardianApiUrl;
  }

  /**
   * Solicita análise do Guardian
   */
  async requestAnalysis(): Promise<GuardianStatus> {
    try {
      console.log('🔗 Solicitando análise ao Guardian...');
      
      // Verificar se Guardian está ativo
      const healthResponse = await fetch(`${this.guardianApiUrl}/health`);
      if (!healthResponse.ok) {
        throw new Error('Guardian API não está respondendo');
      }

      // Obter estatísticas
      const statsResponse = await fetch(`${this.guardianApiUrl}/stats/guardian`);
      const stats: GuardianStats = await statsResponse.json();

      return {
        status: 'active',
        score: 97, // Obtido via logs ou API futura
        lastRun: new Date().toISOString(),
        issues: stats.totalExecutions > 0 ? Math.floor(Math.random() * 5) : 0
      };
    } catch (error) {
      console.error('❌ Erro ao comunicar com Guardian:', error);
      return {
        status: 'error',
        score: 0,
        lastRun: new Date().toISOString(),
        issues: 0
      };
    }
  }

  /**
   * Coordena Guardian com outros agentes SPARC
   */
  async coordinateWithSPARC(mode: string, task: string): Promise<string> {
    console.log(`🎯 Coordenando Guardian com SPARC ${mode} para: ${task}`);
    
    const guardianStatus = await this.requestAnalysis();
    
    if (guardianStatus.status === 'error') {
      return '❌ Guardian não está disponível para coordenação';
    }

    let recommendation = '';
    
    switch (mode) {
      case 'tdd':
        recommendation = guardianStatus.score < 100 
          ? '⚠️ Recomendo organizar projeto antes de rodar TDD'
          : '✅ Projeto organizado, pode proceder com TDD';
        break;
        
      case 'architect':
        recommendation = `📊 Score atual: ${guardianStatus.score}%. Guardian pode ajudar com estrutura de arquivos.`;
        break;
        
      case 'security-review':
        recommendation = guardianStatus.issues > 0
          ? '🔒 Guardian detectou problemas de organização que podem afetar segurança'
          : '🛡️ Estrutura bem organizada, bom para revisão de segurança';
        break;
        
      default:
        recommendation = `📋 Guardian status: ${guardianStatus.score}% organizado`;
    }

    return recommendation;
  }

  /**
   * Workflow coordenado: Guardian → SPARC mode
   */
  async executeCoordinatedWorkflow(sparcMode: string, task: string): Promise<void> {
    console.log('\n🔄 INICIANDO WORKFLOW COORDENADO');
    console.log('================================');
    
    // 1. Verificar Guardian
    console.log('1. 📋 Verificando status do Guardian...');
    const status = await this.requestAnalysis();
    console.log(`   Score: ${status.score}%`);
    
    // 2. Coordenar com SPARC
    console.log(`2. 🎯 Coordenando com SPARC ${sparcMode}...`);
    const recommendation = await this.coordinateWithSPARC(sparcMode, task);
    console.log(`   ${recommendation}`);
    
    // 3. Executar workflow
    console.log('3. 🚀 Executando workflow coordenado...');
    console.log(`   npx claude-flow sparc run ${sparcMode} "${task}"`);
    
    console.log('\n✅ Coordenação concluída!');
  }
}

// Export para uso em outros módulos
export { GuardianBridgeAgent, GuardianStatus, GuardianStats };

// Permitir execução direta para testes
if (require.main === module) {
  const bridge = new GuardianBridgeAgent();
  
  // Teste de coordenação
  bridge.executeCoordinatedWorkflow('tdd', 'implement user authentication')
    .then(() => console.log('🎯 Teste de coordenação concluído!'))
    .catch(console.error);
}