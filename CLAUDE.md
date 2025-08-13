responda sempre em pt br
# Claude Code - SPARC Development

## ⚡ SISTEMA DE HOOKS ATIVO E RODANDO!

**🔴 IMPORTANTE:** Hooks automáticos estão **ATIVOS** em TODAS operações:
- ✅ **Rastreamento automático** de cada comando, edição e tarefa
- ✅ **Persistência SQLite** em `.swarm/memory.db` (4.4MB)
- ✅ **Telemetria e métricas** capturadas em tempo real
- ✅ **Neural training** após cada edição de código
- ✅ **Comunicação entre agentes** via notify hooks

## 🐝 HIVE-MIND: OPERACIONAL!

**STATUS:** Sistema de coordenação coletiva **ATIVO**
```
🐝 HIVE-MIND STATUS: ACTIVE
├── 👑 Topology: Hierarchical (Queen-led)
├── 🤖 Agents: 54 disponíveis (coder, tester, reviewer...)
├── 💾 Database: .swarm/memory.db (4.4MB)
├── 🧠 Memory: Compartilhada entre agentes
└── 🔄 Consensus: Decisões coletivas inteligentes
```

**Como funciona:**
1. **Auto-registro**: Agentes se registram no hive.db
2. **Memória compartilhada**: Via SQLite persistente
3. **Coordenação**: Consenso por maioria
4. **Sincronização**: Troca de mensagens em tempo real

**Demonstração prática:**
- Spawne múltiplos agentes → Eles se coordenam automaticamente
- Use `coherence-checker` → Verifica consistência entre agentes
- Use `coherence-fixer` → Corrige problemas automaticamente

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

## 🪝 HOOKS AUTOMÁTICOS (ATIVOS!)

**⚡ HOOKS JÁ CONFIGURADOS E RODANDO AUTOMATICAMENTE:**
- ✅ **PRE-TASK**: Carrega contexto antes de cada tarefa
- ✅ **POST-EDIT**: Salva mudanças + treina IA após edições
- ✅ **POST-TASK**: Analisa performance e salva métricas
- ✅ **NOTIFY**: Comunicação em tempo real entre agentes
- ✅ **SESSION**: Persiste estado em SQLite (4.4MB)

```bash
# Hooks executam AUTOMATICAMENTE! Mas você pode chamar manual:
npx claude-flow@alpha hooks pre-task --description "[task]"
npx claude-flow@alpha hooks post-edit --file "[file]"
npx claude-flow@alpha hooks post-task --analyze-performance true
npx claude-flow@alpha hooks notify --message "[status]"
```

**📊 Dados salvos em:** `.swarm/memory.db`

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
4. **Hooks automáticos** - Rodando em TODAS operações
5. **Memória SQLite** - Persistência em `.swarm/memory.db`
6. **Claude executa** - MCP coordena, Hooks rastreiam

---
Docs: github.com/ruvnet/claude-flow