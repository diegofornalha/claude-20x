#!/bin/bash
# View Vibe Kanban Logs

BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

LOG_FILE="/tmp/vibe-kanban.log"

if [ ! -f "$LOG_FILE" ]; then
    echo -e "${RED}❌ Arquivo de log não encontrado${NC}"
    echo "Inicie o Vibe Kanban primeiro: ./start.sh"
    exit 1
fi

echo -e "${BLUE}📜 Logs do Vibe Kanban (Ctrl+C para sair)${NC}"
echo "=========================================="
tail -f "$LOG_FILE"