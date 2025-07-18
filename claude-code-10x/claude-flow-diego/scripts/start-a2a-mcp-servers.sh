#!/bin/bash

# Script para iniciar todos os servidores MCP A2A em portas organizadas
# Autor: Diego (Claude Code)
# Data: 2025-07-12

set -e  # Exit on any error

echo "🚀 INICIANDO SERVIDORES MCP A2A"
echo "==============================="
echo

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Diretório de logs
LOG_DIR="./logs/a2a-mcp"
mkdir -p "$LOG_DIR"

# Função para verificar se porta está livre
check_port_free() {
    local port=$1
    if lsof -i :$port >/dev/null 2>&1; then
        echo -e "  ⚠️  ${YELLOW}Porta $port já está em uso${NC}"
        return 1
    else
        echo -e "  ✅ ${GREEN}Porta $port disponível${NC}"
        return 0
    fi
}

# Função para iniciar servidor MCP
start_mcp_server() {
    local name=$1
    local port=$2
    local command=$3
    local log_file="$LOG_DIR/${name,,}.log"
    
    echo -e "🔄 Iniciando ${BLUE}$name${NC} na porta $port..."
    
    if ! check_port_free $port; then
        echo -e "  ❌ ${RED}Falha: Porta $port ocupada${NC}"
        return 1
    fi
    
    echo "  📝 Log: $log_file"
    
    # Exportar variáveis de ambiente A2A
    export A2A_ENABLED=true
    export A2A_BRIDGE_URL="http://localhost:8080"
    export MCP_PORT=$port
    
    # Iniciar servidor em background
    nohup bash -c "$command" > "$log_file" 2>&1 &
    local pid=$!
    
    echo "  🆔 PID: $pid"
    echo "$pid" > "$LOG_DIR/${name,,}.pid"
    
    # Aguardar alguns segundos para verificar se iniciou
    sleep 3
    
    if kill -0 $pid >/dev/null 2>&1; then
        echo -e "  ✅ ${GREEN}$name iniciado com sucesso${NC}"
        return 0
    else
        echo -e "  ❌ ${RED}$name falhou ao iniciar${NC}"
        return 1
    fi
}

# Função para testar health endpoint
test_health() {
    local name=$1
    local port=$2
    local max_attempts=10
    local attempt=1
    
    echo -e "🏥 Testando health check ${BLUE}$name${NC}..."
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s --max-time 2 "http://localhost:$port/health" >/dev/null 2>&1; then
            echo -e "  ✅ ${GREEN}Health check OK${NC} (tentativa $attempt)"
            return 0
        fi
        
        echo "  ⏳ Tentativa $attempt/$max_attempts..."
        sleep 2
        attempt=$((attempt + 1))
    done
    
    echo -e "  ⚠️  ${YELLOW}Health check não respondeu${NC}"
    return 1
}

echo "1️⃣ VERIFICANDO DEPENDÊNCIAS"
echo "---------------------------"

# Verificar se Node.js está disponível
if command -v node >/dev/null 2>&1; then
    echo -e "  ✅ ${GREEN}Node.js$(node --version)${NC}"
else
    echo -e "  ❌ ${RED}Node.js não encontrado${NC}"
    exit 1
fi

# Verificar se npm está disponível
if command -v npm >/dev/null 2>&1; then
    echo -e "  ✅ ${GREEN}npm $(npm --version)${NC}"
else
    echo -e "  ❌ ${RED}npm não encontrado${NC}"
    exit 1
fi

# Verificar se Python está disponível
if command -v python3 >/dev/null 2>&1; then
    echo -e "  ✅ ${GREEN}Python $(python3 --version)${NC}"
else
    echo -e "  ❌ ${RED}Python3 não encontrado${NC}"
    exit 1
fi

echo
echo "2️⃣ INSTALANDO SERVIDORES MCP"
echo "----------------------------"

echo "  📦 Instalando servidores MCP via npm..."

# Lista de servidores MCP para instalar
mcp_packages=(
    "@modelcontextprotocol/server-sequential-thinking"
    "@modelcontextprotocol/server-desktop-commander" 
    "@modelcontextprotocol/server-terminal"
    "@modelcontextprotocol/server-everything"
)

for package in "${mcp_packages[@]}"; do
    echo "  🔄 Instalando $package..."
    if npm install -g "$package" >/dev/null 2>&1; then
        echo -e "    ✅ ${GREEN}$package instalado${NC}"
    else
        echo -e "    ⚠️  ${YELLOW}$package já instalado ou erro${NC}"
    fi
done

echo
echo "3️⃣ INICIANDO SERVIDORES MCP A2A"
echo "-------------------------------"

# Array com configurações dos servidores
declare -a servers=(
    "Sequential-Thinking:3010:npx @modelcontextprotocol/server-sequential-thinking --port 3010"
    "Desktop-Commander:3011:npx @modelcontextprotocol/server-desktop-commander --port 3011"
    "Terminal-Agent:3012:npx @modelcontextprotocol/server-terminal --port 3012"
    "Everything-Agent:3013:npx @modelcontextprotocol/server-everything --port 3013"
)

successful_starts=0
total_servers=${#servers[@]}

for server_config in "${servers[@]}"; do
    IFS=':' read -r name port command <<< "$server_config"
    
    if start_mcp_server "$name" "$port" "$command"; then
        successful_starts=$((successful_starts + 1))
    fi
    echo
done

echo "4️⃣ VERIFICANDO HEALTH CHECKS"
echo "-----------------------------"

# Aguardar um pouco para servidores iniciarem completamente
echo "  ⏳ Aguardando servidores estabilizarem (10s)..."
sleep 10

# Testar health checks dos servidores iniciados
for server_config in "${servers[@]}"; do
    IFS=':' read -r name port command <<< "$server_config"
    
    if [ -f "$LOG_DIR/${name,,}.pid" ]; then
        test_health "$name" "$port"
    fi
done

echo
echo "5️⃣ RESUMO FINAL"
echo "---------------"

echo -e "  📊 Servidores iniciados: ${GREEN}$successful_starts${NC}/$total_servers"

if [ $successful_starts -eq $total_servers ]; then
    echo -e "  🎉 ${GREEN}Todos os servidores MCP A2A iniciados com sucesso!${NC}"
elif [ $successful_starts -gt 0 ]; then
    echo -e "  ⚠️  ${YELLOW}Alguns servidores falharam ao iniciar${NC}"
else
    echo -e "  🚨 ${RED}Nenhum servidor foi iniciado com sucesso${NC}"
fi

echo
echo "6️⃣ COMANDOS DE GERENCIAMENTO"
echo "----------------------------"

echo "  🔍 Verificar status:"
echo "    ./scripts/check-a2a-status.sh"
echo
echo "  📋 Ver logs:"
echo "    tail -f $LOG_DIR/sequential-thinking.log"
echo "    tail -f $LOG_DIR/desktop-commander.log"
echo "    tail -f $LOG_DIR/terminal-agent.log"
echo "    tail -f $LOG_DIR/everything-agent.log"
echo
echo "  🛑 Parar servidores:"
echo "    ./scripts/stop-a2a-mcp-servers.sh"
echo
echo "  🧪 Testar APIs:"
echo "    curl http://localhost:3010/health"
echo "    curl http://localhost:3011/health"
echo "    curl http://localhost:3012/health"
echo "    curl http://localhost:3013/health"

echo
echo "==============================="
echo -e "✅ ${GREEN}Script concluído$(date)${NC}"
echo