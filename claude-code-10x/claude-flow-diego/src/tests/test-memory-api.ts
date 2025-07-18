#!/usr/bin/env node
/**
 * Teste do Memory Enhanced Agent usando API REST do Mem0
 */

import { logAgent } from './agents/agent-log';
import { AgentType } from './core/base-agent';

const MEM0_API_KEY = process.env.MEM0_API_KEY || 'm0-6gLgoXjFJVWtlY9t8T7rgKYf2QWwXDvNUf37efTp';
const MEM0_API_BASE = 'https://api.mem0.ai/v1';

async function testMemoryAgent() {
    console.log('🧠 Iniciando teste do Memory Enhanced Agent...\n');
    
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
        
        // Executar busca via API
        const response = await fetch(`${MEM0_API_BASE}/memories/search/`, {
            method: 'POST',
            headers: {
                'Authorization': `Token ${MEM0_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                query: 'organização projetos estrutura',
                user_id: 'AgentLog',
                limit: 10
            })
        });
        
        const data = await response.json();
        const results = data.results || [];
        
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
            results.slice(0, 3).forEach((result: any, index: number) => {
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
    
    // Tarefa 2: Listar memórias recentes
    const listTaskId = `memory-list-${Date.now()}`;
    
    try {
        console.log('\n\n📋 Listando memórias recentes...');
        
        await logAgent.start(
            'Memory Enhanced Agent',
            AgentType.CUSTOM,
            listTaskId,
            'Listar memórias recentes do AgentLog',
            {
                taskType: 'memory-list',
                complexity: 'simple'
            }
        );
        
        const startTime = Date.now();
        
        // Listar memórias
        const response = await fetch(`${MEM0_API_BASE}/memories/?user_id=AgentLog&limit=5`, {
            headers: {
                'Authorization': `Token ${MEM0_API_KEY}`
            }
        });
        
        const data = await response.json();
        const memories = data.results || [];
        
        const duration = Date.now() - startTime;
        console.log(`✅ Listagem concluída em ${duration}ms`);
        console.log(`📊 Total de memórias: ${memories.length}`);
        
        await logAgent.end(
            'Memory Enhanced Agent',
            listTaskId,
            'completed',
            undefined,
            {
                duration,
                memoriesFound: memories.length
            }
        );
        
        // Mostrar memórias
        if (memories.length > 0) {
            console.log('\nMemórias recentes:');
            memories.forEach((mem: any, index: number) => {
                console.log(`${index + 1}. ${mem.memory.substring(0, 80)}...`);
            });
        }
        
    } catch (error: any) {
        console.error('❌ Erro ao listar:', error.message);
        
        await logAgent.end(
            'Memory Enhanced Agent',
            listTaskId,
            'error',
            error.message
        );
    }
    
    console.log('\n\n🎉 Teste concluído! Verifique o dashboard em http://localhost:5001 para ver as métricas.');
}

// Executar teste
testMemoryAgent().catch(console.error);