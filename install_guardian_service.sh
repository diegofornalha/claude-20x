#!/bin/bash
# Instalador do Guardian como Serviço Permanente do Sistema
# Funciona em Linux/macOS

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
GUARDIAN_SCRIPT="$SCRIPT_DIR/start_guardian_daemon.py"

echo "🛡️ Instalando Guardian Agent como serviço permanente..."

# Verificar sistema operacional
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS - usar launchd
    echo "📱 Detectado macOS - Configurando launchd..."
    
    PLIST_FILE="$HOME/Library/LaunchAgents/com.a2a.guardian.plist"
    
    cat > "$PLIST_FILE" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.a2a.guardian</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/bin/python3</string>
        <string>$GUARDIAN_SCRIPT</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>/tmp/guardian_stdout.log</string>
    <key>StandardErrorPath</key>
    <string>/tmp/guardian_stderr.log</string>
    <key>WorkingDirectory</key>
    <string>$SCRIPT_DIR</string>
</dict>
</plist>
EOF

    # Carregar o serviço
    launchctl load "$PLIST_FILE"
    echo "✅ Guardian configurado como serviço launchd"
    echo "📍 Logs: /tmp/guardian_*.log"
    
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux - usar systemd
    echo "🐧 Detectado Linux - Configurando systemd..."
    
    SERVICE_FILE="/etc/systemd/system/guardian-agent.service"
    
    sudo tee "$SERVICE_FILE" > /dev/null << EOF
[Unit]
Description=Guardian Agent - A2A Sustainability Monitor
After=network.target
Wants=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$SCRIPT_DIR
ExecStart=/usr/bin/python3 $GUARDIAN_SCRIPT
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

    # Recarregar systemd e iniciar serviço
    sudo systemctl daemon-reload
    sudo systemctl enable guardian-agent.service
    sudo systemctl start guardian-agent.service
    
    echo "✅ Guardian configurado como serviço systemd"
    echo "📍 Logs: journalctl -u guardian-agent.service -f"
    
else
    echo "❌ Sistema operacional não suportado: $OSTYPE"
    exit 1
fi

# Tornar o script executável
chmod +x "$GUARDIAN_SCRIPT"

echo ""
echo "🎉 Guardian Agent instalado com sucesso!"
echo ""
echo "📋 Comandos úteis:"

if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "   Parar:     launchctl unload ~/Library/LaunchAgents/com.a2a.guardian.plist"
    echo "   Iniciar:   launchctl load ~/Library/LaunchAgents/com.a2a.guardian.plist"
    echo "   Status:    launchctl list | grep guardian"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    echo "   Parar:     sudo systemctl stop guardian-agent"
    echo "   Iniciar:   sudo systemctl start guardian-agent"
    echo "   Status:    sudo systemctl status guardian-agent"
    echo "   Logs:      journalctl -u guardian-agent -f"
fi

echo ""
echo "🛡️ O Guardian agora estará sempre ativo monitorando a sustentabilidade do sistema!"