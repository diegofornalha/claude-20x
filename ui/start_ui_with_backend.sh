#!/bin/bash

# ============================================================================
# Start UI with Backend - Inicializa UI Mesop com servidor backend
# ============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Cores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${CYAN}╔═══════════════════════════════════════════════════════════════════╗"
echo -e "║              🚀 Iniciando UI Mesop com Backend 🚀                    ║"
echo -e "╚═══════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# 1. Verificar se o servidor backend já está rodando
echo -e "${BLUE}▶ Verificando servidor backend...${NC}"
if curl -s -f "http://localhost:8085/health" >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Servidor backend já está rodando na porta 8085${NC}"
else
    echo -e "${YELLOW}⚠️  Servidor backend não está rodando. Iniciando...${NC}"
    
    # Iniciar servidor backend
    echo -e "${BLUE}▶ Iniciando servidor backend...${NC}"
    python backend_server.py > backend.log 2>&1 &
    BACKEND_PID=$!
    
    # Aguardar servidor backend iniciar
    echo -e "${BLUE}▶ Aguardando servidor backend...${NC}"
    for i in {1..10}; do
        if curl -s -f "http://localhost:8085/health" >/dev/null 2>&1; then
            echo -e "${GREEN}✅ Servidor backend iniciado com sucesso!${NC}"
            break
        fi
        echo -e "${YELLOW}⏳ Aguardando... (tentativa $i/10)${NC}"
        sleep 2
    done
    
    if ! curl -s -f "http://localhost:8085/health" >/dev/null 2>&1; then
        echo -e "${RED}❌ Falha ao iniciar servidor backend${NC}"
        echo -e "${YELLOW}📋 Log do backend:${NC}"
        tail -10 backend.log
        exit 1
    fi
fi

echo ""

# 2. Verificar se a UI Mesop já está rodando
echo -e "${BLUE}▶ Verificando UI Mesop...${NC}"
if curl -s -f "http://localhost:12000/agents" >/dev/null 2>&1; then
    echo -e "${GREEN}✅ UI Mesop já está rodando na porta 12000${NC}"
else
    echo -e "${YELLOW}⚠️  UI Mesop não está rodando. Iniciando...${NC}"
    
    # Iniciar UI Mesop
    echo -e "${BLUE}▶ Iniciando UI Mesop...${NC}"
    uv run main.py > ui.log 2>&1 &
    UI_PID=$!
    
    # Aguardar UI Mesop iniciar
    echo -e "${BLUE}▶ Aguardando UI Mesop...${NC}"
    for i in {1..15}; do
        if curl -s -f "http://localhost:12000/agents" >/dev/null 2>&1; then
            echo -e "${GREEN}✅ UI Mesop iniciada com sucesso!${NC}"
            break
        fi
        echo -e "${YELLOW}⏳ Aguardando... (tentativa $i/15)${NC}"
        sleep 2
    done
    
    if ! curl -s -f "http://localhost:12000/agents" >/dev/null 2>&1; then
        echo -e "${RED}❌ Falha ao iniciar UI Mesop${NC}"
        echo -e "${YELLOW}📋 Log da UI:${NC}"
        tail -10 ui.log
        exit 1
    fi
fi

echo ""

# 3. Testar conectividade entre UI e Backend
echo -e "${BLUE}▶ Testando conectividade...${NC}"
if curl -s -X POST "http://localhost:8085/events/get" >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend respondendo corretamente${NC}"
else
    echo -e "${RED}❌ Backend não está respondendo${NC}"
fi

echo ""

# 4. Mostrar status final
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ Sistema iniciado com sucesso!${NC}"
echo ""
echo -e "${CYAN}📌 URLs importantes:${NC}"
echo -e "   ${BLUE}UI Dashboard:${NC} http://localhost:12000/agents"
echo -e "   ${BLUE}Event List:${NC} http://localhost:12000/event_list"
echo -e "   ${BLUE}Chat UI:${NC} http://localhost:12000/"
echo -e "   ${BLUE}Backend Health:${NC} http://localhost:8085/health"
echo ""
echo -e "${CYAN}📊 Logs:${NC}"
echo -e "   ${BLUE}UI Log:${NC} tail -f ui.log"
echo -e "   ${BLUE}Backend Log:${NC} tail -f backend.log"
echo ""
echo -e "${YELLOW}💡 Dicas:${NC}"
echo -e "   • Para parar: pkill -f 'uv run main.py' && pkill -f 'python backend_server.py'"
echo -e "   • Para reiniciar: ./start_ui_with_backend.sh"
echo -e "   • Para ver logs em tempo real: tail -f ui.log backend.log"
echo ""

# Salvar PIDs para referência
echo $BACKEND_PID > backend.pid 2>/dev/null || true
echo $UI_PID > ui.pid 2>/dev/null || true

echo -e "${GREEN}🎉 Sistema pronto para uso!${NC}" 