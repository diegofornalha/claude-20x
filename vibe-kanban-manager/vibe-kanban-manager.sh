#!/bin/bash
# Vibe Kanban Manager - Script para gerenciar vibe-kanban facilmente

SCRIPT_NAME="Vibe Kanban Manager"
LOG_FILE="/tmp/vibe-kanban.log"
PID_FILE="/tmp/vibe-kanban.pid"

# Cores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para exibir o banner
show_banner() {
    echo -e "${BLUE}╔═══════════════════════════════════╗${NC}"
    echo -e "${BLUE}║     📋 Vibe Kanban Manager        ║${NC}"
    echo -e "${BLUE}╚═══════════════════════════════════╝${NC}"
    echo ""
}

# Função para verificar se vibe-kanban está rodando
is_running() {
    if pgrep -f "vibe-kanban" > /dev/null; then
        return 0
    else
        return 1
    fi
}

# Função para obter URL do servidor
get_server_url() {
    if [ -f "$LOG_FILE" ]; then
        grep "Server running on" "$LOG_FILE" | tail -1 | grep -o 'http://[^ ]*' || echo "URL não encontrada"
    else
        echo "Log não encontrado"
    fi
}

# Função para iniciar vibe-kanban
start_vibe() {
    if is_running; then
        echo -e "${YELLOW}⚠️  Vibe Kanban já está rodando!${NC}"
        echo -e "URL: $(get_server_url)"
        return 1
    fi

    echo -e "${GREEN}🚀 Iniciando Vibe Kanban em background...${NC}"
    npx vibe-kanban > "$LOG_FILE" 2>&1 &
    local pid=$!
    echo $pid > "$PID_FILE"
    
    # Aguardar inicialização
    echo -n "Aguardando servidor iniciar"
    for i in {1..10}; do
        sleep 1
        echo -n "."
        if grep -q "Server running on" "$LOG_FILE" 2>/dev/null; then
            echo ""
            echo -e "${GREEN}✅ Vibe Kanban iniciado com sucesso!${NC}"
            echo -e "📍 URL: ${BLUE}$(get_server_url)${NC}"
            echo -e "📝 PID: $pid"
            echo -e "📄 Logs: $LOG_FILE"
            return 0
        fi
    done
    
    echo ""
    echo -e "${RED}❌ Falha ao iniciar. Verifique os logs em $LOG_FILE${NC}"
    return 1
}

# Função para parar vibe-kanban
stop_vibe() {
    if ! is_running; then
        echo -e "${YELLOW}⚠️  Vibe Kanban não está rodando${NC}"
        return 1
    fi

    echo -e "${RED}🛑 Parando Vibe Kanban...${NC}"
    pkill -f vibe-kanban
    
    # Aguardar parada
    sleep 2
    
    if ! is_running; then
        echo -e "${GREEN}✅ Vibe Kanban parado com sucesso${NC}"
        rm -f "$PID_FILE"
        return 0
    else
        echo -e "${RED}❌ Falha ao parar. Tentando força bruta...${NC}"
        pkill -9 -f vibe-kanban
        sleep 1
        if ! is_running; then
            echo -e "${GREEN}✅ Vibe Kanban forçado a parar${NC}"
            rm -f "$PID_FILE"
        else
            echo -e "${RED}❌ Não foi possível parar o processo${NC}"
            return 1
        fi
    fi
}

# Função para verificar status
status_vibe() {
    echo -e "${BLUE}📊 Status do Vibe Kanban${NC}"
    echo "========================"
    
    if is_running; then
        echo -e "Estado: ${GREEN}● Rodando${NC}"
        echo -e "URL: ${BLUE}$(get_server_url)${NC}"
        echo ""
        echo "Processos ativos:"
        ps aux | grep -E "vibe-kanban" | grep -v grep | grep -v "$0" | while read line; do
            echo "  $line"
        done
    else
        echo -e "Estado: ${RED}○ Parado${NC}"
    fi
    
    if [ -f "$LOG_FILE" ]; then
        echo ""
        echo "Últimas linhas do log:"
        tail -5 "$LOG_FILE" | sed 's/^/  /'
    fi
}

# Função para ver logs
view_logs() {
    if [ ! -f "$LOG_FILE" ]; then
        echo -e "${RED}❌ Arquivo de log não encontrado${NC}"
        return 1
    fi
    
    echo -e "${BLUE}📜 Exibindo logs em tempo real (Ctrl+C para sair)${NC}"
    echo "================================================"
    tail -f "$LOG_FILE"
}

# Função para reiniciar
restart_vibe() {
    echo -e "${YELLOW}🔄 Reiniciando Vibe Kanban...${NC}"
    stop_vibe
    sleep 2
    start_vibe
}

# Função para abrir no navegador
open_browser() {
    if ! is_running; then
        echo -e "${RED}❌ Vibe Kanban não está rodando${NC}"
        echo -e "Use: $0 start"
        return 1
    fi
    
    local url=$(get_server_url)
    if [ "$url" != "URL não encontrada" ] && [ "$url" != "Log não encontrado" ]; then
        echo -e "${BLUE}🌐 Abrindo $url no navegador...${NC}"
        open "$url" 2>/dev/null || xdg-open "$url" 2>/dev/null || echo "Não foi possível abrir o navegador"
    else
        echo -e "${RED}❌ URL não encontrada${NC}"
    fi
}

# Menu principal
show_banner

case "$1" in
    start)
        start_vibe
        ;;
    stop)
        stop_vibe
        ;;
    restart)
        restart_vibe
        ;;
    status)
        status_vibe
        ;;
    logs)
        view_logs
        ;;
    open)
        open_browser
        ;;
    *)
        echo "Uso: $0 {start|stop|restart|status|logs|open}"
        echo ""
        echo "Comandos:"
        echo "  start    - Iniciar Vibe Kanban em background"
        echo "  stop     - Parar Vibe Kanban"
        echo "  restart  - Reiniciar Vibe Kanban"
        echo "  status   - Verificar status e processos"
        echo "  logs     - Ver logs em tempo real"
        echo "  open     - Abrir no navegador"
        echo ""
        echo "Exemplos:"
        echo "  $0 start   # Inicia o servidor"
        echo "  $0 status  # Verifica se está rodando"
        echo "  $0 logs    # Acompanha os logs"
        ;;
esac