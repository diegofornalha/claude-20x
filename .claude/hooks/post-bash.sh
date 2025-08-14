#!/bin/bash
# Post-Bash Hook com Neo4j Integration
# Registra comandos executados

COMMAND="${1:-}"
EXIT_CODE="${2:-0}"
OUTPUT="${3:-}"

# Função para Neo4j
neo4j_memory() {
    local action="$1"
    local data="$2"
    echo "mcp__knowall-ai-mcp-neo-4-j-agent-memory__${action}" |         npx claude-flow@alpha mcp exec --data "${data}"
}

# Criar memória do comando
CMD_DATA=$(cat <<EOF
{
    "label": "command",
    "properties": {
        "name": "bash_command",
        "command": "${COMMAND}",
        "exit_code": ${EXIT_CODE},
        "success": $([ "$EXIT_CODE" -eq 0 ] && echo "true" || echo "false"),
        "executed_at": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
        "output_length": ${#OUTPUT}
    }
}
EOF
)

# Registrar comando
CMD_ID=$(neo4j_memory "create_memory" "${CMD_DATA}" | jq -r '.nodeId' 2>/dev/null)

if [ -n "$CMD_ID" ]; then
    echo "🔧 Comando registrado: ID ${CMD_ID}"
    
    # Se for comando git, criar conexões especiais
    if [[ "$COMMAND" == git* ]]; then
        echo "📦 Comando Git detectado - criando conexões VCS"
        
        # Buscar projeto
        PROJECT=$(neo4j_memory "search_memories" '{"label": "project", "limit": 1}' |                   jq -r '.[0].nodeId' 2>/dev/null)
        
        if [ -n "$PROJECT" ]; then
            CONNECT_DATA='{"fromMemoryId": '"$CMD_ID"', "toMemoryId": '"$PROJECT"', "type": "MODIFIES"}'
            neo4j_memory "create_connection" "${CONNECT_DATA}"
        fi
    fi
fi

echo "✅ Comando registrado no Neo4j"
