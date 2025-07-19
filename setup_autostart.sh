#!/bin/bash

# ============================================================================
# Setup Autostart - Configura inicialização automática do sistema A2A
# ============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Cores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${CYAN}╔═══════════════════════════════════════════════════════════════════╗"
echo -e "║        🔧 Configuração de Inicialização Automática 🔧              ║"
echo -e "╚═══════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Detectar sistema operacional
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS - usar launchd
    echo -e "${BLUE}▶ Sistema detectado: macOS${NC}"
    echo -e "${BLUE}▶ Configurando LaunchAgent...${NC}"
    
    # Criar arquivo plist para launchd
    PLIST_FILE="$HOME/Library/LaunchAgents/com.a2a.system.plist"
    
    cat > "$PLIST_FILE" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.a2a.system</string>
    
    <key>ProgramArguments</key>
    <array>
        <string>$SCRIPT_DIR/start_system.sh</string>
    </array>
    
    <key>RunAtLoad</key>
    <true/>
    
    <key>KeepAlive</key>
    <false/>
    
    <key>StandardOutPath</key>
    <string>$SCRIPT_DIR/logs/launchd_stdout.log</string>
    
    <key>StandardErrorPath</key>
    <string>$SCRIPT_DIR/logs/launchd_stderr.log</string>
    
    <key>WorkingDirectory</key>
    <string>$SCRIPT_DIR</string>
</dict>
</plist>
EOF
    
    # Criar plist para monitor contínuo
    MONITOR_PLIST="$HOME/Library/LaunchAgents/com.a2a.monitor.plist"
    
    cat > "$MONITOR_PLIST" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.a2a.monitor</string>
    
    <key>ProgramArguments</key>
    <array>
        <string>$SCRIPT_DIR/ensure_ui_running.sh</string>
    </array>
    
    <key>StartInterval</key>
    <integer>300</integer> <!-- Executa a cada 5 minutos -->
    
    <key>StandardOutPath</key>
    <string>$SCRIPT_DIR/logs/monitor_stdout.log</string>
    
    <key>StandardErrorPath</key>
    <string>$SCRIPT_DIR/logs/monitor_stderr.log</string>
    
    <key>WorkingDirectory</key>
    <string>$SCRIPT_DIR</string>
</dict>
</plist>
EOF
    
    # Carregar os agentes
    echo -e "${YELLOW}▶ Carregando agentes no launchd...${NC}"
    launchctl load "$PLIST_FILE" 2>/dev/null
    launchctl load "$MONITOR_PLIST" 2>/dev/null
    
    echo -e "${GREEN}✅ LaunchAgents configurados${NC}"
    echo ""
    echo -e "${CYAN}Comandos úteis:${NC}"
    echo "  Iniciar manualmente: launchctl start com.a2a.system"
    echo "  Parar: launchctl stop com.a2a.system"
    echo "  Desabilitar: launchctl unload ~/Library/LaunchAgents/com.a2a.system.plist"
    echo ""
    
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux - usar systemd
    echo -e "${BLUE}▶ Sistema detectado: Linux${NC}"
    echo -e "${BLUE}▶ Configurando systemd...${NC}"
    
    # Criar arquivo de serviço systemd
    SERVICE_FILE="/etc/systemd/system/a2a-system.service"
    
    echo -e "${YELLOW}▶ Criando arquivo de serviço (requer sudo)...${NC}"
    
    sudo tee "$SERVICE_FILE" > /dev/null << EOF
[Unit]
Description=A2A Agent System
After=network.target

[Service]
Type=forking
User=$USER
WorkingDirectory=$SCRIPT_DIR
ExecStart=$SCRIPT_DIR/start_system.sh
ExecStop=$SCRIPT_DIR/stop_system.sh
Restart=on-failure
RestartSec=30

[Install]
WantedBy=multi-user.target
EOF
    
    # Timer para monitor
    TIMER_FILE="/etc/systemd/system/a2a-monitor.timer"
    SERVICE_MONITOR="/etc/systemd/system/a2a-monitor.service"
    
    sudo tee "$SERVICE_MONITOR" > /dev/null << EOF
[Unit]
Description=A2A UI Monitor
After=network.target

[Service]
Type=oneshot
User=$USER
WorkingDirectory=$SCRIPT_DIR
ExecStart=$SCRIPT_DIR/ensure_ui_running.sh
EOF
    
    sudo tee "$TIMER_FILE" > /dev/null << EOF
[Unit]
Description=Run A2A Monitor every 5 minutes
Requires=a2a-monitor.service

[Timer]
OnBootSec=5min
OnUnitActiveSec=5min

[Install]
WantedBy=timers.target
EOF
    
    # Recarregar systemd e habilitar serviços
    echo -e "${YELLOW}▶ Habilitando serviços...${NC}"
    sudo systemctl daemon-reload
    sudo systemctl enable a2a-system.service
    sudo systemctl enable a2a-monitor.timer
    
    echo -e "${GREEN}✅ Serviços systemd configurados${NC}"
    echo ""
    echo -e "${CYAN}Comandos úteis:${NC}"
    echo "  Iniciar: sudo systemctl start a2a-system"
    echo "  Parar: sudo systemctl stop a2a-system"
    echo "  Status: sudo systemctl status a2a-system"
    echo "  Logs: sudo journalctl -u a2a-system -f"
    echo ""
    
else
    echo -e "${RED}❌ Sistema operacional não suportado${NC}"
    exit 1
fi

# Configurar cron como backup (funciona em ambos os sistemas)
echo -e "${BLUE}▶ Configurando cron como backup...${NC}"

# Criar entrada no crontab
CRON_CMD="*/5 * * * * $SCRIPT_DIR/ensure_ui_running.sh"
(crontab -l 2>/dev/null | grep -v "ensure_ui_running.sh"; echo "$CRON_CMD") | crontab -

echo -e "${GREEN}✅ Cron configurado para verificar UI a cada 5 minutos${NC}"
echo ""

# Criar script de desinstalação
cat > "$SCRIPT_DIR/uninstall_autostart.sh" << 'EOF'
#!/bin/bash

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "🗑️  Removendo configurações de inicialização automática..."

# macOS
if [[ "$OSTYPE" == "darwin"* ]]; then
    launchctl unload ~/Library/LaunchAgents/com.a2a.system.plist 2>/dev/null
    launchctl unload ~/Library/LaunchAgents/com.a2a.monitor.plist 2>/dev/null
    rm -f ~/Library/LaunchAgents/com.a2a.system.plist
    rm -f ~/Library/LaunchAgents/com.a2a.monitor.plist
    echo "✅ LaunchAgents removidos"
fi

# Linux
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    sudo systemctl stop a2a-system 2>/dev/null
    sudo systemctl disable a2a-system 2>/dev/null
    sudo systemctl stop a2a-monitor.timer 2>/dev/null
    sudo systemctl disable a2a-monitor.timer 2>/dev/null
    sudo rm -f /etc/systemd/system/a2a-system.service
    sudo rm -f /etc/systemd/system/a2a-monitor.service
    sudo rm -f /etc/systemd/system/a2a-monitor.timer
    sudo systemctl daemon-reload
    echo "✅ Serviços systemd removidos"
fi

# Remover do cron
crontab -l 2>/dev/null | grep -v "ensure_ui_running.sh" | crontab -
echo "✅ Entrada do cron removida"

echo "✅ Desinstalação concluída"
EOF

chmod +x "$SCRIPT_DIR/uninstall_autostart.sh"

echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ Configuração de inicialização automática concluída!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${CYAN}📌 O sistema A2A agora:${NC}"
echo "  • Iniciará automaticamente no boot"
echo "  • Será monitorado a cada 5 minutos"
echo "  • Reiniciará automaticamente em caso de falha"
echo ""
echo -e "${CYAN}📌 URLs sempre disponíveis:${NC}"
echo "  • UI Dashboard: http://0.0.0.0:12000/agents"
echo "  • Chat Interface: http://0.0.0.0:12000/"
echo ""
echo -e "${YELLOW}💡 Para desinstalar a inicialização automática:${NC}"
echo "  ./uninstall_autostart.sh"
echo ""