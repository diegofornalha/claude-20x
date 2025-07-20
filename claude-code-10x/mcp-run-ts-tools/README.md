# 🛠️ MCP Tools & Optimization Tools

Esta pasta contém tanto as ferramentas MCP (Model Context Protocol) quanto as ferramentas de otimização do projeto.

## 📁 Conteúdo

### 🔧 MCP Tools (Model Context Protocol)
- **`src/`** - Código fonte das ferramentas MCP
- **`build/`** - Build das ferramentas MCP
- **`docs/`** - Documentação MCP
- **`run.sh`** - Script para executar servidor MCP
- **`debug-server.js`** - Debug do servidor MCP
- **`debug-mcp-response.js`** - Debug de respostas MCP

### ⚡ Optimization Tools
- **`dependency-optimizer.js`** - Otimizador de dependências
- **`aws-optimized.js`** - Configuração otimizada do AWS SDK
- **`setup-chromium.sh`** - Script de configuração do Chromium
- **`OPTIMIZATION-REPORT.md`** - Relatório de otimizações

## 🚀 Como Usar

### MCP Tools
```bash
cd claude-code-10x/mcp-run-ts-tools
npm install
npm run build
./run.sh
```

### Otimização de Dependências
```bash
cd claude-code-10x/mcp-run-ts-tools
node dependency-optimizer.js
```

### Configurar Chromium
```bash
cd claude-code-10x/mcp-run-ts-tools
./setup-chromium.sh
```

## 📊 Benefícios das Otimizações

- **Redução de tamanho**: ~60% (2.9GB → 1.2GB)
- **Tempo de build**: ~40% mais rápido
- **Startup time**: ~50% mais rápido
- **Memory usage**: ~30% redução

## 🔄 Manutenção

Execute periodicamente para manter as otimizações:
```bash
npm run optimize
npm run check-deps
npm run analyze-bundle
```

## 🏗️ Estrutura

```
mcp-run-ts-tools/
├── src/                    # Código fonte MCP
├── build/                  # Build MCP
├── docs/                   # Documentação
├── dependency-optimizer.js # Otimizador
├── aws-optimized.js       # AWS SDK otimizado
├── setup-chromium.sh      # Setup Chromium
└── OPTIMIZATION-REPORT.md # Relatório
```

---
*Ferramentas de otimização movidas da pasta `tools/` para melhor organização junto com as ferramentas MCP* 