#!/bin/bash

# 🔧 Configurar HelloWorld Agent para iniciar automaticamente
# Este script configura o sistema para iniciar o HelloWorld Agent automaticamente

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
AUTO_START_SCRIPT="$SCRIPT_DIR/auto_start_helloworld.sh"

echo "🔧 Configurando HelloWorld Agent para auto-start..."

# 1. Adicionar ao .zshrc ou .bash_profile
SHELL_RC=""
if [ -n "$ZSH_VERSION" ]; then
    SHELL_RC="$HOME/.zshrc"
elif [ -n "$BASH_VERSION" ]; then
    SHELL_RC="$HOME/.bash_profile"
else
    SHELL_RC="$HOME/.profile"
fi

echo "📝 Adicionando auto-start ao $SHELL_RC..."

# Verificar se já existe
if ! grep -q "auto_start_helloworld.sh" "$SHELL_RC" 2>/dev/null; then
    echo "" >> "$SHELL_RC"
    echo "# HelloWorld Agent Auto-start" >> "$SHELL_RC"
    echo "# Garante que o HelloWorld Agent esteja sempre ativo na porta 9999" >> "$SHELL_RC"
    echo "if [ -f \"$AUTO_START_SCRIPT\" ]; then" >> "$SHELL_RC"
    echo "    \"$AUTO_START_SCRIPT\" > /dev/null 2>&1 &" >> "$SHELL_RC"
    echo "fi" >> "$SHELL_RC"
    echo "✅ Auto-start adicionado ao $SHELL_RC"
else
    echo "ℹ️ Auto-start já configurado no $SHELL_RC"
fi

# 2. Criar LaunchAgent para macOS (opcional)
LAUNCH_AGENTS_DIR="$HOME/Library/LaunchAgents"
PLIST_FILE="$LAUNCH_AGENTS_DIR/com.a2a.helloworld.plist"

if [ ! -d "$LAUNCH_AGENTS_DIR" ]; then
    mkdir -p "$LAUNCH_AGENTS_DIR"
fi

echo "📋 Criando LaunchAgent para macOS..."

cat > "$PLIST_FILE" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.a2a.helloworld</string>
    <key>ProgramArguments</key>
    <array>
        <string>$AUTO_START_SCRIPT</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <dict>
        <key>SuccessfulExit</key>
        <false/>
    </dict>
    <key>StandardErrorPath</key>
    <string>$SCRIPT_DIR/launchagent.log</string>
    <key>StandardOutPath</key>
    <string>$SCRIPT_DIR/launchagent.log</string>
</dict>
</plist>
EOF

echo "✅ LaunchAgent criado em $PLIST_FILE"

# 3. Carregar o LaunchAgent
echo "🔄 Carregando LaunchAgent..."
launchctl load "$PLIST_FILE" 2>/dev/null || echo "⚠️ Aviso: Falha ao carregar LaunchAgent (normal se já estiver carregado)"

# 4. Testar a configuração
echo ""
echo "🧪 Testando configuração..."
"$SCRIPT_DIR/keep_helloworld_active.sh" status

echo ""
echo "🎉 Configuração completa!"
echo ""
echo "O HelloWorld Agent agora irá:"
echo "  ✅ Iniciar automaticamente ao fazer login"
echo "  ✅ Reiniciar automaticamente se falhar"
echo "  ✅ Estar sempre disponível na porta 9999"
echo ""
echo "Comandos úteis:"
echo "  $SCRIPT_DIR/keep_helloworld_active.sh status   # Verificar status"
echo "  $SCRIPT_DIR/keep_helloworld_active.sh monitor  # Monitoramento contínuo"
echo "  $SCRIPT_DIR/keep_helloworld_active.sh logs     # Ver logs"