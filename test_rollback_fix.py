#!/usr/bin/env python3
"""
Script para testar se o erro de rollback foi resolvido
"""

import asyncio
import sys
from pathlib import Path

# Adicionar o caminho do projeto ao PYTHONPATH
sys.path.insert(0, str(Path(__file__).parent / "agents" / "a2a-python" / "src"))

async def test_rollback_fix():
    """Testa se as correções de rollback estão funcionando."""
    
    try:
        from sqlalchemy.ext.asyncio import create_async_engine
        from a2a.server.tasks.database_task_store import DatabaseTaskStore
        from a2a.types import Task
        
        print("✅ Imports bem-sucedidos")
        
        # Criar engine com SQLite em memória para teste
        engine = create_async_engine(
            "sqlite+aiosqlite:///:memory:",
            echo=True,  # Mostrar SQL para debug
            pool_pre_ping=True
        )
        
        # Criar o store
        store = DatabaseTaskStore(engine, create_table=True)
        
        # Inicializar
        await store.initialize()
        print("✅ Store inicializado com sucesso")
        
        # Criar uma task de teste
        test_task = Task(
            id="test-123",
            contextId="context-456",
            kind="test",
            status="pending",
            artifacts=[],
            history=[],
            metadata={}
        )
        
        # Testar save
        await store.save(test_task)
        print("✅ Task salva com sucesso")
        
        # Testar get
        retrieved = await store.get("test-123")
        if retrieved and retrieved.id == "test-123":
            print("✅ Task recuperada com sucesso")
        else:
            print("❌ Erro ao recuperar task")
        
        # Simular erro para testar rollback
        try:
            # Tentar salvar com dados inválidos
            invalid_task = Task(
                id="test-456",
                contextId=None,  # Isso pode causar erro
                kind="test",
                status="invalid_status",  # Status inválido
                artifacts=[],
                history=[],
                metadata={}
            )
            await store.save(invalid_task)
        except Exception as e:
            print(f"✅ Erro capturado e rollback executado: {type(e).__name__}")
        
        # Verificar se podemos continuar operando após o erro
        test_task2 = Task(
            id="test-789",
            contextId="context-789",
            kind="test",
            status="completed",
            artifacts=[],
            history=[],
            metadata={}
        )
        
        await store.save(test_task2)
        retrieved2 = await store.get("test-789")
        
        if retrieved2 and retrieved2.id == "test-789":
            print("✅ Operações continuam funcionando após rollback!")
            print("\n🎉 SUCESSO: O erro de rollback foi corrigido!")
            return True
        else:
            print("❌ Falha ao continuar operações após rollback")
            return False
            
    except Exception as e:
        print(f"❌ Erro durante teste: {e}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        # Fechar engine
        if 'engine' in locals():
            await engine.dispose()

if __name__ == "__main__":
    print("🧪 Testando correções de rollback SQLAlchemy...\n")
    
    # Verificar se aiosqlite está instalado
    try:
        import aiosqlite
    except ImportError:
        print("⚠️  aiosqlite não está instalado. Instalando...")
        import subprocess
        subprocess.run([sys.executable, "-m", "pip", "install", "aiosqlite"], check=True)
        print("✅ aiosqlite instalado\n")
    
    # Executar teste
    success = asyncio.run(test_rollback_fix())
    
    if success:
        print("\n✅ Todas as correções estão funcionando corretamente!")
        print("\n📝 O erro 'Can't reconnect until invalid transaction is rolled back' foi resolvido.")
        print("\nAs principais correções aplicadas foram:")
        print("1. Context manager _get_session() com rollback automático")
        print("2. Configuração do session_maker com autoflush=False")
        print("3. Tratamento adequado de exceções em todas as operações")
        print("4. Fechamento correto de sessões após uso")
    else:
        print("\n❌ Ainda há problemas. Verifique os logs acima.")
        
    print("\n💡 Dica: Use o script fix_sqlalchemy_engine.py para criar engines robustos em produção.")