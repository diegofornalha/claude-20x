# 🤖 Gerenciamento de Agentes A2A

Este repositório contém scripts para manter os agentes A2A sempre ativos e funcionais.

## 🚀 Agentes Disponíveis

### 1. **HelloWorld Agent** 
- **Porta**: 9999
- **URL**: http://localhost:9999
- **Função**: Agente de demonstração com respostas contextuais inteligentes
- **Localização**: `/agents/helloworld/`
- **Skills**: Intelligent Hello World (saudações contextuais)

### 2. **Analytics Agent**
- **Porta**: 10011
- **URL**: http://localhost:10011
- **Função**: Gerador de gráficos a partir de dados CSV
- **Localização**: `/backup-reorganized/active-prototypes/analytics/`
- **Skills**: Chart Generator (geração de gráficos PNG)

## 📋 Scripts Disponíveis

### ✅ `start_agents.sh`
**Função**: Inicia e mantém os agentes ativos em background

```bash
./start_agents.sh
```

**O que faz**:
- Verifica se os agentes estão rodando
- Inicia agentes inativos automaticamente
- Exibe status detalhado de cada agente
- Configura logs para monitoramento

### 🔍 `check_agents.sh`
**Função**: Verifica rapidamente o status dos agentes

```bash
./check_agents.sh
```

**O que faz**:
- Verifica se as portas estão ativas
- Mostra nome e status de cada agente
- Indica se há agentes inativos

## 🖥️ Interface Web (UI)

A interface web está disponível em:
- **URL**: http://localhost:12000
- **Função**: Gerenciamento visual dos agentes A2A
- **Registro**: Agentes são registrados automaticamente pelos scripts

## 📊 Exemplo de Uso

### HelloWorld Agent
```bash
# Teste via curl
curl -X POST "http://localhost:12000/message/send" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "message/send",
    "params": {
      "messageId": "msg-001",
      "contextId": "test-context",
      "role": "user",
      "parts": [{"kind": "text", "text": "hello world"}]
    },
    "id": 1
  }'
```

### Analytics Agent
```bash
# Exemplo de dados CSV para gráficos
Month,Revenue
Janeiro,15000
Fevereiro,22000
Março,18500
Abril,25000
```

## 🛠️ Comandos Úteis

### Verificar Status das Portas
```bash
lsof -i :9999   # HelloWorld Agent
lsof -i :10011  # Analytics Agent
lsof -i :12000  # UI Web
```

### Parar Agentes
```bash
pkill -f 'python.*9999'   # Parar HelloWorld
pkill -f 'python.*10011'  # Parar Analytics
```

### Logs dos Agentes
```bash
# HelloWorld Agent
tail -f /Users/agents/Desktop/codex/agents/helloworld/helloworld_agent.log

# Analytics Agent
tail -f /Users/agents/Desktop/codex/backup-reorganized/active-prototypes/analytics/analytics_agent.log
```

## 🔧 Configuração

### Variáveis de Ambiente Necessárias
```bash
# Para Analytics Agent (opcional)
export OPENAI_API_KEY="sua_chave_aqui"

# Para UI
export GOOGLE_API_KEY="sua_chave_google_aqui"
```

### Dependências
- Python 3.12+
- UV (gerenciador de pacotes Python)
- jq (para parsing JSON)
- curl (para testes HTTP)

## 🎯 Fluxo de Trabalho Recomendado

1. **Iniciar Agentes**:
   ```bash
   ./start_agents.sh
   ```

2. **Verificar Status**:
   ```bash
   ./check_agents.sh
   ```

3. **Acessar Interface Web**:
   ```
   http://localhost:12000
   ```

4. **Monitorar Logs** (se necessário):
   ```bash
   tail -f agents/helloworld/helloworld_agent.log
   tail -f backup-reorganized/active-prototypes/analytics/analytics_agent.log
   ```

## 📝 Notas

- Os agentes são iniciados em background com `nohup`
- Logs são salvos automaticamente
- A UI registra os agentes automaticamente
- Os agentes mantêm-se ativos mesmo após logout
- Para desenvolvimento, use os logs para debug

## 🚨 Solução de Problemas

### Agente não inicia
1. Verificar se a porta não está em uso
2. Verificar logs de erro
3. Verificar dependências (UV, Python)

### UI não conecta aos agentes
1. Verificar se agentes estão ativos
2. Verificar se UI está rodando na porta 12000
3. Re-registrar agentes na UI se necessário

### Porta já em uso
```bash
# Identificar processo usando a porta
lsof -i :PORTA

# Parar processo específico
kill -9 PID
``` 