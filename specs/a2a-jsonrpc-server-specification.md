# SPARC Specification: JSON-RPC 2.0 Server for A2A Protocol Compliance

## Overview
Especificação completa do servidor JSON-RPC 2.0 para conformidade com protocolo A2A v0.2.9, integrando SPARC methodology e Batchtools optimization com suporte a streaming SSE.

## Protocol Requirements

### A2A Protocol Compliance
- **Version**: A2A Protocol v0.2.9
- **Transport**: JSON-RPC 2.0 over HTTP(S)
- **Content-Type**: `application/json` for JSON-RPC, `text/event-stream` for SSE
- **Streaming**: Server-Sent Events (SSE) support required
- **Push Notifications**: Webhook-based notifications
- **State Management**: Task lifecycle tracking

### JSON-RPC 2.0 Standard
```json
{
  "jsonrpc": "2.0",
  "method": "message/send",
  "params": { /* method parameters */ },
  "id": "unique-request-id"
}
```

## Required Endpoints

### 1. Agent Card Discovery
```http
GET /.well-known/agent.json
Content-Type: application/json
```
**Purpose**: Serve agent card for discovery
**Response**: AgentCard JSON structure

### 2. Message Operations

#### message/send (Synchronous)
```json
{
  "jsonrpc": "2.0",
  "method": "message/send", 
  "params": {
    "message": {
      "role": "user",
      "parts": [
        {
          "kind": "text",
          "text": "Execute SPARC specification phase for user authentication system"
        }
      ],
      "messageId": "msg-001"
    },
    "configuration": {
      "sparcPhase": "specification",
      "batchtoolsOptimized": true,
      "parallelProcessing": true
    },
    "metadata": {
      "workflowId": "sparc-workflow-001",
      "priority": "high"
    }
  },
  "id": "req-001"
}
```

**Response Options**:
- **Message Response** (quick replies):
```json
{
  "jsonrpc": "2.0",
  "id": "req-001",
  "result": {
    "messageId": "msg-002",
    "contextId": "ctx-001",
    "parts": [
      {
        "kind": "text",
        "text": "SPARC specification analysis completed. Requirements identified..."
      }
    ],
    "kind": "message",
    "metadata": {
      "sparcPhase": "specification",
      "processingTime": 450,
      "resourcesUsed": ["parallel_analysis", "constraint_validation"]
    }
  }
}
```

- **Task Response** (long-running operations):
```json
{
  "jsonrpc": "2.0", 
  "id": "req-001",
  "result": {
    "id": "task-001",
    "contextId": "ctx-001",
    "status": {
      "state": "submitted",
      "message": {
        "role": "agent",
        "parts": [
          {
            "kind": "text",
            "text": "SPARC specification task initiated with parallel processing"
          }
        ],
        "messageId": "msg-002",
        "taskId": "task-001"
      },
      "timestamp": "2024-01-15T10:30:00Z"
    },
    "history": [/* message history */],
    "kind": "task",
    "metadata": {
      "sparcPhase": "specification",
      "estimatedDuration": 300000,
      "batchProcessing": true
    }
  }
}
```

#### message/stream (Streaming)
```json
{
  "jsonrpc": "2.0",
  "method": "message/stream",
  "params": {
    "message": {
      "role": "user", 
      "parts": [
        {
          "kind": "text",
          "text": "Implement SPARC refinement phase with TDD for authentication module"
        }
      ],
      "messageId": "msg-003"
    },
    "configuration": {
      "sparcPhase": "refinement",
      "tddEnabled": true,
      "streamingUpdates": true
    }
  },
  "id": "req-002"
}
```

**SSE Response Stream**:
```
Content-Type: text/event-stream
Cache-Control: no-cache
Connection: keep-alive

event: task-status-update
data: {
  "jsonrpc": "2.0",
  "id": "req-002", 
  "result": {
    "id": "task-002",
    "contextId": "ctx-002",
    "status": {
      "state": "working",
      "message": {
        "role": "agent",
        "parts": [
          {
            "kind": "text", 
            "text": "Initiating TDD cycle: Red phase - writing failing tests"
          }
        ]
      },
      "timestamp": "2024-01-15T10:31:00Z"
    },
    "kind": "task"
  }
}

event: artifact-update
data: {
  "jsonrpc": "2.0",
  "id": "req-002",
  "result": {
    "taskId": "task-002",
    "contextId": "ctx-002", 
    "artifact": {
      "artifactId": "test-001",
      "name": "authentication_tests.ts",
      "parts": [
        {
          "kind": "text",
          "text": "describe('Authentication Module', () => {\n  it('should validate user credentials', () => {\n    // Test implementation...\n  });\n});"
        }
      ]
    },
    "append": false,
    "lastChunk": false,
    "kind": "artifact-update"
  }
}

event: status-update 
data: {
  "jsonrpc": "2.0",
  "id": "req-002",
  "result": {
    "taskId": "task-002",
    "status": {
      "state": "completed",
      "timestamp": "2024-01-15T10:35:00Z"
    },
    "final": true,
    "kind": "status-update"
  }
}
```

### 3. Task Management

#### tasks/get
```json
{
  "jsonrpc": "2.0",
  "method": "tasks/get",
  "params": {
    "taskId": "task-001"
  },
  "id": "req-003"
}
```

**Response**:
```json
{
  "jsonrpc": "2.0",
  "id": "req-003",
  "result": {
    "id": "task-001",
    "contextId": "ctx-001", 
    "status": {
      "state": "completed",
      "timestamp": "2024-01-15T10:32:00Z"
    },
    "artifacts": [
      {
        "artifactId": "spec-001",
        "name": "authentication_specification.md",
        "parts": [
          {
            "kind": "text",
            "text": "# Authentication System Specification\n\n## Requirements\n..."
          }
        ]
      }
    ],
    "history": [/* complete message history */],
    "kind": "task",
    "metadata": {
      "sparcPhase": "specification",
      "completionTime": 120000,
      "resourcesUsed": ["parallel_analysis", "requirement_synthesis"]
    }
  }
}
```

#### tasks/cancel
```json
{
  "jsonrpc": "2.0",
  "method": "tasks/cancel", 
  "params": {
    "taskId": "task-001"
  },
  "id": "req-004"
}
```

#### tasks/list
```json
{
  "jsonrpc": "2.0",
  "method": "tasks/list",
  "params": {
    "limit": 10,
    "status": "working"
  },
  "id": "req-005"
}
```

### 4. Push Notification Configuration

#### tasks/pushNotificationConfig/set
```json
{
  "jsonrpc": "2.0",
  "method": "tasks/pushNotificationConfig/set",
  "params": {
    "taskId": "task-001",
    "config": {
      "url": "https://client.example.com/webhook/a2a-notifications",
      "token": "secure-client-token",
      "authentication": {
        "schemes": ["Bearer"]
      }
    }
  },
  "id": "req-006"
}
```

#### tasks/pushNotificationConfig/get
```json
{
  "jsonrpc": "2.0",
  "method": "tasks/pushNotificationConfig/get", 
  "params": {
    "taskId": "task-001"
  },
  "id": "req-007"
}
```

### 5. Subscription Management (SSE)

#### tasks/resubscribe
```json
{
  "jsonrpc": "2.0",
  "method": "tasks/resubscribe",
  "params": {
    "taskId": "task-001"
  },
  "id": "req-008"
}
```

## SPARC-Specific Extensions

### SPARC Phase Management
```json
{
  "jsonrpc": "2.0",
  "method": "sparc/phase/set",
  "params": {
    "workflowId": "sparc-workflow-001",
    "phase": "refinement",
    "agentTypes": ["coder", "analyst"],
    "configuration": {
      "tddEnabled": true,
      "parallelProcessing": true,
      "batchtoolsOptimized": true
    }
  },
  "id": "req-009"
}
```

### Batchtools Operations
```json
{
  "jsonrpc": "2.0",
  "method": "batchtools/execute",
  "params": {
    "operation": "parallel_analysis",
    "tasks": ["task-001", "task-002", "task-003"],
    "configuration": {
      "maxConcurrent": 5,
      "batchSize": 10,
      "optimization": "performance"
    }
  },
  "id": "req-010"
}
```

### Memory Integration
```json
{
  "jsonrpc": "2.0",
  "method": "memory/store",
  "params": {
    "namespace": "sparc",
    "key": "workflow-001-specification",
    "data": {
      "requirements": ["auth", "validation", "security"],
      "constraints": ["performance", "scalability"],
      "phase": "specification"
    },
    "ttl": 3600
  },
  "id": "req-011"
}
```

## Error Handling

### Standard JSON-RPC Errors
```json
{
  "jsonrpc": "2.0",
  "id": "req-001",
  "error": {
    "code": -32600,
    "message": "Invalid Request",
    "data": {
      "details": "Missing required 'message' parameter",
      "requestId": "req-001"
    }
  }
}
```

### A2A-Specific Errors
```json
{
  "jsonrpc": "2.0", 
  "id": "req-001",
  "error": {
    "code": -32001,
    "message": "TaskNotFoundError",
    "data": {
      "taskId": "task-999",
      "details": "Task not found or expired"
    }
  }
}
```

### SPARC-Specific Errors
```json
{
  "jsonrpc": "2.0",
  "id": "req-001", 
  "error": {
    "code": -33001,
    "message": "SPARCPhaseError",
    "data": {
      "currentPhase": "specification",
      "requestedPhase": "completion",
      "details": "Cannot skip intermediate phases"
    }
  }
}
```

## Security Requirements

### Authentication
- **Bearer Token**: `Authorization: Bearer <token>`
- **API Key**: `X-API-Key: <key>`
- **CORS**: Configurable allowed origins
- **Rate Limiting**: Per-client request limits

### Authorization
- Agent-specific permissions
- SPARC phase access control
- Resource-based authorization
- Batchtools operation permissions

### Data Protection
- Input validation and sanitization
- Output encoding
- Sensitive data filtering
- Audit logging

## Performance Requirements

### Response Times
- **Agent Card Discovery**: < 100ms
- **Message Send (quick)**: < 500ms  
- **Message Send (task)**: < 200ms (task creation)
- **SSE Stream Setup**: < 300ms
- **Task Status**: < 100ms

### Throughput
- **Concurrent Connections**: 100+ SSE streams
- **Requests per Second**: 1000+ JSON-RPC requests
- **Message Throughput**: 50+ messages/second per agent
- **Batch Operations**: 10+ parallel tasks

### Resource Usage
- **Memory**: < 512MB per agent instance
- **CPU**: < 50% single core under normal load
- **Network**: Efficient SSE streaming with compression
- **Storage**: Temporary task state only

## Integration Requirements

### SPARC Workflow Integration
- Automatic phase detection and routing
- Workflow state synchronization
- Cross-phase data persistence
- Performance metrics collection

### Batchtools Integration  
- Parallel request processing
- Batch operation coordination
- Resource optimization
- Load balancing

### Memory Bank Integration
- Automatic context storage
- Session state persistence
- Cross-agent memory sharing
- Namespace isolation

## Transport Alternatives

### WebSocket Support (Optional)
```javascript
// WebSocket handshake upgrade from HTTP
ws://localhost:8001/sparc-researcher/ws

// JSON-RPC over WebSocket
{
  "jsonrpc": "2.0",
  "method": "message/send",
  "params": { /* same as HTTP */ },
  "id": "ws-001"
}
```

### gRPC Support (Optional)
```protobuf
service A2AAgent {
  rpc SendMessage(SendMessageRequest) returns (SendMessageResponse);
  rpc StreamMessage(SendMessageRequest) returns (stream StreamResponse);
  rpc GetTask(GetTaskRequest) returns (Task);
  rpc CancelTask(CancelTaskRequest) returns (CancelTaskResponse);
}
```

## Health and Monitoring

### Health Check Endpoint
```http
GET /health
Content-Type: application/json

{
  "status": "healthy",
  "version": "1.0.0",
  "uptime": 3600,
  "metrics": {
    "activeConnections": 25,
    "activeTasks": 10,
    "memoryUsage": 256,
    "cpuUsage": 45
  }
}
```

### Metrics Endpoint
```http  
GET /metrics
Content-Type: application/json

{
  "requests": {
    "total": 1500,
    "perSecond": 25.5,
    "errors": 12
  },
  "tasks": {
    "created": 45,
    "completed": 42,
    "failed": 1,
    "active": 2
  },
  "performance": {
    "averageResponseTime": 320,
    "p95ResponseTime": 850,
    "throughput": 18.3
  }
}
```

Esta especificação garante conformidade completa com A2A v0.2.9 enquanto integra perfeitamente com SPARC methodology e Batchtools optimization.