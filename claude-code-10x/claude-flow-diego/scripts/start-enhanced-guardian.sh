#!/bin/bash

# Enhanced Guardian Startup Script
# Inicia o Guardian Universal com monitoramento A2A aprimorado

echo "🚀 Iniciando Guardian Universal com Monitoramento A2A Aprimorado..."
echo "=================================================="

# Verificar se está no diretório correto
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo "📁 Diretório do projeto: $PROJECT_DIR"

# Navegar para o diretório do projeto
cd "$PROJECT_DIR"

# Verificar dependências
echo "🔍 Verificando dependências..."

if ! command -v node &> /dev/null; then
    echo "❌ Node.js não encontrado. Instale Node.js primeiro."
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "❌ NPM não encontrado. Instale NPM primeiro."
    exit 1
fi

# Verificar se package.json existe
if [ ! -f "package.json" ]; then
    echo "❌ package.json não encontrado. Execute npm init primeiro."
    exit 1
fi

# Instalar dependências se necessário
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependências..."
    npm install
fi

# Compilar TypeScript se necessário
echo "⚙️ Compilando TypeScript..."
npx tsc --build || echo "⚠️ Compilação com avisos"

# Verificar se o arquivo existe
GUARDIAN_FILE="src/agents/universal-organization-guardian.ts"
if [ ! -f "$GUARDIAN_FILE" ]; then
    echo "❌ Arquivo do Guardian não encontrado: $GUARDIAN_FILE"
    exit 1
fi

# Configurar variáveis de ambiente
export GUARDIAN_MODE="continuous"
export GUARDIAN_A2A_MONITORING="enabled"
export GUARDIAN_AUTO_FIX="true"
export MEM0_BRIDGE_URL="http://localhost:3002"

echo "🌐 Variáveis de ambiente configuradas:"
echo "   GUARDIAN_MODE: $GUARDIAN_MODE"
echo "   GUARDIAN_A2A_MONITORING: $GUARDIAN_A2A_MONITORING"
echo "   GUARDIAN_AUTO_FIX: $GUARDIAN_AUTO_FIX"
echo "   MEM0_BRIDGE_URL: $MEM0_BRIDGE_URL"

# Criar arquivo de log
LOG_FILE="logs/guardian-enhanced.log"
mkdir -p logs
touch "$LOG_FILE"

echo "📝 Log será salvo em: $LOG_FILE"

# Função para cleanup
cleanup() {
    echo ""
    echo "🛑 Parando Guardian Enhanced..."
    if [ ! -z "$GUARDIAN_PID" ]; then
        kill $GUARDIAN_PID 2>/dev/null
    fi
    exit 0
}

# Configurar trap para cleanup
trap cleanup SIGINT SIGTERM

echo ""
echo "🤖 Iniciando Guardian Universal com Monitoramento A2A..."
echo "   Pressione Ctrl+C para parar"
echo "   Logs: tail -f $LOG_FILE"
echo ""

# Iniciar Guardian com monitoramento A2A
node -r ts-node/register "$GUARDIAN_FILE" "$PROJECT_DIR" "continuous" 2>&1 | tee "$LOG_FILE" &
GUARDIAN_PID=$!

echo "✅ Guardian iniciado (PID: $GUARDIAN_PID)"
echo ""
echo "🔍 Funcionalidades ativas:"
echo "   ✅ Monitoramento de organização universal"
echo "   ✅ Compliance A2A automático"
echo "   ✅ Descoberta de projetos A2A"
echo "   ✅ Correções automáticas"
echo "   ✅ Verificações periódicas (10 min)"
echo "   ✅ Memória persistente"
echo ""

# Aguardar process
wait $GUARDIAN_PID

echo "🛑 Guardian parado"