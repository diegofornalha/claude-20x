#!/bin/bash

# 🔄 Auto-start HelloWorld Agent ao fazer login
# Este script garante que o HelloWorld Agent inicie automaticamente

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
KEEP_ACTIVE_SCRIPT="$SCRIPT_DIR/keep_helloworld_active.sh"

# Log de inicialização
echo "[$(date '+%Y-%m-%d %H:%M:%S')] 🚀 Auto-start HelloWorld Agent executado" >> "$SCRIPT_DIR/auto_start.log"

# Verificar se o script principal existe
if [ ! -f "$KEEP_ACTIVE_SCRIPT" ]; then
    echo "❌ Script principal não encontrado: $KEEP_ACTIVE_SCRIPT" >> "$SCRIPT_DIR/auto_start.log"
    exit 1
fi

# Garantir que o agente esteja ativo
"$KEEP_ACTIVE_SCRIPT" ensure

# Log de conclusão
echo "[$(date '+%Y-%m-%d %H:%M:%S')] ✅ Auto-start concluído" >> "$SCRIPT_DIR/auto_start.log"