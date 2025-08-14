#!/bin/bash
# Session Hook com Neo4j Integration
# Gerencia estado da sessão no grafo

SESSION_ID="${1:-$(uuidgen 2>/dev/null || echo "session_$(date +%s)")}"
ACTION="${2:-start}"

# Função para Neo4j
neo4j_memory() {
    local action="$1"
    local data="$2"
    echo "mcp__knowall-ai-mcp-neo-4-j-agent-memory__${action}" |         npx claude-flow@alpha mcp exec --data "${data}"
}

case "$ACTION" in
    start)
        # Criar nova sessão
        SESSION_DATA=$(cat <<EOF
{
    "label": "session",
    "properties": {
        "name": "${SESSION_ID}",
        "status": "active",
        "started_at": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
        "user": "${USER:-unknown}",
        "cwd": "$(pwd)",
        "pid": $$
    }
}
EOF
)
        SESSION_NODE=$(neo4j_memory "create_memory" "${SESSION_DATA}" | jq -r '.nodeId' 2>/dev/null)
        
        if [ -n "$SESSION_NODE" ]; then
            echo "🚀 Sessão iniciada no Neo4j: ${SESSION_ID} (Node: ${SESSION_NODE})"
            echo "$SESSION_NODE" > /tmp/.neo4j_session_${SESSION_ID}
        fi
        ;;
        
    end)
        # Finalizar sessão
        if [ -f "/tmp/.neo4j_session_${SESSION_ID}" ]; then
            NODE_ID=$(cat "/tmp/.neo4j_session_${SESSION_ID}")
            
            UPDATE_DATA=$(cat <<EOF
{
    "nodeId": ${NODE_ID},
    "properties": {
        "status": "completed",
        "ended_at": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
    }
}
EOF
)
            neo4j_memory "update_memory" "${UPDATE_DATA}"
            rm -f "/tmp/.neo4j_session_${SESSION_ID}"
            echo "🏁 Sessão finalizada: ${SESSION_ID}"
        fi
        ;;
        
    checkpoint)
        # Criar checkpoint da sessão
        if [ -f "/tmp/.neo4j_session_${SESSION_ID}" ]; then
            NODE_ID=$(cat "/tmp/.neo4j_session_${SESSION_ID}")
            
            CHECKPOINT_DATA=$(cat <<EOF
{
    "label": "checkpoint",
    "properties": {
        "name": "session_checkpoint",
        "session_id": "${SESSION_ID}",
        "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
        "state": "$(env | head -20 | base64)"
    }
}
EOF
)
            CP_ID=$(neo4j_memory "create_memory" "${CHECKPOINT_DATA}" | jq -r '.nodeId' 2>/dev/null)
            
            if [ -n "$CP_ID" ] && [ -n "$NODE_ID" ]; then
                CONNECT='{"fromMemoryId": '"$NODE_ID"', "toMemoryId": '"$CP_ID"', "type": "HAS_CHECKPOINT"}'
                neo4j_memory "create_connection" "${CONNECT}"
                echo "💾 Checkpoint criado para sessão ${SESSION_ID}"
            fi
        fi
        ;;
esac

echo "✅ Estado da sessão gerenciado via Neo4j"
