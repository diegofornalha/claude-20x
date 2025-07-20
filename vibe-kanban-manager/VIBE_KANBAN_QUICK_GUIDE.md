# 📋 Vibe Kanban - Guia Rápido

## ✅ Sim, criei um script completo!

### 🛠️ Script: `vibe-kanban-manager.sh`

## 🚀 Comandos Principais

```bash
# Iniciar
./vibe-kanban-manager.sh start

# Parar
./vibe-kanban-manager.sh stop

# Ver status
./vibe-kanban-manager.sh status

# Ver logs em tempo real
./vibe-kanban-manager.sh logs

# Abrir no navegador
./vibe-kanban-manager.sh open

# Reiniciar
./vibe-kanban-manager.sh restart
```

## 📊 Status Atual

✅ **Vibe Kanban está RODANDO!**
- URL: http://127.0.0.1:54086
- PID: 48918
- Logs: /tmp/vibe-kanban.log

## 💡 Dicas

### Adicionar ao PATH (opcional)
```bash
# Criar link simbólico
sudo ln -s $PWD/vibe-kanban-manager.sh /usr/local/bin/vibe-kanban

# Agora pode usar de qualquer lugar:
vibe-kanban start
vibe-kanban status
```

### Iniciar automaticamente
```bash
# Adicionar ao .zshrc ou .bashrc
echo "cd $PWD && ./vibe-kanban-manager.sh start" >> ~/.zshrc
```

## 🎯 Recursos do Script

- ✅ Gerenciamento completo (start/stop/restart)
- ✅ Verificação de status com cores
- ✅ Logs em tempo real
- ✅ Abertura automática no navegador
- ✅ Detecção de processos duplicados
- ✅ Mensagens claras e coloridas

Agora você tem controle total sobre o Vibe Kanban! 🎉