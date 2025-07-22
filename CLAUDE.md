# Claude Code Configuration - SPARC Alpha v2.0.0 Environment (Hive Mind + 87 MCP Tools)

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
This project uses the SPARC Alpha v2.0.0 methodology with Hive Mind System for revolutionary AI-powered development orchestration with 87 MCP tools integration.

**🐝 Hive Mind System Enabled**: Queen-led coordination with worker specialization, collective memory, consensus building, and auto-scaling capabilities.

**⚡ 87 MCP Tools Integrated**: Complete ruv-swarm integration with neural networking and production-ready infrastructure.

## 🐝 Hive Mind Commands (NEW!)

### Quick Start with Hive Mind
- `claude-flow hive-mind wizard`: Interactive setup wizard (RECOMMENDED)
- `claude-flow hive-mind spawn "<objective>"`: Create intelligent swarm for any task
- `claude-flow hive-mind status`: View active swarms and performance metrics
- `claude-flow hive-mind metrics`: Advanced performance analytics

### Advanced Hive Mind Operations
- `claude-flow hive-mind init`: Initialize system with SQLite
- `claude-flow hive-mind sessions`: List all hive mind sessions
- `claude-flow hive-mind resume <session-id>`: Resume paused session
- `claude-flow hive-mind consensus`: View consensus decisions
- `claude-flow hive-mind memory`: Manage collective memory

## SPARC Alpha Commands (16 Modes Available)

### Core SPARC Alpha Modes
- `claude-flow sparc modes`: List all 16 available SPARC development modes
- `claude-flow sparc architect "<task>"`: 🏗️ System architecture design
- `claude-flow sparc code "<task>"`: 🧠 Auto-Coder with AI assistance
- `claude-flow sparc tdd "<task>"`: 🧪 Test-Driven Development
- `claude-flow sparc debug "<task>"`: 🪲 Advanced debugging assistance
- `claude-flow sparc security-review "<task>"`: 🛡️ Security analysis and review
- `claude-flow sparc docs-writer "<task>"`: 📚 Documentation generation
- `claude-flow sparc integration "<task>"`: 🔗 System integration
- `claude-flow sparc devops "<task>"`: 🚀 DevOps automation

### Specialized SPARC Alpha Modes
- `claude-flow sparc refinement-optimization-mode "<task>"`: 🧹 Code optimization
- `claude-flow sparc post-deployment-monitoring-mode "<task>"`: 📈 Deployment monitoring
- `claude-flow sparc spec-pseudocode "<task>"`: 📋 Specification writing
- `claude-flow sparc supabase-admin "<task>"`: 🔐 Supabase administration
- `claude-flow sparc mcp "<task>"`: ♾️ MCP Integration
- `claude-flow sparc sparc "<task>"`: ⚡️ SPARC Orchestrator
- `claude-flow sparc tutorial`: 📘 SPARC Tutorial
- `claude-flow sparc ask "<question>"`: ❓ Ask mode for queries

### Core System Commands
- `claude-flow start --ui --swarm`: Start with swarm intelligence UI
- `claude-flow swarm "<objective>"`: Deploy multi-agent workflow
- `claude-flow status`: System status and health
- `claude-flow memory <action>`: Persistent memory operations
- `claude-flow mcp <action>`: Manage 87 MCP tools

### Standard Build Commands
- `npm run build`: Build the project
- `npm run test`: Run the test suite
- `npm run lint`: Run linter and format checks
- `npm run typecheck`: Run TypeScript type checking

## SPARC Alpha Methodology Workflow (Hive Mind Enhanced)

### 🐝 Hive Mind Orchestrated Development
```bash
# Start with Hive Mind wizard for complex projects
claude-flow hive-mind wizard

# Spawn intelligent swarm for full-stack development
claude-flow hive-mind spawn "Build complete authentication system" --claude --auto-spawn
```
**Hive Mind Optimization**: Queen-led coordination with specialized workers, collective memory sharing, and consensus-driven decisions.

### 1. Specification Phase (AI-Driven Analysis)
```bash
# Create detailed specifications with AI assistance
claude-flow sparc spec-pseudocode "Define user authentication requirements"

# Use specialized modes for complex requirements
claude-flow sparc ask "What are best practices for OAuth 2.0 implementation?"
```
**Alpha Enhancement**: Advanced AI reasoning, pattern recognition, and security-first design principles.

### 2. Architecture Phase (Intelligent Design)
```bash
# Design system architecture with AI insights
claude-flow sparc architect "Design microservices authentication architecture"

# DevOps integration from the start
claude-flow sparc devops "Plan authentication service deployment strategy"
```
**Alpha Enhancement**: Neural network-powered architecture analysis, auto-scaling design, and deployment optimization.

### 3. Development Phase (AI-Assisted Coding)
```bash
# AI-powered code generation
claude-flow sparc code "implement JWT authentication service"

# Parallel TDD with intelligent test generation
claude-flow sparc tdd "user authentication with JWT and refresh tokens"
```
**Alpha Enhancement**: Context-aware code generation, intelligent test scenarios, and continuous security validation.

### 4. Quality Assurance (Comprehensive Analysis)
```bash
# Automated security review
claude-flow sparc security-review "authentication service security analysis"

# Advanced debugging assistance
claude-flow sparc debug "investigate authentication token validation issues"
```
**Alpha Enhancement**: ML-powered vulnerability detection, intelligent debugging suggestions, and performance optimization.

### 5. Integration & Deployment (Orchestrated Completion)
```bash
# System integration with monitoring
claude-flow sparc integration "integrate authentication with user management and monitoring"

# Post-deployment monitoring setup
claude-flow sparc post-deployment-monitoring-mode "authentication service monitoring"
```
**Alpha Enhancement**: Automated integration testing, real-time performance monitoring, and self-healing deployment strategies.

## Hive Mind Alpha Integration Features

### 🐝 Queen-Led Coordination
- **Intelligent Task Distribution**: Auto-assign tasks based on agent capabilities
- **Collective Memory**: Shared knowledge base across all agents
- **Consensus Building**: Democratic decision making for critical choices
- **Auto-Scaling**: Dynamic agent spawning based on workload

### ⚡ 87 MCP Tools Integration
- **Neural Networks**: Advanced AI pattern recognition and learning
- **Swarm Intelligence**: Coordinated multi-agent problem solving
- **Real-time Monitoring**: Live performance metrics and health monitoring
- **Fault Tolerance**: Self-healing systems with automatic recovery

### 🚀 Performance Optimizations
- **Parallel Processing**: Concurrent execution across specialized agents
- **Memory Persistence**: Cross-session knowledge retention
- **Pipeline Optimization**: Intelligent workflow orchestration
- **Resource Management**: Efficient utilization with auto-scaling

## Performance Benchmarks

### SPARC Alpha v2.0.0 Performance Improvements
- **Hive Mind Coordination**: Up to 500% faster task completion with intelligent agent distribution
- **Neural AI Processing**: 400% improvement in code analysis and pattern recognition
- **Swarm Development**: 350% faster with parallel agent specialization
- **MCP Tools Integration**: 300% improvement in development workflow efficiency
- **Collective Memory**: 250% faster knowledge retrieval and context switching
- **Auto-Scaling**: 200% improvement in resource utilization efficiency

## Code Style and Best Practices (SPARC Alpha Enhanced)

### SPARC Alpha Development Principles
- **AI-First Design**: Leverage neural networks for architecture decisions
- **Hive Mind Coordination**: Use collective intelligence for complex problems
- **Security-First**: Always run security-review mode for sensitive code
- **Test-Driven AI**: Combine TDD with AI-powered test generation
- **Continuous Integration**: Use DevOps mode for deployment strategies

### Hive Mind Best Practices
- **Queen Coordination**: Start complex projects with hive-mind wizard
- **Agent Specialization**: Use appropriate SPARC modes for specific tasks
- **Collective Memory**: Share knowledge across development sessions
- **Consensus Decisions**: Use hive mind for architectural choices
- **Auto-Scaling**: Let the system manage resource allocation dynamically

## Important Notes (SPARC Alpha v2.0.0)

- **Hive Mind First**: Start complex projects with `claude-flow hive-mind wizard` for optimal coordination
- **Security Integration**: Always use `claude-flow sparc security-review` for sensitive code
- **AI-Powered Testing**: Leverage `claude-flow sparc tdd` with intelligent test generation
- **Collective Memory**: Use `claude-flow hive-mind memory` to maintain context across sessions
- **Real-time Monitoring**: Enable monitoring with `claude-flow sparc post-deployment-monitoring-mode`
- **Neural Optimization**: Use 87 MCP tools for advanced AI-powered development
- **Auto-Scaling**: Let Hive Mind system manage resource allocation dynamically

### 🚀 Quick Start Recommendations
1. **Initialize**: `claude-flow hive-mind init` (one-time setup)
2. **Start Projects**: `claude-flow hive-mind wizard` (interactive guidance)
3. **Complex Tasks**: `claude-flow hive-mind spawn "<objective>"` (intelligent swarm)
4. **Development**: Use appropriate `claude-flow sparc <mode>` for specific tasks
5. **Monitor**: `claude-flow hive-mind status` for performance tracking

For more information about SPARC Alpha and Hive Mind system:
- 🐝 Hive Mind Guide: https://github.com/ruvnet/claude-flow/tree/main/docs/hive-mind
- 🐝 ruv-swarm: https://github.com/ruvnet/ruv-FANN/tree/main/ruv-swarm
- 📚 Documentation: https://github.com/ruvnet/claude-flow

# important-instruction-reminders
Do what has been asked; nothing more, nothing less.
NEVER create files unless they're absolutely necessary for achieving your goal.
ALWAYS prefer editing an existing file to creating a new one.
NEVER proactively create documentation files (*.md) or README files. Only create documentation files if explicitly requested by the User.
