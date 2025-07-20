# 🦕 Deno Tools

Esta pasta contém ferramentas e scripts relacionados ao Deno runtime.

## 📁 Conteúdo

### 🚀 Servidor Deno
- **`deno-server.ts`** - Servidor Deno principal
  - Servidor HTTP simples
  - Configuração de rotas
  - Middleware de logging

### 🔧 Scripts de Diagnóstico
- **`diagnose_sparc_deno.sh`** - Script de diagnóstico SPARC/Deno
  - Verifica instalação do Deno
  - Testa conectividade
  - Valida configurações

### 🎯 Wrapper SPARC
- **`sparc-deno-wrapper.sh`** - Wrapper para SPARC com Deno
  - Inicialização do ambiente SPARC
  - Configuração de variáveis
  - Execução de comandos

## 🚀 Como Usar

### Executar Servidor Deno
```bash
cd deno
deno run --allow-net deno-server.ts
```

### Diagnóstico SPARC/Deno
```bash
cd deno
./diagnose_sparc_deno.sh
```

### Usar Wrapper SPARC
```bash
cd deno
./sparc-deno-wrapper.sh bridge
```

## 📋 Requisitos

- **Deno**: Runtime JavaScript/TypeScript
- **SPARC**: Sistema de agentes
- **Bash**: Para scripts shell

## 🔧 Configuração

### Instalar Deno
```bash
curl -fsSL https://deno.land/x/install/install.sh | sh
```

### Verificar Instalação
```bash
deno --version
```

## 📊 Funcionalidades

- **Servidor HTTP**: API REST simples
- **Diagnóstico**: Verificação de ambiente
- **Wrapper**: Integração SPARC/Deno
- **Logging**: Sistema de logs estruturado

---
*Arquivos movidos da raiz do projeto para melhor organização* 