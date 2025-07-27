---
name: agent-coordination-protocol
description: Coordination protocol for A2A agents using Claude Flow hooks. Use proactively for inter-agent communication, state management, and workflow orchestration. Must be used when coordinating multiple agents in SPARC workflows.
tools: Read, Write, Bash, TodoWrite
color: green
priority: high
---

# Agent Coordination Protocol

This document defines the coordination protocol for A2A agents within the Claude Flow ecosystem, ensuring seamless communication and state management across the agent hierarchy.

## 🎯 Coordination Architecture

### Agent Communication Flow

```
Master Coordinator (Claude Flow)
    ↓ (spawn & coordinate)
Lead Agent (a2a-client)
    ↓ (delegate tasks)
Specialized Agents (8 A2A agents)
    ↓ (report status)
Memory Database (.swarm/memory.db)
```

### Required Hook Integration

All A2A agents MUST implement these coordination hooks:

#### Pre-Task Hooks
```bash
# Before starting any task
npx claude-flow@alpha hooks pre-task \
  --description "Agent ${AGENT_NAME} starting ${TASK_DESCRIPTION}" \
  --auto-spawn-agents false \
  --load-context true
```

#### During Task Hooks
```bash
# After each significant operation
npx claude-flow@alpha hooks post-edit \
  --file "${MODIFIED_FILE}" \
  --memory-key "a2a/${AGENT_NAME}/${OPERATION}" \
  --format true

# Progress notification
npx claude-flow@alpha hooks notification \
  --message "Agent ${AGENT_NAME}: ${PROGRESS_UPDATE}" \
  --telemetry true
```

#### Post-Task Hooks
```bash
# After task completion
npx claude-flow@alpha hooks post-task \
  --task-id "${TASK_ID}" \
  --analyze-performance true \
  --store-results true
```

## 🔄 State Management Protocol

### Memory Key Structure
```
a2a/
├── coordination/
│   ├── active_agents
│   ├── task_distribution
│   └── performance_metrics
├── agents/
│   ├── ${agent_name}/
│   │   ├── status
│   │   ├── current_task
│   │   └── progress
└── tasks/
    ├── ${task_id}/
    │   ├── assignments
    │   ├── dependencies
    │   └── results
```

### Agent Status Protocol
```python
# Agent status structure
agent_status = {
    "agent_id": "a2a-message-handler",
    "status": "active|idle|busy|error",
    "current_task": "task_uuid",
    "progress": 0.75,  # 0.0 to 1.0
    "capabilities": ["message_parsing", "validation"],
    "last_update": "2025-01-15T10:30:00Z",
    "performance_metrics": {
        "tasks_completed": 42,
        "avg_response_time": 150,  # milliseconds
        "success_rate": 0.98
    }
}
```

## 📊 Performance Monitoring

### Metrics Collection
Each agent must track and report:

```python
metrics = {
    "execution_time": float,      # seconds
    "memory_usage": int,          # bytes
    "cpu_utilization": float,     # percentage
    "success_rate": float,        # 0.0 to 1.0
    "error_count": int,
    "throughput": float           # operations per second
}
```

### Reporting Protocol
```bash
# Report metrics after task completion
npx claude-flow@alpha hooks post-task \
  --task-id "${TASK_ID}" \
  --metrics-data '${JSON_METRICS}' \
  --analyze-performance true
```

## 🎯 SPARC Phase Coordination

### Phase Transitions
```python
sparc_phases = {
    "specification": {
        "lead_agents": ["a2a-agent-card-manager"],
        "supporting_agents": ["a2a-message-handler"],
        "deliverables": ["requirements.md", "agent_cards.json"]
    },
    "pseudocode": {
        "lead_agents": ["a2a-task-manager"],
        "supporting_agents": ["a2a-message-handler"],
        "deliverables": ["algorithms.py", "workflow.md"]
    },
    "architecture": {
        "lead_agents": ["a2a-server"],
        "supporting_agents": ["a2a-task-manager"],
        "deliverables": ["system_design.md", "api_spec.json"]
    },
    "refinement": {
        "lead_agents": ["a2a-streaming-handler"],
        "supporting_agents": ["a2a-part-artifact-handler"],
        "deliverables": ["implementation/", "tests/"]
    },
    "completion": {
        "lead_agents": ["a2a-push-notification-handler"],
        "supporting_agents": ["a2a-client"],
        "deliverables": ["deployment/", "documentation/"]
    }
}
```

### Phase Handoff Protocol
```bash
# Complete current phase
npx claude-flow@alpha hooks post-task \
  --task-id "sparc_${PHASE}" \
  --phase-complete true \
  --deliverables '${PHASE_OUTPUTS}'

# Initialize next phase
npx claude-flow@alpha hooks pre-task \
  --description "SPARC ${NEXT_PHASE} phase" \
  --dependencies '${PHASE_DEPENDENCIES}' \
  --load-context true
```

## 🔧 Error Handling & Recovery

### Error Classification
```python
error_types = {
    "coordination_error": "Agent communication failure",
    "task_error": "Task execution failure", 
    "resource_error": "Insufficient resources",
    "timeout_error": "Task timeout exceeded",
    "dependency_error": "Missing dependencies"
}
```

### Recovery Protocol
```bash
# Report error
npx claude-flow@alpha hooks notification \
  --message "ERROR: ${ERROR_TYPE} in agent ${AGENT_NAME}" \
  --severity "high" \
  --telemetry true

# Attempt recovery
npx claude-flow@alpha hooks pre-task \
  --description "Recovery attempt for ${FAILED_TASK}" \
  --retry-count ${RETRY_NUMBER} \
  --load-context true
```

## 🛡️ Security & Compliance

### Authentication Requirements
- All inter-agent communication must use OAuth2/JWT tokens
- Agents must validate caller identity before processing requests
- Sensitive data must be encrypted in memory storage

### Audit Trail
```bash
# Log all agent interactions
npx claude-flow@alpha hooks notification \
  --message "Agent interaction: ${AGENT_A} → ${AGENT_B}" \
  --audit-log true \
  --telemetry true
```

## 🎯 Integration Checklist

For each A2A agent, ensure:

- ✅ **YAML Frontmatter**: Standardized with proper tools and description
- ✅ **Hook Integration**: Pre-task, post-edit, and post-task hooks implemented
- ✅ **Memory Protocol**: Consistent memory key structure
- ✅ **Performance Metrics**: Tracking and reporting implemented
- ✅ **Error Handling**: Proper error classification and recovery
- ✅ **Security Compliance**: Authentication and audit logging
- ✅ **SPARC Mapping**: Clear phase responsibilities defined
- ✅ **Coordination Tests**: Integration tests with other agents

## 📋 Usage Examples

### Basic Agent Coordination
```bash
# Coordinate task between message handler and task manager
npx claude-flow@alpha hooks pre-task \
  --description "Process multimodal message for task creation" \
  --agents "a2a-message-handler,a2a-task-manager" \
  --coordination-mode "sequential"
```

### SPARC Phase Execution
```bash
# Execute specification phase with multiple agents
npx claude-flow@alpha hooks pre-task \
  --description "SPARC Specification Phase" \
  --agents "a2a-agent-card-manager,a2a-message-handler" \
  --coordination-mode "parallel" \
  --phase "specification"
```

This coordination protocol ensures all A2A agents work together effectively within the Claude Flow ecosystem while maintaining performance, security, and reliability standards.