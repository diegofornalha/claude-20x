#!/usr/bin/env node
/**
 * Teste do Memory Enhanced Agent
 * Executa uma busca em memórias para demonstrar o AgentLog
 */

import { createAgentMemory } from './agents/memory-enhanced-agents';
import { logAgent } from './agents/agent-log';
import { AgentType } from './core/base-agent';

async function testMemoryAgent() {
    console.log('🧠 Iniciando teste do Memory Enhanced Agent...\n');
    
    // Criar instância do agente
    const memory = createAgentMemory('TestAgent');
    
    // Tarefa 1: Busca em memórias
    const searchTaskId = `memory-search-${Date.now()}`;
    
    try {
        // Registrar início da busca
        await logAgent.start(
            'Memory Enhanced Agent',
            AgentType.CUSTOM,
            searchTaskId,
            'Busca por memórias sobre organização de projetos',
            {
                taskType: 'memory-search',
                complexity: 'simple',
                searchQuery: 'organização projetos estrutura'
            }
        );
        
        console.log('🔍 Executando busca em memórias...');
        const startTime = Date.now();
        
        // Executar busca
        const results = await memory.recall('organização projetos estrutura');
        
        const duration = Date.now() - startTime;
        console.log(`✅ Busca concluída em ${duration}ms`);
        console.log(`📊 Encontrados ${results.results.length} resultados\n`);
        
        // Registrar conclusão com sucesso
        await logAgent.end(
            'Memory Enhanced Agent',
            searchTaskId,
            'completed',
            undefined,
            {
                resultsFound: results.results.length,
                searchDuration: duration,
                topResult: results.results[0]?.content || 'Nenhum resultado'
            }
        );
        
        // Mostrar alguns resultados
        if (results.results.length > 0) {
            console.log('📋 Top 3 resultados:');
            results.results.slice(0, 3).forEach((result, index) => {
                console.log(`\n${index + 1}. ${result.content.substring(0, 100)}...`);
                console.log(`   Relevância: ${(result.score * 100).toFixed(1)}%`);
            });
        }
        
    } catch (error: any) {
        console.error('❌ Erro na busca:', error.message);
        
        // Registrar erro
        await logAgent.end(
            'Memory Enhanced Agent',
            searchTaskId,
            'error',
            error.message
        );
    }
    
    // Tarefa 2: Consolidação de memórias (simulada)
    const consolidationTaskId = `memory-consolidation-${Date.now()}`;
    
    try {
        console.log('\n\n📚 Iniciando consolidação de memórias...');
        
        await logAgent.start(
            'Memory Enhanced Agent',
            AgentType.CUSTOM,
            consolidationTaskId,
            'Consolidação de memórias duplicadas sobre AgentLog',
            {
                taskType: 'memory-consolidation',
                complexity: 'complex',
                targetTopic: 'AgentLog'
            }
        );
        
        // Simular processo de consolidação
        console.log('🔄 Analisando memórias existentes...');
        await new Promise(resolve => setTimeout(resolve, 2000)); // Simular trabalho
        
        console.log('🔀 Identificando duplicatas...');
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        console.log('✨ Consolidando informações...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const totalDuration = 4500;
        console.log(`\n✅ Consolidação concluída em ${totalDuration}ms`);
        
        // Registrar conclusão
        await logAgent.end(
            'Memory Enhanced Agent',
            consolidationTaskId,
            'completed',
            undefined,
            {
                memoriesAnalyzed: 17,
                memoriesConsolidated: 5,
                spaceSaved: '65%',
                duration: totalDuration
            }
        );
        
        console.log('📊 Resultado da consolidação:');
        console.log('   - 17 memórias analisadas');
        console.log('   - 5 memórias consolidadas');
        console.log('   - 65% de redução no armazenamento');
        
    } catch (error: any) {
        console.error('❌ Erro na consolidação:', error.message);
        
        await logAgent.end(
            'Memory Enhanced Agent',
            consolidationTaskId,
            'error',
            error.message
        );
    }
    
    console.log('\n\n🎉 Teste concluído! Verifique o dashboard para ver as métricas.');
}

// Executar teste
testMemoryAgent().catch(console.error);