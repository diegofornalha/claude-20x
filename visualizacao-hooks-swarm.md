# 🔄 Visualização Completa do Fluxo de Hooks - Swarm Multi-Agente

## 📊 Diagrama de Fluxo de Execução dos Hooks

```mermaid
graph TB
    Start([🚀 INÍCIO DO SWARM])
    
    %% Inicialização
    Start --> SwarmInit[📦 swarm_init<br/>Topologia: mesh<br/>4 agentes]
    SwarmInit --> AgentSpawn[🤖 agent_spawn x4<br/>researcher, coder, tester, reviewer]
    
    %% Pre-Task Hooks
    AgentSpawn --> PreTask1[⚡ PRE-TASK Hook - Researcher<br/>npx claude-flow hooks pre-task<br/>--description 'Analisar requisitos'<br/>--load-context true]
    AgentSpawn --> PreTask2[⚡ PRE-TASK Hook - Coder<br/>npx claude-flow hooks pre-task<br/>--description 'Implementar feature'<br/>--load-context true]
    AgentSpawn --> PreTask3[⚡ PRE-TASK Hook - Tester<br/>npx claude-flow hooks pre-task<br/>--description 'Criar testes'<br/>--load-context true]
    AgentSpawn --> PreTask4[⚡ PRE-TASK Hook - Reviewer<br/>npx claude-flow hooks pre-task<br/>--description 'Revisar código'<br/>--load-context true]
    
    %% Execução Principal
    PreTask1 --> Research[🔍 RESEARCHER TRABALHANDO<br/>- Busca em arquivos<br/>- Análise de docs<br/>- Síntese de informações]
    PreTask2 --> Code[💻 CODER TRABALHANDO<br/>- Implementação<br/>- Refatoração<br/>- Debug]
    PreTask3 --> Test[🧪 TESTER TRABALHANDO<br/>- Testes unitários<br/>- Integração<br/>- Validação]
    PreTask4 --> Review[📝 REVIEWER TRABALHANDO<br/>- Code review<br/>- Checagem de padrões<br/>- Qualidade]
    
    %% Notify Hooks Durante Execução
    Research --> NotifyR[📢 NOTIFY Hook<br/>Descoberta: APIs identificadas<br/>Level: info]
    Code --> NotifyC[📢 NOTIFY Hook<br/>Status: 50% implementado<br/>Level: progress]
    Test --> NotifyT[📢 NOTIFY Hook<br/>3 testes criados<br/>Level: success]
    Review --> NotifyRv[📢 NOTIFY Hook<br/>2 issues encontradas<br/>Level: warning]
    
    %% Post-Edit Hooks
    Code --> PostEdit1[✏️ POST-EDIT Hook<br/>File: api/routes.js<br/>--format true<br/>--update-memory true]
    Code --> PostEdit2[✏️ POST-EDIT Hook<br/>File: api/models.js<br/>--format true<br/>--train-neural true]
    Test --> PostEdit3[✏️ POST-EDIT Hook<br/>File: tests/api.test.js<br/>--format true<br/>--update-memory true]
    
    %% Memory Updates
    NotifyR --> Memory1[💾 MEMORY UPDATE<br/>key: swarm/researcher/findings<br/>value: {apis: [...]}]
    NotifyC --> Memory2[💾 MEMORY UPDATE<br/>key: swarm/coder/progress<br/>value: {status: 50%}]
    NotifyT --> Memory3[💾 MEMORY UPDATE<br/>key: swarm/tester/tests<br/>value: {count: 3}]
    NotifyRv --> Memory4[💾 MEMORY UPDATE<br/>key: swarm/reviewer/issues<br/>value: {issues: 2}]
    
    %% Post-Task Hooks
    Memory1 --> PostTask1[🏁 POST-TASK Hook - Researcher<br/>Task ID: task-xxx-researcher<br/>Performance: 45.2s<br/>--analyze-performance true]
    Memory2 --> PostTask2[🏁 POST-TASK Hook - Coder<br/>Task ID: task-xxx-coder<br/>Performance: 63.5s<br/>--analyze-performance true]
    Memory3 --> PostTask3[🏁 POST-TASK Hook - Tester<br/>Task ID: task-xxx-tester<br/>Performance: 38.1s<br/>--analyze-performance true]
    Memory4 --> PostTask4[🏁 POST-TASK Hook - Reviewer<br/>Task ID: task-xxx-reviewer<br/>Performance: 22.7s<br/>--analyze-performance true]
    
    %% Finalização
    PostTask1 --> SessionEnd
    PostTask2 --> SessionEnd
    PostTask3 --> SessionEnd
    PostTask4 --> SessionEnd[📊 SESSION-END Hook<br/>--generate-summary true<br/>--export-metrics true<br/>--persist-state true]
    
    SessionEnd --> End([✅ SWARM COMPLETO])
```

## 🎯 Fluxo Temporal Detalhado

### T=0s: Inicialização do Swarm
```bash
# MCP Tools (Coordenação)
mcp__claude-flow__swarm_init { topology: "mesh", maxAgents: 4 }
mcp__claude-flow__agent_spawn { type: "researcher", name: "Pesquisador" }
mcp__claude-flow__agent_spawn { type: "coder", name: "Desenvolvedor" }
mcp__claude-flow__agent_spawn { type: "tester", name: "Testador" }
mcp__claude-flow__agent_spawn { type: "reviewer", name: "Revisor" }
```

### T=1s: Pre-Task Hooks (Paralelo)
```bash
# Todos os agentes executam simultaneamente
[RESEARCHER] npx claude-flow@alpha hooks pre-task --description "Analisar requisitos" --auto-spawn-agents false
[CODER]      npx claude-flow@alpha hooks pre-task --description "Implementar feature" --load-context true
[TESTER]     npx claude-flow@alpha hooks pre-task --description "Criar testes" --auto-spawn-agents false
[REVIEWER]   npx claude-flow@alpha hooks pre-task --description "Revisar código" --load-context true
```

### T=5s-60s: Execução Principal com Notify Hooks

#### 🔍 Researcher (T=5s-25s)
```bash
# Durante análise
npx claude-flow@alpha hooks notify --message "Analisando estrutura de APIs" --level "info"
npx claude-flow@alpha hooks notify --message "3 endpoints REST identificados" --level "success"
npx claude-flow@alpha hooks notify --message "Documentação OpenAPI encontrada" --level "info"
```

#### 💻 Coder (T=10s-60s)
```bash
# Durante implementação
npx claude-flow@alpha hooks pre-edit --file "api/routes.js" --auto-assign-agents true
# [Edita arquivo]
npx claude-flow@alpha hooks post-edit --file "api/routes.js" --format true --update-memory true

npx claude-flow@alpha hooks notify --message "25% implementado" --level "progress"
npx claude-flow@alpha hooks notify --message "50% implementado" --level "progress"
npx claude-flow@alpha hooks notify --message "75% implementado" --level "progress"

npx claude-flow@alpha hooks pre-edit --file "api/models.js" --auto-assign-agents true
# [Edita arquivo]
npx claude-flow@alpha hooks post-edit --file "api/models.js" --format true --train-neural true
```

#### 🧪 Tester (T=30s-50s)
```bash
# Durante criação de testes
npx claude-flow@alpha hooks notify --message "Criando suite de testes" --level "info"

npx claude-flow@alpha hooks pre-edit --file "tests/api.test.js" --auto-assign-agents true
# [Cria arquivo de teste]
npx claude-flow@alpha hooks post-edit --file "tests/api.test.js" --format true --update-memory true

npx claude-flow@alpha hooks notify --message "3 testes unitários criados" --level "success"
npx claude-flow@alpha hooks notify --message "Coverage: 85%" --level "info"
```

#### 📝 Reviewer (T=40s-55s)
```bash
# Durante revisão
npx claude-flow@alpha hooks notify --message "Iniciando code review" --level "info"
npx claude-flow@alpha hooks notify --message "Issue: Missing error handling in routes.js:45" --level "warning"
npx claude-flow@alpha hooks notify --message "Issue: Unused variable in models.js:23" --level "warning"
npx claude-flow@alpha hooks notify --message "Code quality: 8.5/10" --level "success"
```

### T=60s-65s: Memory Synchronization
```bash
# Todos os agentes sincronizam memória
mcp__claude-flow__memory_usage { action: "store", key: "swarm/researcher/findings", value: {...} }
mcp__claude-flow__memory_usage { action: "store", key: "swarm/coder/implementation", value: {...} }
mcp__claude-flow__memory_usage { action: "store", key: "swarm/tester/results", value: {...} }
mcp__claude-flow__memory_usage { action: "store", key: "swarm/reviewer/report", value: {...} }
```

### T=65s-70s: Post-Task Hooks (Paralelo)
```bash
[RESEARCHER] npx claude-flow@alpha hooks post-task --task-id "task-001-researcher" --analyze-performance true
# Output: Performance: 45.2s, Tokens: 3542, Memory: 15KB

[CODER] npx claude-flow@alpha hooks post-task --task-id "task-002-coder" --analyze-performance true
# Output: Performance: 63.5s, Tokens: 8921, Memory: 45KB, Files: 2

[TESTER] npx claude-flow@alpha hooks post-task --task-id "task-003-tester" --analyze-performance true
# Output: Performance: 38.1s, Tokens: 2156, Memory: 12KB, Tests: 3

[REVIEWER] npx claude-flow@alpha hooks post-task --task-id "task-004-reviewer" --analyze-performance true
# Output: Performance: 22.7s, Tokens: 1823, Memory: 8KB, Issues: 2
```

### T=70s: Session End
```bash
npx claude-flow@alpha hooks session-end --generate-summary true --export-metrics true --persist-state true
```

## 📊 Visualização em Tempo Real

### Dashboard de Monitoramento
```
🐝 SWARM STATUS: ACTIVE
├── 📡 Topology: MESH (peer-to-peer)
├── 👥 Agents: 4/4 ACTIVE
├── ⚡ Execution: PARALLEL
└── 💾 Memory: 80KB stored

╔════════════════════════════════════════════════════════════╗
║                    AGENT ACTIVITY MONITOR                   ║
╠════════════════════════════════════════════════════════════╣
║                                                            ║
║ [RESEARCHER] 🟢 ████████████████████ 100% │ 45.2s │ ✅   ║
║   └─ Hooks: pre-task ✓ | notify(3x) ✓ | post-task ✓      ║
║                                                            ║
║ [CODER]      🟡 ████████████░░░░░░░░  63% │ 40.1s │ 🔄   ║
║   └─ Hooks: pre-task ✓ | pre-edit(2x) ✓ | notify(3x) ✓   ║
║                                                            ║
║ [TESTER]     🟡 ██████░░░░░░░░░░░░░░  30% │ 11.4s │ 🔄   ║
║   └─ Hooks: pre-task ✓ | notify(1x) ✓ | pending...        ║
║                                                            ║
║ [REVIEWER]   🔵 ░░░░░░░░░░░░░░░░░░░░   0% │  0.0s │ ⏳   ║
║   └─ Hooks: pre-task ✓ | waiting for code completion...    ║
║                                                            ║
╠════════════════════════════════════════════════════════════╣
║                      HOOK EXECUTION LOG                     ║
╠════════════════════════════════════════════════════════════╣
║ [00:00:01] ⚡ pre-task     │ ALL AGENTS  │ Context loaded ║
║ [00:00:05] 📢 notify       │ RESEARCHER  │ APIs found     ║
║ [00:00:10] ✏️  pre-edit     │ CODER       │ routes.js      ║
║ [00:00:12] ✏️  post-edit    │ CODER       │ formatted      ║
║ [00:00:15] 📢 notify       │ CODER       │ 25% complete   ║
║ [00:00:20] 📢 notify       │ RESEARCHER  │ Docs found     ║
║ [00:00:25] 🏁 post-task    │ RESEARCHER  │ 45.2s total    ║
║ [00:00:30] 📢 notify       │ TESTER      │ Tests started  ║
║ [00:00:35] ✏️  pre-edit     │ TESTER      │ api.test.js    ║
║ [00:00:40] 📢 notify       │ REVIEWER    │ Review started ║
╚════════════════════════════════════════════════════════════╝

📈 PERFORMANCE METRICS
├── Total Execution: 70s
├── Parallel Efficiency: 85%
├── Memory Usage: 80KB
├── Token Consumption: 16,442
└── Hook Calls: 28

🔄 COORDINATION FLOW
Researcher ──notify──> Memory <──retrieve── Coder
    │                    ↑                    │
    └──complete──>   Coordinator   <──update──┘
                         ↓
                    Tester & Reviewer
```

## 🎮 Comandos para Monitoramento

### Monitorar Swarm em Tempo Real
```bash
# Monitor completo
npx claude-flow@alpha swarm monitor --interval 1 --detailed

# Monitor específico de hooks
npx claude-flow@alpha hooks monitor --swarm-id [ID] --real-time

# Visualizar fluxo de memória
npx claude-flow@alpha memory flow --swarm-id [ID] --visualize
```

### Analisar Performance dos Hooks
```bash
# Performance por agente
npx claude-flow@alpha hooks performance --agent-id [ID]

# Performance geral do swarm
npx claude-flow@alpha swarm performance --detailed

# Bottlenecks identificados
npx claude-flow@alpha bottleneck analyze --swarm-id [ID]
```

### Exportar Visualização
```bash
# Exportar como JSON
npx claude-flow@alpha swarm export --format json --include-hooks

# Gerar relatório HTML
npx claude-flow@alpha swarm report --format html --open

# Timeline interativo
npx claude-flow@alpha timeline generate --swarm-id [ID]
```

## 🔍 Detalhes de Cada Hook

### PRE-TASK Hook
- **Quando**: Antes de iniciar qualquer tarefa
- **Função**: Carregar contexto, preparar recursos
- **Dados**: description, auto-spawn-agents, load-context

### NOTIFY Hook
- **Quando**: Durante execução para comunicar progresso
- **Função**: Compartilhar descobertas entre agentes
- **Dados**: message, level (info/warning/error/success)

### PRE-EDIT Hook
- **Quando**: Antes de editar qualquer arquivo
- **Função**: Validar, auto-assign agents, preparar
- **Dados**: file, auto-assign-agents, load-context

### POST-EDIT Hook
- **Quando**: Após editar arquivo
- **Função**: Formatar, atualizar memória, treinar IA
- **Dados**: file, format, update-memory, train-neural

### POST-TASK Hook
- **Quando**: Ao completar tarefa
- **Função**: Analisar performance, salvar resultados
- **Dados**: task-id, analyze-performance, metrics

### SESSION-END Hook
- **Quando**: Ao finalizar sessão do swarm
- **Função**: Gerar sumário, exportar métricas, persistir
- **Dados**: generate-summary, export-metrics, persist-state

## 💡 Insights do Fluxo

1. **Paralelismo**: Todos os agentes iniciam simultaneamente
2. **Coordenação**: Hooks notify permitem comunicação em tempo real
3. **Memória Compartilhada**: Cada agente atualiza e consulta memória
4. **Performance Tracking**: Cada operação é medida e otimizada
5. **Neural Training**: Post-edit hooks treinam modelos com cada edição

Este sistema permite total visibilidade e controle sobre o swarm multi-agente!