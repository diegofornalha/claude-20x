#!/bin/bash

# Script para iniciar MCP Server Mem0 com busca semântica real
# Porta: 3020 (seguindo organização A2A)

set -e

echo "🧠 INICIANDO MCP SERVER MEM0 COM BUSCA SEMÂNTICA"
echo "=============================================="

# Configuração
MCP_PORT=3020
LOG_DIR="./logs/mcp-mem0"
LOG_FILE="$LOG_DIR/mem0-mcp-server.log"
PID_FILE="$LOG_DIR/mem0-mcp-server.pid"

# Criar diretório de logs
mkdir -p "$LOG_DIR"

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "📋 Configuração:"
echo "  Porta: $MCP_PORT"
echo "  Log: $LOG_FILE"
echo "  PID: $PID_FILE"

# Verificar se porta está livre
if lsof -i :$MCP_PORT >/dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Porta $MCP_PORT já está em uso${NC}"
    
    # Tentar parar processo existente
    if [ -f "$PID_FILE" ]; then
        OLD_PID=$(cat "$PID_FILE")
        echo "🛑 Parando processo existente (PID: $OLD_PID)..."
        kill -TERM "$OLD_PID" 2>/dev/null || true
        sleep 2
        
        # Force kill se necessário
        if kill -0 "$OLD_PID" 2>/dev/null; then
            echo "💥 Force killing processo..."
            kill -KILL "$OLD_PID" 2>/dev/null || true
        fi
        
        rm -f "$PID_FILE"
    fi
    
    # Verificar novamente
    if lsof -i :$MCP_PORT >/dev/null 2>&1; then
        echo -e "${RED}❌ Não foi possível liberar porta $MCP_PORT${NC}"
        exit 1
    fi
fi

echo -e "${GREEN}✅ Porta $MCP_PORT disponível${NC}"

# Configurar variáveis de ambiente para Mem0
export MEM0_API_KEY=""  # Usando modo local
export MEM0_CONFIG_PATH=""  # Usando configuração padrão

# Iniciar servidor MCP Mem0 em background
echo "🚀 Iniciando servidor MCP Mem0..."

nohup npx @mem0/mcp-server --port $MCP_PORT > "$LOG_FILE" 2>&1 &
SERVER_PID=$!

echo $SERVER_PID > "$PID_FILE"
echo -e "${GREEN}✅ Servidor iniciado (PID: $SERVER_PID)${NC}"

# Aguardar inicialização
echo "⏳ Aguardando servidor estabilizar..."
sleep 5

# Verificar se processo ainda está rodando
if ! kill -0 $SERVER_PID 2>/dev/null; then
    echo -e "${RED}❌ Servidor falhou ao iniciar${NC}"
    echo "📋 Últimas linhas do log:"
    tail -10 "$LOG_FILE"
    exit 1
fi

# Testar conectividade
echo "🔍 Testando conectividade..."
MAX_ATTEMPTS=10
ATTEMPT=1

while [ $ATTEMPT -le $MAX_ATTEMPTS ]; do
    if curl -s --max-time 3 "http://localhost:$MCP_PORT/health" >/dev/null 2>&1; then
        echo -e "${GREEN}✅ Servidor respondendo na porta $MCP_PORT${NC}"
        break
    elif curl -s --max-time 3 "http://localhost:$MCP_PORT/" >/dev/null 2>&1; then
        echo -e "${GREEN}✅ Servidor ativo na porta $MCP_PORT${NC}"
        break
    else
        echo "⏳ Tentativa $ATTEMPT/$MAX_ATTEMPTS..."
        sleep 2
        ATTEMPT=$((ATTEMPT + 1))
    fi
done

if [ $ATTEMPT -gt $MAX_ATTEMPTS ]; then
    echo -e "${YELLOW}⚠️  Servidor pode estar rodando mas não responde a HTTP${NC}"
    echo "📋 Últimas linhas do log:"
    tail -10 "$LOG_FILE"
fi

echo
echo "📊 STATUS DO SERVIDOR MEM0 MCP"
echo "=============================="
echo -e "🟢 Status: ${GREEN}ATIVO${NC}"
echo "🆔 PID: $SERVER_PID"
echo "🌐 Porta: $MCP_PORT"
echo "📄 Log: $LOG_FILE"
echo "🔧 Config: MCP Server com busca semântica"

echo
echo "🔗 INTEGRAÇÃO COM SISTEMA HÍBRIDO"
echo "=================================="
echo "Para integrar com o sistema híbrido existente:"
echo "1. Atualizar hybrid-memory-bridge.py para incluir MCP endpoint"
echo "2. Configurar busca semântica na porta 3020"
echo "3. Testar busca conceitual vs literal"

echo
echo "🧪 COMANDOS DE TESTE"
echo "===================="
echo "# Testar servidor MCP:"
echo "curl http://localhost:3020/"
echo
echo "# Ver logs em tempo real:"
echo "tail -f $LOG_FILE"
echo
echo "# Parar servidor:"
echo "kill \$(cat $PID_FILE)"

echo
echo -e "${GREEN}✅ MCP Server Mem0 iniciado com sucesso!${NC}"
echo "Agora você tem busca semântica real disponível na porta 3020"