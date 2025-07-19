#!/bin/bash

# Script para manter o agente HelloWorld sempre ativo

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

# Verificar e iniciar HelloWorld Agent
if check_port 9999; then
    echo "✅ HelloWorld Agent já está rodando na porta 9999"
else
    start_helloworld
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

echo ""
echo "🎯 Agente configurado para permanecer ativo em background"
echo "📝 Log disponível em:"
echo "   - HelloWorld: /Users/agents/Desktop/codex/agents/helloworld/helloworld_agent.log"
echo ""
echo "🔧 Para parar o agente, use:"
echo "   pkill -f 'python.*9999'" 