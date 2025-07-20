# 🛠️ Tools - Ferramentas do Projeto

Esta pasta contém ferramentas e scripts úteis para o desenvolvimento e otimização do projeto.

## 📁 Conteúdo

### 🔧 Scripts de Otimização
- **`dependency-optimizer.js`** - Otimizador de dependências
- **`aws-optimized.js`** - Configuração otimizada do AWS SDK
- **`setup-chromium.sh`** - Script de configuração do Chromium
- **`OPTIMIZATION-REPORT.md`** - Relatório de otimizações

## 🚀 Como Usar

### Otimização de Dependências
```bash
cd tools
node dependency-optimizer.js
```

### Configurar Chromium
```bash
cd tools
./setup-chromium.sh
```

### Ver Relatório
```bash
cd tools
cat OPTIMIZATION-REPORT.md
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

---
*Ferramentas movidas da pasta `optimization/` para melhor organização* 