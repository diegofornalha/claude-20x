#!/bin/bash
# 🌐 Script para iniciar o Chart Server do Analytics Agent

echo "🤖 Analytics Agent - Chart Server"
echo "================================="

# Verificar se o servidor já está rodando
if curl -s "http://localhost:8080/status" > /dev/null 2>&1; then
    echo "✅ Chart Server já está rodando em http://localhost:8080"
    echo "📊 Status do servidor:"
    curl -s "http://localhost:8080/status" | python3 -m json.tool
    echo ""
    echo "🔗 Acesse: http://localhost:8080"
    exit 0
fi

echo "🚀 Iniciando Chart Server..."

# Ir para o diretório do Analytics Agent e ativar venv
cd "/Users/agents/Desktop/codex/backup-reorganized/active-prototypes/analytics"
source .venv/bin/activate

# Iniciar o servidor em background
python "/Users/agents/Desktop/codex/ui/analytics_agent/chart_server.py" &
SERVER_PID=$!

echo "📡 Servidor iniciado com PID: $SERVER_PID"
echo "⏳ Aguardando servidor ficar ativo..."

# Aguardar servidor ficar ativo (máximo 10 segundos)
for i in {1..10}; do
    if curl -s "http://localhost:8080/status" > /dev/null 2>&1; then
        echo "✅ Chart Server ativo em http://localhost:8080"
        echo "📊 Charts disponíveis: $(curl -s 'http://localhost:8080/status' | python3 -c 'import json,sys; print(json.load(sys.stdin)["total_charts"])')"
        echo ""
        echo "🎯 Links gerados pelo Analytics Agent agora são clicáveis!"
        echo "🔗 Exemplo: http://localhost:8080/charts/analytics_chart_[id].html"
        exit 0
    fi
    sleep 1
done

echo "❌ Timeout ao iniciar servidor"
echo "🔍 Verifique se as dependências estão instaladas:"
echo "   pip install fastapi uvicorn"
exit 1