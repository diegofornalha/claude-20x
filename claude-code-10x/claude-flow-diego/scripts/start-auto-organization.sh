#!/bin/bash

echo "🤖 Iniciando Organização Automática"
echo "==================================="
echo ""

# Verificar se está na pasta correta
if [ ! -f "package.json" ]; then
    echo "❌ Erro: Execute este script na raiz do projeto claude-flow"
    exit 1
fi

echo "Escolha o método de execução:"
echo "1) Docker (recomendado)"
echo "2) Local com PM2"
echo "3) Local simples"
echo ""
read -p "Opção (1-3): " OPTION

case $OPTION in
    1)
        echo "🐳 Iniciando com Docker..."
        docker-compose -f config/docker-compose.auto-organization.yml up -d organization-auto-fix
        echo ""
        echo "✅ Organização automática iniciada!"
        echo "📋 Ver logs: docker logs -f organization-auto-fix"
        echo "🛑 Parar: docker-compose -f config/docker-compose.auto-organization.yml down"
        ;;
        
    2)
        echo "⚡ Iniciando com PM2..."
        
        # Instalar PM2 se necessário
        if ! command -v pm2 &> /dev/null; then
            echo "📦 Instalando PM2..."
            npm install -g pm2
        fi
        
        # Instalar dependências se necessário
        if [ ! -d "node_modules/chokidar" ]; then
            echo "📦 Instalando dependências..."
            npm install chokidar
        fi
        
        # Iniciar com PM2
        pm2 start src/organization-auto-fix.ts --name "org-auto-fix"
        pm2 save
        
        echo ""
        echo "✅ Organização automática iniciada com PM2!"
        echo "📋 Ver logs: pm2 logs org-auto-fix"
        echo "📊 Status: pm2 status"
        echo "🛑 Parar: pm2 stop org-auto-fix"
        ;;
        
    3)
        echo "🖥️  Iniciando localmente..."
        
        # Instalar dependências se necessário
        if [ ! -d "node_modules/chokidar" ]; then
            echo "📦 Instalando dependências..."
            npm install chokidar
        fi
        
        echo ""
        echo "✅ Iniciando organização automática..."
        echo "📋 Logs aparecerão abaixo"
        echo "🛑 Pressione Ctrl+C para parar"
        echo ""
        
        node src/organization-auto-fix.ts
        ;;
        
    *)
        echo "❌ Opção inválida"
        exit 1
        ;;
esac