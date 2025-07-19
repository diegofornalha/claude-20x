# ⚡ Comandos Rápidos - HelloWorld Agent (Porta 9999)

## 🚀 **Inicialização**

```bash
# Iniciar automaticamente (recomendado)
./start_agents.sh

# Iniciar manualmente
cd /Users/agents/Desktop/codex/agents/helloworld
nohup uv run . --host 0.0.0.0 --port 9999 > helloworld_agent.log 2>&1 &
```

## 🔍 **Verificação de Status**

```bash
# Status geral de todos os agentes
./check_agents.sh

# Verificar se está rodando na porta 9999
lsof -i :9999

# Verificar processo Python
ps aux | grep python | grep 9999

# Testar Agent Card
curl -s "http://localhost:9999/.well-known/agent.json" | jq '.name'

# Testar Health Check
curl -s "http://localhost:9999/health"
```

## 🛑 **Parada e Reinicialização**

```bash
# Parar HelloWorld Agent
pkill -f 'python.*9999'

# Parar forçadamente
lsof -ti :9999 | xargs kill -9

# Reiniciar completamente
pkill -f 'python.*9999' && sleep 2 && ./start_agents.sh
```

## 📊 **Logs e Monitoramento**

```bash
# Ver logs em tempo real
tail -f /Users/agents/Desktop/codex/agents/helloworld/helloworld_agent.log

# Últimas 20 linhas do log
tail -20 /Users/agents/Desktop/codex/agents/helloworld/helloworld_agent.log

# Monitorar conexões
watch -n 10 'lsof -i :9999'

# Monitorar status
watch -n 30 './check_agents.sh'
```

## 🧪 **Testes Rápidos**

```bash
# Testar skill básica
curl -X POST "http://localhost:9999/skills/hello_world" \
  -H "Content-Type: application/json" \
  -d '{"message": "test"}'

# Testar skill avançada
curl -X POST "http://localhost:9999/skills/super_hello_world" \
  -H "Content-Type: application/json" \
  -d '{"message": "super test"}'

# Teste via UI A2A
curl -X POST "http://localhost:12000/message/send" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "message/send",
    "params": {
      "messageId": "quick-test",
      "contextId": "test-context",
      "role": "user",
      "parts": [{"kind": "text", "text": "hello world"}]
    },
    "id": 1
  }'
```

## 🔧 **Diagnóstico de Problemas**

```bash
# Verificar se porta está ocupada
lsof -i :9999

# Verificar dependências
cd /Users/agents/Desktop/codex/agents/helloworld && uv sync

# Verificar logs de erro
grep -i error /Users/agents/Desktop/codex/agents/helloworld/helloworld_agent.log

# Verificar recursos do sistema
top -pid $(pgrep -f 'python.*9999')

# Teste de conectividade
curl -v "http://localhost:9999/health"
```

## 🌐 **URLs de Acesso**

| Endpoint | URL | Descrição |
|----------|-----|-----------|
| **Agent Card** | `http://localhost:9999/.well-known/agent.json` | Informações do agente |
| **Health Check** | `http://localhost:9999/health` | Status de saúde |
| **Extended Card** | `http://localhost:9999/agent/authenticatedExtendedCard` | Card autenticado |
| **UI A2A** | `http://localhost:12000/` | Interface web |
| **Task List** | `http://localhost:12000/task_list` | Lista de tarefas |

## 📱 **One-Liners Úteis**

```bash
# Status completo em uma linha
lsof -i :9999 >/dev/null && echo "✅ ATIVO" || echo "❌ INATIVO"

# Reinicialização rápida
pkill -f 'python.*9999'; sleep 2; cd agents/helloworld; nohup uv run . --host 0.0.0.0 --port 9999 > helloworld_agent.log 2>&1 & echo "Reiniciado!"

# Verificar + iniciar se necessário
lsof -i :9999 >/dev/null || ./start_agents.sh

# Ver se está respondendo
curl -s localhost:9999/health | jq '.status' 2>/dev/null || echo "Não responde"

# Contar conexões ativas
lsof -i :9999 | grep -c ESTABLISHED

# Ver PID do processo
lsof -ti :9999

# Verificar há quanto tempo está rodando
ps -p $(lsof -ti :9999) -o etime= 2>/dev/null | xargs echo "Rodando há:"
```

## 🚨 **Troubleshooting Rápido**

### Não Inicia:
```bash
cd /Users/agents/Desktop/codex/agents/helloworld
uv sync
lsof -i :9999 && pkill -f 'python.*9999'
nohup uv run . --host 0.0.0.0 --port 9999 > helloworld_agent.log 2>&1 &
```

### Não Responde:
```bash
tail -20 helloworld_agent.log
curl -v localhost:9999/health
ps aux | grep python | grep 9999
```

### Porta Ocupada:
```bash
lsof -i :9999
kill -9 $(lsof -ti :9999)
./start_agents.sh
```

## 🎯 **Scripts de Conveniência**

### Criar script de restart:
```bash
echo '#!/bin/bash
pkill -f "python.*9999"
sleep 2
cd /Users/agents/Desktop/codex/agents/helloworld
nohup uv run . --host 0.0.0.0 --port 9999 > helloworld_agent.log 2>&1 &
echo "HelloWorld Agent reiniciado!"' > restart_hello.sh
chmod +x restart_hello.sh
```

### Criar script de status:
```bash
echo '#!/bin/bash
if lsof -i :9999 >/dev/null 2>&1; then
    echo "🟢 HelloWorld Agent ATIVO"
    curl -s localhost:9999/.well-known/agent.json | jq -r ".name"
else
    echo "🔴 HelloWorld Agent INATIVO"
fi' > status_hello.sh
chmod +x status_hello.sh
```

---

**💡 Dica**: Salve estes comandos como aliases no seu `.bashrc` ou `.zshrc` para acesso ainda mais rápido!

**📅 Atualizado**: 13 de Janeiro de 2025 