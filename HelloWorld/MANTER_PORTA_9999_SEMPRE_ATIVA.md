# 🔄 Como Manter a Porta 9999 Sempre Ativa - HelloWorld Agent

## 📋 Visão Geral

Este guia explica **em detalhes** como configurar o **HelloWorld Agent** para permanecer **sempre ativo** na porta 9999, mesmo após reinicializações do sistema, logouts ou falhas temporárias.

## 🎯 Objetivo

Garantir que o HelloWorld Agent esteja **disponível 24/7** na porta 9999 para:
- Integração contínua com outros agentes
- Disponibilidade para a UI A2A
- Testes automatizados
- Ambiente de desenvolvimento estável

## 🛠️ Métodos Implementados

### 1. **Método Principal: Nohup + Background**

#### **Como Funciona:**
O comando `nohup` (no hang up) permite que processos continuem rodando mesmo após o terminal ser fechado ou o usuário fazer logout.

#### **Implementação:**
```bash
# Navegar para o diretório do HelloWorld Agent
cd /Users/agents/Desktop/codex/agents/helloworld

# Iniciar em background com nohup
nohup uv run . --host 0.0.0.0 --port 9999 > helloworld_agent.log 2>&1 &
```

#### **Breakdown do Comando:**
- **`nohup`**: Ignora sinais de "hang up" (SIGHUP)
- **`uv run .`**: Executa o HelloWorld Agent usando UV
- **`--host 0.0.0.0`**: Aceita conexões de qualquer interface
- **`--port 9999`**: Define a porta específica
- **`> helloworld_agent.log`**: Redireciona output para arquivo de log
- **`2>&1`**: Redireciona stderr para stdout (ambos no log)
- **`&`**: Executa o processo em background

### 2. **Script Automatizado: start_agents.sh**

#### **Localização:**
```
/Users/agents/Desktop/codex/start_agents.sh
```

#### **Funcionalidade:**
```bash
#!/bin/bash

# Função para verificar se uma porta está em uso
check_port() {
    local port=$1
    lsof -i :$port >/dev/null 2>&1
}

# Função para iniciar o HelloWorld Agent
start_helloworld() {
    echo "🔄 Iniciando HelloWorld Agent na porta 9999..."
    cd /Users/agents/Desktop/codex/agents/helloworld
    nohup uv run . --host 0.0.0.0 --port 9999 > helloworld_agent.log 2>&1 &
    echo "✅ HelloWorld Agent iniciado (PID: $!)"
}

# Verificar e iniciar HelloWorld Agent
if check_port 9999; then
    echo "✅ HelloWorld Agent já está rodando na porta 9999"
else
    start_helloworld
    sleep 3
fi
```

#### **Como Usar:**
```bash
# Tornar executável (primeira vez)
chmod +x start_agents.sh

# Executar o script
./start_agents.sh
```

### 3. **Script de Verificação: check_agents.sh**

#### **Funcionalidade:**
```bash
#!/bin/bash

# Verificar HelloWorld Agent
if lsof -i :9999 >/dev/null 2>&1; then
    echo "🟢 HelloWorld Agent: ATIVO (porta 9999)"
    curl -s "http://localhost:9999/.well-known/agent.json" | jq -r '.name' | sed 's/^/   📝 /'
else
    echo "🔴 HelloWorld Agent: INATIVO (porta 9999)"
fi
```

#### **Como Usar:**
```bash
# Verificar status rapidamente
./check_agents.sh
```

## 🔍 Verificação Detalhada

### **1. Verificar se o Processo Está Rodando**

#### **Por Porta:**
```bash
# Verificar especificamente a porta 9999
lsof -i :9999

# Resultado esperado:
# COMMAND   PID   USER   FD   TYPE   DEVICE SIZE/OFF NODE NAME
# Python  68465 agents   6u  IPv4   ...         TCP *:distinct (LISTEN)
```

#### **Por Processo:**
```bash
# Buscar processo Python na porta 9999
ps aux | grep python | grep 9999

# Resultado esperado:
# agents  68465  0.1  0.1  411230432  6976  ??  SN  05PM  1:30.42 python . --host 0.0.0.0 --port 9999
```

### **2. Verificar Agent Card**

```bash
# Testar se o agent está respondendo
curl -s "http://localhost:9999/.well-known/agent.json" | jq '.name'

# Resultado esperado:
# "Hello World Agent"
```

### **3. Verificar Health Check**

```bash
# Testar endpoint de saúde
curl -s "http://localhost:9999/health" | jq '.'

# Resultado esperado:
# {
#   "status": "healthy",
#   "agent": "helloworld"
# }
```

## 📊 Monitoramento e Logs

### **1. Localização dos Logs**

```bash
# Log principal do HelloWorld Agent
tail -f /Users/agents/Desktop/codex/agents/helloworld/helloworld_agent.log

# Últimas 20 linhas
tail -20 /Users/agents/Desktop/codex/agents/helloworld/helloworld_agent.log
```

### **2. Informações nos Logs**

#### **Inicialização Bem-Sucedida:**
```
INFO:     Started server process [68465]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:9999 (Press CTRL+C to quit)
```

#### **Requests Sendo Processados:**
```
INFO:     127.0.0.1:54321 - "GET /.well-known/agent.json HTTP/1.1" 200 OK
INFO:     127.0.0.1:54322 - "POST /skills/hello_world HTTP/1.1" 200 OK
```

### **3. Monitoramento Contínuo**

```bash
# Verificar de 30 em 30 segundos
watch -n 30 './check_agents.sh'

# Monitorar conexões ativas
watch -n 10 'lsof -i :9999'
```

## 🔄 Gerenciamento do Processo

### **1. Parar o HelloWorld Agent**

#### **Por Porta:**
```bash
# Matar processo específico da porta 9999
pkill -f 'python.*9999'

# Alternativa mais específica
lsof -ti :9999 | xargs kill -9
```

#### **Por PID:**
```bash
# Encontrar PID
PID=$(lsof -ti :9999)

# Parar graciosamente
kill $PID

# Forçar parada (se necessário)
kill -9 $PID
```

### **2. Reiniciar o HelloWorld Agent**

```bash
# Parar o processo atual
pkill -f 'python.*9999'

# Aguardar 2 segundos
sleep 2

# Iniciar novamente
cd /Users/agents/Desktop/codex/agents/helloworld
nohup uv run . --host 0.0.0.0 --port 9999 > helloworld_agent.log 2>&1 &

# Verificar se iniciou
sleep 3 && curl -s "http://localhost:9999/.well-known/agent.json" | jq '.name'
```

### **3. Script de Reinicialização Automática**

```bash
#!/bin/bash
# restart_helloworld.sh

echo "🔄 Reiniciando HelloWorld Agent..."

# Parar processo atual
pkill -f 'python.*9999'
sleep 2

# Verificar se parou
if lsof -i :9999 >/dev/null 2>&1; then
    echo "⚠️ Processo ainda ativo, forçando parada..."
    lsof -ti :9999 | xargs kill -9
    sleep 2
fi

# Iniciar novamente
cd /Users/agents/Desktop/codex/agents/helloworld
nohup uv run . --host 0.0.0.0 --port 9999 > helloworld_agent.log 2>&1 &

# Verificar sucesso
sleep 5
if lsof -i :9999 >/dev/null 2>&1; then
    echo "✅ HelloWorld Agent reiniciado com sucesso!"
    curl -s "http://localhost:9999/.well-known/agent.json" | jq '.name'
else
    echo "❌ Falha ao reiniciar HelloWorld Agent"
    exit 1
fi
```

## 🚨 Solução de Problemas

### **Problema 1: Porta 9999 em Uso**

#### **Sintomas:**
```
Error: [Errno 48] Address already in use
```

#### **Solução:**
```bash
# Identificar processo usando a porta
lsof -i :9999

# Matar processo específico
kill -9 <PID>

# Ou matar por padrão
pkill -f 'python.*9999'

# Tentar iniciar novamente
./start_agents.sh
```

### **Problema 2: Processo Para Inesperadamente**

#### **Diagnóstico:**
```bash
# Verificar logs para erros
tail -50 /Users/agents/Desktop/codex/agents/helloworld/helloworld_agent.log

# Verificar se há core dumps
ls -la /cores/

# Verificar recursos do sistema
top -pid $(pgrep -f 'python.*9999')
```

#### **Soluções:**
- **Falta de memória**: Verificar uso de RAM
- **Dependências**: Executar `uv sync` novamente
- **Permissões**: Verificar permissões do diretório
- **Porta bloqueada**: Verificar firewall/antivírus

### **Problema 3: Agent Não Responde**

#### **Verificações:**
```bash
# Processo está rodando?
ps aux | grep python | grep 9999

# Porta está escutando?
lsof -i :9999

# Network está ok?
curl -v "http://localhost:9999/health"

# Logs mostram erros?
tail -20 helloworld_agent.log
```

## ⚙️ Configuração para Diferentes Ambientes

### **1. Desenvolvimento Local**

```bash
# Configuração básica para desenvolvimento
cd /Users/agents/Desktop/codex/agents/helloworld
uv run . --host 127.0.0.1 --port 9999 --reload
```

### **2. Produção/Servidor**

```bash
# Configuração robusta para produção
cd /Users/agents/Desktop/codex/agents/helloworld
nohup uv run . --host 0.0.0.0 --port 9999 --workers 4 > helloworld_agent.log 2>&1 &
```

### **3. Container Docker/Podman**

```dockerfile
# Usar Containerfile existente
podman build . -t helloworld-agent
podman run -d -p 9999:9999 --name helloworld helloworld-agent

# Verificar container
podman ps | grep helloworld
```

## 🔧 Automação Avançada

### **1. Cron Job para Auto-Restart**

```bash
# Editar crontab
crontab -e

# Adicionar linha para verificar a cada 5 minutos
*/5 * * * * /Users/agents/Desktop/codex/start_agents.sh

# Ou criar script de verificação
*/5 * * * * /Users/agents/Desktop/codex/check_and_restart_helloworld.sh
```

### **2. Systemd Service (Linux)**

```ini
[Unit]
Description=HelloWorld A2A Agent
After=network.target

[Service]
Type=simple
User=agents
WorkingDirectory=/Users/agents/Desktop/codex/agents/helloworld
ExecStart=/usr/local/bin/uv run . --host 0.0.0.0 --port 9999
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

### **3. LaunchAgent (macOS)**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.a2a.helloworld</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/local/bin/uv</string>
        <string>run</string>
        <string>.</string>
        <string>--host</string>
        <string>0.0.0.0</string>
        <string>--port</string>
        <string>9999</string>
    </array>
    <key>WorkingDirectory</key>
    <string>/Users/agents/Desktop/codex/agents/helloworld</string>
    <key>KeepAlive</key>
    <true/>
    <key>RunAtLoad</key>
    <true/>
</dict>
</plist>
```

## 📈 Métricas e Performance

### **1. Monitoramento de Recursos**

```bash
# CPU e Memória do processo
ps -p $(pgrep -f 'python.*9999') -o pid,pcpu,pmem,etime,cmd

# Conexões ativas
netstat -an | grep :9999

# Estatísticas de rede
lsof -i :9999 -P
```

### **2. Benchmarks de Performance**

```bash
# Teste de carga básico
for i in {1..100}; do
    curl -s "http://localhost:9999/.well-known/agent.json" > /dev/null &
done
wait

# Teste de throughput
ab -n 1000 -c 10 http://localhost:9999/.well-known/agent.json
```

## 🎯 Comandos Rápidos de Referência

### **Verificação Rápida:**
```bash
# Status geral
./check_agents.sh

# Verificação específica
lsof -i :9999 && curl -s localhost:9999/health
```

### **Inicialização:**
```bash
# Iniciar se não estiver rodando
./start_agents.sh

# Iniciar manualmente
cd agents/helloworld && nohup uv run . --host 0.0.0.0 --port 9999 > helloworld_agent.log 2>&1 &
```

### **Parada:**
```bash
# Parar processo
pkill -f 'python.*9999'

# Verificar se parou
lsof -i :9999 || echo "Processo parado com sucesso"
```

### **Logs:**
```bash
# Ver logs em tempo real
tail -f agents/helloworld/helloworld_agent.log

# Últimas linhas
tail -20 agents/helloworld/helloworld_agent.log
```

## 🎉 Resultado Final

Com essa configuração, o **HelloWorld Agent** permanece **sempre ativo** na porta 9999:

- ✅ **Inicia automaticamente** via scripts
- ✅ **Mantém-se ativo** mesmo após logout
- ✅ **Logs detalhados** para monitoramento
- ✅ **Fácil verificação** de status
- ✅ **Restart automático** quando necessário
- ✅ **Integração completa** com UI A2A

### **Status Atual:**
```
🟢 HelloWorld Agent: SEMPRE ATIVO (porta 9999)
📝 Hello World Agent
```

**O sistema está configurado para máxima disponibilidade e confiabilidade!** 🚀

---

**📅 Criado em**: 13 de Janeiro de 2025  
**🔧 Implementado**: Scripts automáticos + nohup  
**✅ Status**: HelloWorld Agent sempre ativo na porta 9999  
**✏️ Autor**: Cursor Agent AI 