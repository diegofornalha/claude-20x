responda sempre em pt br
# Claude Code Configuration - SPARC Development

## 🤖 REGRA ABSOLUTA: SEMPRE USE SUBAGENTES ESPECIALIZADOS

**LOCALIZAÇÃO**: `.claude/agents/` (54 agentes do Claude Code)
- São instruções especializadas, NÃO processos externos
- SEMPRE spawnar para QUALQUER tarefa

### 🎯 MAPEAMENTO AUTOMÁTICO TAREFA → AGENTES

| Tarefa | Agentes Obrigatórios |
|--------|---------------------|
| implementar/criar | coder + tester + reviewer |
| testar/validar | tester + code-analyzer |
| revisar/analisar | reviewer + code-analyzer |
| documentar | api-docs + researcher |
| debug/erro | code-analyzer + coder + tester |
| API/REST | backend-dev + api-docs + tester |
| deploy/CI/CD | cicd-engineer + tester |
| performance | perf-analyzer + code-analyzer |

## 🚨 EXECUÇÃO CONCORRENTE OBRIGATÓRIA

**TUDO em UMA mensagem:**
- TodoWrite: 5-10+ todos em UMA chamada
- Task: TODOS agentes em paralelo
- File ops: TODAS operações batched
- Bash: TODOS comandos juntos

### ⚡ INICIALIZAÇÃO PADRÃO

```javascript
// SEMPRE no início
[Single Message]:
  mcp__claude-flow__swarm_init { topology: "hierarchical", maxAgents: 8 }
  mcp__claude-flow__agent_spawn { type: "task-orchestrator" }
  mcp__claude-flow__agent_spawn { type: "coder" }
  mcp__claude-flow__agent_spawn { type: "tester" }
  mcp__claude-flow__agent_spawn { type: "reviewer" }
  TodoWrite { todos: [10+ todos] }
```

## SPARC Commands

- `npx claude-flow sparc modes`: Listar modos
- `npx claude-flow sparc run <mode> "<task>"`: Executar modo
- `npx claude-flow sparc tdd "<feature>"`: TDD completo
- `npx claude-flow sparc batch`: Múltiplos modos paralelos

## 📋 COORDENAÇÃO OBRIGATÓRIA

**INÍCIO:**
```bash
npx claude-flow@alpha hooks pre-task --description "[tarefa]"
```

**DURANTE:**
```bash
npx claude-flow@alpha hooks post-edit --file "[arquivo]"
npx claude-flow@alpha hooks notify --message "[decisão]"
```

**FIM:**
```bash
npx claude-flow@alpha hooks post-task --analyze-performance true
```

## Agentes Principais (54 total)

### Core
- coder, tester, reviewer, planner, researcher

### Coordination
- task-orchestrator, hierarchical-coordinator, mesh-coordinator

### Specialized
- backend-dev, mobile-dev, ml-developer, cicd-engineer
- api-docs, system-architect, code-analyzer

### SPARC
- sparc-coord, sparc-coder, specification, architecture

### GitHub
- pr-manager, code-review-swarm

## MCP Tools Essenciais

- `mcp__claude-flow__swarm_init`: Inicializar swarm
- `mcp__claude-flow__agent_spawn`: Criar agentes
- `mcp__claude-flow__task_orchestrate`: Coordenar tarefas
- `mcp__claude-flow__memory_usage`: Memória persistente
- `mcp__claude-flow__swarm_monitor`: Monitoramento

## Princípios

1. **Batch tudo** - Nunca sequencial
2. **Paralelo sempre** - Maximizar concorrência
3. **Agentes sempre** - Nunca trabalho direto
4. **Memória vital** - Coordenação entre agentes
5. **Claude Code executa** - MCP coordena

---
Docs: https://github.com/ruvnet/claude-flow