# 📚 Guia Completo do Subagent Expert

## 🎯 O que é o Subagent Expert?

O **subagent-expert** é um especialista em criar, otimizar e gerenciar sub agents do Claude Code. Ele é otimizado para trabalhar com:
- **SPARC Alpha v2.0.0** - Metodologia avançada de desenvolvimento
- **Hive Mind Integration** - Coordenação inteligente entre agents
- **Neural Patterns** - Padrões de IA para otimização
- **Concurrent Execution** - Execução paralela para máxima performance

## 🚀 Como Executar o Subagent Expert

### Comando Básico
```bash
# Execute através do Task tool
Task(
  description="Execute subagent expert",
  prompt="[sua solicitação específica]",
  subagent_type="subagent-expert"
)
```

### Exemplos Práticos de Uso

#### 1. Criar um Novo Sub Agent
```bash
# Exemplo: Criar um agent para análise de dados
Task(
  description="Create data analysis agent",
  prompt="Crie um sub agent especializado em análise de dados com pandas, visualizações e relatórios automatizados",
  subagent_type="subagent-expert"
)
```

#### 2. Otimizar um Agent Existente
```bash
# Exemplo: Otimizar agent de testes
Task(
  description="Optimize test agent",
  prompt="Otimize o agent de testes para executar em paralelo e melhorar a cobertura de código",
  subagent_type="subagent-expert"
)
```

#### 3. Criar Workflow Multi-Agent
```bash
# Exemplo: Sistema completo de desenvolvimento
Task(
  description="Design multi-agent system",
  prompt="Projete um sistema multi-agent para desenvolvimento full-stack com 5 agents especializados",
  subagent_type="subagent-expert"
)
```

## 📁 Recursos que o Subagent Expert Cria

### 1. **Templates de Agents**
- `TEMPLATE-subagent.md` - Template padrão configurável
- Estrutura YAML com metadados
- Seções pré-definidas para responsabilidades e workflows
- Exemplos de prompts e padrões

### 2. **Agents Especializados**
- `code-review-expert.md` - Revisão de código com IA
- `api-testing-specialist.md` - Testes automatizados de API
- `behavioral-assessment-specialist.md` - Avaliação comportamental
- Agents customizados conforme necessidade

### 3. **Ferramentas de Suporte**
- `tool-selection-matrix.md` - Matriz para escolher ferramentas
- `validation-checklist.md` - Checklist de qualidade
- `multi-agent-example.md` - Exemplos de coordenação

## 🛠️ Capacidades do Subagent Expert

### 1. **Criação de Agents**
- Análise de requisitos
- Seleção otimizada de ferramentas
- Configuração de prioridades e cores
- Definição de workflows específicos

### 2. **Otimização de Performance**
- Implementação de execução paralela
- Redução de tokens através de batching
- Uso eficiente de memória
- Padrões neurais para aprendizado

### 3. **Integração SPARC**
- Compatibilidade com todos os 16 modos SPARC
- Integração com Hive Mind
- Suporte a 87 MCP tools
- Coordenação Queen-led

### 4. **Padrões de Design**
- Event-driven architecture
- CQRS com Event Sourcing
- Circuit Breaker para resiliência
- Bulkhead para isolamento

## 📋 Casos de Uso Comuns

### 1. **Desenvolvimento de Software**
```bash
"Crie agents para um projeto React com TypeScript, incluindo testes, linting e deploy"
```

### 2. **Análise de Dados**
```bash
"Desenvolva um sistema de agents para ETL, análise estatística e geração de dashboards"
```

### 3. **DevOps e Automação**
```bash
"Projete agents para CI/CD, monitoramento e auto-scaling de infraestrutura"
```

### 4. **Segurança e Compliance**
```bash
"Crie agents especializados em security scanning, audit logs e compliance checks"
```

## ⚡ Melhores Práticas

### 1. **Sempre Use Execução Concorrente**
```javascript
// ✅ CORRETO - Tudo em uma mensagem
[Single Message]:
  - TodoWrite { todos: [10+ todos] }
  - Task("Agent 1")
  - Task("Agent 2")
  - Task("Agent 3")
```

### 2. **Defina Objetivos Claros**
- Seja específico sobre o que o agent deve fazer
- Inclua tecnologias e frameworks desejados
- Especifique requisitos de performance

### 3. **Use o Template Padrão**
- Comece com `TEMPLATE-subagent.md`
- Customize conforme necessidade
- Mantenha a estrutura YAML

### 4. **Implemente Coordenação**
- Use hooks do Claude Flow
- Implemente memória compartilhada
- Configure consenso para decisões críticas

## 🔧 Configuração Avançada

### Estrutura YAML de um Agent
```yaml
---
name: nome-do-agent
description: Descrição clara e objetiva. Use proativamente para [cenário].
tools: [Read, Write, Edit, Task, TodoWrite]
color: blue
priority: high
---

# Nome do Agent

## 🎯 Responsabilidades Principais
- Lista de responsabilidades
- Foco em tarefas específicas

## 🔄 Workflow
1. Passo inicial
2. Processamento
3. Validação
4. Entrega

## ⚡ Otimizações
- Execução paralela
- Uso de memória
- Padrões neurais
```

### Integração com Hive Mind
```bash
# Inicializar com Hive Mind
claude-flow hive-mind init --agents auto

# Spawn com coordenação
claude-flow hive-mind spawn "Objetivo" --sparc-modes "architect,code,tdd"
```

## 📊 Métricas de Performance

O subagent-expert otimiza para:
- **500% mais rápido** com spawn paralelo
- **350% melhor** distribuição de tarefas
- **400% mais eficiente** no uso de memória
- **84.8% taxa de sucesso** no SWE-Bench

## 🚨 Troubleshooting

### Problema: Agent não executa corretamente
**Solução**: Verifique se todas as ferramentas necessárias estão listadas no YAML

### Problema: Performance baixa
**Solução**: Implemente batching e execução paralela

### Problema: Falta de coordenação
**Solução**: Use hooks do Claude Flow e memória compartilhada

## 📚 Recursos Adicionais

- **Documentação SPARC**: [GitHub - SPARC Methodology](https://github.com/ruvnet/sparc)
- **Claude Flow**: [GitHub - Claude Flow](https://github.com/ruvnet/claude-flow)
- **Exemplos**: Veja os arquivos em `.claude/agents/`

## 🎯 Próximos Passos

1. **Experimente**: Use o comando básico para criar seu primeiro agent
2. **Customize**: Adapte o template para suas necessidades
3. **Otimize**: Implemente execução paralela e batching
4. **Monitore**: Use métricas para melhorar continuamente

---

💡 **Dica Pro**: Sempre comece com o subagent-expert quando precisar criar ou otimizar agents. Ele conhece todos os padrões e melhores práticas do ecossistema SPARC Alpha v2.0.0!