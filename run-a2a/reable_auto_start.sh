#!/bin/bash
# Script para reabilitar auto-start

echo "🔓 Reabilitando auto-start..."

# Remover flag de desabilitação
rm -f auto_start_disabled.flag

# Restaurar permissões
chmod +x ../agent_manager.sh

echo "✅ Auto-start reabilitado!"
echo "💡 Para iniciar manualmente: ../agent_manager.sh start all"
