#!/bin/bash
# Script para executar servidor Deno

# Mudar para o diretório do script
cd "$(dirname "$0")"

echo "🦕 Iniciando servidor Deno..."
echo "Servidor estará disponível em: http://localhost:8000"
echo ""
echo "Opções de execução:"
echo "1. Primeiro plano (Ctrl+C para parar):"
echo "   deno serve --allow-net deno-server.ts"
echo ""
echo "2. Background com logs:"
echo "   deno serve --allow-net deno-server.ts &"
echo ""
echo "3. Porta customizada:"
echo "   deno serve --allow-net --port 3000 deno-server.ts"
echo ""

# Executar servidor
deno serve --allow-net deno-server.ts