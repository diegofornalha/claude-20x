#!/bin/bash
# Stop Vibe Kanban

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

if ! pgrep -f "vibe-kanban" > /dev/null; then
    echo -e "${YELLOW}⚠️  Vibe Kanban não está rodando${NC}"
    exit 1
fi

echo -e "${RED}🛑 Parando Vibe Kanban...${NC}"
pkill -f vibe-kanban

sleep 2

if ! pgrep -f "vibe-kanban" > /dev/null; then
    echo -e "${GREEN}✅ Vibe Kanban parado${NC}"
    rm -f /tmp/vibe-kanban.pid
    exit 0
else
    echo -e "${RED}❌ Tentando força bruta...${NC}"
    pkill -9 -f vibe-kanban
    sleep 1
    if ! pgrep -f "vibe-kanban" > /dev/null; then
        echo -e "${GREEN}✅ Vibe Kanban forçado a parar${NC}"
        rm -f /tmp/vibe-kanban.pid
        exit 0
    else
        echo -e "${RED}❌ Não foi possível parar${NC}"
        exit 1
    fi
fi