#!/usr/bin/env node
/**
 * Debug MCP Response Structure
 */

import { successResponse } from './build/utils.js';

// Testar a função successResponse
console.log('=== Testando successResponse ===\n');

const testData = {
  id: 'test-123',
  content: 'Memória de teste',
  user_id: 'guardian',
  created_at: new Date().toISOString()
};

const response = successResponse(testData, 'Teste executado com sucesso');

console.log('Resposta completa:');
console.log(JSON.stringify(response, null, 2));

console.log('\nVerificações:');
console.log('- response tem content?', !!response.content);
console.log('- content é array?', Array.isArray(response.content));
console.log('- tamanho do content:', response.content?.length || 0);
console.log('- tipo do primeiro item:', response.content?.[0]?.type);

// Testar o que o MCP espera
console.log('\n=== Formato esperado pelo MCP ===');
const mcpFormat = {
  content: [
    {
      type: 'text',
      text: 'Resultado da operação'
    }
  ]
};

console.log(JSON.stringify(mcpFormat, null, 2));

// Testar cenários diferentes
console.log('\n=== Testando diferentes cenários ===');

// 1. Apenas string
const response1 = successResponse('Apenas uma string simples');
console.log('\n1. String simples:');
console.log('content:', response1.content);

// 2. Objeto complexo
const response2 = successResponse(
  { data: [1, 2, 3], info: 'teste' },
  'Com mensagem'
);
console.log('\n2. Objeto complexo:');
console.log('content:', response2.content);