#!/bin/bash

# ============================================================================
# Agent Manager - Sistema Universal de Gerenciamento de Agentes A2A
# ============================================================================
# Uso: ./agent_manager.sh [comando] [agente_id]
# Comandos: start, stop, restart, status, monitor, list, enable, disable
# ============================================================================

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Diretórios base
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG_FILE="$SCRIPT_DIR/config/agents.json"
LOG_DIR="$SCRIPT_DIR/logs/agents"
PID_DIR="$SCRIPT_DIR/run"
MONITOR_PID_FILE="$PID_DIR/agent_monitor.pid"

# Criar diretórios necessários
mkdir -p "$LOG_DIR" "$PID_DIR"

# ============================================================================
# Funções Utilitárias
# ============================================================================

log() {
    echo -e "${2:-$NC}[$(date '+%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    log "❌ $1" "$RED" >&2
}

success() {
    log "✅ $1" "$GREEN"
}

info() {
    log "ℹ️  $1" "$BLUE"
}

warning() {
    log "⚠️  $1" "$YELLOW"
}

# Verificar se jq está instalado
check_dependencies() {
    if ! command -v jq &> /dev/null; then
        error "jq não está instalado. Instale com: brew install jq"
        exit 1
    fi
    
    if [ ! -f "$CONFIG_FILE" ]; then
        error "Arquivo de configuração não encontrado: $CONFIG_FILE"
        exit 1
    fi
}

# Obter configuração de um agente
get_agent_config() {
    local agent_id=$1
    jq -r ".agents[] | select(.id == \"$agent_id\")" "$CONFIG_FILE"
}

# Listar todos os agentes
list_agents() {
    jq -r '.agents[] | [.id, .name, .port, if .enabled then "✅" else "❌" end] | @tsv' "$CONFIG_FILE" | \
    column -t -s $'\t' -N "ID,NOME,PORTA,ATIVO"
}

# Verificar se uma porta está em uso
check_port() {
    local port=$1
    lsof -i ":$port" >/dev/null 2>&1
}

# Obter PID de um processo na porta
get_pid_by_port() {
    local port=$1
    lsof -ti ":$port" 2>/dev/null | head -1
}

# Verificar saúde do agente
check_agent_health() {
    local port=$1
    local health_check=$2
    local timeout=${3:-5}
    
    if [ -z "$health_check" ]; then
        return 1
    fi
    
    curl -s -f -m "$timeout" "http://localhost:$port$health_check" >/dev/null 2>&1
}

# ============================================================================
# Funções de Controle de Agentes
# ============================================================================

start_agent() {
    local agent_id=$1
    local agent_config=$(get_agent_config "$agent_id")
    
    if [ -z "$agent_config" ]; then
        error "Agente '$agent_id' não encontrado na configuração"
        return 1
    fi
    
    local name=$(echo "$agent_config" | jq -r '.name')
    local port=$(echo "$agent_config" | jq -r '.port')
    local path=$(echo "$agent_config" | jq -r '.path')
    local command=$(echo "$agent_config" | jq -r '.command')
    local enabled=$(echo "$agent_config" | jq -r '.enabled')
    local host=$(echo "$agent_config" | jq -r '.host')
    
    if [ "$enabled" != "true" ]; then
        warning "Agente '$name' está desabilitado"
        return 1
    fi
    
    if check_port "$port"; then
        info "Agente '$name' já está rodando na porta $port"
        return 0
    fi
    
    info "Iniciando $name..."
    
    # Verificar se o diretório existe
    if [ ! -d "$path" ]; then
        error "Diretório do agente não encontrado: $path"
        return 1
    fi
    
    # Criar arquivo de log
    local log_file="$LOG_DIR/${agent_id}.log"
    local pid_file="$PID_DIR/${agent_id}.pid"
    
    # Carregar variáveis de ambiente
    local env_vars=$(echo "$agent_config" | jq -r '.environment | to_entries | .[] | "\(.key)=\(.value)"')
    
    # Executar comando
    (
        cd "$path"
        if [ -n "$env_vars" ]; then
            export $env_vars
        fi
        eval "$command --host $host --port $port" > "$log_file" 2>&1 &
        echo $! > "$pid_file"
    )
    
    sleep 2
    
    # Verificar se iniciou corretamente
    if check_port "$port"; then
        success "$name iniciado com sucesso (PID: $(cat "$pid_file"))"
        return 0
    else
        error "Falha ao iniciar $name"
        rm -f "$pid_file"
        return 1
    fi
}

stop_agent() {
    local agent_id=$1
    local agent_config=$(get_agent_config "$agent_id")
    
    if [ -z "$agent_config" ]; then
        error "Agente '$agent_id' não encontrado na configuração"
        return 1
    fi
    
    local name=$(echo "$agent_config" | jq -r '.name')
    local port=$(echo "$agent_config" | jq -r '.port')
    local pid_file="$PID_DIR/${agent_id}.pid"
    
    if ! check_port "$port"; then
        info "Agente '$name' não está rodando"
        rm -f "$pid_file"
        return 0
    fi
    
    info "Parando $name..."
    
    # Tentar parar pelo PID do arquivo
    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        if kill -0 "$pid" 2>/dev/null; then
            kill -TERM "$pid"
            sleep 2
            if kill -0 "$pid" 2>/dev/null; then
                kill -KILL "$pid"
            fi
        fi
        rm -f "$pid_file"
    fi
    
    # Se ainda estiver rodando, forçar parada pela porta
    local port_pid=$(get_pid_by_port "$port")
    if [ -n "$port_pid" ]; then
        kill -KILL "$port_pid"
    fi
    
    success "$name parado"
    return 0
}

restart_agent() {
    local agent_id=$1
    stop_agent "$agent_id"
    sleep 1
    start_agent "$agent_id"
}

agent_status() {
    local agent_id=$1
    
    if [ -n "$agent_id" ]; then
        # Status de um agente específico
        local agent_config=$(get_agent_config "$agent_id")
        if [ -z "$agent_config" ]; then
            error "Agente '$agent_id' não encontrado"
            return 1
        fi
        
        print_agent_status "$agent_config"
    else
        # Status de todos os agentes
        echo -e "\n${CYAN}📊 Status dos Agentes A2A${NC}"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        
        jq -c '.agents[]' "$CONFIG_FILE" | while read -r agent; do
            print_agent_status "$agent"
        done
        
        echo -e "\n${CYAN}📈 Resumo:${NC}"
        local total=$(jq '.agents | length' "$CONFIG_FILE")
        local enabled=$(jq '[.agents[] | select(.enabled == true)] | length' "$CONFIG_FILE")
        local running=0
        
        jq -r '.agents[] | select(.enabled == true) | .port' "$CONFIG_FILE" | while read -r port; do
            if check_port "$port"; then
                ((running++))
            fi
        done
        
        echo "  Total de agentes: $total"
        echo "  Agentes habilitados: $enabled"
        echo "  Agentes rodando: $running"
    fi
}

print_agent_status() {
    local agent_config=$1
    local name=$(echo "$agent_config" | jq -r '.name')
    local id=$(echo "$agent_config" | jq -r '.id')
    local port=$(echo "$agent_config" | jq -r '.port')
    local enabled=$(echo "$agent_config" | jq -r '.enabled')
    local health_check=$(echo "$agent_config" | jq -r '.health_check')
    local pid_file="$PID_DIR/${id}.pid"
    
    echo -e "\n${BLUE}📦 $name${NC} (ID: $id)"
    echo "  Porta: $port"
    echo -n "  Status: "
    
    if [ "$enabled" != "true" ]; then
        echo -e "${YELLOW}🔶 Desabilitado${NC}"
    elif check_port "$port"; then
        echo -e "${GREEN}🟢 Rodando${NC}"
        
        if [ -f "$pid_file" ]; then
            echo "  PID: $(cat "$pid_file")"
        fi
        
        # Verificar saúde
        echo -n "  Saúde: "
        if check_agent_health "$port" "$health_check"; then
            echo -e "${GREEN}✅ OK${NC}"
            
            # Tentar obter mais informações
            local agent_info=$(curl -s "http://localhost:$port$health_check" 2>/dev/null)
            if [ -n "$agent_info" ]; then
                local version=$(echo "$agent_info" | jq -r '.version // "N/A"' 2>/dev/null)
                if [ "$version" != "N/A" ]; then
                    echo "  Versão: $version"
                fi
            fi
        else
            echo -e "${RED}❌ Falha${NC}"
        fi
    else
        echo -e "${RED}🔴 Parado${NC}"
    fi
    
    # Log file info
    local log_file="$LOG_DIR/${id}.log"
    if [ -f "$log_file" ]; then
        echo "  Log: $log_file"
        if [ -s "$log_file" ]; then
            echo "  Últimas linhas do log:"
            tail -3 "$log_file" | sed 's/^/    /'
        fi
    fi
}

# ============================================================================
# Monitor de Agentes
# ============================================================================

start_monitor() {
    if [ -f "$MONITOR_PID_FILE" ] && kill -0 $(cat "$MONITOR_PID_FILE") 2>/dev/null; then
        warning "Monitor já está rodando (PID: $(cat "$MONITOR_PID_FILE"))"
        return 1
    fi
    
    info "Iniciando monitor de agentes..."
    
    # Executar monitor em background
    (
        while true; do
            # Verificar cada agente habilitado
            jq -c '.agents[] | select(.enabled == true)' "$CONFIG_FILE" | while read -r agent; do
                local id=$(echo "$agent" | jq -r '.id')
                local port=$(echo "$agent" | jq -r '.port')
                local restart_on_failure=$(echo "$agent" | jq -r '.restart_on_failure')
                local health_check=$(echo "$agent" | jq -r '.health_check')
                
                if [ "$restart_on_failure" == "true" ] && ! check_port "$port"; then
                    warning "Agente '$id' não está respondendo. Reiniciando..."
                    start_agent "$id"
                elif check_port "$port" && ! check_agent_health "$port" "$health_check"; then
                    warning "Agente '$id' falhou no health check. Reiniciando..."
                    restart_agent "$id"
                fi
            done
            
            # Intervalo de verificação
            sleep $(jq -r '.global_settings.health_check_interval // 30' "$CONFIG_FILE")
        done
    ) > "$LOG_DIR/monitor.log" 2>&1 &
    
    echo $! > "$MONITOR_PID_FILE"
    success "Monitor iniciado (PID: $!)"
}

stop_monitor() {
    if [ ! -f "$MONITOR_PID_FILE" ]; then
        info "Monitor não está rodando"
        return 0
    fi
    
    local pid=$(cat "$MONITOR_PID_FILE")
    if kill -0 "$pid" 2>/dev/null; then
        kill -TERM "$pid"
        rm -f "$MONITOR_PID_FILE"
        success "Monitor parado"
    else
        rm -f "$MONITOR_PID_FILE"
        info "Monitor não estava rodando"
    fi
}

# ============================================================================
# Comandos de Gerenciamento
# ============================================================================

enable_agent() {
    local agent_id=$1
    if [ -z "$agent_id" ]; then
        error "ID do agente é obrigatório"
        return 1
    fi
    
    # Criar arquivo temporário
    local temp_file=$(mktemp)
    
    # Atualizar configuração
    jq "(.agents[] | select(.id == \"$agent_id\") | .enabled) = true" "$CONFIG_FILE" > "$temp_file"
    
    if [ $? -eq 0 ]; then
        mv "$temp_file" "$CONFIG_FILE"
        success "Agente '$agent_id' habilitado"
    else
        rm -f "$temp_file"
        error "Falha ao habilitar agente '$agent_id'"
        return 1
    fi
}

disable_agent() {
    local agent_id=$1
    if [ -z "$agent_id" ]; then
        error "ID do agente é obrigatório"
        return 1
    fi
    
    # Parar o agente primeiro
    stop_agent "$agent_id"
    
    # Criar arquivo temporário
    local temp_file=$(mktemp)
    
    # Atualizar configuração
    jq "(.agents[] | select(.id == \"$agent_id\") | .enabled) = false" "$CONFIG_FILE" > "$temp_file"
    
    if [ $? -eq 0 ]; then
        mv "$temp_file" "$CONFIG_FILE"
        success "Agente '$agent_id' desabilitado"
    else
        rm -f "$temp_file"
        error "Falha ao desabilitar agente '$agent_id'"
        return 1
    fi
}

# ============================================================================
# Comandos Compostos
# ============================================================================

start_all() {
    info "Iniciando todos os agentes habilitados..."
    local delay=$(jq -r '.global_settings.startup_delay // 2' "$CONFIG_FILE")
    
    jq -r '.agents[] | select(.enabled == true) | .id' "$CONFIG_FILE" | while read -r agent_id; do
        start_agent "$agent_id"
        sleep "$delay"
    done
}

stop_all() {
    info "Parando todos os agentes..."
    
    jq -r '.agents[] | .id' "$CONFIG_FILE" | while read -r agent_id; do
        stop_agent "$agent_id"
    done
}

restart_all() {
    stop_all
    sleep 2
    start_all
}

# ============================================================================
# Menu de Ajuda
# ============================================================================

show_help() {
    cat << EOF
${CYAN}╔═══════════════════════════════════════════════════════════════════╗
║                   Agent Manager - Gerenciador A2A                   ║
╚═══════════════════════════════════════════════════════════════════╝${NC}

${GREEN}Uso:${NC} $0 [comando] [argumentos]

${YELLOW}Comandos Principais:${NC}
  ${BLUE}start${NC} [agent_id|all]     Inicia agente(s)
  ${BLUE}stop${NC} [agent_id|all]      Para agente(s)
  ${BLUE}restart${NC} [agent_id|all]   Reinicia agente(s)
  ${BLUE}status${NC} [agent_id]        Mostra status do(s) agente(s)
  ${BLUE}list${NC}                     Lista todos os agentes

${YELLOW}Comandos de Configuração:${NC}
  ${BLUE}enable${NC} <agent_id>       Habilita um agente
  ${BLUE}disable${NC} <agent_id>      Desabilita um agente

${YELLOW}Comandos de Monitoramento:${NC}
  ${BLUE}monitor${NC} start           Inicia monitor automático
  ${BLUE}monitor${NC} stop            Para monitor automático
  ${BLUE}logs${NC} <agent_id>         Mostra logs de um agente

${YELLOW}Exemplos:${NC}
  $0 start all            # Inicia todos os agentes habilitados
  $0 start helloworld     # Inicia apenas o HelloWorld Agent
  $0 status               # Mostra status de todos os agentes
  $0 restart marvin       # Reinicia o Marvin Agent
  $0 monitor start        # Inicia monitoramento automático

${YELLOW}Configuração:${NC}
  Arquivo: $CONFIG_FILE
  Logs: $LOG_DIR/
  PIDs: $PID_DIR/

EOF
}

# ============================================================================
# Main
# ============================================================================

main() {
    check_dependencies
    
    case "${1:-help}" in
        start)
            if [ "$2" == "all" ] || [ -z "$2" ]; then
                start_all
            else
                start_agent "$2"
            fi
            ;;
        stop)
            if [ "$2" == "all" ] || [ -z "$2" ]; then
                stop_all
            else
                stop_agent "$2"
            fi
            ;;
        restart)
            if [ "$2" == "all" ] || [ -z "$2" ]; then
                restart_all
            else
                restart_agent "$2"
            fi
            ;;
        status)
            agent_status "$2"
            ;;
        list)
            echo -e "\n${CYAN}📋 Agentes Configurados:${NC}\n"
            list_agents
            ;;
        enable)
            enable_agent "$2"
            ;;
        disable)
            disable_agent "$2"
            ;;
        monitor)
            case "$2" in
                start)
                    start_monitor
                    ;;
                stop)
                    stop_monitor
                    ;;
                *)
                    error "Uso: $0 monitor [start|stop]"
                    ;;
            esac
            ;;
        logs)
            if [ -z "$2" ]; then
                error "ID do agente é obrigatório"
                exit 1
            fi
            log_file="$LOG_DIR/$2.log"
            if [ -f "$log_file" ]; then
                tail -f "$log_file"
            else
                error "Arquivo de log não encontrado: $log_file"
            fi
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            error "Comando desconhecido: $1"
            show_help
            exit 1
            ;;
    esac
}

# Executar main
main "$@"