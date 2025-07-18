# 🚀 Guia Rápido - Agentes A2A Sempre Ativos

## ✅ Status Atual

### Agentes Ativos:
- **HelloWorld Agent**: ✅ ATIVO (porta 9999)
- **Analytics Agent**: ✅ ATIVO (porta 10011)  
- **UI Web**: ✅ ATIVO (porta 12000)

## 🎯 Acesso Direto

### Interface Web
```
🌐 http://localhost:12000/
```

### Verificar Status
```bash
./check_agents.sh
```

### Reiniciar Agentes (se necessário)
```bash
./start_agents.sh
```

## 📊 Exemplos de Uso

### HelloWorld Agent
**Teste rápido:**
```bash
curl -X POST "http://localhost:12000/message/send" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "message/send", 
    "params": {
      "messageId": "msg-hello",
      "contextId": "test-001",
      "role": "user",
      "parts": [{"kind": "text", "text": "super hello world"}]
    },
    "id": 1
  }'
```

### Analytics Agent
**Dados CSV de exemplo:**
```csv
Month,Revenue
Janeiro,15000
Fevereiro,22000
Março,18500
Abril,25000
Maio,30000
```

**Outros exemplos:**
```csv
Product,Sales
Produto A,5000
Produto B,7500
Produto C,3200
```

## 🔧 Comandos Úteis

### Verificar Processos
```bash
ps aux | grep python | grep -E "9999|10011|12000"
```

### Verificar Portas
```bash
lsof -i :9999 && lsof -i :10011 && lsof -i :12000
```

### Ver Logs
```bash
# HelloWorld
tail -f agents/helloworld/helloworld_agent.log

# Analytics  
tail -f backup-reorganized/active-prototypes/analytics/analytics_agent.log
```

## 🎉 Pronto para Usar!

Os agentes estão configurados para permanecer sempre ativos. 
Acesse a UI web para interagir visualmente ou use os comandos curl para testes diretos.

**Tarefas aparecem automaticamente na UI em:**
- 🌐 http://localhost:12000/task_list 