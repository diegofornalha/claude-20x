#!/bin/bash
# MCP Auto-Start Hook
# Inicializa servidores MCP automaticamente

echo "🚀 Iniciando servidores MCP..."

# 1. Claude-Flow MCP
if ! pgrep -f "claude-flow mcp" > /dev/null; then
    echo "✅ Iniciando Claude-Flow MCP..."
    claude-flow mcp start --auto-orchestrator --enable-neural --daemon 2>/dev/null &
fi

# 2. RAG Server (quando configurado)
RAG_DIR="/Users/agents/Desktop/claude-20x/.conductor/hangzhou/PROJETOS/mcp-rag-server"
if [ -d "$RAG_DIR" ] && [ -f "$RAG_DIR/start_rag_mcp.py" ]; then
    if ! pgrep -f "start_rag_mcp.py" > /dev/null; then
        echo "✅ Iniciando RAG Server MCP..."
        cd "$RAG_DIR"
        if [ -d "venv" ]; then
            source venv/bin/activate
            python start_rag_mcp.py --mcp 2>/dev/null &
        else
            python3 start_rag_mcp.py --mcp 2>/dev/null &
        fi
    fi
fi

# 3. Verificar status
sleep 2
echo "📊 Status dos servidores MCP:"
claude mcp list 2>/dev/null || echo "⚠️  Claude MCP list indisponível"

echo "✅ Auto-start completo!"