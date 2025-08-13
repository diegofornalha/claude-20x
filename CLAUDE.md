responda sempre em pt br
# Claude Code - SPARC Development

## 🤖 REGRA #1: SEMPRE USE SUBAGENTES

**`.claude/agents/`** - 54 agentes especializados do Claude Code

### 🎯 MAPEAMENTO AUTOMÁTICO

| Tarefa | Agentes |
|--------|---------|
| implementar | coder + tester + reviewer |
| testar | tester + code-analyzer |
| documentar | api-docs + researcher |
| debug | code-analyzer + coder + tester |
| API | backend-dev + api-docs + tester |
| CI/CD | cicd-engineer + tester |
| performance | perf-analyzer + code-analyzer |

## 🚨 EXECUÇÃO CONCORRENTE

**TUDO em 1 mensagem:**
- TodoWrite: 5-10+ todos
- Task: TODOS agentes paralelos
- Files: batch Read/Write/Edit
- Bash: TODOS comandos juntos

### ⚡ INIT PADRÃO

```javascript
[Single Message]:
  mcp__claude-flow__swarm_init { topology: "hierarchical", maxAgents: 8 }
  mcp__claude-flow__agent_spawn { type: "task-orchestrator" }
  mcp__claude-flow__agent_spawn { type: "coder" }
  mcp__claude-flow__agent_spawn { type: "tester" }
  TodoWrite { todos: [10+ todos] }
```

## COMANDOS

**SPARC:** `npx claude-flow sparc [modes|run|tdd|batch]`
**Build:** `npm run [build|test|lint|typecheck]`

## HOOKS OBRIGATÓRIOS

```bash
npx claude-flow@alpha hooks pre-task --description "[task]"
npx claude-flow@alpha hooks post-edit --file "[file]"
npx claude-flow@alpha hooks post-task --analyze-performance true
```

## AGENTES (54)

**Core:** coder, tester, reviewer, planner, researcher
**Coord:** task-orchestrator, hierarchical-coordinator
**Dev:** backend-dev, mobile-dev, cicd-engineer, api-docs
**SPARC:** sparc-coord, sparc-coder, specification
**GitHub:** pr-manager, code-review-swarm

## MCP TOOLS

- `swarm_init` - Setup
- `agent_spawn` - Criar agentes
- `task_orchestrate` - Coordenar
- `memory_usage` - Persistência
- `swarm_monitor` - Status

## REGRAS

1. **Batch tudo** - Nunca sequencial
2. **Paralelo sempre** - Max concorrência
3. **Agentes sempre** - Nunca direto
4. **Memória vital** - Coordenação
5. **Claude executa** - MCP coordena

---
Docs: github.com/ruvnet/claude-flow