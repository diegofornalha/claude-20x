#!/bin/bash
# Setup Chromium Otimizado
echo "🎭 Configurando Chromium compartilhado..."

# Baixar apenas uma vez
if [ ! -d ".chromium-shared" ]; then
    npx puppeteer browsers install chrome
fi

# Configurar variável de ambiente
export CHROMIUM_PATH=$(npx puppeteer browsers path chrome)
echo "✅ Chromium configurado em: $CHROMIUM_PATH"
