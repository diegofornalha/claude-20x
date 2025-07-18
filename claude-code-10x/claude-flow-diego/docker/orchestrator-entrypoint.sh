#!/bin/bash
set -e

echo "🚀 SPARC Orchestrator Starting..."
echo "📍 Working directory: $(pwd)"
echo "👤 Running as: $(whoami)"

# Configurar PATH explicitamente
export PATH="/usr/local/bin:/workspace/.npm-global/bin:$PATH"
export NPM_CONFIG_PREFIX="/workspace/.npm-global"
export DENO_INSTALL="/usr/local"

# Verificar se Deno está instalado
echo "🔍 Checking Deno installation..."
if [ -f /bin/deno ]; then
    echo "✅ Deno binary found at /bin/deno"
    # Criar link simbólico se necessário
    if [ ! -f /usr/local/bin/deno ]; then
        ln -s /bin/deno /usr/local/bin/deno || true
    fi
    # Testar se funciona
    /bin/deno --version || echo "❌ Deno execution failed"
else
    echo "❌ Deno not found at expected location"
fi

# Verificar Claude-Flow
echo "🔍 Checking Claude-Flow installation..."
if command -v claude-flow &> /dev/null; then
    echo "✅ Claude-Flow found at: $(which claude-flow)"
    claude-flow --version || echo "Version check failed"
else
    echo "⚠️ Claude-Flow not found, installing..."
    npm install -g claude-flow@latest
fi

# Mudar para workspace
cd /workspace

# Criar package.json se não existir
if [ ! -f package.json ]; then
    echo "📦 Creating package.json..."
    npm init -y
fi

# Instalar claude-flow localmente também
echo "📦 Installing claude-flow locally..."
npm install claude-flow@latest

# Tentar executar localmente
echo "🎯 Starting Claude-Flow on port 3003..."
if [ -f node_modules/.bin/claude-flow ]; then
    echo "Using local installation..."
    exec node_modules/.bin/claude-flow start --port 3003
else
    echo "Using global installation..."
    exec claude-flow start --port 3003
fi