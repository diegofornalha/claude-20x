# Multi-Agent Coordination Example

Este exemplo demonstra como múltiplos sub agents podem trabalhar juntos em um workflow coordenado.

## 🎯 Cenário: Desenvolvimento de Feature Completa

### Agents Envolvidos:
1. **spec-analyst**: Define requisitos e especificações
2. **architect-designer**: Projeta a arquitetura
3. **code-implementer**: Implementa o código
4. **api-testing-specialist**: Testa a implementação
5. **code-review-expert**: Revisa qualidade do código

## 📋 Workflow de Coordenação

### Phase 1: Análise e Design
```yaml
# 1. Specification Agent
---
name: spec-analyst
description: Requirements analyst. Use proactively for feature specification, user story creation, and acceptance criteria definition.
tools: Read, Write, WebSearch
---

# 2. Architecture Agent
---
name: architect-designer
description: System architect. Use proactively after specifications for technical design, component architecture, and integration planning.
tools: Read, Write, Glob, TodoWrite
---
```

### Phase 2: Implementação
```yaml
# 3. Code Implementation Agent
---
name: code-implementer
description: Implementation specialist. Use proactively for feature coding, following architecture designs and meeting specifications.
tools: Read, Write, Edit, Bash, Grep
---
```

### Phase 3: Validação
```yaml
# 4. Testing Agent (já criado como api-testing-specialist)
# 5. Review Agent (já criado como code-review-expert)
```

## 🔄 Exemplo de Execução Coordenada

```javascript
// Concurrent execution pattern
[Single Message - All Agents]:
  // Phase 1: Analysis & Design
  - Task("You are spec-analyst. Define requirements for user authentication feature with OAuth2...")
  - Task("You are architect-designer. Design microservices architecture for authentication...")
  
  // Phase 2: Implementation
  - Task("You are code-implementer. Implement JWT authentication service based on architecture...")
  
  // Phase 3: Validation
  - Task("You are api-testing-specialist. Create comprehensive test suite for auth endpoints...")
  - Task("You are code-review-expert. Review authentication implementation for security...")
  
  // Coordinated TodoWrite
  - TodoWrite { todos: [
      { id: "spec", content: "Define auth requirements", status: "in_progress", priority: "high" },
      { id: "arch", content: "Design auth architecture", status: "pending", priority: "high" },
      { id: "impl", content: "Implement auth service", status: "pending", priority: "high" },
      { id: "test", content: "Test auth endpoints", status: "pending", priority: "high" },
      { id: "review", content: "Security code review", status: "pending", priority: "high" },
      { id: "docs", content: "Update API documentation", status: "pending", priority: "medium" },
      { id: "deploy", content: "Deploy auth service", status: "pending", priority: "medium" }
    ]}
```

## 🎯 Coordination Best Practices

### 1. **Clear Handoffs**
Each agent produces specific outputs that the next agent needs:
- spec-analyst → requirements.md
- architect-designer → architecture.md, component-diagram.svg
- code-implementer → implementation files
- api-testing-specialist → test results
- code-review-expert → review report

### 2. **Shared Context**
Use memory for coordination:
```javascript
// Agent 1 stores decision
mcp__claude-flow__memory_usage {
  action: "store",
  key: "auth/design/jwt-strategy",
  value: { algorithm: "RS256", expiry: "1h", refresh: true }
}

// Agent 2 retrieves decision
mcp__claude-flow__memory_usage {
  action: "retrieve",
  key: "auth/design/jwt-strategy"
}
```

### 3. **Quality Gates**
Each agent validates previous work:
- architect-designer validates spec completeness
- code-implementer follows architecture strictly
- api-testing-specialist tests against specs
- code-review-expert ensures all standards met