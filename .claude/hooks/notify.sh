#!/bin/bash
# Notify Hook com Neo4j Integration
# Comunicação entre agentes via grafo

AGENT_ID="${1:-}"
MESSAGE="${2:-}"
PRIORITY="${3:-normal}"

# Função para Neo4j
neo4j_memory() {
    local action="$1"
    local data="$2"
    echo "mcp__knowall-ai-mcp-neo-4-j-agent-memory__${action}" |         npx claude-flow@alpha mcp exec --data "${data}"
}

# Criar memória da notificação
NOTIFY_DATA=$(cat <<EOF
{
    "label": "event",
    "properties": {
        "name": "agent_notification",
        "from_agent": "${AGENT_ID}",
        "message": "${MESSAGE}",
        "priority": "${PRIORITY}",
        "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
        "processed": false
    }
}
EOF
)

# Registrar notificação
EVENT_ID=$(neo4j_memory "create_memory" "${NOTIFY_DATA}" | jq -r '.nodeId' 2>/dev/null)

if [ -n "$EVENT_ID" ]; then
    echo "📨 Notificação registrada: ID ${EVENT_ID}"
    
    # Buscar agente destinatário
    AGENT=$(neo4j_memory "search_memories" '{"query": "'"${AGENT_ID}"'", "label": "agent", "limit": 1}' |             jq -r '.[0].nodeId' 2>/dev/null)
    
    if [ -n "$AGENT" ]; then
        CONNECT_DATA='{"fromMemoryId": '"$EVENT_ID"', "toMemoryId": '"$AGENT"', "type": "NOTIFIES"}'
        neo4j_memory "create_connection" "${CONNECT_DATA}"
        echo "🔗 Notificação conectada ao agente"
    fi
    
    # Para alta prioridade, buscar eventos relacionados
    if [ "$PRIORITY" = "high" ] || [ "$PRIORITY" = "critical" ]; then
        echo "⚠️ Prioridade alta - buscando contexto adicional..."
        CONTEXT=$(neo4j_memory "search_memories" '{"query": "'"${MESSAGE}"'", "limit": 3}')
        if [ -n "$CONTEXT" ]; then
            echo "📋 Contexto relacionado:"
            echo "$CONTEXT" | jq -r '.[] | "  - \(.label): \(.properties.name)"' 2>/dev/null
        fi
    fi
fi

echo "✅ Notificação processada via Neo4j"
