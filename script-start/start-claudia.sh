#!/bin/bash
# Script para iniciar o Claudia

echo "🚀 Iniciando Claudia..."

# Adicionar Bun ao PATH
export PATH="$HOME/.bun/bin:$PATH"

# Navegar para o diretório do Claudia
cd "/Users/agents/Desktop/claude-20x/claudia"

# Iniciar em modo desenvolvimento
echo "📦 Claudia será iniciado em modo desenvolvimento"
echo "🌐 Acesse em: http://localhost:1420/"
echo ""
echo "Para parar, pressione Ctrl+C"

# Executar Claudia
bun run tauri dev