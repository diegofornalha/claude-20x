#!/bin/bash

# ============================================================================
# Restart System - Reinicia todo o sistema A2A
# ============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Cores
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}╔═══════════════════════════════════════════════════════════════════╗"
echo -e "║              🔄 Reiniciando Sistema A2A 🔄                         ║"
echo -e "╚═══════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# 1. Parar sistema
echo -e "${YELLOW}▶ Parando sistema...${NC}"
"$SCRIPT_DIR/stop_system.sh"

# 2. Aguardar
echo -e "${YELLOW}▶ Aguardando 3 segundos...${NC}"
sleep 3

# 3. Iniciar sistema
echo -e "${YELLOW}▶ Iniciando sistema...${NC}"
"$SCRIPT_DIR/start_system.sh"