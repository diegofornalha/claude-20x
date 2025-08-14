#!/bin/bash
# Memory Guardian Hook - Integração com Hive-Mind
# Executado automaticamente em eventos do sistema

# Configuração
GUARDIAN_ID="agent_guardian_001"
SWARM_ID="swarm_active_001"
GUARDIAN_SCRIPT=".claude/agents/memory_guardian_analyzer.py"
HIVE_LOG=".hive-mind/guardian.log"

# Criar diretórios se não existirem
mkdir -p .hive-mind

# Função para registrar no Neo4j
neo4j_log() {
    local event_type="$1"
    local details="$2"
    
    npx claude-flow mcp__neo4j-memory__create_memory "{
        \"label\": \"guardian_event\",
        \"properties\": {
            \"agent\": \"$GUARDIAN_ID\",
            \"event\": \"$event_type\",
            \"details\": \"$details\",
            \"timestamp\": \"$(date -u +\"%Y-%m-%dT%H:%M:%SZ\")\"
        }
    }" 2>/dev/null || true
}

# Função para comunicar com Hive-Mind
hive_broadcast() {
    local message="$1"
    echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] [Guardian] $message" >> "$HIVE_LOG"
}

# Detectar tipo de hook
HOOK_TYPE="${HOOK_TYPE:-unknown}"

case "$HOOK_TYPE" in
    "post-edit")
        # Após edição de arquivo
        FILE_EDITED="$1"
        hive_broadcast "📝 Arquivo editado: $FILE_EDITED"
        neo4j_log "file_edit" "$FILE_EDITED"
        
        # Se for arquivo crítico, executar análise
        if [[ "$FILE_EDITED" == *".yaml"* ]] || [[ "$FILE_EDITED" == *"agent"* ]]; then
            hive_broadcast "⚠️ Arquivo crítico modificado, iniciando análise..."
            python3 "$GUARDIAN_SCRIPT" 2>&1 | tail -5
        fi
        ;;
    
    "post-bash")
        # Após comando bash
        COMMAND="$1"
        EXIT_CODE="$2"
        
        # Comandos importantes para monitorar
        if [[ "$COMMAND" == *"delete"* ]] || [[ "$COMMAND" == *"rm"* ]]; then
            hive_broadcast "🗑️ Comando de deleção detectado: $COMMAND"
            neo4j_log "deletion_command" "$COMMAND"
        fi
        
        if [[ "$COMMAND" == *"neo4j"* ]] || [[ "$COMMAND" == *"memory"* ]]; then
            hive_broadcast "💾 Comando relacionado a memória: $COMMAND"
            neo4j_log "memory_command" "$COMMAND"
        fi
        ;;
    
    "post-task")
        # Após conclusão de tarefa
        TASK_ID="$1"
        TASK_DESC="$2"
        
        hive_broadcast "✅ Tarefa concluída: $TASK_DESC"
        neo4j_log "task_completed" "$TASK_ID: $TASK_DESC"
        
        # Executar análise periódica
        hive_broadcast "🔄 Executando análise periódica..."
        python3 "$GUARDIAN_SCRIPT" 2>&1 | tail -5
        ;;
    
    "periodic")
        # Execução periódica (cron-like)
        hive_broadcast "⏰ Análise periódica iniciada"
        
        # Verificar saúde do sistema
        MEMORY_COUNT=$(npx claude-flow mcp__neo4j-memory__list_memory_labels 2>/dev/null | grep totalMemories | grep -o '[0-9]*' | head -1)
        
        if [ -n "$MEMORY_COUNT" ]; then
            hive_broadcast "📊 Total de memórias: $MEMORY_COUNT"
            
            # Se exceder limite, executar guardian
            if [ "$MEMORY_COUNT" -gt 90 ]; then
                hive_broadcast "⚠️ Limite de memórias excedido! Ativando Guardian..."
                python3 "$GUARDIAN_SCRIPT"
            fi
        fi
        ;;
    
    "session")
        # Início/fim de sessão
        hive_broadcast "🚀 Memory Guardian ativado para a sessão"
        neo4j_log "session_start" "Guardian monitoring active"
        
        # Verificação inicial
        python3 "$GUARDIAN_SCRIPT" 2>&1 | head -10
        ;;
    
    *)
        # Hook desconhecido
        hive_broadcast "❓ Hook desconhecido: $HOOK_TYPE"
        ;;
esac

# Comunicação final com Hive-Mind
echo "[Memory Guardian] Hook executado: $HOOK_TYPE" >&2