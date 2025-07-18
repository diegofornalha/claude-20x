#!/bin/bash

# Script para verificar rapidamente o status dos agentes

echo "📊 Verificando Status dos Agentes A2A..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Função para verificar se uma porta está em uso
check_port() {
    local port=$1
    lsof -i :$port >/dev/null 2>&1
}

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
echo "💡 Para iniciar agentes inativos, execute: ./start_agents.sh" 