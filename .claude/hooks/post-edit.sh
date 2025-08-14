#!/bin/bash
# Post-Edit Hook com Neo4j Integration
# Salva mudanças de código no grafo de conhecimento

FILE_PATH="${1:-}"
EDIT_TYPE="${2:-edit}"

# Função para Neo4j
neo4j_memory() {
    local action="$1"
    local data="$2"
    echo "mcp__knowall-ai-mcp-neo-4-j-agent-memory__${action}" |         npx claude-flow@alpha mcp exec --data "${data}"
}

# Criar memória da edição
EDIT_DATA=$(cat <<EOF
{
    "label": "document",
    "properties": {
        "name": "$(basename "${FILE_PATH}")",
        "path": "${FILE_PATH}",
        "type": "code_edit",
        "edit_type": "${EDIT_TYPE}",
        "edited_at": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
        "language": "${FILE_PATH##*.}"
    }
}
EOF
)

# Registrar edição
EDIT_ID=$(neo4j_memory "create_memory" "${EDIT_DATA}" | jq -r '.nodeId' 2>/dev/null)

if [ -n "$EDIT_ID" ]; then
    echo "📝 Edição registrada no Neo4j: ID ${EDIT_ID}"
    
    # Conectar com projeto atual se existir
    PROJECT_ID=$(neo4j_memory "search_memories" '{"query": "claude-20x", "label": "project", "limit": 1}' |                  jq -r '.[0].nodeId' 2>/dev/null)
    
    if [ -n "$PROJECT_ID" ]; then
        CONNECT_DATA=$(cat <<EOF
{
    "fromMemoryId": ${PROJECT_ID},
    "toMemoryId": ${EDIT_ID},
    "type": "HAS_FILE"
}
EOF
)
        neo4j_memory "create_connection" "${CONNECT_DATA}"
        echo "🔗 Conectado ao projeto"
    fi
fi

echo "✅ Mudanças salvas no grafo de conhecimento"
