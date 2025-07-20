#!/bin/bash
# Interactive Menu for Vibe Kanban Manager

BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

show_menu() {
    clear
    echo -e "${BLUE}╔═══════════════════════════════════╗${NC}"
    echo -e "${BLUE}║     📋 Vibe Kanban Manager        ║${NC}"
    echo -e "${BLUE}╚═══════════════════════════════════╝${NC}"
    echo ""
    echo -e "${GREEN}Escolha uma opção:${NC}"
    echo ""
    echo "  1) ▶️  Iniciar"
    echo "  2) ⏹️  Parar"
    echo "  3) 🔄 Reiniciar"
    echo "  4) 📊 Ver Status"
    echo "  5) 📜 Ver Logs"
    echo "  6) 🌐 Abrir no Navegador"
    echo "  0) ❌ Sair"
    echo ""
}

DIR=$(dirname "$0")

while true; do
    show_menu
    read -p "Opção: " choice
    
    case $choice in
        1)
            echo ""
            $DIR/start.sh
            read -p "Pressione Enter para continuar..."
            ;;
        2)
            echo ""
            $DIR/stop.sh
            read -p "Pressione Enter para continuar..."
            ;;
        3)
            echo ""
            $DIR/restart.sh
            read -p "Pressione Enter para continuar..."
            ;;
        4)
            echo ""
            $DIR/status.sh
            read -p "Pressione Enter para continuar..."
            ;;
        5)
            echo ""
            echo -e "${YELLOW}Mostrando logs (Ctrl+C para voltar ao menu)${NC}"
            $DIR/logs.sh
            ;;
        6)
            echo ""
            $DIR/open.sh
            read -p "Pressione Enter para continuar..."
            ;;
        0)
            echo ""
            echo -e "${GREEN}Até logo! 👋${NC}"
            exit 0
            ;;
        *)
            echo ""
            echo -e "${RED}Opção inválida!${NC}"
            read -p "Pressione Enter para continuar..."
            ;;
    esac
done