# Claude-Flow SPARC - Comandos e Modos Disponíveis

Este documento lista todos os comandos e modos disponíveis no sistema Claude-Flow SPARC, seguindo as regras de execução concorrente e batchtools otimizadas definidas no CLAUDE.md.

## 🚀 Comandos Principais (Core Commands)

### Inicialização e Status
```bash
# Inicializar Claude Flow v2.0.0 (cria CLAUDE.md & .claude/commands)
./claude-flow init --sparc

# Iniciar sistema de orquestração
./claude-flow start --ui --swarm

# Status do sistema e saúde
./claude-flow status

# Ajuda detalhada
./claude-flow --help
./claude-flow help <command>
```

### 🐝 Hive Mind Commands (NOVO!)
```bash
# Assistente interativo de configuração (RECOMENDADO)
./claude-flow hive-mind wizard

# Inicializar sistema Hive Mind com SQLite
./claude-flow hive-mind init

# Criar swarm inteligente com objetivo
./claude-flow hive-mind spawn "objetivo"

# Visualizar swarms ativos e métricas de performance
./claude-flow hive-mind status

# Análise avançada de performance
./claude-flow hive-mind metrics
```

## 🧠 Comandos de Swarm Intelligence

### Swarm (Coordenação Multi-Agentes)
```bash
# Executar swarm com objetivo
./claude-flow swarm "objetivo" [opções]

# Opções disponíveis:
--strategy <tipo>        # research, development, analysis, testing, optimization, maintenance
--mode <tipo>           # centralized, distributed, hierarchical, mesh, hybrid
--max-agents <n>        # Máximo de agentes (padrão: 5)
--parallel              # Execução paralela (2.8-4.4x mais rápido)
--monitor              # Monitoramento em tempo real
--ui                   # Interface interativa
--background           # Executar em segundo plano
--analysis             # Modo somente leitura
--read-only            # Modo somente análise (alias para --analysis)

# Exemplos:
./claude-flow swarm "Build a REST API with authentication"
./claude-flow swarm "Research cloud architecture patterns" --strategy research
./claude-flow swarm "Optimize database queries" --max-agents 3 --parallel
./claude-flow swarm "Develop feature X" --strategy development --monitor --ui
./claude-flow swarm "Analyze codebase for security issues" --analysis
```

### Agent (Gerenciamento de Agentes)
```bash
# Criar novo agente IA
./claude-flow agent spawn <tipo> [opções]

# Listar todos os agentes ativos
./claude-flow agent list

# Terminar agente específico
./claude-flow agent terminate <id>

# Mostrar detalhes do agente
./claude-flow agent info <id>

# Gerenciar hierarquias de agentes
./claude-flow agent hierarchy

# Visualizar ecossistema de agentes
./claude-flow agent ecosystem

# Opções:
--name <nome>           # Nome customizado para o agente
--verbose              # Saída detalhada
--json                 # Formato de saída JSON

# Tipos de agentes disponíveis:
researcher             # Pesquisa e análise de dados
coder                  # Geração e refatoração de código
analyst                # Análise de performance e segurança
architect              # Design de sistema e arquitetura
tester                 # Criação e execução de testes
coordinator            # Coordenação de tarefas
reviewer               # Revisão de código e design
optimizer              # Otimização de performance
```

### Memory (Gerenciamento de Memória Persistente)
```bash
# Armazenar dados na memória
./claude-flow memory store <chave> <valor>

# Recuperar dados armazenados
./claude-flow memory get <chave>

# Buscar conteúdo da memória
./claude-flow memory query <busca>

# Listar todos os itens armazenados
./claude-flow memory list

# Deletar entrada específica
./claude-flow memory delete <chave>

# Estatísticas de uso da memória
./claude-flow memory stats

# Exportar memória para arquivo
./claude-flow memory export <arquivo>

# Importar memória de arquivo
./claude-flow memory import <arquivo>

# Limpar entradas antigas
./claude-flow memory cleanup

# Opções:
--namespace <ns>        # Usar namespace específico
--format <tipo>         # Formato de saída (json, table)
--verbose              # Saída detalhada
```

## ⚡ Modos SPARC (16 Modos Disponíveis)

### 1. 🏗️ Architect
```bash
./claude-flow sparc run architect "tarefa"
./claude-flow sparc info architect
```
**Função**: Design de arquiteturas escaláveis, seguras e modulares baseadas em especificações funcionais e necessidades do usuário.
**Ferramentas**: read, edit

### 2. 🧠 Auto-Coder
```bash
./claude-flow sparc run code "tarefa"
./claude-flow sparc info code
```
**Função**: Escreve código limpo, eficiente e modular baseado em pseudocódigo e arquitetura.
**Ferramentas**: read, edit, browser, mcp, command

### 3. 🧪 Tester (TDD)
```bash
./claude-flow sparc run tdd "tarefa"
./claude-flow sparc tdd "feature"
./claude-flow sparc info tdd
```
**Função**: Implementa Test-Driven Development (TDD, London School), escrevendo testes primeiro e refatorando após implementação mínima.
**Ferramentas**: read, edit, browser, mcp, command

### 4. 🪲 Debugger
```bash
./claude-flow sparc run debug "tarefa"
./claude-flow sparc info debug
```
**Função**: Soluciona bugs de runtime, erros lógicos ou falhas de integração através de rastreamento, inspeção e análise.
**Ferramentas**: read, edit, browser, mcp, command

### 5. 🛡️ Security Reviewer
```bash
./claude-flow sparc run security-review "tarefa"
./claude-flow sparc info security-review
```
**Função**: Executa auditorias estáticas e dinâmicas para garantir práticas de código seguro.
**Ferramentas**: read, edit

### 6. 📚 Documentation Writer
```bash
./claude-flow sparc run docs-writer "tarefa"
./claude-flow sparc info docs-writer
```
**Função**: Escreve documentação Markdown concisa, clara e modular explicando uso, integração, configuração e setup.
**Ferramentas**: read, edit

### 7. 🔗 System Integrator
```bash
./claude-flow sparc run integration "tarefa"
./claude-flow sparc info integration
```
**Função**: Mescla saídas de todos os modos em um sistema funcional, testado e pronto para produção.
**Ferramentas**: read, edit, browser, mcp, command

### 8. 📈 Deployment Monitor
```bash
./claude-flow sparc run post-deployment-monitoring-mode "tarefa"
./claude-flow sparc info post-deployment-monitoring-mode
```
**Função**: Observa o sistema pós-lançamento, coletando performance, logs e feedback do usuário.
**Ferramentas**: read, edit, browser, mcp, command

### 9. 🧹 Optimizer
```bash
./claude-flow sparc run refinement-optimization-mode "tarefa"
./claude-flow sparc info refinement-optimization-mode
```
**Função**: Refatora, modulariza e melhora performance do sistema.
**Ferramentas**: read, edit, browser, mcp, command

### 10. ❓ Ask
```bash
./claude-flow sparc run ask "pergunta"
./claude-flow sparc info ask
```
**Função**: Guia de formulação de tarefas que ajuda usuários a navegar e delegar tarefas aos modos SPARC corretos.
**Ferramentas**: read

### 11. 🚀 DevOps
```bash
./claude-flow sparc run devops "tarefa"
./claude-flow sparc info devops
```
**Função**: Especialista em automação DevOps e infraestrutura para deploy, gerenciamento e orquestração de sistemas.
**Ferramentas**: read, edit, command

### 12. 📘 SPARC Tutorial
```bash
./claude-flow sparc run tutorial "tarefa"
./claude-flow sparc info tutorial
```
**Função**: Assistente de onboarding e educação SPARC para guiar usuários através do processo de desenvolvimento.
**Ferramentas**: read

### 13. 🔐 Supabase Admin
```bash
./claude-flow sparc run supabase-admin "tarefa"
./claude-flow sparc info supabase-admin
```
**Função**: Especialista em banco de dados, autenticação e armazenamento Supabase.
**Ferramentas**: read, edit, mcp

### 14. 📋 Specification Writer
```bash
./claude-flow sparc run spec-pseudocode "tarefa"
./claude-flow sparc info spec-pseudocode
```
**Função**: Captura contexto completo do projeto e traduz em pseudocódigo modular com âncoras TDD.
**Ferramentas**: read, edit

### 15. ♾️ MCP Integration
```bash
./claude-flow sparc run mcp "tarefa"
./claude-flow sparc info mcp
```
**Função**: Especialista em integração MCP para conectar e gerenciar serviços externos.
**Ferramentas**: edit, mcp

### 16. ⚡️ SPARC Orchestrator
```bash
./claude-flow sparc run sparc "tarefa"
./claude-flow sparc info sparc
```
**Função**: Orquestrador de workflows complexos que quebra objetivos grandes em subtarefas delegadas.
**Ferramentas**: (varia conforme necessidade)

## 🎯 Comandos Batchtools (Otimizados)

### Execução Paralela
```bash
# Executar múltiplos modos SPARC em paralelo
./claude-flow sparc batch <modos> "tarefa"

# Executar pipeline SPARC completo com processamento paralelo
./claude-flow sparc pipeline "tarefa"

# Processar múltiplas tarefas concorrentemente
./claude-flow sparc concurrent <modo> "arquivo-tarefas"
```

### Comandos de Performance
```bash
# Listar todos os modos SPARC
./claude-flow sparc modes

# Obter informações detalhadas sobre um modo
./claude-flow sparc info <modo>

# Listar modos com descrições verbosas
./claude-flow sparc modes --verbose
```

## 📋 Comandos Adicionais

### Task (Gerenciamento de Tarefas)
```bash
./claude-flow task <ação>
```

### Config (Configuração do Sistema)
```bash
./claude-flow config <ação>
```

### MCP (Gerenciamento de Servidor MCP)
```bash
./claude-flow mcp <ação>
```

### Batch (Operações em Lote)
```bash
./claude-flow batch <ação>
```

### GitHub (Automação de Workflow)
```bash
./claude-flow github <modo>
```

## 🔍 Comandos de Monitoramento e Análise

### Training (Aprendizado de Padrões Neurais)
```bash
./claude-flow training <comando>
```

### Coordination (Orquestração de Swarm e Agentes)
```bash
./claude-flow coordination <comando>
```

### Analysis (Análise de Performance e Uso)
```bash
./claude-flow analysis <comando>
```

### Automation (Gerenciamento Inteligente)
```bash
./claude-flow automation <comando>
```

### Hooks (Gerenciamento de Eventos)
```bash
./claude-flow hooks <comando>
./claude-flow migrate-hooks  # Migrar settings.json para Claude Code 1.0.51+
```

### Monitoring (Monitoramento em Tempo Real)
```bash
./claude-flow monitoring <comando>
```

### Optimization (Otimização de Performance)
```bash
./claude-flow optimization <comando>
```

## 🚨 Regras de Execução Concorrente

### ⚡ REGRA DOURADA: "1 MENSAGEM = TODAS AS OPERAÇÕES RELACIONADAS"

**Padrões Obrigatórios de Execução Concorrente:**
1. **TodoWrite**: SEMPRE agrupar TODOS os todos em UMA chamada (5-10+ todos mínimo)
2. **Task tool**: SEMPRE criar TODOS os agentes em UMA mensagem com instruções completas
3. **Operações de arquivo**: SEMPRE agrupar TODAS as operações read/write/edit em UMA mensagem
4. **Comandos Bash**: SEMPRE agrupar TODAS as operações de terminal em UMA mensagem
5. **Operações de memória**: SEMPRE agrupar TODAS as operações store/retrieve em UMA mensagem

### ✅ Exemplo CORRETO - Execução Concorrente:
```javascript
[Mensagem Única]:
  - TodoWrite { todos: [10+ todos com status/prioridades] }
  - Task("Agente 1 com instruções completas")
  - Task("Agente 2 com instruções completas")
  - Task("Agente 3 com instruções completas")
  - Read("arquivo1.js")
  - Read("arquivo2.js")
  - Write("saida1.js", conteudo)
  - Write("saida2.js", conteudo)
  - Bash("npm install")
  - Bash("npm test")
  - Bash("npm run build")
```

### ❌ Exemplo INCORRETO - Execução Sequencial:
```javascript
// NUNCA faça isso - quebra a coordenação!
Mensagem 1: TodoWrite { todos: [um todo] }
Mensagem 2: Task("Agente 1")
Mensagem 3: Task("Agente 2")
Mensagem 4: Read("arquivo1.js")
Mensagem 5: Write("saida1.js")
Mensagem 6: Bash("npm install")
// Isso é 6x mais lento!
```

## 🎯 Melhorias de Performance com Batchtools

- **Operações de Arquivo**: Até 300% mais rápido com processamento paralelo
- **Análise de Código**: 250% de melhoria com reconhecimento de padrões concorrente
- **Geração de Testes**: 400% mais rápido com criação paralela de testes
- **Documentação**: 200% de melhoria com geração concorrente de conteúdo
- **Operações de Memória**: 180% mais rápido com operações read/write agrupadas

## 🔗 Links Úteis

- **Documentação**: https://github.com/ruvnet/claude-flow
- **Guia Hive Mind**: https://github.com/ruvnet/claude-flow/tree/main/docs/hive-mind
- **ruv-swarm**: https://github.com/ruvnet/ruv-FANN/tree/main/ruv-swarm
- **Guia SPARC**: https://github.com/ruvnet/claude-code-flow/docs/sparc.md
- **Documentação Batchtools**: https://github.com/ruvnet/claude-code-flow/docs/batchtools.md

---

*Documento criado automaticamente com base no sistema Claude-Flow SPARC v2.0.0-alpha.56*