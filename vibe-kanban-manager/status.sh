#!/bin/bash
# Check Vibe Kanban Status

BLUE='\033[0;34m'
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}📊 Status do Vibe Kanban${NC}"
echo "========================"

if pgrep -f "vibe-kanban" > /dev/null; then
    echo -e "Estado: ${GREEN}● Rodando${NC}"
    if [ -f "/tmp/vibe-kanban.log" ]; then
        URL=$(grep "Server running on" "/tmp/vibe-kanban.log" | tail -1 | grep -o 'http://[^ ]*')
        echo -e "URL: ${BLUE}$URL${NC}"
    fi
    echo ""
    echo "Processos:"
    ps aux | grep -E "vibe-kanban" | grep -v grep | grep -v "status.sh"
else
    echo -e "Estado: ${RED}○ Parado${NC}"
fi

if [ -f "/tmp/vibe-kanban.log" ]; then
    echo ""
    echo "Últimas linhas do log:"
    tail -5 "/tmp/vibe-kanban.log"
fi