# Troubleshooting: Rodando o Projeto em Outra Máquina

## Erro: "Cannot connect to agent as http://localhost:9999/"

### Solução Rápida (Testada e Funcionando)

Se você receber o erro "Cannot connect to agent as http://localhost:9999/", siga estes passos:

```bash
# 1. Verificar se há algo rodando na porta 9999
lsof -i :9999

# 2. Entrar no diretório do agente
cd agents/helloworld

# 3. Instalar dependências com UV
uv sync

# 4. Iniciar o agente em background
nohup uv run python main_helloworld.py > helloworld.log 2>&1 & echo $!

# 5. Aguardar 2 segundos e verificar os logs
sleep 2 && tail -20 helloworld.log

# 6. Testar se está funcionando
curl -s http://localhost:9999/.well-known/agent.json | jq
```

### O que aconteceu no erro original

1. O módulo `a2a` não estava instalado no ambiente Python
2. O agente falhou ao iniciar com erro: `ModuleNotFoundError: No module named 'a2a'`
3. A porta 9999 estava ocupada por outro processo Python que não era o agente

### Verificação de sucesso

Se tudo estiver funcionando, você verá:
- Logs mostrando: "Uvicorn running on http://localhost:9999"
- O comando curl retornará o JSON do agent card
- A UI conseguirá se conectar ao agente

### Salvar o PID para gerenciar o processo

```bash
# Salvar o PID retornado pelo comando nohup
echo "PID_RETORNADO" > agents/helloworld/helloworld.pid

# Para parar o agente depois
kill $(cat agents/helloworld/helloworld.pid)
```

### Monitorar logs em tempo real

```bash
# Ver logs continuamente
tail -f agents/helloworld/helloworld.log
```

## UV não é obrigatório!

UV é apenas um gerenciador de pacotes mais rápido. Você pode usar pip normal:

### Opção 1: Usando pip (sem UV)

```bash
# Criar ambiente virtual
python -m venv .venv

# Ativar ambiente virtual
# Linux/Mac:
source .venv/bin/activate
# Windows:
.venv\Scripts\activate

# Instalar dependências com pip
pip install -r requirements.txt
# OU se tiver pyproject.toml:
pip install -e .

# Rodar o projeto
python main_helloworld.py
```

### Opção 2: Instalando UV (se quiser)

```bash
# Mac/Linux
curl -LsSf https://astral.sh/uv/install.sh | sh

# Windows
powershell -c "irm https://astral.sh/uv/install.ps1 | iex"

# Ou via pip
pip install uv
```

**Nota**: Após instalar o UV, pode ser necessário reiniciar o terminal ou executar:
```bash
# Mac/Linux
source ~/.bashrc  # ou ~/.zshrc dependendo do seu shell

# Verificar se o UV foi instalado
uv --version
```

## Checklist de Problemas Comuns

### 1. Versão do Python

```bash
python --version
# Precisa ser Python 3.12 ou superior
```

Se não tiver Python 3.12:
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install python3.12 python3.12-venv

# Mac com Homebrew
brew install python@3.12

# Windows
# Baixar de python.org
```

### 2. Dependências do Sistema

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install -y \
    build-essential \
    python3-dev \
    python3-pip \
    python3-venv \
    libssl-dev \
    libffi-dev \
    git
```

**Mac:**
```bash
# Instalar Xcode Command Line Tools
xcode-select --install

# Com Homebrew
brew install python@3.12
```

**Windows:**
- Instalar Python 3.12+ de python.org
- Instalar Visual Studio Build Tools
- Instalar Git para Windows

### 3. Criar requirements.txt

Se não existir requirements.txt, criar a partir do pyproject.toml:

```bash
# No diretório do helloworld
cd /caminho/para/agents/helloworld

# Criar requirements.txt
cat > requirements.txt << EOF
a2a-sdk>=0.2.11
fastapi>=0.116.1
uvicorn>=0.34.2
httpx>=0.28.1
pydantic>=2.11.5
python-dotenv>=1.1.0
langgraph>=0.4.7
pandas>=2.3.1
numpy>=2.3.1
EOF
```

### 4. Instalação Manual Passo a Passo

```bash
# 1. Entrar no diretório
cd agents/helloworld

# 2. Criar ambiente virtual
python3 -m venv .venv

# 3. Ativar ambiente
source .venv/bin/activate  # Linux/Mac
# ou
.venv\Scripts\activate     # Windows

# 4. Atualizar pip
pip install --upgrade pip

# 5. Instalar dependências uma por uma (se tiver problemas)
pip install a2a-sdk
pip install fastapi
pip install uvicorn
pip install httpx
pip install pydantic
pip install python-dotenv
pip install langgraph
pip install pandas
pip install numpy

# 6. Rodar o agente
python main_helloworld.py
```

### 5. Problemas de Porta

Verificar se a porta 9999 está livre:

```bash
# Linux/Mac
lsof -i :9999
netstat -an | grep 9999

# Windows
netstat -an | findstr :9999
```

### 6. Firewall/Antivírus

- Verificar se o firewall está bloqueando a porta 9999
- Adicionar exceção para Python no antivírus
- No Windows Defender, adicionar pasta do projeto como exceção

### 7. Permissões

```bash
# Linux/Mac - dar permissão de execução
chmod +x main_helloworld.py

# Se tiver problema de permissão
sudo chown -R $USER:$USER .
```

### 8. Logs de Debug

Rodar com mais detalhes:

```bash
# Com variáveis de ambiente de debug
PYTHONPATH=. python -m uvicorn main:app --host localhost --port 9999 --log-level debug
```

### 9. Teste Mínimo

Criar um teste mínimo para verificar se FastAPI está funcionando:

```python
# test_minimal.py
from fastapi import FastAPI
import uvicorn

app = FastAPI()

@app.get("/")
def read_root():
    return {"Hello": "World"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=9999)
```

Rodar:
```bash
python test_minimal.py
```

Se funcionar, o problema está nas dependências do A2A.

### 10. Instalação do a2a-sdk

Se o a2a-sdk der problema:

```bash
# Tentar instalar direto do GitHub
pip install git+https://github.com/org/a2a-sdk.git

# Ou baixar e instalar localmente
git clone https://github.com/org/a2a-sdk.git
cd a2a-sdk
pip install -e .
```

## Comando de Diagnóstico Completo

```bash
# Salvar isso em diagnostico.sh e executar
#!/bin/bash

echo "=== Diagnóstico do Sistema ==="
echo "Python version:"
python --version

echo -e "\nPip version:"
pip --version

echo -e "\nSistema Operacional:"
uname -a

echo -e "\nPorta 9999:"
lsof -i :9999 2>/dev/null || netstat -an | grep 9999

echo -e "\nPacotes instalados:"
pip list | grep -E "(fastapi|uvicorn|a2a|httpx)"

echo -e "\nVariáveis de ambiente:"
env | grep -E "(PYTHON|PATH|PORT)"

echo -e "\nTestando import dos módulos:"
python -c "import fastapi; print('FastAPI OK')" 2>&1
python -c "import uvicorn; print('Uvicorn OK')" 2>&1
python -c "import a2a; print('A2A SDK OK')" 2>&1
```

## Solução Alternativa: Docker

Se nada funcionar, use Docker:

```dockerfile
# Dockerfile
FROM python:3.12-slim

WORKDIR /app

COPY . .

RUN pip install --no-cache-dir -r requirements.txt

EXPOSE 9999

CMD ["python", "main_helloworld.py"]
```

```bash
# Construir e rodar
docker build -t helloworld-agent .
docker run -p 9999:9999 helloworld-agent
```

## Verificação Final - Agente Funcionando

Após seguir as instruções, verifique se tudo está funcionando:

```bash
# 1. Verificar processo rodando
ps aux | grep main_helloworld | grep -v grep

# 2. Verificar porta aberta
lsof -i :9999

# 3. Testar agent card
curl -s http://localhost:9999/.well-known/agent.json | jq .name
# Deve retornar: "Hello World Agent"

# 4. Verificar integração com a UI (se estiver usando)
curl -s -X POST http://localhost:12000/agent/list -H "Content-Type: application/json" -d '{}' | jq '.[] | select(.name=="HelloWorld Agent")'
```

## Contato para Suporte

Se continuar com problemas:
1. Execute o script de diagnóstico
2. Copie a saída completa
3. Verifique os logs de erro específicos
4. Compare as versões de pacotes entre as duas máquinas