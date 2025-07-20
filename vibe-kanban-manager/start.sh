#!/bin/bash
# Start Vibe Kanban

LOG_FILE="/tmp/vibe-kanban.log"
PID_FILE="/tmp/vibe-kanban.pid"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

if pgrep -f "vibe-kanban" > /dev/null; then
    echo -e "${YELLOW}⚠️  Vibe Kanban já está rodando!${NC}"
    if [ -f "$LOG_FILE" ]; then
        URL=$(grep "Server running on" "$LOG_FILE" | tail -1 | grep -o 'http://[^ ]*')
        echo -e "URL: ${BLUE}$URL${NC}"
    fi
    exit 1
fi

echo -e "${GREEN}🚀 Iniciando Vibe Kanban...${NC}"
npx vibe-kanban > "$LOG_FILE" 2>&1 &
PID=$!
echo $PID > "$PID_FILE"

echo -n "Aguardando servidor iniciar"
for i in {1..10}; do
    sleep 1
    echo -n "."
    if grep -q "Server running on" "$LOG_FILE" 2>/dev/null; then
        echo ""
        URL=$(grep "Server running on" "$LOG_FILE" | tail -1 | grep -o 'http://[^ ]*')
        echo -e "${GREEN}✅ Vibe Kanban iniciado!${NC}"
        echo -e "📍 URL: ${BLUE}$URL${NC}"
        echo -e "📝 PID: $PID"
        exit 0
    fi
done

echo ""
echo -e "${RED}❌ Falha ao iniciar${NC}"
exit 1