#!/bin/bash
# Restart Vibe Kanban

YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}🔄 Reiniciando Vibe Kanban...${NC}"

# Chamar stop.sh
$(dirname "$0")/stop.sh

# Aguardar um pouco
sleep 2

# Chamar start.sh
$(dirname "$0")/start.sh