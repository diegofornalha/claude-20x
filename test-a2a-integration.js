#!/usr/bin/env node

/**
 * Teste de integração A2A - Valida se o servidor funciona
 */

import { spawn } from 'child_process';
import path from 'path';

const A2A_SERVER_PATH = './mcp-a2a-specialist/build/index.js';

async function testA2AServer() {
  console.log('🧪 Testando MCP A2A Specialist Server...');
  console.log('=' * 50);
  
  return new Promise((resolve, reject) => {
    // Spawn the A2A server
    const serverProcess = spawn('node', [A2A_SERVER_PATH], {
      env: {
        ...process.env,
        NEO4J_URI: 'bolt://localhost:7687',
        NEO4J_USERNAME: 'neo4j',
        NEO4J_PASSWORD: 'claude-flow-2025'
      },
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let output = '';
    let errorOutput = '';

    serverProcess.stdout.on('data', (data) => {
      output += data.toString();
      console.log('📊 Output:', data.toString().trim());
    });

    serverProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
      console.error('❌ Error:', data.toString().trim());
    });

    // Test with sample MCP call
    setTimeout(() => {
      console.log('📋 Enviando teste de lista de tools...');
      
      const testMessage = JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/list',
        params: {}
      }) + '\n';

      serverProcess.stdin.write(testMessage);
    }, 2000);

    // Timeout and result evaluation
    setTimeout(() => {
      serverProcess.kill();
      
      console.log('\n📊 RESULTADO DO TESTE:');
      console.log('=' * 50);
      
      if (output.includes('MCP A2A Specialist Server started')) {
        console.log('✅ Servidor iniciou corretamente');
      } else {
        console.log('❌ Servidor falhou ao iniciar');
      }
      
      if (output.includes('Neo4j') && output.includes('connected')) {
        console.log('✅ Conexão Neo4j estabelecida');
      } else {
        console.log('❌ Problemas na conexão Neo4j');
      }
      
      if (output.includes('tools') || output.includes('register_a2a_agent')) {
        console.log('✅ Tools MCP disponíveis');
      } else {
        console.log('❌ Tools MCP não detectadas');
      }

      const success = output.includes('started') && !errorOutput.includes('Error:');
      
      if (success) {
        console.log('\n🎉 TESTE PASSOU! A2A Server funcionando corretamente');
        resolve(true);
      } else {
        console.log('\n❌ TESTE FALHOU! Verificar logs acima');
        resolve(false);
      }
    }, 5000);

    serverProcess.on('error', (error) => {
      console.error('❌ Erro ao iniciar servidor:', error);
      reject(error);
    });
  });
}

// Executar teste
testA2AServer()
  .then(success => {
    if (success) {
      console.log('\n✅ Integração A2A validada com sucesso!');
      process.exit(0);
    } else {
      console.log('\n❌ Integração A2A requer correções');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('\n💥 Erro durante teste:', error);
    process.exit(1);
  });
