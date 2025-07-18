#!/usr/bin/env node
/**
 * Teste simples do Memory Agent com AgentLog
 */

import { Memory } from 'mem0';
import { logAgent } from './agents/agent-log';
import { AgentType } from './core/base-agent';

async function testMemoryAgent() {
    console.log('🧠 Iniciando teste do Memory Enhanced Agent...\n');
    
    // Criar memória
    const memory = new Memory({ 
        config: { 
            api_key: process.env.MEM0_API_KEY || 'm0-6gLgoXjFJVWtlY9t8T7rgKYf2QWwXDvNUf37efTp' 
        } 
    });
    
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
        const results = await memory.search(
            'organização projetos estrutura',
            { user_id: 'AgentLog', limit: 10 }
        );
        
        const duration = Date.now() - startTime;
        console.log(`✅ Busca concluída em ${duration}ms`);
        console.log(`📊 Encontrados ${results.length} resultados\n`);
        
        // Registrar conclusão com sucesso
        await logAgent.end(
            'Memory Enhanced Agent',
            searchTaskId,
            'completed',
            undefined,
            {
                resultsFound: results.length,
                searchDuration: duration,
                topResult: results[0]?.memory || 'Nenhum resultado'
            }
        );
        
        // Mostrar alguns resultados
        if (results.length > 0) {
            console.log('📋 Top 3 resultados:');
            results.slice(0, 3).forEach((result, index) => {
                console.log(`\n${index + 1}. ${result.memory.substring(0, 100)}...`);
                if (result.score) {
                    console.log(`   Relevância: ${(result.score * 100).toFixed(1)}%`);
                }
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
    
    // Tarefa 2: Adicionar nova memória
    const addTaskId = `memory-add-${Date.now()}`;
    
    try {
        console.log('\n\n📝 Adicionando nova memória de teste...');
        
        await logAgent.start(
            'Memory Enhanced Agent',
            AgentType.CUSTOM,
            addTaskId,
            'Adicionar memória sobre execução de teste',
            {
                taskType: 'memory-add',
                complexity: 'simple'
            }
        );
        
        const startTime = Date.now();
        
        // Adicionar memória
        await memory.add(
            'Teste do Memory Enhanced Agent executado com sucesso. O AgentLog está registrando métricas de busca e consolidação.',
            { user_id: 'TestAgent' }
        );
        
        const duration = Date.now() - startTime;
        console.log(`✅ Memória adicionada em ${duration}ms`);
        
        await logAgent.end(
            'Memory Enhanced Agent',
            addTaskId,
            'completed',
            undefined,
            {
                duration,
                memoryType: 'test-execution'
            }
        );
        
    } catch (error: any) {
        console.error('❌ Erro ao adicionar memória:', error.message);
        
        await logAgent.end(
            'Memory Enhanced Agent',
            addTaskId,
            'error',
            error.message
        );
    }
    
    console.log('\n\n🎉 Teste concluído! Verifique o dashboard em http://localhost:5001 para ver as métricas.');
}

// Executar teste
testMemoryAgent().catch(console.error);