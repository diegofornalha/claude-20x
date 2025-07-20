# Controle de Inicialização Automática

## Status Atual
- ✅ Auto-start desabilitado
- ✅ Porta 12000 livre
- ✅ Porta 8085 livre

## Comandos Úteis

### Para iniciar manualmente:
```bash
cd ui
uv run main.py
```

### Para reabilitar auto-start:
```bash
cd run
./reable_auto_start.sh
```

### Para verificar status:
```bash
lsof -i :12000
lsof -i :8085
ps aux | grep agent_manager
```

## Arquivos de Controle
- `auto_start_disabled.flag` - Flag de desabilitação
- `check_auto_start.sh` - Script de verificação
- `reable_auto_start.sh` - Script de reabilitação

## Data de Desabilitação
Sat Jul 19 06:30:07 -03 2025
