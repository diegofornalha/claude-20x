#!/bin/bash

# Script para manter os agentes HelloWorld e Analytics sempre ativos

echo "🚀 Iniciando agentes A2A..."

# Função para verificar se uma porta está em uso
check_port() {
    local port=$1
    lsof -i :$port >/dev/null 2>&1
}

# Função para iniciar o HelloWorld Agent
start_helloworld() {
    echo "🔄 Iniciando HelloWorld Agent na porta 9999..."
    cd /Users/agents/Desktop/codex/agents/helloworld
    nohup uv run . --host localhost --port 9999 > helloworld_agent.log 2>&1 &
    echo "✅ HelloWorld Agent iniciado (PID: $!)"
}

# Função para iniciar o Analytics Agent
start_analytics() {
    echo "🔄 Iniciando Analytics Agent na porta 10011..."
    cd /Users/agents/Desktop/codex/backup-reorganized/active-prototypes/analytics
    nohup uv run . --host localhost --port 10011 > analytics_agent.log 2>&1 &
    echo "✅ Analytics Agent iniciado (PID: $!)"
}

# Verificar e iniciar HelloWorld Agent
if check_port 9999; then
    echo "✅ HelloWorld Agent já está rodando na porta 9999"
else
    start_helloworld
    sleep 3
fi

# Verificar e iniciar Analytics Agent
if check_port 10011; then
    echo "✅ Analytics Agent já está rodando na porta 10011"
else
    start_analytics
    sleep 3
fi

echo ""
echo "📊 Status dos Agentes:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Verificar HelloWorld Agent
if check_port 9999; then
    echo "🟢 HelloWorld Agent: ATIVO (porta 9999)"
    curl -s "http://localhost:9999/.well-known/agent.json" | jq -r '.name' | sed 's/^/   📝 /'
else
    echo "🔴 HelloWorld Agent: INATIVO (porta 9999)"
fi

# Verificar Analytics Agent
if check_port 10011; then
    echo "🟢 Analytics Agent: ATIVO (porta 10011)"
    curl -s "http://localhost:10011/.well-known/agent.json" | jq -r '.name' | sed 's/^/   📝 /'
else
    echo "🔴 Analytics Agent: INATIVO (porta 10011)"
fi

echo ""
echo "🎯 Agentes configurados para permanecer ativos em background"
echo "📝 Logs disponíveis em:"
echo "   - HelloWorld: /Users/agents/Desktop/codex/agents/helloworld/helloworld_agent.log"
echo "   - Analytics: /Users/agents/Desktop/codex/backup-reorganized/active-prototypes/analytics/analytics_agent.log"
echo ""
echo "🔧 Para parar os agentes, use:"
echo "   pkill -f 'python.*9999'"
echo "   pkill -f 'python.*10011'" 