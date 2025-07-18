# Claude Code Configuration - SPARC Development Environment (Batchtools Optimized)

## 🚨 CRITICAL: CONCURRENT EXECUTION FOR ALL ACTIONS

**ABSOLUTE RULE**: ALL operations MUST be concurrent/parallel in a single message:

### 🔴 MANDATORY CONCURRENT PATTERNS:
1. **TodoWrite**: ALWAYS batch ALL todos in ONE call (5-10+ todos minimum)
2. **Task tool**: ALWAYS spawn ALL agents in ONE message with full instructions
3. **File operations**: ALWAYS batch ALL reads/writes/edits in ONE message
4. **Bash commands**: ALWAYS batch ALL terminal operations in ONE message
5. **Memory operations**: ALWAYS batch ALL memory store/retrieve in ONE message

### ⚡ GOLDEN RULE: "1 MESSAGE = ALL RELATED OPERATIONS"

**Examples of CORRECT concurrent execution:**
```javascript
// ✅ CORRECT: Everything in ONE message
[Single Message]:
  - TodoWrite { todos: [10+ todos with all statuses/priorities] }
  - Task("Agent 1 with full instructions and hooks")
  - Task("Agent 2 with full instructions and hooks")
  - Task("Agent 3 with full instructions and hooks")
  - Read("file1.js")
  - Read("file2.js")
  - Write("output1.js", content)
  - Write("output2.js", content)
  - Bash("npm install")
  - Bash("npm test")
  - Bash("npm run build")
```

**Examples of WRONG sequential execution:**
```javascript
// ❌ WRONG: Multiple messages (NEVER DO THIS)
Message 1: TodoWrite { todos: [single todo] }
Message 2: Task("Agent 1")
Message 3: Task("Agent 2")
Message 4: Read("file1.js")
Message 5: Write("output1.js")
Message 6: Bash("npm install")
// This is 6x slower and breaks coordination!
```

### 🎯 CONCURRENT EXECUTION CHECKLIST:

Before sending ANY message, ask yourself:
- ✅ Are ALL related TodoWrite operations batched together?
- ✅ Are ALL Task spawning operations in ONE message?
- ✅ Are ALL file operations (Read/Write/Edit) batched together?
- ✅ Are ALL bash commands grouped in ONE message?
- ✅ Are ALL memory operations concurrent?

If ANY answer is "No", you MUST combine operations into a single message!

## Project Overview
This project uses the SPARC (Specification, Pseudocode, Architecture, Refinement, Completion) methodology for systematic Test-Driven Development with AI assistance through Claude-Flow orchestration.

**🚀 Batchtools Optimization Enabled**: This configuration includes optimized prompts and parallel processing capabilities for improved performance and efficiency.

## SPARC Development Commands

### Core SPARC Commands
- `./claude-flow sparc modes`: List all available SPARC development modes
- `./claude-flow sparc modes --verbose`: List SPARC modes with detailed descriptions
- `./claude-flow sparc run <mode> "<task>"`: Execute specific SPARC mode for a task
- `./claude-flow sparc info <mode>`: Get detailed information about a specific mode
- `./claude-flow sparc tdd "<feature>"`: Run complete TDD workflow using SPARC methodology

## 🎯 17 MODOS SPARC DISPONÍVEIS - REGRAS DE USO

**REGRA CRÍTICA**: Os agentes DEVEM usar os modos SPARC através do claude-flow para especialização de tarefas.

### 🏗️ Core Orchestration (4 modos):
1. **orchestrator** - Orquestração multi-agente com TodoWrite/Task/Memory
   ```bash
   ./claude-flow sparc run orchestrator "coordenar desenvolvimento de API REST"
   ```
   - **Ferramentas**: TodoWrite, TodoRead, Task, Memory, Bash
   - **Uso**: Coordenação complexa de múltiplos agentes

2. **swarm-coordinator** - Coordenação avançada de enxame
   ```bash
   ./claude-flow sparc run swarm-coordinator "gerenciar equipe de desenvolvimento"
   ```
   - **Ferramentas**: TodoWrite, TodoRead, Task, Memory, Bash
   - **Uso**: Coordenação de swarms de agentes

3. **workflow-manager** - Automação de processos e workflows
   ```bash
   ./claude-flow sparc run workflow-manager "automatizar pipeline CI/CD"
   ```
   - **Ferramentas**: TodoWrite, TodoRead, Task, Bash, Memory
   - **Uso**: Gestão de workflows automatizados

4. **batch-executor** - Execução paralela de tarefas
   ```bash
   ./claude-flow sparc run batch-executor "executar testes em paralelo"
   ```
   - **Ferramentas**: Task, Bash, Read, Write, TodoWrite, Memory
   - **Uso**: Execução massiva de tarefas paralelas

### 🔧 Development Modes (4 modos):
5. **coder** - Geração autônoma de código com operações batch
   ```bash
   ./claude-flow sparc run coder "implementar sistema de autenticação JWT"
   ```
   - **Ferramentas**: Read, Write, Edit, Bash, Glob, Grep, TodoWrite
   - **Uso**: Implementação de código limpo e eficiente

6. **architect** - Design de sistemas com coordenação via Memory
   ```bash
   ./claude-flow sparc run architect "projetar arquitetura microserviços"
   ```
   - **Ferramentas**: Read, Write, Glob, Memory, TodoWrite, Task
   - **Uso**: Design arquitetural e planejamento de sistemas

7. **reviewer** - Revisão de código usando análise batch de arquivos
   ```bash
   ./claude-flow sparc run reviewer "revisar código de segurança"
   ```
   - **Ferramentas**: Read, Edit, Grep, Bash, TodoWrite, Memory
   - **Uso**: Revisão de qualidade e otimização de código

8. **tdd** - Desenvolvimento orientado a testes com planejamento TodoWrite
   ```bash
   ./claude-flow sparc run tdd "criar suite de testes para API"
   ```
   - **Ferramentas**: Read, Write, Edit, Bash, TodoWrite, Task
   - **Uso**: Test-Driven Development rigoroso

### 📊 Analysis & Research (3 modos):
9. **researcher** - Pesquisa profunda com WebSearch/WebFetch paralelos
   ```bash
   ./claude-flow sparc run researcher "pesquisar melhores práticas React 2025"
   ```
   - **Ferramentas**: WebSearch, WebFetch, Read, Write, Memory, TodoWrite, Task
   - **Uso**: Pesquisa abrangente e coleta de informações

10. **analyzer** - Análise de código e dados com processamento batch
    ```bash
    ./claude-flow sparc run analyzer "analisar performance da aplicação"
    ```
    - **Ferramentas**: Read, Grep, Bash, Write, Memory, TodoWrite, Task
    - **Uso**: Análise sistemática de código e dados

11. **optimizer** - Otimização de performance com análise sistemática
    ```bash
    ./claude-flow sparc run optimizer "otimizar consultas do banco de dados"
    ```
    - **Ferramentas**: Read, Edit, Bash, Grep, TodoWrite, Memory
    - **Uso**: Otimização de performance e recursos

### 🎨 Creative & Support (4 modos):
12. **designer** - Design UI/UX com coordenação Memory
    ```bash
    ./claude-flow sparc run designer "criar interface de dashboard"
    ```
    - **Ferramentas**: Read, Write, Edit, Memory, TodoWrite
    - **Uso**: Design de interfaces e experiência do usuário

13. **innovator** - Resolução criativa de problemas com WebSearch
    ```bash
    ./claude-flow sparc run innovator "criar solução inovadora para cache"
    ```
    - **Ferramentas**: Read, Write, WebSearch, Memory, TodoWrite, Task
    - **Uso**: Soluções criativas e inovação

14. **documenter** - Documentação com operações batch de arquivos
    ```bash
    ./claude-flow sparc run documenter "documentar API REST completa"
    ```
    - **Ferramentas**: Read, Write, Glob, Memory, TodoWrite
    - **Uso**: Criação e manutenção de documentação

15. **debugger** - Debug sistemático com TodoWrite/Memory
    ```bash
    ./claude-flow sparc run debugger "corrigir bug de memory leak"
    ```
    - **Ferramentas**: Read, Edit, Bash, Grep, TodoWrite, Memory
    - **Uso**: Debug sistemático e correção de problemas

### 🧪 Testing & Quality (2 modos):
16. **tester** - Testes abrangentes com execução paralela
    ```bash
    ./claude-flow sparc run tester "criar testes de integração completos"
    ```
    - **Ferramentas**: Read, Write, Edit, Bash, TodoWrite, Task
    - **Uso**: Criação e execução de testes abrangentes

17. **memory-manager** - Gestão de conhecimento com ferramentas Memory
    ```bash
    ./claude-flow sparc run memory-manager "organizar base de conhecimento"
    ```
    - **Ferramentas**: Memory, Read, Write, TodoWrite, TodoRead
    - **Uso**: Gestão de conhecimento e memória persistente

### 🚀 REGRAS DE USO DOS MODOS SPARC:

1. **SEMPRE use o modo apropriado** para a tarefa específica
2. **Combine modos** para tarefas complexas usando Task tool
3. **Use TodoWrite** ANTES de executar qualquer modo SPARC
4. **Armazene resultados** importantes no Memory
5. **Execute em lote** quando possível para eficiência máxima

### 💡 EXEMPLOS DE USO COMBINADO:
```bash
# Desenvolvimento completo de feature
./claude-flow sparc run architect "design sistema de pagamentos"
./claude-flow sparc run coder "implementar sistema de pagamentos"
./claude-flow sparc run tester "criar testes para pagamentos"
./claude-flow sparc run reviewer "revisar código de pagamentos"

# Pesquisa e implementação
./claude-flow sparc run researcher "pesquisar melhores práticas GraphQL"
./claude-flow sparc run architect "projetar API GraphQL"
./claude-flow sparc run coder "implementar resolvers GraphQL"
```

### Batchtools Commands (Optimized)
- `npx claude-flow sparc batch <modes> "<task>"`: Execute multiple SPARC modes in parallel
- `npx claude-flow sparc pipeline "<task>"`: Execute full SPARC pipeline with parallel processing
- `npx claude-flow sparc concurrent <mode> "<tasks-file>"`: Process multiple tasks concurrently

### Standard Build Commands
- `npm run build`: Build the project
- `npm run test`: Run the test suite
- `npm run lint`: Run linter and format checks
- `npm run typecheck`: Run TypeScript type checking

## SPARC Methodology Workflow (Batchtools Enhanced)

### 1. Specification Phase (Parallel Analysis)
```bash
# Create detailed specifications with concurrent requirements analysis
npx claude-flow sparc run spec-pseudocode "Define user authentication requirements" --parallel
```
**Batchtools Optimization**: Simultaneously analyze multiple requirement sources, validate constraints in parallel, and generate comprehensive specifications.

### 2. Pseudocode Phase (Concurrent Logic Design)
```bash
# Develop algorithmic logic with parallel pattern analysis
npx claude-flow sparc run spec-pseudocode "Create authentication flow pseudocode" --batch-optimize
```
**Batchtools Optimization**: Process multiple algorithm patterns concurrently, validate logic flows in parallel, and optimize data structures simultaneously.

### 3. Architecture Phase (Parallel Component Design)
```bash
# Design system architecture with concurrent component analysis
npx claude-flow sparc run architect "Design authentication service architecture" --parallel
```
**Batchtools Optimization**: Generate multiple architectural alternatives simultaneously, validate integration points in parallel, and create comprehensive documentation concurrently.

### 4. Refinement Phase (Parallel TDD Implementation)
```bash
# Execute Test-Driven Development with parallel test generation
npx claude-flow sparc tdd "implement user authentication system" --batch-tdd
```
**Batchtools Optimization**: Generate multiple test scenarios simultaneously, implement and validate code in parallel, and optimize performance concurrently.

### 5. Completion Phase (Concurrent Integration)
```bash
# Integration with parallel validation and documentation
npx claude-flow sparc run integration "integrate authentication with user management" --parallel
```
**Batchtools Optimization**: Run integration tests in parallel, generate documentation concurrently, and validate requirements simultaneously.

## Batchtools Integration Features

### Parallel Processing Capabilities
- **Concurrent File Operations**: Read, analyze, and modify multiple files simultaneously
- **Parallel Code Analysis**: Analyze dependencies, patterns, and architecture concurrently
- **Batch Test Generation**: Create comprehensive test suites in parallel
- **Concurrent Documentation**: Generate multiple documentation formats simultaneously

### Performance Optimizations
- **Smart Batching**: Group related operations for optimal performance
- **Pipeline Processing**: Chain dependent operations with parallel stages
- **Resource Management**: Efficient utilization of system resources
- **Error Resilience**: Robust error handling with parallel recovery

## Performance Benchmarks

### Batchtools Performance Improvements
- **File Operations**: Up to 300% faster with parallel processing
- **Code Analysis**: 250% improvement with concurrent pattern recognition
- **Test Generation**: 400% faster with parallel test creation
- **Documentation**: 200% improvement with concurrent content generation
- **Memory Operations**: 180% faster with batched read/write operations

## Code Style and Best Practices (Batchtools Enhanced)

### SPARC Development Principles with Batchtools
- **Modular Design**: Keep files under 500 lines, optimize with parallel analysis
- **Environment Safety**: Never hardcode secrets, validate with concurrent checks
- **Test-First**: Always write tests before implementation using parallel generation
- **Clean Architecture**: Separate concerns with concurrent validation
- **Parallel Documentation**: Maintain clear, up-to-date documentation with concurrent updates

### Batchtools Best Practices
- **Parallel Operations**: Use batchtools for independent tasks
- **Concurrent Validation**: Validate multiple aspects simultaneously
- **Batch Processing**: Group similar operations for efficiency
- **Pipeline Optimization**: Chain operations with parallel stages
- **Resource Management**: Monitor and optimize resource usage

## Important Notes (Enhanced)

- Always run tests before committing with parallel execution (`npm run test --parallel`)
- Use SPARC memory system with concurrent operations to maintain context across sessions
- Follow the Red-Green-Refactor cycle with parallel test generation during TDD phases
- Document architectural decisions with concurrent validation in memory
- Regular security reviews with parallel analysis for authentication or data handling code
- Claude Code slash commands provide quick access to batchtools-optimized SPARC modes
- Monitor system resources during parallel operations for optimal performance

For more information about SPARC methodology and batchtools optimization, see: 
- SPARC Guide: https://github.com/ruvnet/claude-code-flow/docs/sparc.md
- Batchtools Documentation: https://github.com/ruvnet/claude-code-flow/docs/batchtools.md

# important-instruction-reminders
Do what has been asked; nothing more, nothing less.
NEVER create files unless they're absolutely necessary for achieving your goal.
ALWAYS prefer editing an existing file to creating a new one.
NEVER proactively create documentation files (*.md) or README files. Only create documentation files if explicitly requested by the User.
