#!/bin/bash

echo "🚀 Instalador do Monitor de Organização Automático"
echo "=================================================="
echo ""

PROJECT_PATH=$(pwd)
USER=$(whoami)

# Detectar sistema operacional
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS - usar launchd
    echo "🍎 Sistema macOS detectado"
    
    PLIST_FILE="$HOME/Library/LaunchAgents/com.claudeflow.organization.plist"
    
    # Criar arquivo plist
    cat > "$PLIST_FILE" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.claudeflow.organization</string>
    
    <key>ProgramArguments</key>
    <array>
        <string>/usr/local/bin/node</string>
        <string>$PROJECT_PATH/src/organization-auto-fix.ts</string>
    </array>
    
    <key>WorkingDirectory</key>
    <string>$PROJECT_PATH</string>
    
    <key>RunAtLoad</key>
    <true/>
    
    <key>KeepAlive</key>
    <true/>
    
    <key>StandardOutPath</key>
    <string>$HOME/Library/Logs/claudeflow-organization.log</string>
    
    <key>StandardErrorPath</key>
    <string>$HOME/Library/Logs/claudeflow-organization-error.log</string>
</dict>
</plist>
EOF

    # Carregar serviço
    launchctl unload "$PLIST_FILE" 2>/dev/null || true
    launchctl load "$PLIST_FILE"
    
    echo "✅ Serviço instalado no macOS!"
    echo "📋 Logs em: ~/Library/Logs/claudeflow-organization.log"
    echo "🛑 Para parar: launchctl unload $PLIST_FILE"
    
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux - usar systemd
    echo "🐧 Sistema Linux detectado"
    
    SERVICE_FILE="/etc/systemd/system/claudeflow-organization.service"
    
    # Criar arquivo de serviço
    sudo tee "$SERVICE_FILE" > /dev/null << EOF
[Unit]
Description=Claude Flow Organization Monitor
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$PROJECT_PATH
ExecStart=/usr/bin/node $PROJECT_PATH/src/organization-auto-fix.ts
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

    # Recarregar systemd e iniciar serviço
    sudo systemctl daemon-reload
    sudo systemctl enable claudeflow-organization
    sudo systemctl start claudeflow-organization
    
    echo "✅ Serviço instalado no Linux!"
    echo "📋 Ver logs: sudo journalctl -u claudeflow-organization -f"
    echo "🛑 Para parar: sudo systemctl stop claudeflow-organization"
fi

echo ""
echo "🎉 Monitor de Organização Automático instalado!"
echo ""
echo "Funcionalidades ativas:"
echo "  ✅ Verificação a cada 5 minutos"
echo "  ✅ Correção automática de problemas"
echo "  ✅ Monitoramento de novos arquivos"
echo "  ✅ Início automático com o sistema"