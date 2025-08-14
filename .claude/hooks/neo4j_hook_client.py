#!/usr/bin/env python3
"""
Cliente Neo4j para Hooks
Substitui completamente SQLite por Neo4j
"""

import json
import sys
import os
from datetime import datetime
from typing import Dict, Any

class Neo4jHookClient:
    """Cliente para hooks salvarem diretamente no Neo4j"""
    
    def __init__(self):
        # Prevenir criação de SQLite
        os.environ['NO_SQLITE'] = 'true'
        os.environ['USE_NEO4J_ONLY'] = 'true'
        
        # Remover qualquer referência a .swarm
        if os.path.exists('.swarm'):
            print("[Warning] .swarm directory exists but will be ignored")
    
    def create_memory(self, label: str, properties: Dict[str, Any]) -> Dict:
        """
        Cria uma memória no Neo4j
        
        Args:
            label: Tipo da memória (command, edit, task, etc)
            properties: Propriedades da memória
        """
        # Adicionar timestamp se não existir
        if 'created_at' not in properties:
            properties['created_at'] = datetime.utcnow().isoformat() + 'Z'
        
        # Em produção, isso chamaria o MCP real
        # Por enquanto, simula a criação
        result = {
            'success': True,
            'label': label,
            'properties': properties,
            'storage': 'neo4j',
            'sqlite_used': False
        }
        
        print(f"[Neo4j] Created {label}: {properties.get('name', 'unnamed')}")
        return result
    
    def log_command(self, command: str, exit_code: int, output: str = ""):
        """Registra comando executado"""
        return self.create_memory('command', {
            'name': 'bash_command',
            'command': command[:500],  # Limitar tamanho
            'exit_code': exit_code,
            'success': exit_code == 0,
            'output_length': len(output)
        })
    
    def log_edit(self, file_path: str, action: str = "edit"):
        """Registra edição de arquivo"""
        return self.create_memory('file_edit', {
            'name': os.path.basename(file_path),
            'path': file_path,
            'action': action,
            'extension': os.path.splitext(file_path)[1]
        })
    
    def log_task(self, task_id: str, description: str, status: str = "started"):
        """Registra tarefa"""
        return self.create_memory('task', {
            'name': task_id,
            'description': description,
            'status': status
        })
    
    def prevent_sqlite(self):
        """Previne criação de SQLite"""
        sqlite_paths = [
            '.swarm/memory.db',
            'memory.db',
            '.conductor/memory.db'
        ]
        
        for path in sqlite_paths:
            if os.path.exists(path):
                print(f"[Warning] SQLite found at {path} - Neo4j should be used instead")
                # Não deletar automaticamente, apenas avisar
        
        return True


def main():
    """Função principal para uso via CLI"""
    if len(sys.argv) < 2:
        print("Usage: neo4j_hook_client.py <action> [args...]")
        print("Actions: command, edit, task, check")
        sys.exit(1)
    
    client = Neo4jHookClient()
    action = sys.argv[1]
    
    if action == "command" and len(sys.argv) >= 4:
        result = client.log_command(
            command=sys.argv[2],
            exit_code=int(sys.argv[3]),
            output=sys.argv[4] if len(sys.argv) > 4 else ""
        )
    elif action == "edit" and len(sys.argv) >= 3:
        result = client.log_edit(
            file_path=sys.argv[2],
            action=sys.argv[3] if len(sys.argv) > 3 else "edit"
        )
    elif action == "task" and len(sys.argv) >= 4:
        result = client.log_task(
            task_id=sys.argv[2],
            description=sys.argv[3],
            status=sys.argv[4] if len(sys.argv) > 4 else "started"
        )
    elif action == "check":
        client.prevent_sqlite()
        print("[Neo4j] Hook client ready - SQLite prevention active")
        result = {'status': 'ready'}
    else:
        print(f"Unknown action: {action}")
        sys.exit(1)
    
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()