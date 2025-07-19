#!/bin/bash

# ============================================================================
# Ensure UI Running - Garante que a UI está sempre acessível
# ============================================================================
# Este script pode ser executado via cron para garantir disponibilidade
# Exemplo crontab: */5 * * * * /Users/agents/Desktop/claude-20x/ensure_ui_running.sh
# ============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_FILE="$SCRIPT_DIR/logs/ui_monitor.log"

# Criar diretório de logs se não existir
mkdir -p "$(dirname "$LOG_FILE")"

# Função para log com timestamp
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

# Verificar se a UI está respondendo
check_ui() {
    curl -s -f -m 5 "http://0.0.0.0:12000/agents" >/dev/null 2>&1
}

# Verificar se o processo está rodando
check_process() {
    lsof -i :12000 >/dev/null 2>&1
}

log "Verificando status da UI..."

# Primeiro, verificar se o processo está rodando
if ! check_process; then
    log "❌ Processo da UI não está rodando. Iniciando..."
    "$SCRIPT_DIR/agent_manager.sh" start ui
    sleep 5
    
    if check_ui; then
        log "✅ UI iniciada com sucesso"
    else
        log "⚠️ UI iniciada mas ainda não está respondendo"
    fi
elif ! check_ui; then
    # Processo está rodando mas não responde
    log "⚠️ UI está rodando mas não responde. Reiniciando..."
    "$SCRIPT_DIR/agent_manager.sh" restart ui
    sleep 5
    
    if check_ui; then
        log "✅ UI reiniciada com sucesso"
    else
        log "❌ Falha ao reiniciar UI"
    fi
else
    log "✅ UI está funcionando normalmente"
fi

# Verificar também se os agentes críticos estão rodando
CRITICAL_AGENTS=("helloworld" "marvin")

for agent in "${CRITICAL_AGENTS[@]}"; do
    status=$("$SCRIPT_DIR/agent_manager.sh" status "$agent" 2>&1 | grep -c "🟢 Rodando")
    if [ "$status" -eq 0 ]; then
        log "⚠️ Agente crítico '$agent' não está rodando. Iniciando..."
        "$SCRIPT_DIR/agent_manager.sh" start "$agent"
    fi
done

# Limpar logs antigos (manter apenas últimos 7 dias)
find "$SCRIPT_DIR/logs" -name "*.log" -mtime +7 -delete 2>/dev/null