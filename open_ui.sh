#!/bin/bash

# Open UI - Abre a UI no navegador

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
RED='\033[0;31m'
NC='\033[0m'

# URLs possíveis para a UI
URLS=(
    "http://localhost:12000/agents"
    "http://0.0.0.0:12000/agents"
    "http://127.0.0.1:12000/agents"
)

# URL preferida para abrir no navegador
OPEN_URL="http://localhost:12000/agents"

echo -e "${CYAN}🌐 Verificando UI Dashboard...${NC}"

# Função para verificar se a UI está rodando
check_ui_running() {
    for url in "${URLS[@]}"; do
        if curl -s -f "$url" >/dev/null 2>&1; then
            return 0
        fi
    done
    return 1
}

# Verificar se está rodando
if check_ui_running; then
    echo -e "${GREEN}✅ UI Dashboard já está rodando!${NC}"
    echo -e "${CYAN}📌 Abrindo no navegador...${NC}"
    
    # Abrir no navegador padrão
    if [[ "$OSTYPE" == "darwin"* ]]; then
        open "$OPEN_URL"
        echo -e "${GREEN}✅ Abrindo no Safari/Chrome${NC}"
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        xdg-open "$OPEN_URL" 2>/dev/null || echo -e "${YELLOW}⚠️  Acesse manualmente: $OPEN_URL${NC}"
    fi
    
    echo -e "${CYAN}📌 URL: $OPEN_URL${NC}"
else
    echo -e "${YELLOW}⚠️  UI não está respondendo${NC}"
    
    # Verificar se devemos usar start_ui_with_backend.sh ou start_system.sh
    if [ -f "./ui/start_ui_with_backend.sh" ]; then
        echo -e "${CYAN}🚀 Iniciando UI com backend...${NC}"
        cd ui && ./start_ui_with_backend.sh
        cd ..
    else
        echo -e "${CYAN}🚀 Iniciando sistema completo...${NC}"
        ./start_system.sh
    fi
    
    echo ""
    echo -e "${CYAN}⏳ Aguardando UI iniciar...${NC}"
    
    # Aguardar até 30 segundos pela UI iniciar
    for i in {1..15}; do
        if check_ui_running; then
            echo -e "${GREEN}✅ UI iniciada com sucesso!${NC}"
            
            # Abrir no navegador
            if [[ "$OSTYPE" == "darwin"* ]]; then
                open "$OPEN_URL"
            elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
                xdg-open "$OPEN_URL" 2>/dev/null
            fi
            break
        fi
        echo -e "${YELLOW}⏳ Aguardando... ($i/15)${NC}"
        sleep 2
    done
    
    if ! check_ui_running; then
        echo -e "${RED}❌ Falha ao iniciar UI${NC}"
        echo -e "${YELLOW}💡 Verifique os logs com: ./agent_manager.sh logs ui${NC}"
    fi
fi