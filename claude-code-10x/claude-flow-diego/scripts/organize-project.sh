#!/bin/bash

# Universal Organization Guardian Script
# Organiza qualquer projeto para 100%

PROJECT_PATH=${1:-$(pwd)}

echo "🚀 Universal Organization Guardian"
echo "📁 Organizando: $PROJECT_PATH"
echo ""

cd /Users/agents/Desktop/claude-code-10x/claude-flow

# Compilar TypeScript
npm run build 2>/dev/null || {
    echo "⚠️ Compilando projeto..."
    npx tsc
}

# Executar guardian universal
node dist/organization/universal-organization-guardian.js "$PROJECT_PATH"