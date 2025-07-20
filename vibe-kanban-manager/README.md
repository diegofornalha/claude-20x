# 📋 Vibe Kanban Manager Scripts

Scripts individuais para gerenciar o Vibe Kanban facilmente.

## 🚀 Início Rápido

### Comando Principal: `vk`
```bash
cd vibe-kanban-manager

# Menu interativo
./vk

# Ou comando direto
./vk start
./vk status
./vk logs
```

### Tornar scripts executáveis (primeira vez)
```bash
cd vibe-kanban-manager
chmod +x *.sh vk
```

### Comandos Disponíveis

#### ▶️ Iniciar
```bash
./start.sh
```
Inicia o Vibe Kanban em background.

#### ⏹️ Parar
```bash
./stop.sh
```
Para o servidor Vibe Kanban.

#### 📊 Status
```bash
./status.sh
```
Verifica se está rodando e mostra informações.

#### 📜 Logs
```bash
./logs.sh
```
Acompanha os logs em tempo real (Ctrl+C para sair).

#### 🌐 Abrir
```bash
./open.sh
```
Abre o Vibe Kanban no navegador padrão.

#### 🔄 Reiniciar
```bash
./restart.sh
```
Para e inicia novamente o servidor.

## 💡 Dicas

### Adicionar ao PATH
Para usar de qualquer lugar:

```bash
# Adicionar ao ~/.zshrc ou ~/.bashrc
export PATH="$PATH:/Users/agents/Desktop/claude-20x/vibe-kanban-manager"

# Recarregar
source ~/.zshrc

# Agora pode usar:
start.sh
status.sh
logs.sh
```

### Criar Aliases
```bash
# Adicionar ao ~/.zshrc
alias vk-start="/Users/agents/Desktop/claude-20x/vibe-kanban-manager/start.sh"
alias vk-stop="/Users/agents/Desktop/claude-20x/vibe-kanban-manager/stop.sh"
alias vk-status="/Users/agents/Desktop/claude-20x/vibe-kanban-manager/status.sh"
alias vk-logs="/Users/agents/Desktop/claude-20x/vibe-kanban-manager/logs.sh"
alias vk-open="/Users/agents/Desktop/claude-20x/vibe-kanban-manager/open.sh"
alias vk-restart="/Users/agents/Desktop/claude-20x/vibe-kanban-manager/restart.sh"
```

## 📁 Arquivos do Sistema

- **Logs**: `/tmp/vibe-kanban.log`
- **PID**: `/tmp/vibe-kanban.pid`
- **URL**: Gerada dinamicamente (geralmente `http://127.0.0.1:PORTA`)

## 🐛 Troubleshooting

### "Já está rodando"
```bash
./status.sh  # Verificar processos
./stop.sh    # Parar se necessário
./start.sh   # Iniciar novamente
```

### "Porta em uso"
O Vibe Kanban escolhe uma porta automaticamente, mas se houver problemas:
```bash
./restart.sh  # Reinicia com nova porta
```

### Logs não aparecem
```bash
ls -la /tmp/vibe-kanban.log  # Verificar se existe
./status.sh                   # Ver status geral
```