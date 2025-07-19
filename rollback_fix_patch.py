#!/usr/bin/env python3
"""
Script para corrigir o erro de rollback do SQLAlchemy
Aplica as correções necessárias ao DatabaseTaskStore
"""

import os
import shutil
from pathlib import Path

def apply_rollback_fix():
    """Aplica as correções de rollback ao código existente."""
    
    # Caminho do arquivo original
    original_file = Path("/Users/agents/Desktop/claude-20x/agents/a2a-python/src/a2a/server/tasks/database_task_store.py")
    
    if not original_file.exists():
        print(f"❌ Arquivo não encontrado: {original_file}")
        return False
    
    # Backup do arquivo original
    backup_file = original_file.with_suffix('.py.backup')
    shutil.copy2(original_file, backup_file)
    print(f"✅ Backup criado: {backup_file}")
    
    # Ler o conteúdo original
    content = original_file.read_text()
    
    # Aplicar correções
    
    # 1. Adicionar imports necessários
    new_imports = """import logging
from contextlib import asynccontextmanager
from typing import AsyncGenerator

"""
    content = content.replace("import logging\n\n\n", new_imports)
    
    # 2. Adicionar imports de exceções
    old_import = "from sqlalchemy import delete, select"
    new_import = "from sqlalchemy import delete, select\n    from sqlalchemy.exc import OperationalError, DBAPIError"
    content = content.replace(old_import, new_import)
    
    # 3. Atualizar configuração do session maker
    old_session_maker = """        self.async_session_maker = async_sessionmaker(
            self.engine, expire_on_commit=False
        )"""
    new_session_maker = """        self.async_session_maker = async_sessionmaker(
            self.engine,
            expire_on_commit=False,
            class_=AsyncSession,
            autoflush=False,  # Prevent auto-flush issues
            autocommit=False  # Explicit transaction control
        )"""
    content = content.replace(old_session_maker, new_session_maker)
    
    # 4. Adicionar método _get_session após __init__
    session_method = '''
    @asynccontextmanager
    async def _get_session(self) -> AsyncGenerator[AsyncSession, None]:
        """Context manager for safe session handling with automatic rollback."""
        async with self.async_session_maker() as session:
            try:
                yield session
                await session.commit()
            except Exception as e:
                await session.rollback()
                logger.error(f"Database operation failed: {e}")
                raise
            finally:
                await session.close()
'''
    
    # Inserir após o método __init__
    init_end = content.find("    async def initialize(self) -> None:")
    if init_end != -1:
        content = content[:init_end] + session_method + "\n" + content[init_end:]
    
    # 5. Atualizar método save
    old_save = '''    async def save(self, task: Task) -> None:
        """Saves or updates a task in the database."""
        await self._ensure_initialized()
        db_task = self._to_orm(task)
        async with self.async_session_maker.begin() as session:
            await session.merge(db_task)
            logger.debug(f'Task {task.id} saved/updated successfully.')'''
    
    new_save = '''    async def save(self, task: Task) -> None:
        """Saves or updates a task in the database with proper error handling."""
        await self._ensure_initialized()
        db_task = self._to_orm(task)
        
        async with self._get_session() as session:
            await session.merge(db_task)
            logger.debug(f'Task {task.id} saved/updated successfully.')'''
    
    content = content.replace(old_save, new_save)
    
    # 6. Atualizar método get
    old_get_start = '''    async def get(self, task_id: str) -> Task | None:
        """Retrieves a task from the database by ID."""
        await self._ensure_initialized()
        async with self.async_session_maker() as session:'''
    
    new_get_start = '''    async def get(self, task_id: str) -> Task | None:
        """Retrieves a task from the database by ID with proper error handling."""
        await self._ensure_initialized()
        
        async with self._get_session() as session:'''
    
    content = content.replace(old_get_start, new_get_start)
    
    # 7. Atualizar método delete
    old_delete = '''    async def delete(self, task_id: str) -> None:
        """Deletes a task from the database by ID."""
        await self._ensure_initialized()

        async with self.async_session_maker.begin() as session:'''
    
    new_delete = '''    async def delete(self, task_id: str) -> None:
        """Deletes a task from the database by ID with proper error handling."""
        await self._ensure_initialized()

        async with self._get_session() as session:'''
    
    content = content.replace(old_delete, new_delete)
    
    # Salvar o arquivo corrigido
    original_file.write_text(content)
    print(f"✅ Correções aplicadas em: {original_file}")
    
    # Criar script de configuração do engine
    engine_config = Path("/Users/agents/Desktop/claude-20x/fix_sqlalchemy_engine.py")
    engine_config.write_text('''#!/usr/bin/env python3
"""
Exemplo de como criar um engine robusto para evitar erros de transação
"""

from sqlalchemy.ext.asyncio import create_async_engine, AsyncEngine

def create_robust_engine(database_url: str) -> AsyncEngine:
    """Cria um AsyncEngine com configuração robusta."""
    
    # Configurações específicas por tipo de banco
    connect_args = {}
    
    if "postgresql" in database_url:
        connect_args = {
            "server_settings": {"jit": "off"},
            "command_timeout": 60,
            "options": "-c statement_timeout=60000"  # 60 segundos
        }
    elif "mysql" in database_url:
        connect_args = {
            "connect_timeout": 60,
        }
    
    return create_async_engine(
        database_url,
        echo=False,  # Mude para True para debug SQL
        pool_pre_ping=True,  # Verifica conexões antes de usar
        pool_recycle=3600,  # Recicla conexões após 1 hora
        pool_size=5,
        max_overflow=10,
        connect_args=connect_args
    )

# Exemplo de uso:
if __name__ == "__main__":
    # Para PostgreSQL
    engine = create_robust_engine("postgresql+asyncpg://user:pass@localhost/db")
    
    # Para MySQL
    # engine = create_robust_engine("mysql+aiomysql://user:pass@localhost/db")
    
    # Para SQLite (desenvolvimento)
    # engine = create_robust_engine("sqlite+aiosqlite:///./test.db")
    
    print("Engine criado com configuração robusta!")
''')
    print(f"✅ Script de configuração criado: {engine_config}")
    
    return True

if __name__ == "__main__":
    print("🔧 Aplicando correções de rollback SQLAlchemy...")
    if apply_rollback_fix():
        print("\n✅ Correções aplicadas com sucesso!")
        print("\n📝 Próximos passos:")
        print("1. Reinicie sua aplicação")
        print("2. Se usar create_async_engine, considere usar create_robust_engine do script fix_sqlalchemy_engine.py")
        print("3. Monitore os logs para verificar se o erro foi resolvido")
    else:
        print("\n❌ Erro ao aplicar correções")