# Tool Selection Matrix for Sub Agents

## 🎯 Tool Selection by Agent Type

### 📊 Quick Reference Matrix

| Agent Type | Primary Tools | Optional Tools | Avoid |
|------------|--------------|----------------|-------|
| **Code Implementation** | Read, Write, Edit, Bash | Grep, MultiEdit | WebSearch, WebFetch |
| **Code Review** | Read, Grep, Glob, TodoWrite | - | Write, Edit, Bash |
| **Testing** | Read, Write, Bash, TodoWrite | Edit | WebSearch, WebFetch |
| **Documentation** | Read, Write, WebFetch | Grep, Glob | Bash, Edit |
| **Research** | WebSearch, WebFetch, Read, Write | - | Bash, Edit |
| **Architecture** | Read, Write, Glob, TodoWrite | Grep | Bash, Edit |
| **Analysis** | Read, Grep, Glob, TodoWrite | Write | Edit, Bash |
| **Integration** | Read, Write, Edit, Bash | Grep, Glob | WebSearch |
| **Deployment** | Bash, Read, Write, TodoWrite | Edit | WebSearch, WebFetch |
| **Monitoring** | Read, Bash, TodoWrite | Write | Edit, WebSearch |

## 🔍 Detailed Tool Descriptions

### Core Tools

#### **Read** 📖
- **Purpose**: Read file contents, images, PDFs
- **Use Cases**: Code analysis, documentation review, configuration inspection
- **Best For**: All agents that need to understand existing code/content

#### **Write** ✍️
- **Purpose**: Create new files
- **Use Cases**: Generate code, create reports, save results
- **Best For**: Implementation, documentation, and output-generating agents

#### **Edit** ✏️
- **Purpose**: Modify existing files with precise replacements
- **Use Cases**: Code refactoring, bug fixes, configuration updates
- **Best For**: Implementation and maintenance agents

#### **Bash** 🖥️
- **Purpose**: Execute shell commands
- **Use Cases**: Run tests, install dependencies, build projects
- **Best For**: Testing, deployment, and system integration agents

#### **Grep** 🔍
- **Purpose**: Search for patterns in files
- **Use Cases**: Find code patterns, analyze usage, locate issues
- **Best For**: Analysis and review agents

#### **Glob** 📁
- **Purpose**: Find files by pattern
- **Use Cases**: Discover project structure, locate specific file types
- **Best For**: Architecture and analysis agents

#### **TodoWrite** ✅
- **Purpose**: Manage task lists
- **Use Cases**: Track progress, coordinate work, plan tasks
- **Best For**: Coordination and management agents

#### **WebSearch** 🌐
- **Purpose**: Search the internet
- **Use Cases**: Research solutions, find documentation, explore APIs
- **Best For**: Research and learning agents

#### **WebFetch** 🌍
- **Purpose**: Fetch web content
- **Use Cases**: Download documentation, retrieve API specs
- **Best For**: Documentation and integration agents

## 📋 Tool Selection Guidelines

### 1. **Minimize Tool Count**
```yaml
# ✅ GOOD: Focused tool set
tools: Read, Write, Edit

# ❌ BAD: Kitchen sink approach
tools: Read, Write, Edit, Bash, Grep, Glob, WebSearch, WebFetch, TodoWrite
```

### 2. **Match Tools to Purpose**
```yaml
# ✅ GOOD: Review agent with search tools
name: code-reviewer
tools: Read, Grep, Glob

# ❌ BAD: Review agent with modification tools
name: code-reviewer
tools: Write, Edit, Bash
```

### 3. **Consider Dependencies**
```yaml
# If agent needs to:
# - Modify files → Include Edit
# - Create files → Include Write
# - Search patterns → Include Grep
# - Run commands → Include Bash
# - Find files → Include Glob
```

## 🎯 Common Tool Combinations

### **Implementation Pattern**
```yaml
tools: Read, Write, Edit, Bash
# Read existing code, write new files, edit existing ones, run tests
```

### **Analysis Pattern**
```yaml
tools: Read, Grep, Glob, TodoWrite
# Read files, search patterns, find files, track findings
```

### **Testing Pattern**
```yaml
tools: Read, Write, Bash, TodoWrite
# Read specs, write tests, execute tests, track results
```

### **Documentation Pattern**
```yaml
tools: Read, Write, WebFetch
# Read code, write docs, fetch external references
```

### **Research Pattern**
```yaml
tools: WebSearch, WebFetch, Read, Write
# Search solutions, fetch details, read existing, document findings
```

## 🚨 Anti-Patterns to Avoid

### 1. **Tool Overload**
```yaml
# ❌ WRONG: Agent has too many tools
tools: Read, Write, Edit, Bash, Grep, Glob, WebSearch, WebFetch, TodoWrite, MultiEdit
# This makes the agent unfocused and slow
```

### 2. **Mismatched Tools**
```yaml
# ❌ WRONG: Analysis agent with modification tools
name: security-analyzer
tools: Write, Edit, Bash
# Analyzers should not modify code
```

### 3. **Missing Essential Tools**
```yaml
# ❌ WRONG: Implementation agent without Edit
name: bug-fixer
tools: Read, Write
# Can't fix bugs without Edit tool
```

## 📊 Decision Tree

```
What does your agent do?
├── Analyzes/Reviews Code?
│   └── Tools: Read, Grep, Glob, TodoWrite
├── Implements/Modifies Code?
│   └── Tools: Read, Write, Edit, Bash
├── Tests/Validates?
│   └── Tools: Read, Write, Bash, TodoWrite
├── Documents/Explains?
│   └── Tools: Read, Write, WebFetch
├── Researches/Learns?
│   └── Tools: WebSearch, WebFetch, Read, Write
└── Coordinates/Manages?
    └── Tools: Read, TodoWrite, Write
```

## 🎯 Performance Considerations

### Tool Performance Impact

| Tool | Performance Impact | Memory Usage | Best Practices |
|------|-------------------|--------------|----------------|
| Read | Low | Variable | Use limit parameter for large files |
| Write | Low | Low | Batch writes when possible |
| Edit | Medium | Low | Use replace_all for multiple changes |
| Bash | High | Variable | Avoid long-running commands |
| Grep | Medium | Low | Use specific file patterns |
| Glob | Low | Low | Use specific patterns |
| TodoWrite | Low | Low | Batch all todos in one call |
| WebSearch | High | Low | Cache results when possible |
| WebFetch | High | Variable | Limit content size |

## 💡 Expert Tips

1. **Start Minimal**: Begin with 2-3 tools, add only if necessary
2. **Consider Workflow**: Tools should support the agent's workflow steps
3. **Avoid Redundancy**: Don't include tools with overlapping functionality
4. **Think Integration**: Consider what tools other agents in the chain use
5. **Performance First**: Fewer tools = faster execution
6. **Validate Necessity**: For each tool, ask "Is this absolutely required?"