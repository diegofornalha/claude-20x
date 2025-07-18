#!/bin/bash

# Script para verificar status de todos os servidores A2A
# Autor: Diego (Claude Code)
# Data: 2025-07-12

echo "🎯 VERIFICAÇÃO DE STATUS - SERVIDORES A2A"
echo "=========================================="
echo

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para verificar se porta está em uso
check_port() {
    local port=$1
    local name=$2
    
    if lsof -i :$port >/dev/null 2>&1; then
        echo -e "  ✅ ${GREEN}$name${NC} - Porta $port: ${GREEN}ATIVO${NC}"
        return 0
    else
        echo -e "  ❌ ${RED}$name${NC} - Porta $port: ${RED}INATIVO${NC}"
        return 1
    fi
}

# Função para verificar health endpoint
check_health() {
    local url=$1
    local name=$2
    
    if curl -s --max-time 3 "$url" >/dev/null 2>&1; then
        echo -e "  🟢 ${GREEN}$name${NC}: Health check ${GREEN}OK${NC}"
        return 0
    else
        echo -e "  🔴 ${RED}$name${NC}: Health check ${RED}FALHOU${NC}"
        return 1
    fi
}

echo "1️⃣ SERVIDORES MCP A2A"
echo "--------------------"

# Memory Agent (porta 3001)
check_port 3001 "Memory Agent"
check_health "http://localhost:3001/health" "Memory Agent API"

# Mem0-Bridge Docker (porta 3002) 
check_port 3002 "Mem0-Bridge (Docker)"
check_health "http://localhost:3002/health" "Mem0-Bridge API"

# Orchestrator (porta 3003)
check_port 3003 "Claude Flow Orchestrator"

# Sequential Thinking (porta 3010)
check_port 3010 "Sequential Thinking MCP"

# Desktop Commander (porta 3011)
check_port 3011 "Desktop Commander MCP"

# Terminal Agent (porta 3012)
check_port 3012 "Terminal Agent MCP"

# Everything Agent (porta 3013)
check_port 3013 "Everything Agent MCP"

echo
echo "2️⃣ INFRAESTRUTURA A2A"
echo "---------------------"

# A2A Bridge Central (porta 8080)
check_port 8080 "A2A Bridge Central"
check_health "http://localhost:8080/health" "A2A Bridge API"

# ChromaDB (porta 8000)
check_port 8000 "ChromaDB Vector Database"
check_health "http://localhost:8000/health" "ChromaDB API"

echo
echo "3️⃣ CONTAINERS DOCKER"
echo "--------------------"

# Verificar containers Docker
if command -v docker >/dev/null 2>&1; then
    echo "  📊 Status dos containers:"
    
    containers=("claude-flow-orchestrator" "organization-guardian" "mem0-bridge" "chroma-db" "chatwoot_ramon-redis-1" "portainer")
    
    for container in "${containers[@]}"; do
        if docker ps --format "table {{.Names}}" | grep -q "^$container$"; then
            status=$(docker ps --format "table {{.Names}}\t{{.Status}}" | grep "^$container" | awk '{$1=""; print $0}' | sed 's/^ *//')
            echo -e "    ✅ ${GREEN}$container${NC}: $status"
        else
            echo -e "    ❌ ${RED}$container${NC}: Não encontrado"
        fi
    done
else
    echo -e "  ⚠️  ${YELLOW}Docker não disponível${NC}"
fi

echo
echo "4️⃣ DATABASES & CACHE"
echo "--------------------"

# Redis (porta 6379)
check_port 6379 "Redis Cache"

echo
echo "5️⃣ MANAGEMENT"
echo "-------------"

# Portainer (portas 9000, 9443)
check_port 9000 "Portainer HTTP"
check_port 9443 "Portainer HTTPS"

echo
echo "6️⃣ RESUMO GERAL"
echo "---------------"

# Contadores
active_count=0
total_count=0

# Lista de serviços críticos
critical_services=(
    "3001:Memory Agent"
    "3002:Mem0-Bridge" 
    "8080:A2A Bridge"
    "6379:Redis"
)

echo "  🎯 Serviços críticos A2A:"
for service in "${critical_services[@]}"; do
    port=$(echo $service | cut -d: -f1)
    name=$(echo $service | cut -d: -f2)
    total_count=$((total_count + 1))
    
    if lsof -i :$port >/dev/null 2>&1; then
        echo -e "    ✅ ${GREEN}$name${NC}"
        active_count=$((active_count + 1))
    else
        echo -e "    ❌ ${RED}$name${NC}"
    fi
done

echo
echo -e "  📊 Status geral: ${GREEN}$active_count${NC}/${total_count} serviços críticos ativos"

if [ $active_count -eq $total_count ]; then
    echo -e "  🎉 ${GREEN}Sistema A2A totalmente operacional!${NC}"
elif [ $active_count -gt 0 ]; then
    echo -e "  ⚠️  ${YELLOW}Sistema A2A parcialmente operacional${NC}"
else
    echo -e "  🚨 ${RED}Sistema A2A não operacional${NC}"
fi

echo
echo "7️⃣ COMANDOS ÚTEIS"
echo "-----------------"
echo "  🚀 Iniciar sistema completo:"
echo "    ./scripts/start-unified-a2a-system.sh"
echo
echo "  🔍 Verificar logs:"
echo "    docker logs mem0-bridge --tail 20"
echo "    docker logs organization-guardian --tail 20"
echo
echo "  📋 Testar APIs:"
echo "    curl http://localhost:3002/health"
echo "    curl http://localhost:8080/health"
echo
echo "  🛑 Parar sistema:"
echo "    docker-compose down"

echo
echo "=========================================="
echo "✅ Verificação concluída $(date)"
echo