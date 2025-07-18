#!/bin/bash
# Script para manter o Guardian Agent sempre ativo na porta 10102
# Similar ao HelloWorld que roda na porta 9999

HELLOWORLD_DIR="/Users/agents/Desktop/codex/agents/helloworld"

echo "🛡️ INICIANDO GUARDIAN AGENT - SEMPRE ATIVO"
echo "=========================================="
echo "📍 Porta: http://localhost:10102/"
echo "🌍 Comparação: HelloWorld em http://localhost:9999/"
echo ""

# Verificar se estamos no diretório correto
if [[ ! -f "$HELLOWORLD_DIR/guardian_main.py" ]]; then
    echo "❌ Arquivos do Guardian não encontrados!"
    echo "💡 Execute primeiro os scripts de configuração"
    exit 1
fi

cd "$HELLOWORLD_DIR"

# Ativar ambiente virtual
if [[ -d ".venv" ]]; then
    echo "🔧 Ativando ambiente virtual..."
    source .venv/bin/activate
else
    echo "⚠️ Ambiente virtual não encontrado, usando Python global"
fi

# Verificar se já está rodando
if lsof -i :10102 &> /dev/null; then
    echo "✅ Guardian já está rodando na porta 10102!"
    echo "🔄 Para reiniciar, mate o processo primeiro: pkill -f guardian_main.py"
    exit 0
fi

echo "🚀 Iniciando Guardian Agent..."
echo "🔄 Para parar: Ctrl+C ou pkill -f guardian_main.py"
echo ""

# Executar com restart automático
while true; do
    echo "🛡️ $(date): Iniciando Guardian Agent..."
    
    python3 guardian_main.py
    
    EXIT_CODE=$?
    echo "⚠️ $(date): Guardian parou (código: $EXIT_CODE)"
    
    if [[ $EXIT_CODE -eq 130 ]]; then
        echo "🛑 Guardian interrompido pelo usuário (Ctrl+C)"
        break
    fi
    
    echo "🔄 Reiniciando em 3 segundos..."
    sleep 3
done

echo "✅ Guardian Agent finalizado"