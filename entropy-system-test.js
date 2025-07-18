// Teste do Sistema de Controle de Entropia A2A
const { demonstrateEntropyControl } = require('./a2a-entropy-integration');

async function runQuickTest() {
  console.log('🧪 === TESTE RÁPIDO DO SISTEMA DE ENTROPIA ===\n');
  
  try {
    // Inicializar sistema
    const integration = await demonstrateEntropyControl();
    
    // Aguardar alguns ciclos de simulação
    console.log('⏱️ Aguardando 30 segundos para coletar dados...\n');
    await new Promise(resolve => setTimeout(resolve, 30000));
    
    // Verificar status atual
    const status = await integration.getEntropyStatus();
    console.log('📊 STATUS ATUAL DO SISTEMA:');
    console.log(JSON.stringify(status, null, 2));
    console.log('\n');
    
    // Simular situação de alta entropia
    console.log('🔥 Simulando alta entropia...');
    await integration.forceScaling('scale_up', 10);
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    const highEntropyStatus = await integration.getEntropyStatus();
    console.log('📈 STATUS COM ALTA ENTROPIA:');
    console.log(JSON.stringify(highEntropyStatus, null, 2));
    console.log('\n');
    
    // Executar limpeza
    console.log('🧹 Executando limpeza automática...');
    const cleanupResult = await integration.executeManualCleanup('comprehensive', 'aggressive');
    console.log('✅ RESULTADO DA LIMPEZA:');
    console.log(JSON.stringify(cleanupResult, null, 2));
    console.log('\n');
    
    // Status final
    const finalStatus = await integration.getEntropyStatus();
    console.log('🎯 STATUS FINAL:');
    console.log(JSON.stringify(finalStatus, null, 2));
    
    console.log('\n✅ Teste concluído com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  }
}

// Executar teste se chamado diretamente
if (require.main === module) {
  runQuickTest();
}

module.exports = { runQuickTest };