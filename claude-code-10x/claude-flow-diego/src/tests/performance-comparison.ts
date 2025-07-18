/**
 * Teste de Performance: Local OSS vs Cloud
 * 
 * Compara latência, throughput e confiabilidade entre:
 * - Chroma DB local (OSS)
 * - Mem0 Cloud (original)
 */

import { GuardianMemoryManagerOSS } from '../utils/guardian-memory-oss';
import { GuardianMemoryManager } from '../utils/guardian-memory';
import axios from 'axios';

interface PerformanceResult {
  system: 'OSS Local' | 'Mem0 Cloud';
  operations: {
    add_memory: { avg_ms: number; success_rate: number };
    search_memory: { avg_ms: number; success_rate: number };
    list_memories: { avg_ms: number; success_rate: number };
  };
  total_tests: number;
  errors: string[];
}

export class PerformanceComparison {
  private ossMemory: GuardianMemoryManagerOSS;
  private cloudMemory: GuardianMemoryManager;

  constructor() {
    this.ossMemory = new GuardianMemoryManagerOSS('http://localhost:3003');
    this.cloudMemory = new GuardianMemoryManager();
  }

  /**
   * Executa teste de performance completo
   */
  async runComparison(): Promise<{oss: PerformanceResult, cloud: PerformanceResult}> {
    console.log('\n🏁 Iniciando teste de performance OSS vs Cloud...\n');

    // Testar OSS Local
    const ossResult = await this.testSystem('OSS Local', async (operation, data) => {
      switch (operation) {
        case 'add_memory':
          await this.ossMemory.addMemory(data);
          break;
        case 'search_memory':
          return await this.ossMemory.searchMemories(data.query, data.limit);
        case 'list_memories':
          return await this.ossMemory.listMemories(data.limit);
      }
    });

    console.log('\n' + '='.repeat(60) + '\n');

    // Testar Mem0 Cloud
    const cloudResult = await this.testSystem('Mem0 Cloud', async (operation, data) => {
      switch (operation) {
        case 'add_memory':
          await this.cloudMemory.addMemory(data);
          break;
        case 'search_memory':
          return await this.cloudMemory.searchMemories(data.query, data.limit);
        case 'list_memories':
          return await this.cloudMemory.listMemories(data.limit);
      }
    });

    // Comparar resultados
    this.printComparison(ossResult, cloudResult);

    return { oss: ossResult, cloud: cloudResult };
  }

  /**
   * Testa um sistema específico
   */
  private async testSystem(
    systemName: 'OSS Local' | 'Mem0 Cloud',
    executor: Function
  ): Promise<PerformanceResult> {
    console.log(`📊 Testando ${systemName}...`);
    
    const result: PerformanceResult = {
      system: systemName,
      operations: {
        add_memory: { avg_ms: 0, success_rate: 0 },
        search_memory: { avg_ms: 0, success_rate: 0 },
        list_memories: { avg_ms: 0, success_rate: 0 }
      },
      total_tests: 0,
      errors: []
    };

    const testCases = 5; // Número de testes por operação

    // Teste 1: Add Memory
    console.log(`  ⏱️  Testando add_memory (${testCases} vezes)...`);
    const addResults = await this.measureOperation(
      'add_memory',
      testCases,
      executor,
      (i) => ({
        content: `Teste de performance ${systemName} - memória ${i}`,
        category: 'performance_test',
        metadata: {
          test_id: i,
          system: systemName,
          timestamp: new Date().toISOString()
        },
        tags: ['performance', 'test', systemName.toLowerCase().replace(' ', '_')]
      })
    );
    result.operations.add_memory = addResults;

    // Aguardar um pouco para sincronização
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Teste 2: Search Memory
    console.log(`  🔍 Testando search_memory (${testCases} vezes)...`);
    const searchResults = await this.measureOperation(
      'search_memory',
      testCases,
      executor,
      (i) => ({
        query: `performance teste ${systemName}`,
        limit: 5
      })
    );
    result.operations.search_memory = searchResults;

    // Teste 3: List Memories
    console.log(`  📋 Testando list_memories (${testCases} vezes)...`);
    const listResults = await this.measureOperation(
      'list_memories',
      testCases,
      executor,
      (i) => ({
        limit: 10
      })
    );
    result.operations.list_memories = listResults;

    result.total_tests = testCases * 3;
    
    console.log(`✅ ${systemName} testado: ${result.total_tests} operações`);
    return result;
  }

  /**
   * Mede performance de uma operação específica
   */
  private async measureOperation(
    operation: string,
    iterations: number,
    executor: Function,
    dataGenerator: Function
  ): Promise<{ avg_ms: number; success_rate: number }> {
    const times: number[] = [];
    let successes = 0;

    for (let i = 1; i <= iterations; i++) {
      try {
        const start = Date.now();
        await executor(operation, dataGenerator(i));
        const duration = Date.now() - start;
        
        times.push(duration);
        successes++;
        
        console.log(`    ${i}/${iterations}: ${duration}ms ✅`);
      } catch (error) {
        console.log(`    ${i}/${iterations}: ERRO ❌ (${error.message})`);
      }
    }

    const avg_ms = times.length > 0 ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : 0;
    const success_rate = Math.round((successes / iterations) * 100);

    return { avg_ms, success_rate };
  }

  /**
   * Imprime comparação detalhada
   */
  private printComparison(oss: PerformanceResult, cloud: PerformanceResult): void {
    console.log('\n' + '='.repeat(60));
    console.log('🏆 COMPARAÇÃO DE PERFORMANCE');
    console.log('='.repeat(60));

    console.log('\n📊 LATÊNCIA MÉDIA (menor é melhor):');
    console.log(`  Add Memory:    OSS ${oss.operations.add_memory.avg_ms}ms  vs  Cloud ${cloud.operations.add_memory.avg_ms}ms`);
    console.log(`  Search Memory: OSS ${oss.operations.search_memory.avg_ms}ms  vs  Cloud ${cloud.operations.search_memory.avg_ms}ms`);
    console.log(`  List Memories: OSS ${oss.operations.list_memories.avg_ms}ms  vs  Cloud ${cloud.operations.list_memories.avg_ms}ms`);

    console.log('\n📈 TAXA DE SUCESSO (maior é melhor):');
    console.log(`  Add Memory:    OSS ${oss.operations.add_memory.success_rate}%  vs  Cloud ${cloud.operations.add_memory.success_rate}%`);
    console.log(`  Search Memory: OSS ${oss.operations.search_memory.success_rate}%  vs  Cloud ${cloud.operations.search_memory.success_rate}%`);
    console.log(`  List Memories: OSS ${oss.operations.list_memories.success_rate}%  vs  Cloud ${cloud.operations.list_memories.success_rate}%`);

    // Calcular vencedores
    const ossAvgLatency = (oss.operations.add_memory.avg_ms + oss.operations.search_memory.avg_ms + oss.operations.list_memories.avg_ms) / 3;
    const cloudAvgLatency = (cloud.operations.add_memory.avg_ms + cloud.operations.search_memory.avg_ms + cloud.operations.list_memories.avg_ms) / 3;
    
    const ossAvgSuccess = (oss.operations.add_memory.success_rate + oss.operations.search_memory.success_rate + oss.operations.list_memories.success_rate) / 3;
    const cloudAvgSuccess = (cloud.operations.add_memory.success_rate + cloud.operations.search_memory.success_rate + cloud.operations.list_memories.success_rate) / 3;

    console.log('\n🏁 RESULTADOS FINAIS:');
    console.log(`  Latência Média:  OSS ${Math.round(ossAvgLatency)}ms  vs  Cloud ${Math.round(cloudAvgLatency)}ms  ${ossAvgLatency < cloudAvgLatency ? '🏆 OSS VENCE' : '🏆 CLOUD VENCE'}`);
    console.log(`  Confiabilidade:  OSS ${Math.round(ossAvgSuccess)}%  vs  Cloud ${Math.round(cloudAvgSuccess)}%  ${ossAvgSuccess > cloudAvgSuccess ? '🏆 OSS VENCE' : '🏆 CLOUD VENCE'}`);

    console.log('\n💰 CUSTO:');
    console.log(`  OSS Local:  $0.00 (sem custos)`);
    console.log(`  Mem0 Cloud: $0.00 (tier gratuito)*`);
    console.log(`  * Sujeito a limites de uso`);

    console.log('\n🎯 RECOMENDAÇÃO:');
    if (ossAvgLatency < cloudAvgLatency && ossAvgSuccess >= cloudAvgSuccess) {
      console.log(`  ✅ OSS LOCAL - Melhor performance e controle total`);
    } else if (cloudAvgSuccess > ossAvgSuccess) {
      console.log(`  ⚠️  HÍBRIDO - OSS para desenvolvimento, Cloud para produção`);
    } else {
      console.log(`  📊 EMPATE - Ambos são viáveis, OSS oferece mais controle`);
    }
  }

  /**
   * Testa conectividade básica
   */
  async testConnectivity(): Promise<void> {
    console.log('🔌 Testando conectividade...\n');

    // Teste OSS
    try {
      const health = await this.ossMemory.checkBridgeHealth();
      console.log(`OSS Local: ${health.healthy ? '✅ Conectado' : '❌ Falhou'}`);
      if (health.details) {
        console.log(`  Detalhes: ${JSON.stringify(health.details, null, 2)}`);
      }
    } catch (error) {
      console.log(`OSS Local: ❌ Erro - ${error.message}`);
    }

    // Teste Cloud (verificação simples)
    try {
      const hasApiKey = !!process.env.MEM0_API_KEY;
      console.log(`Mem0 Cloud: ${hasApiKey ? '✅ API Key configurada' : '⚠️  API Key não configurada'}`);
    } catch (error) {
      console.log(`Mem0 Cloud: ❌ Erro - ${error.message}`);
    }
  }
}

// Executar teste se chamado diretamente
if (require.main === module) {
  const comparison = new PerformanceComparison();
  
  comparison.testConnectivity().then(async () => {
    console.log('\n');
    await comparison.runComparison();
    
    console.log('\n✅ Teste de performance concluído!');
    console.log('🚀 Para usar OSS: GuardianMemoryManagerOSS');
    console.log('☁️  Para usar Cloud: GuardianMemoryManager (original)');
    
    process.exit(0);
  }).catch(error => {
    console.error('❌ Erro no teste:', error);
    process.exit(1);
  });
}