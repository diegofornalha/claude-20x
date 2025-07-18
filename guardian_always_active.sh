#!/bin/bash
# Script para manter o Guardian sempre ativo na porta 10102
# Similar ao HelloWorld na porta 9999

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
GUARDIAN_SERVER="$SCRIPT_DIR/start_guardian_http_server.py"

echo "🛡️ Iniciando Guardian Agent Server..."
echo "🌐 Porta: http://localhost:10102/"
echo "📊 Monitoramento: Sustentabilidade A2A"
echo ""

# Verificar se Python3 está disponível
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3 não encontrado!"
    exit 1
fi

# Verificar se as dependências estão instaladas
echo "🔍 Verificando dependências..."
python3 -c "import uvicorn, a2a" 2>/dev/null || {
    echo "⚠️ Algumas dependências podem estar faltando"
    echo "💡 Execute: pip install uvicorn a2a"
}

# Tornar executável
chmod +x "$GUARDIAN_SERVER"

echo "🚀 Iniciando Guardian HTTP Server..."
echo "🔄 Para parar: Ctrl+C"
echo "📋 Comandos disponíveis: status, health, agents, budget, entropy"
echo ""

# Iniciar servidor com restart automático
while true; do
    echo "🛡️ $(date): Iniciando Guardian..."
    
    python3 "$GUARDIAN_SERVER" || {
        echo "❌ $(date): Guardian falhou, reiniciando em 5 segundos..."
        sleep 5
        continue
    }
    
    echo "🔄 $(date): Guardian parou, reiniciando em 3 segundos..."
    sleep 3
done