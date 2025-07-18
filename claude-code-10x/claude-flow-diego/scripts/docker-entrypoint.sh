#!/bin/bash
set -e

echo "🚀 Iniciando Guardian Agent..."

# Configurar Git com variáveis de ambiente
if [ -n "$GIT_AUTHOR_NAME" ]; then
    git config --global user.name "$GIT_AUTHOR_NAME"
    echo "✅ Git user.name: $GIT_AUTHOR_NAME"
fi

if [ -n "$GIT_AUTHOR_EMAIL" ]; then
    git config --global user.email "$GIT_AUTHOR_EMAIL"
    echo "✅ Git user.email: $GIT_AUTHOR_EMAIL"
fi

# Adicionar diretório como seguro
git config --global --add safe.directory /workspace

# Verificar se é um repositório Git
cd /workspace
if [ ! -d .git ]; then
    echo "⚠️  Aviso: /workspace não é um repositório Git!"
    echo "💡 Inicializando repositório..."
    git init
fi

# Verificar SSH keys (se existirem)
if [ -d /home/node/.ssh ]; then
    echo "🔑 SSH keys encontradas"
    # Tentar corrigir permissões (pode falhar se read-only)
    chmod 700 /home/node/.ssh 2>/dev/null || echo "ℹ️  SSH montado como read-only (OK)"
    chmod 600 /home/node/.ssh/* 2>/dev/null || true
    
    # Copiar para diretório local se necessário
    if [ ! -d /home/agent/.ssh ]; then
        cp -r /home/node/.ssh /home/agent/.ssh 2>/dev/null || true
        chmod 700 /home/agent/.ssh 2>/dev/null || true
        chmod 600 /home/agent/.ssh/* 2>/dev/null || true
    fi
fi

# Verificar conexão com remote
if git remote -v | grep -q origin; then
    echo "✅ Remote 'origin' configurado"
    
    # Configurar token se disponível
    if [ -n "$GITHUB_TOKEN" ]; then
        echo "🔑 Configurando autenticação com GitHub Token..."
        REMOTE_URL=$(git remote get-url origin)
        # Extrair owner/repo da URL
        if [[ $REMOTE_URL =~ github\.com[:/]([^/]+)/(.+)(\.git)?$ ]]; then
            OWNER="${BASH_REMATCH[1]}"
            REPO="${BASH_REMATCH[2]%.git}"
            NEW_URL="https://${GITHUB_TOKEN}@github.com/${OWNER}/${REPO}.git"
            git remote set-url origin "$NEW_URL"
            echo "✅ Remote configurado com token"
        fi
    fi
    
    # Testar conexão (sem falhar se não conseguir)
    if [ "$AUTO_PUSH" = "true" ]; then
        echo "🔄 Testando conexão com remote..."
        git ls-remote origin HEAD >/dev/null 2>&1 && echo "✅ Conexão com remote OK" || echo "⚠️  Não foi possível conectar ao remote"
    fi
else
    echo "⚠️  Nenhum remote configurado"
    echo "💡 Configure com: git remote add origin <url>"
fi

echo ""
echo "📁 Monitorando: /workspace"
echo "⏱️  Intervalo: ${COMMIT_INTERVAL:-3} segundos"
echo "🚀 Auto-fix: ${AUTO_FIX:-true}"
echo ""

# Voltar ao diretório da aplicação para executar npm
cd /app

# Executar o comando passado
exec "$@"