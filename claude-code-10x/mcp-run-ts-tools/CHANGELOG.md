# Changelog

Todas as mudanças notáveis deste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere ao [Versionamento Semântico](https://semver.org/lang/pt-BR/).

## [2.0.0] - 2025-06-11

### 🎉 Grandes Mudanças

- **Refatoração Completa**: Index.ts reduzido de 1139 para 143 linhas (87.5% de redução!)
- **Arquitetura Modular**: Todas as ferramentas organizadas em módulos independentes
- **21 Ferramentas**: Conjunto completo de ferramentas para automação e desenvolvimento

### ✨ Adicionado

- Sistema de logging estruturado com níveis e suporte a arquivos
- Configuração centralizada com validação Zod
- Testes unitários com Jest
- README.md completo com exemplos práticos
- Documentação de API detalhada para todas as ferramentas
- Auto-push para commits Git
- Sistema de memória persistente com Mem0
- Ferramenta para executar Claude CLI

### 🔧 Melhorado

- TypeScript com strict mode completo
- Validação de entrada para todas as ferramentas
- Tratamento de erros consistente
- Performance com lazy loading e cache
- Organização de código em módulos

### 🐛 Corrigido

- Limpeza automática de recursos do Puppeteer
- Tratamento de timeouts em operações assíncronas
- Validação de variáveis de ambiente

### 🏗️ Alterado

- Migração de todo código duplicado para módulos
- Atualização de dependências para versões mais recentes
- Padronização de respostas das ferramentas

## [1.0.0] - 2025-06-01

### ✨ Versão Inicial

- 15 ferramentas básicas
- Suporte para Puppeteer, GitHub e Git
- Configuração inicial do servidor MCP
- Documentação básica

---

## Convenções de Versionamento

- **MAJOR** (X.0.0): Mudanças incompatíveis na API
- **MINOR** (0.X.0): Funcionalidades adicionadas de forma compatível
- **PATCH** (0.0.X): Correções de bugs compatíveis

## Links

- [Comparar versões](https://github.com/diegofornalha/claude-code-10x/compare/v1.0.0...v2.0.0)
- [Releases](https://github.com/diegofornalha/claude-code-10x/releases)