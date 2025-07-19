#!/bin/bash

# ============================================================================
# Start System - Inicialização completa do sistema A2A
# ============================================================================
# Este script garante que a UI e todos os agentes estejam rodando
# ============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Cores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}╔═══════════════════════════════════════════════════════════════════╗"
echo -e "║              🚀 Iniciando Sistema A2A Completo 🚀                  ║"
echo -e "╚═══════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# 1. Primeiro, garantir que a UI está rodando
echo -e "${BLUE}▶ Iniciando UI Dashboard...${NC}"
"$SCRIPT_DIR/agent_manager.sh" start ui
sleep 3

# Verificar se a UI iniciou
if curl -s -f "http://0.0.0.0:12000/agents" >/dev/null 2>&1; then
    echo -e "${GREEN}✅ UI Dashboard está acessível em: http://0.0.0.0:12000/agents${NC}"
else
    echo -e "${YELLOW}⚠️  UI pode estar iniciando... aguarde alguns segundos${NC}"
fi

echo ""

# 2. Iniciar todos os agentes habilitados
echo -e "${BLUE}▶ Iniciando agentes habilitados...${NC}"
"$SCRIPT_DIR/agent_manager.sh" start all

echo ""

# 3. Iniciar monitor automático
echo -e "${BLUE}▶ Iniciando monitor automático...${NC}"
"$SCRIPT_DIR/agent_manager.sh" monitor start

echo ""

# 4. Mostrar status final
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
"$SCRIPT_DIR/agent_manager.sh" status

echo ""
echo -e "${GREEN}✅ Sistema A2A iniciado com sucesso!${NC}"
echo ""
echo -e "${CYAN}📌 URLs importantes:${NC}"
echo -e "   ${BLUE}UI Dashboard:${NC} http://0.0.0.0:12000/agents"
echo -e "   ${BLUE}Chat UI:${NC} http://0.0.0.0:12000/"
echo -e "   ${BLUE}HelloWorld:${NC} http://localhost:9999/.well-known/agent.json"
echo -e "   ${BLUE}Marvin:${NC} http://localhost:10030/.well-known/agent.json"
echo ""
echo -e "${YELLOW}💡 Dicas:${NC}"
echo -e "   • Para ver logs: ./agent_manager.sh logs ui"
echo -e "   • Para parar tudo: ./stop_system.sh"
echo -e "   • Para reiniciar: ./restart_system.sh"
echo -e "   • Monitor rodando em background verificando saúde dos agentes"
echo ""