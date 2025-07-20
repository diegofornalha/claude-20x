#!/bin/bash
# Open Vibe Kanban in Browser

BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

if ! pgrep -f "vibe-kanban" > /dev/null; then
    echo -e "${RED}❌ Vibe Kanban não está rodando${NC}"
    echo "Inicie primeiro: ./start.sh"
    exit 1
fi

LOG_FILE="/tmp/vibe-kanban.log"
if [ -f "$LOG_FILE" ]; then
    URL=$(grep "Server running on" "$LOG_FILE" | tail -1 | grep -o 'http://[^ ]*')
    if [ ! -z "$URL" ]; then
        echo -e "${BLUE}🌐 Abrindo $URL no navegador...${NC}"
        open "$URL" 2>/dev/null || xdg-open "$URL" 2>/dev/null || echo "Abra manualmente: $URL"
    else
        echo -e "${RED}❌ URL não encontrada${NC}"
        exit 1
    fi
else
    echo -e "${RED}❌ Log não encontrado${NC}"
    exit 1
fi