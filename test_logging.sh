#!/bin/bash
echo "🧪 Testando Sistema de Logging..."

# 1. Enviar diferentes níveis de log
echo "📝 Enviando logs de diferentes níveis..."
curl -s -X POST http://localhost:8002/logs \
  -H "Content-Type: application/json" \
  -d '{"level": "DEBUG", "source": "ui", "service": "test", "message": "Debug message"}' > /dev/null

curl -s -X POST http://localhost:8002/logs \
  -H "Content-Type: application/json" \
  -d '{"level": "WARNING", "source": "mcp_server", "service": "test", "message": "Warning: Alta latência detectada"}' > /dev/null

curl -s -X POST http://localhost:8002/logs \
  -H "Content-Type: application/json" \
  -d '{"level": "ERROR", "source": "agent_helloworld", "service": "test", "message": "Erro: Falha na conexão com agente"}' > /dev/null

echo "✅ Logs enviados!"

# 2. Consultar logs por nível
echo -e "\n🔴 Logs de ERROR:"
curl -s "http://localhost:8002/logs?level=ERROR&limit=5" | python -m json.tool | grep message

# 3. Verificar saúde
echo -e "\n💚 Status do Sistema:"
curl -s http://localhost:8002/health | python -m json.tool

echo -e "\n✨ Teste concluído! Acesse http://localhost:8002/docs para mais opções."
