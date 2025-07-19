#!/bin/bash

# 🤖 Script para Manter HelloWorld Agent Sempre Ativo
# Garante que a porta 9999 tenha sempre o HelloWorld Agent respondendo

AGENT_DIR="/Users/agents/Desktop/claude-20x/agents/helloworld"
AGENT_PORT=9999
AGENT_HOST="0.0.0.0"
LOG_FILE="$AGENT_DIR/helloworld_agent.log"
PID_FILE="$AGENT_DIR/helloworld.pid"

# Cores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para log com timestamp
log_message() {
    echo -e "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Verificar se o agente está rodando
is_agent_running() {
    lsof -i :$AGENT_PORT >/dev/null 2>&1
}

# Verificar se o agente está respondendo
is_agent_healthy() {
    local response=$(curl -s -w "%{http_code}" -o /dev/null "http://localhost:$AGENT_PORT/.well-known/agent.json" 2>/dev/null)
    [ "$response" = "200" ]
}

# Obter PID do processo na porta 9999
get_agent_pid() {
    lsof -ti :$AGENT_PORT 2>/dev/null
}

# Iniciar o HelloWorld Agent
start_agent() {
    log_message "${BLUE}🚀 Iniciando HelloWorld Agent...${NC}"
    
    # Verificar se o diretório existe
    if [ ! -d "$AGENT_DIR" ]; then
        log_message "${RED}❌ Diretório do agente não encontrado: $AGENT_DIR${NC}"
        return 1
    fi
    
    # Navegar para o diretório do agente
    cd "$AGENT_DIR" || return 1
    
    # Iniciar o agente em background
    nohup python -m http.server $AGENT_PORT --bind $AGENT_HOST > "$LOG_FILE" 2>&1 &
    local pid=$!
    
    # Salvar PID
    echo $pid > "$PID_FILE"
    
    # Aguardar inicialização
    sleep 3
    
    # Verificar se iniciou corretamente
    if is_agent_running && is_agent_healthy; then
        log_message "${GREEN}✅ HelloWorld Agent iniciado com sucesso (PID: $pid)${NC}"
        return 0
    else
        log_message "${RED}❌ Falha ao iniciar HelloWorld Agent${NC}"
        return 1
    fi
}

# Parar o HelloWorld Agent
stop_agent() {
    log_message "${YELLOW}🛑 Parando HelloWorld Agent...${NC}"
    
    local pid=$(get_agent_pid)
    if [ -n "$pid" ]; then
        kill $pid 2>/dev/null
        sleep 2
        
        # Verificar se parou
        if ! is_agent_running; then
            log_message "${GREEN}✅ HelloWorld Agent parado com sucesso${NC}"
            rm -f "$PID_FILE"
        else
            log_message "${YELLOW}⚠️ Forçando parada do agente...${NC}"
            kill -9 $pid 2>/dev/null
            rm -f "$PID_FILE"
        fi
    else
        log_message "${YELLOW}⚠️ Nenhum processo encontrado na porta $AGENT_PORT${NC}"
    fi
}

# Verificar status do agente
check_status() {
    if is_agent_running; then
        if is_agent_healthy; then
            local pid=$(get_agent_pid)
            log_message "${GREEN}🟢 HelloWorld Agent: ATIVO e SAUDÁVEL (PID: $pid, Porta: $AGENT_PORT)${NC}"
            
            # Testar agent card
            local agent_name=$(curl -s "http://localhost:$AGENT_PORT/.well-known/agent.json" 2>/dev/null | jq -r '.name' 2>/dev/null)
            if [ "$agent_name" != "null" ] && [ -n "$agent_name" ]; then
                log_message "${BLUE}   📝 Agent Name: $agent_name${NC}"
            fi
            return 0
        else
            log_message "${YELLOW}🟡 HelloWorld Agent: RODANDO mas NÃO RESPONDENDO${NC}"
            return 1
        fi
    else
        log_message "${RED}🔴 HelloWorld Agent: INATIVO (Porta $AGENT_PORT)${NC}"
        return 1
    fi
}

# Garantir que o agente esteja sempre ativo
ensure_active() {
    if ! check_status; then
        log_message "${BLUE}🔄 Agente não está ativo, iniciando...${NC}"
        stop_agent  # Limpar qualquer processo problemático
        start_agent
    fi
}

# Monitoramento contínuo
monitor() {
    log_message "${BLUE}👁️ Iniciando monitoramento contínuo do HelloWorld Agent...${NC}"
    log_message "${BLUE}   Pressione Ctrl+C para parar${NC}"
    
    while true; do
        ensure_active
        sleep 30  # Verificar a cada 30 segundos
    done
}

# Menu principal
case "${1:-status}" in
    "start")
        start_agent
        ;;
    "stop")
        stop_agent
        ;;
    "restart")
        stop_agent
        sleep 2
        start_agent
        ;;
    "status")
        check_status
        ;;
    "ensure")
        ensure_active
        ;;
    "monitor")
        monitor
        ;;
    "logs")
        if [ -f "$LOG_FILE" ]; then
            tail -f "$LOG_FILE"
        else
            log_message "${RED}❌ Arquivo de log não encontrado: $LOG_FILE${NC}"
        fi
        ;;
    "test")
        log_message "${BLUE}🧪 Testando HelloWorld Agent...${NC}"
        if is_agent_healthy; then
            log_message "${GREEN}✅ Teste de conectividade: SUCESSO${NC}"
            curl -s "http://localhost:$AGENT_PORT/.well-known/agent.json" | jq '.'
        else
            log_message "${RED}❌ Teste de conectividade: FALHA${NC}"
        fi
        ;;
    *)
        echo "Uso: $0 {start|stop|restart|status|ensure|monitor|logs|test}"
        echo ""
        echo "Comandos:"
        echo "  start   - Iniciar o HelloWorld Agent"
        echo "  stop    - Parar o HelloWorld Agent"
        echo "  restart - Reiniciar o HelloWorld Agent"
        echo "  status  - Verificar status do agente"
        echo "  ensure  - Garantir que o agente esteja ativo"
        echo "  monitor - Monitoramento contínuo (Ctrl+C para parar)"
        echo "  logs    - Visualizar logs em tempo real"
        echo "  test    - Testar conectividade do agente"
        ;;
esac