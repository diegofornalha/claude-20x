# Sub Agent Validation Checklist

## 🎯 Quick Validation Guide

Use this checklist to ensure your sub agent follows best practices.

## ✅ YAML Frontmatter Validation

```yaml
---
name: agent-name              # ✓ lowercase-with-hyphens
description: ...              # ✓ Includes "Use proactively..."
tools: Tool1, Tool2, Tool3    # ✓ Minimal set (3-5 tools max)
color: blue                   # ✓ Optional but recommended
priority: high                # ✓ Optional but helpful
---
```

### Common Issues to Avoid:
- ❌ `name: AgentName` (should be lowercase-with-hyphens)
- ❌ `tools: Read, Write, Edit, Bash, Grep, Glob, WebSearch, WebFetch` (too many)
- ❌ `description: "Handles various tasks"` (too vague, missing triggers)

## 📝 System Prompt Structure

### Required Sections:
- [ ] **Role Title** - Clear, specific role
- [ ] **Primary Responsibility** - One main focus
- [ ] **Responsabilidades Principais** - 3-5 key responsibilities
- [ ] **Especialidades Técnicas** - Domain expertise areas
- [ ] **Workflow Process** - Step-by-step execution
- [ ] **Quality Checklist** - Validation criteria
- [ ] **Success Criteria** - Measurable outcomes

### Optional but Recommended:
- [ ] **Example Usage** - Concrete examples
- [ ] **Priority Matrix** - For decision-making agents
- [ ] **Report Templates** - For analysis agents
- [ ] **Tool Commands** - Specific tool usage examples

## 🔧 Tool Selection Guidelines

### By Agent Type:

**Analysis/Review Agents:**
```yaml
tools: Read, Grep, Glob, TodoWrite
```

**Implementation Agents:**
```yaml
tools: Read, Write, Edit, Bash
```

**Testing Agents:**
```yaml
tools: Read, Write, Bash, TodoWrite
```

**Documentation Agents:**
```yaml
tools: Read, Write, WebFetch
```

**Research Agents:**
```yaml
tools: WebSearch, WebFetch, Read, Write
```

## 📊 Performance Checklist

- [ ] **Token Efficiency**: System prompt < 1000 tokens
- [ ] **Tool Minimalism**: Using only necessary tools
- [ ] **Clear Workflow**: Steps are specific and actionable
- [ ] **Measurable Output**: Success criteria are quantifiable
- [ ] **Error Handling**: Failure scenarios addressed

## 🎯 Integration Testing

### Test Scenarios:

1. **Standalone Execution**
   ```bash
   # Can the agent complete a task independently?
   Task("You are [agent-name]. [specific task]")
   ```

2. **Chain Execution**
   ```bash
   # Can the agent work with others?
   Task("You are agent-1. Produce output for agent-2...")
   Task("You are agent-2. Use agent-1's output to...")
   ```

3. **Error Recovery**
   ```bash
   # How does the agent handle missing inputs?
   # How does it respond to invalid data?
   ```

## 🚀 Optimization Tips

### 1. **Reduce Token Usage**
- Use concise language
- Avoid redundant instructions
- Focus on actionable items

### 2. **Improve Response Time**
- Minimize tool calls
- Batch operations when possible
- Use specific file patterns

### 3. **Enhance Quality**
- Include validation steps
- Define clear success metrics
- Provide concrete examples

## 📋 Final Validation

Before deploying your sub agent:

1. **Syntax Check**
   ```bash
   # Validate YAML frontmatter
   yamllint .claude/agents/your-agent.md
   ```

2. **Tool Access**
   ```bash
   # Verify all specified tools are available
   ```

3. **Workflow Test**
   ```bash
   # Execute typical use case
   ```

4. **Integration Test**
   ```bash
   # Test with other agents in workflow
   ```

5. **Performance Test**
   ```bash
   # Measure execution time and token usage
   ```

## 🎯 Red Flags to Avoid

- 🚫 Vague descriptions without trigger phrases
- 🚫 More than 5-6 tools in the tool list
- 🚫 System prompts over 1500 tokens
- 🚫 Missing workflow steps
- 🚫 No success criteria defined
- 🚫 No concrete examples provided
- 🚫 Overlapping responsibilities with other agents

## ✅ Green Flags of Quality

- ✅ Clear, single responsibility
- ✅ Minimal necessary tools
- ✅ Step-by-step workflow
- ✅ Measurable success criteria
- ✅ Concrete usage examples
- ✅ Proactive trigger phrases
- ✅ Integration considerations