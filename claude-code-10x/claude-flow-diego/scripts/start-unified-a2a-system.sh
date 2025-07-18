#!/bin/bash

# Script de Inicialização Unificada do Sistema A2A
# Inicia todo o ecossistema A2A com Guardian, MCP servers e monitoramento

set -e  # Parar em caso de erro

echo "🚀 Iniciando Sistema A2A Unificado"
echo "=================================="
echo "Data: $(date)"
echo ""

# Configurações
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOG_DIR="$PROJECT_DIR/logs"
DATA_DIR="$PROJECT_DIR/data"

# Criar diretórios necessários
mkdir -p "$LOG_DIR" "$DATA_DIR"/{memory,thinking,desktop,terminal,guardian}

echo "📁 Diretório do projeto: $PROJECT_DIR"
echo "📝 Logs serão salvos em: $LOG_DIR"
echo "💾 Dados serão salvos em: $DATA_DIR"
echo ""

# Verificar dependências
echo "🔍 Verificando dependências..."

# Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker não encontrado. Instale Docker primeiro."
    exit 1
fi

# Docker Compose
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose não encontrado. Instale Docker Compose primeiro."
    exit 1
fi

# Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não encontrado. Instale Node.js primeiro."
    exit 1
fi

# Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3 não encontrado. Instale Python3 primeiro."
    exit 1
fi

echo "✅ Todas as dependências verificadas"
echo ""

# Navegar para o diretório do projeto
cd "$PROJECT_DIR"

# Verificar se config existe
if [ ! -f "a2a-mcp-unified-config.json" ]; then
    echo "❌ Arquivo de configuração não encontrado: a2a-mcp-unified-config.json"
    exit 1
fi

if [ ! -f "docker-compose.a2a.yml" ]; then
    echo "❌ Arquivo Docker Compose não encontrado: docker-compose.a2a.yml"
    exit 1
fi

echo "📄 Arquivos de configuração verificados"
echo ""

# Função para cleanup
cleanup() {
    echo ""
    echo "🛑 Parando Sistema A2A Unificado..."
    
    # Parar containers Docker
    if docker-compose -f docker-compose.a2a.yml ps -q > /dev/null 2>&1; then
        echo "🐳 Parando containers Docker..."
        docker-compose -f docker-compose.a2a.yml down
    fi
    
    # Parar processos locais se existirem
    if [ ! -z "$GUARDIAN_PID" ]; then
        echo "🛡️ Parando Guardian..."
        kill $GUARDIAN_PID 2>/dev/null || true
    fi
    
    echo "✅ Sistema parado"
    exit 0
}

# Configurar trap para cleanup
trap cleanup SIGINT SIGTERM

# Escolher modo de deployment
echo "🎯 Escolha o modo de deployment:"
echo "1) Docker Compose (Recomendado)"
echo "2) Local Development"
echo "3) Hybrid (Docker + Local Guardian)"
echo ""
read -p "Digite sua escolha (1-3): " DEPLOYMENT_MODE

case $DEPLOYMENT_MODE in
    1)
        echo "🐳 Iniciando em modo Docker Compose..."
        
        # Construir imagens se necessário
        echo "🔨 Construindo imagens Docker..."
        docker-compose -f docker-compose.a2a.yml build
        
        # Iniciar serviços
        echo "🚀 Iniciando serviços A2A..."
        docker-compose -f docker-compose.a2a.yml up -d
        
        # Aguardar serviços ficarem prontos
        echo "⏳ Aguardando serviços ficarem prontos..."
        sleep 30
        
        # Verificar status
        echo "📊 Status dos serviços:"
        docker-compose -f docker-compose.a2a.yml ps
        
        echo ""
        echo "✅ Sistema A2A Unificado iniciado com sucesso!"
        echo ""
        echo "🌐 Endpoints disponíveis:"
        echo "   A2A Server: http://localhost:8080"
        echo "   Memory MCP: http://localhost:3001"
        echo "   Thinking MCP: http://localhost:3002"
        echo "   Desktop MCP: http://localhost:3003"
        echo "   Terminal MCP: http://localhost:3004"
        echo "   Grafana: http://localhost:3000 (admin/admin)"
        echo "   Prometheus: http://localhost:9090"
        echo ""
        echo "📝 Logs:"
        echo "   docker-compose -f docker-compose.a2a.yml logs -f"
        echo ""
        echo "🛑 Para parar:"
        echo "   docker-compose -f docker-compose.a2a.yml down"
        echo ""
        
        # Aguardar indefinidamente
        echo "Pressione Ctrl+C para parar o sistema..."
        while true; do
            sleep 60
            # Verificar se containers ainda estão rodando
            if ! docker-compose -f docker-compose.a2a.yml ps -q > /dev/null 2>&1; then
                echo "⚠️ Alguns containers pararam. Verificando status..."
                docker-compose -f docker-compose.a2a.yml ps
            fi
        done
        ;;
        
    2)
        echo "💻 Iniciando em modo Local Development..."
        
        # Instalar dependências Node.js
        if [ ! -d "node_modules" ]; then
            echo "📦 Instalando dependências Node.js..."
            npm install
        fi
        
        # Instalar dependências Python
        echo "🐍 Verificando dependências Python..."
        pip3 install -q uvicorn fastapi mem0ai 2>/dev/null || echo "⚠️ Algumas dependências Python podem estar faltando"
        
        # Configurar variáveis de ambiente
        export A2A_ENABLED=true
        export GUARDIAN_MODE=continuous
        export GUARDIAN_A2A_MONITORING=enabled
        export GUARDIAN_AUTO_FIX=true
        export MEM0_BRIDGE_URL=http://localhost:3001
        
        echo "🌐 Variáveis de ambiente configuradas"
        
        # Iniciar Guardian Enhanced
        echo "🛡️ Iniciando Guardian Enhanced..."
        node -r ts-node/register src/agents/universal-organization-guardian.ts "$PROJECT_DIR" continuous > "$LOG_DIR/guardian.log" 2>&1 &
        GUARDIAN_PID=$!
        
        echo "✅ Guardian iniciado (PID: $GUARDIAN_PID)"
        echo ""
        echo "📝 Log do Guardian: tail -f $LOG_DIR/guardian.log"
        echo ""
        
        # Aguardar
        echo "Pressione Ctrl+C para parar o sistema..."
        wait $GUARDIAN_PID
        ;;
        
    3)
        echo "🔄 Iniciando em modo Hybrid..."
        
        # Iniciar containers essenciais
        echo "🐳 Iniciando containers essenciais..."
        docker-compose -f docker-compose.a2a.yml up -d a2a-server mcp-memory mcp-sequential-thinking
        
        # Aguardar containers ficarem prontos
        echo "⏳ Aguardando containers..."
        sleep 20
        
        # Instalar dependências locais
        if [ ! -d "node_modules" ]; then
            echo "📦 Instalando dependências locais..."
            npm install
        fi
        
        # Configurar variáveis de ambiente
        export A2A_ENABLED=true
        export GUARDIAN_MODE=continuous
        export GUARDIAN_A2A_MONITORING=enabled
        export GUARDIAN_AUTO_FIX=true
        export MEM0_BRIDGE_URL=http://localhost:3001
        export A2A_SERVER_URL=http://localhost:8080
        
        # Iniciar Guardian local
        echo "🛡️ Iniciando Guardian local..."
        node -r ts-node/register src/agents/universal-organization-guardian.ts "$PROJECT_DIR" continuous > "$LOG_DIR/guardian-hybrid.log" 2>&1 &
        GUARDIAN_PID=$!
        
        echo "✅ Sistema Hybrid iniciado!"
        echo ""
        echo "🐳 Containers Docker:"
        docker-compose -f docker-compose.a2a.yml ps
        echo ""
        echo "💻 Guardian Local: PID $GUARDIAN_PID"
        echo "📝 Log: tail -f $LOG_DIR/guardian-hybrid.log"
        echo ""
        
        # Aguardar
        echo "Pressione Ctrl+C para parar o sistema..."
        wait $GUARDIAN_PID
        ;;
        
    *)
        echo "❌ Opção inválida"
        exit 1
        ;;
esac

echo "🛑 Sistema parado"