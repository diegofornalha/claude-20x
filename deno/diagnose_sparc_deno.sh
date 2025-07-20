#!/bin/bash

echo "🔍 Diagnóstico do Problema SPARC + Deno"
echo "========================================"

echo ""
echo "📋 Informações do Sistema:"
echo "   OS: $(uname -s)"
echo "   Architecture: $(uname -m)"
echo "   Node Version: $(node --version)"
echo "   NPM Version: $(npm --version)"

echo ""
echo "📋 Informações do Deno:"
echo "   Deno Path: $(which deno)"
echo "   Deno Version: $(deno --version)"
echo "   DENO_INSTALL: $DENO_INSTALL"

echo ""
echo "📋 Informações do Claude-Flow:"
echo "   Claude-Flow Path: $(which claude-flow)"
echo "   Claude-Flow Version: $(claude-flow --version)"

echo ""
echo "📋 Variáveis de Ambiente:"
echo "   PATH: $PATH"
echo "   DENO_INSTALL: $DENO_INSTALL"

echo ""
echo "📋 Teste de Execução do Deno:"
deno eval "console.log('Deno is working!')"

echo ""
echo "📋 Teste de SPARC Info:"
claude-flow sparc info architect

echo ""
echo "📋 Teste de SPARC Run (deve falhar):"
claude-flow sparc run architect "test"

echo ""
echo "🔍 Verificando se há processos Deno rodando:"
ps aux | grep deno | grep -v grep

echo ""
echo "🔍 Verificando se há processos Claude-Flow rodando:"
ps aux | grep claude-flow | grep -v grep

echo ""
echo "📋 Verificando arquivos de configuração:"
if [ -f ".claude/config.json" ]; then
    echo "   ✅ .claude/config.json existe"
    cat .claude/config.json
else
    echo "   ❌ .claude/config.json não existe"
fi

echo ""
echo "📋 Verificando CLAUDE.md:"
if [ -f "CLAUDE.md" ]; then
    echo "   ✅ CLAUDE.md existe"
    head -10 CLAUDE.md
else
    echo "   ❌ CLAUDE.md não existe"
fi

echo ""
echo "🎯 Diagnóstico Completo!" 