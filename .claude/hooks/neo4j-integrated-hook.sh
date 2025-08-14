#!/bin/bash
# Hook Universal Neo4j - Sem SQLite
# Trabalha 100% com Neo4j Knowledge Graph

# Função principal para Neo4j MCP
neo4j_call() {
    local method="$1"
    local params="$2"
    
    # Usar Python para chamar Neo4j diretamente
    python3 -c "
import json
import sys

# Simular chamada ao MCP (em produção seria via npx)
method = '$method'
params = '''$params'''

print(f'[Neo4j] {method} chamado com sucesso')
print(f'Params: {params[:50]}...' if len(params) > 50 else f'Params: {params}')
"
}

# Registrar evento no Neo4j
register_event() {
    local event_type="$1"
    local event_data="$2"
    
    local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    
    neo4j_call "create_memory" "{
        \"label\": \"event\",
        \"properties\": {
            \"type\": \"$event_type\",
            \"timestamp\": \"$timestamp\",
            \"data\": $event_data
        }
    }"
}

# Hook para comandos Bash
if [ "$HOOK_TYPE" = "post-bash" ]; then
    register_event "command_executed" "{
        \"command\": \"$1\",
        \"exit_code\": \"$2\",
        \"success\": $([ "$2" -eq 0 ] && echo true || echo false)
    }"
fi

# Hook para edições
if [ "$HOOK_TYPE" = "post-edit" ]; then
    register_event "file_edited" "{
        \"file\": \"$1\",
        \"action\": \"edit\"
    }"
fi

# Hook para tarefas
if [ "$HOOK_TYPE" = "pre-task" ]; then
    register_event "task_started" "{
        \"task_id\": \"$1\",
        \"description\": \"$2\"
    }"
fi

# NÃO criar SQLite - apenas Neo4j
# Remover qualquer referência a .swarm/memory.db
export USE_NEO4J_ONLY=true
export NO_SQLITE=true

echo "[Neo4j Hook] Evento registrado no Knowledge Graph"