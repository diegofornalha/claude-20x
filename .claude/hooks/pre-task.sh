#!/bin/bash
# Pre-Task Hook com Neo4j Integration
# Carrega contexto antes de executar tarefas

TASK_ID="${1:-unknown}"
TASK_DESC="${2:-}"

# Função para interagir com Neo4j via Claude MCP
neo4j_memory() {
    local action="$1"
    local data="$2"
    
    # Usar o comando claude mcp para interagir com Neo4j
    echo "mcp__knowall-ai-mcp-neo-4-j-agent-memory__${action}" |         npx claude-flow@alpha mcp exec --data "${data}"
}

# Buscar contexto relacionado à tarefa
echo "🔍 Buscando contexto para tarefa: ${TASK_ID}"

# Criar memória da nova tarefa no Neo4j
TASK_DATA=$(cat <<EOF
{
    "label": "task",
    "properties": {
        "name": "${TASK_ID}",
        "description": "${TASK_DESC}",
        "status": "started",
        "started_at": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
    }
}
EOF
)

# Registrar início da tarefa
neo4j_memory "create_memory" "${TASK_DATA}"

# Buscar tarefas relacionadas
RELATED=$(neo4j_memory "search_memories" '{"query": "'"${TASK_DESC}"'", "label": "task", "limit": 5}')

if [ -n "$RELATED" ]; then
    echo "📋 Tarefas relacionadas encontradas:"
    echo "$RELATED" | jq -r '.[] | "  - \(.properties.name): \(.properties.status)"' 2>/dev/null || echo "$RELATED"
fi

echo "✅ Contexto carregado para tarefa ${TASK_ID}"
