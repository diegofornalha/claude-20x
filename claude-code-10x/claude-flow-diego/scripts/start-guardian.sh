#!/bin/bash

echo "🛡️  Iniciando Organization Guardian"
echo "=================================="
echo ""
echo "O Guardian irá:"
echo "✓ Manter seu projeto sempre em 100% de organização"
echo "✓ Corrigir problemas automaticamente"
echo "✓ Monitorar mudanças em tempo real"
echo "✓ Gerar relatórios de progresso"
echo ""

# Verificar se está na pasta correta
if [ ! -f "package.json" ]; then
    echo "❌ Erro: Execute este script na raiz do projeto claude-flow"
    exit 1
fi

# Criar estrutura necessária
echo "📁 Preparando estrutura..."
mkdir -p docs src/agents src/mcp src/core src/utils src/tests src/organization config scripts

echo ""
echo "Escolha o método de execução:"
echo "1) Docker (recomendado para produção)"
echo "2) Local com monitoramento"
echo "3) Local simples"
echo ""
read -p "Opção (1-3): " OPTION

case $OPTION in
    1)
        echo "🐳 Iniciando Guardian com Docker..."
        
        # Build se necessário
        if ! docker images | grep -q "claude-flow"; then
            echo "📦 Construindo imagem Docker..."
            docker build -t claude-flow .
        fi
        
        # Iniciar Guardian
        npm run docker:guardian
        
        echo ""
        echo "✅ Guardian iniciado em background!"
        echo ""
        echo "📊 Comandos úteis:"
        echo "   Ver logs: npm run docker:guardian:logs"
        echo "   Ver status: cat docs/GUARDIAN-STATUS.md"
        echo "   Ver score: cat docs/ORGANIZATION-SCORE.md"
        echo "   Parar: npm run docker:guardian:stop"
        echo ""
        echo "🌐 Dashboard: docker attach claude-flow-dashboard"
        ;;
        
    2)
        echo "🖥️  Iniciando Guardian local com PM2..."
        
        # Instalar PM2 se necessário
        if ! command -v pm2 &> /dev/null; then
            echo "📦 Instalando PM2..."
            npm install -g pm2
        fi
        
        # Parar instância anterior
        pm2 stop org-guardian 2>/dev/null || true
        pm2 delete org-guardian 2>/dev/null || true
        
        # Iniciar Guardian
        pm2 start npm --name "org-guardian" -- run guardian
        pm2 save
        
        echo ""
        echo "✅ Guardian iniciado com PM2!"
        echo ""
        echo "📊 Comandos úteis:"
        echo "   Ver logs: pm2 logs org-guardian"
        echo "   Status: pm2 status"
        echo "   Monitorar: pm2 monit"
        echo "   Parar: pm2 stop org-guardian"
        echo ""
        
        # Mostrar status inicial
        sleep 3
        pm2 status
        ;;
        
    3)
        echo "🚀 Iniciando Guardian localmente..."
        echo ""
        echo "📋 Logs aparecerão abaixo"
        echo "🛑 Pressione Ctrl+C para parar"
        echo ""
        
        npm run guardian
        ;;
        
    *)
        echo "❌ Opção inválida"
        exit 1
        ;;
esac