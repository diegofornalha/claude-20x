#!/usr/bin/env node

console.log('Testando inicialização do DiegoTools...');
const startTime = Date.now();

// Teste simples - apenas verificar se o servidor responde
const { spawn } = require('child_process');
const path = require('path');

const serverPath = path.join(__dirname, 'build', 'index.js');
const child = spawn('node', [serverPath], {
  stdio: ['pipe', 'pipe', 'pipe']
});

// Enviar requisição de teste
const testRequest = JSON.stringify({
  jsonrpc: '2.0',
  method: 'tools/list',
  id: 1
}) + '\n';

let responded = false;

child.stdout.on('data', (data) => {
  if (!responded) {
    responded = true;
    const elapsed = Date.now() - startTime;
    console.log(`✓ Servidor respondeu em ${elapsed}ms`);
    console.log('Resposta:', data.toString().substring(0, 100) + '...');
    child.kill();
    process.exit(0);
  }
});

child.stderr.on('data', (data) => {
  console.error('Erro do servidor:', data.toString());
});

child.on('error', (error) => {
  console.error('✗ Erro ao iniciar servidor:', error);
  process.exit(1);
});

// Enviar requisição após um pequeno delay
setTimeout(() => {
  child.stdin.write(testRequest);
}, 100);

// Timeout de 5 segundos
setTimeout(() => {
  if (!responded) {
    console.error('✗ Timeout - servidor não respondeu em 5 segundos');
    child.kill();
    process.exit(1);
  }
}, 5000);