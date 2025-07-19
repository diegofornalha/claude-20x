#!/bin/bash

# ============================================================================
# Stop System - Para todo o sistema A2A
# ============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Cores
RED='\033[0;31m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}╔═══════════════════════════════════════════════════════════════════╗"
echo -e "║                🛑 Parando Sistema A2A 🛑                           ║"
echo -e "╚═══════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# 1. Parar monitor
echo -e "${YELLOW}▶ Parando monitor automático...${NC}"
"$SCRIPT_DIR/agent_manager.sh" monitor stop

echo ""

# 2. Parar todos os agentes (incluindo a UI)
echo -e "${YELLOW}▶ Parando todos os agentes e UI...${NC}"
"$SCRIPT_DIR/agent_manager.sh" stop all

echo ""

# 3. Verificar status final
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
"$SCRIPT_DIR/agent_manager.sh" status

echo ""
echo -e "${RED}✅ Sistema A2A parado${NC}"
echo ""