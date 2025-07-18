#!/usr/bin/env python3
"""
Teste rápido do Guardian Agent HTTP Server
Verifica se tudo está funcionando antes de iniciar o servidor completo
"""

import sys
from pathlib import Path

def test_guardian_dependencies():
    """Testa se as dependências do Guardian estão disponíveis."""
    print("🔍 Testando dependências do Guardian...")
    
    try:
        import uvicorn
        print("✅ uvicorn: OK")
    except ImportError:
        print("❌ uvicorn: FALTANDO (pip install uvicorn)")
        return False
    
    try:
        import a2a
        print("✅ a2a: OK")
    except ImportError:
        print("❌ a2a: FALTANDO (pip install a2a)")
        return False
    
    # Verificar arquivos do Guardian
    guardian_path = Path(__file__).parent / "backup-reorganized/active-prototypes/a2a_mcp/src/a2a_mcp/guardian"
    if guardian_path.exists():
        print("✅ Guardian files: OK")
    else:
        print("❌ Guardian files: NÃO ENCONTRADOS")
        return False
    
    print("\n🎉 Todas as dependências estão OK!")
    return True

def show_guardian_info():
    """Mostra informações sobre o Guardian."""
    print("\n🛡️ GUARDIAN AGENT - INFORMAÇÕES")
    print("=" * 50)
    print("📍 Porta: http://localhost:10102/")
    print("🎯 Função: Monitor de Sustentabilidade A2A")
    print("🔄 Status: Será sempre ativo (daemon)")
    print("\n📋 Comandos disponíveis:")
    print("  • status    - Status geral do Guardian")
    print("  • health    - Health check completo")
    print("  • agents    - Lista agentes monitorados")
    print("  • budget    - Relatório carbon budget")
    print("  • entropy   - Análise entropia sistema")
    print("  • analyze   - Análise sustentabilidade")
    print("\n🚀 Para iniciar:")
    print("  ./guardian_always_active.sh")
    print("\n⚖️ Comparação com outros agentes:")
    print("  🌍 HelloWorld:   http://localhost:9999/  (ativo)")
    print("  🎭 Orchestrator: http://localhost:10101/ (inativo)")
    print("  🛡️ Guardian:     http://localhost:10102/ (será ativo)")

if __name__ == "__main__":
    print("🛡️ GUARDIAN AGENT - TESTE DE CONFIGURAÇÃO\n")
    
    if test_guardian_dependencies():
        show_guardian_info()
        print("\n✅ Guardian está pronto para ser iniciado!")
        print("🚀 Execute: ./guardian_always_active.sh")
    else:
        print("\n❌ Guardian não pode ser iniciado devido a dependências faltando")
        print("💡 Instale as dependências e tente novamente")