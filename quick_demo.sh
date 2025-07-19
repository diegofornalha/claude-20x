#!/bin/bash

# Quick Demo - Demonstração rápida do sistema

echo "🎯 Demonstração Rápida do Sistema A2A"
echo ""

# Verificar status atual
echo "📊 Status atual:"
./agent_manager.sh status
echo ""

# Oferecer opções
echo "O que você gostaria de fazer?"
echo "1) Iniciar sistema completo"
echo "2) Apenas verificar UI"
echo "3) Configurar inicialização automática"
echo "4) Ver logs da UI"
echo "5) Sair"
echo ""
read -p "Escolha (1-5): " choice

case $choice in
    1)
        echo ""
        ./start_system.sh
        echo ""
        echo "✅ Sistema iniciado!"
        echo "🌐 Acesse: http://0.0.0.0:12000/agents"
        ;;
    2)
        echo ""
        ./ensure_ui_running.sh
        if curl -s -f "http://0.0.0.0:12000/agents" >/dev/null 2>&1; then
            echo "✅ UI está acessível em: http://0.0.0.0:12000/agents"
        else
            echo "❌ UI não está respondendo"
        fi
        ;;
    3)
        echo ""
        ./setup_autostart.sh
        ;;
    4)
        echo ""
        echo "📄 Últimas 20 linhas do log da UI:"
        echo "-----------------------------------"
        tail -20 logs/agents/ui.log 2>/dev/null || echo "Log ainda não existe"
        ;;
    5)
        echo "👋 Até logo!"
        exit 0
        ;;
    *)
        echo "❌ Opção inválida"
        ;;
esac