#!/bin/bash

echo "🧹 Iniciando Monitor de Organização Automático"
echo "=============================================="
echo ""

# Opção 1: Usar Docker (recomendado para produção)
if command -v docker &> /dev/null; then
    echo "🐳 Docker detectado - Iniciando com Docker..."
    
    # Build da imagem se necessário
    if ! docker images | grep -q "auto-commit-agent"; then
        echo "📦 Construindo imagem Docker..."
        docker build -f docker/Dockerfile.auto-commit -t auto-commit-agent .
    fi
    
    # Parar container anterior se existir
    docker stop organization-watch 2>/dev/null || true
    docker rm organization-watch 2>/dev/null || true
    
    # Iniciar monitor
    docker run -d \
        --name organization-watch \
        -v $(pwd):/workspace:rw \
        -e NODE_ENV=production \
        --restart unless-stopped \
        auto-commit-agent \
        node /app/src/organization-dedup.ts watch
    
    echo "✅ Monitor iniciado em Docker!"
    echo "📋 Ver logs: docker logs -f organization-watch"
    echo "🛑 Parar: docker stop organization-watch"
    
else
    echo "🖥️  Iniciando monitor local..."
    
    # Verificar se PM2 está instalado
    if command -v pm2 &> /dev/null; then
        echo "⚡ PM2 detectado - Usando PM2 para gerenciamento"
        
        # Parar processo anterior se existir
        pm2 stop organization-watch 2>/dev/null || true
        pm2 delete organization-watch 2>/dev/null || true
        
        # Iniciar com PM2
        pm2 start src/organization-dedup.ts \
            --name "organization-watch" \
            --interpreter node \
            -- watch
        
        pm2 save
        
        echo "✅ Monitor iniciado com PM2!"
        echo "📋 Ver logs: pm2 logs organization-watch"
        echo "📊 Status: pm2 status"
        echo "🛑 Parar: pm2 stop organization-watch"
        
    else
        echo "💡 Instalando PM2 para melhor gerenciamento..."
        npm install -g pm2
        
        # Tentar novamente
        pm2 start src/organization-dedup.ts \
            --name "organization-watch" \
            --interpreter node \
            -- watch
        
        pm2 save
        pm2 startup
        
        echo "✅ PM2 instalado e monitor iniciado!"
    fi
fi

echo ""
echo "🎯 Monitor de Organização está rodando!"
echo "   - Verificação a cada 5 minutos"
echo "   - Alertas sobre problemas de organização"
echo "   - Logs salvos automaticamente"