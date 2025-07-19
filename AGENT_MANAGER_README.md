# 🚀 Sistema de Gerenciamento de Agentes A2A

Sistema completo e profissional para gerenciar todos os agentes A2A, incluindo a UI Dashboard.

## ✨ Características

- ✅ **Gerenciamento Centralizado**: Todos os agentes em um único arquivo de configuração
- ✅ **UI Sempre Visível**: Garante que http://0.0.0.0:12000/agents esteja sempre acessível
- ✅ **Auto-restart**: Reinicia agentes automaticamente em caso de falha
- ✅ **Monitoramento Contínuo**: Verifica saúde dos agentes periodicamente
- ✅ **Inicialização Automática**: Inicia com o sistema (macOS/Linux)
- ✅ **Logs Centralizados**: Todos os logs em um único diretório
- ✅ **Comandos Intuitivos**: Interface simples e poderosa

## 📦 Componentes

### 1. **agent_manager.sh** - Script Principal
Gerencia todos os agentes com comandos simples:
```bash
./agent_manager.sh start all      # Inicia todos os agentes
./agent_manager.sh stop all       # Para todos os agentes
./agent_manager.sh restart ui     # Reinicia apenas a UI
./agent_manager.sh status         # Mostra status de todos
./agent_manager.sh logs ui        # Mostra logs da UI
```

### 2. **config/agents.json** - Configuração Central
Define todos os agentes, incluindo:
- HelloWorld Agent (porta 9999)
- Marvin Agent (porta 10030)  
- Analytics Agent (porta 10011)
- **A2A UI Dashboard (porta 12000)** ✨

### 3. **Scripts de Sistema**
- `start_system.sh` - Inicia todo o sistema
- `stop_system.sh` - Para todo o sistema
- `restart_system.sh` - Reinicia todo o sistema
- `ensure_ui_running.sh` - Garante que a UI está sempre rodando

### 4. **Inicialização Automática**
- `setup_autostart.sh` - Configura início automático no boot
- `uninstall_autostart.sh` - Remove configurações de autostart

## 🚀 Início Rápido

### 1. Iniciar Sistema Completo
```bash
./start_system.sh
```

Isso irá:
1. Iniciar a UI Dashboard primeiro
2. Iniciar todos os agentes habilitados
3. Iniciar monitor automático
4. Mostrar status completo

### 2. Garantir UI Sempre Visível
```bash
# Configurar inicialização automática
./setup_autostart.sh
```

Isso garante que:
- Sistema inicia no boot
- UI é verificada a cada 5 minutos
- Reinicialização automática em caso de falha

## 🔧 Comandos Úteis

### Gerenciamento Individual
```bash
# Iniciar agente específico
./agent_manager.sh start helloworld

# Parar agente específico
./agent_manager.sh stop marvin

# Reiniciar UI
./agent_manager.sh restart ui

# Ver status de um agente
./agent_manager.sh status ui
```

### Configuração
```bash
# Habilitar agente
./agent_manager.sh enable mcp

# Desabilitar agente
./agent_manager.sh disable guardian

# Listar todos os agentes
./agent_manager.sh list
```

### Monitoramento
```bash
# Iniciar monitor automático
./agent_manager.sh monitor start

# Parar monitor
./agent_manager.sh monitor stop

# Ver logs em tempo real
./agent_manager.sh logs ui
```

## 📊 URLs Importantes

Após iniciar o sistema, acesse:

- **UI Dashboard**: http://0.0.0.0:12000/agents ✨
- **Chat Interface**: http://0.0.0.0:12000/
- **HelloWorld API**: http://localhost:9999/.well-known/agent.json
- **Marvin API**: http://localhost:10030/.well-known/agent.json

## 🔍 Verificar se UI está Rodando

```bash
# Verificar processo
lsof -i :12000

# Verificar resposta
curl http://0.0.0.0:12000/agents

# Ver logs
tail -f logs/agents/ui.log
```

## 🛠️ Adicionar Novo Agente

1. Edite `config/agents.json`:
```json
{
  "name": "Meu Novo Agent",
  "id": "meu-agent",
  "enabled": true,
  "port": 10200,
  "host": "localhost",
  "path": "/caminho/para/agent",
  "command": "python meu_agent.py",
  "health_check": "/health",
  "restart_on_failure": true,
  "description": "Descrição do agente"
}
```

2. Inicie o novo agente:
```bash
./agent_manager.sh start meu-agent
```

## 🐛 Troubleshooting

### UI não está acessível
```bash
# Verificar status
./agent_manager.sh status ui

# Reiniciar UI
./agent_manager.sh restart ui

# Ver logs
./agent_manager.sh logs ui
```

### Agente não inicia
```bash
# Verificar logs
tail -f logs/agents/<agent-id>.log

# Verificar porta em uso
lsof -i :<porta>

# Forçar parada e reiniciar
./agent_manager.sh stop <agent-id>
./agent_manager.sh start <agent-id>
```

### Monitor não funciona
```bash
# Verificar se está rodando
ps aux | grep ensure_ui_running

# Ver logs do monitor
tail -f logs/ui_monitor.log

# Reiniciar monitor
./agent_manager.sh monitor stop
./agent_manager.sh monitor start
```

## 📁 Estrutura de Diretórios

```
claude-20x/
├── agent_manager.sh          # Script principal
├── start_system.sh          # Iniciar sistema
├── stop_system.sh           # Parar sistema
├── restart_system.sh        # Reiniciar sistema
├── ensure_ui_running.sh     # Monitor da UI
├── setup_autostart.sh       # Configurar autostart
├── config/
│   └── agents.json         # Configuração dos agentes
├── logs/
│   ├── agents/            # Logs dos agentes
│   │   ├── ui.log
│   │   ├── helloworld.log
│   │   └── marvin.log
│   └── ui_monitor.log     # Log do monitor
└── run/                   # PIDs dos processos
    ├── ui.pid
    ├── helloworld.pid
    └── agent_monitor.pid
```

## 🔐 Segurança

- Agentes rodam com privilégios do usuário
- Logs são rotacionados automaticamente (7 dias)
- Portas configuráveis por agente
- Suporte a variáveis de ambiente personalizadas

## 🎯 Benefícios do Novo Sistema

1. **Confiabilidade**: UI sempre acessível em http://0.0.0.0:12000/agents
2. **Simplicidade**: Um comando para gerenciar tudo
3. **Visibilidade**: Status claro de todos os agentes
4. **Automação**: Reinicialização automática em falhas
5. **Flexibilidade**: Fácil adicionar/remover agentes
6. **Profissional**: Logs, PIDs e monitoramento adequados

---

**✅ Com este sistema, a UI estará SEMPRE visível em http://0.0.0.0:12000/agents!**