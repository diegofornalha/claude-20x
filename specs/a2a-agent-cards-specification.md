# SPARC Specification: A2A Agent Cards Structure

## Overview
Definição da estrutura de Agent Cards conforme protocolo A2A v0.2.9 para todos os agentes do sistema claude-20x, integrando capacidades SPARC e Batchtools.

## Protocol Requirements

### A2A Agent Card Standard
- **Formato**: JSON conforme especificação A2A v0.2.9
- **Localização**: `.well-known/agent.json` para cada agente
- **Protocolo**: JSON-RPC 2.0 sobre HTTP(S)
- **Capabilities**: Streaming, Push Notifications, State History

## Agent Types Specification

### 1. SPARC Researcher Agent
```json
{
  "protocolVersion": "0.2.9",
  "name": "SPARC-Researcher-Agent",
  "description": "Advanced research agent with SPARC methodology and Batchtools parallel processing for information gathering, analysis, and synthesis",
  "url": "http://localhost:8001/sparc-researcher",
  "preferredTransport": "JSONRPC",
  "provider": {
    "organization": "Claude-Flow SPARC System",
    "url": "https://github.com/ruvnet/claude-code-flow"
  },
  "version": "1.0.0",
  "capabilities": {
    "streaming": true,
    "pushNotifications": true,
    "stateTransitionHistory": true
  },
  "defaultInputModes": ["text/plain", "application/json", "multipart/form-data"],
  "defaultOutputModes": ["text/plain", "application/json", "text/markdown"],
  "skills": [
    {
      "id": "SPARC_SPECIFICATION",
      "name": "sparc_specification",
      "description": "SPARC Specification phase with parallel requirements analysis and constraint validation",
      "tags": ["sparc", "specification", "research", "analysis"],
      "inputModes": ["text/plain", "application/json"],
      "outputModes": ["application/json", "text/markdown"]
    },
    {
      "id": "PARALLEL_RESEARCH",
      "name": "parallel_research", 
      "description": "Concurrent research operations with Batchtools optimization for multiple source analysis",
      "tags": ["research", "parallel", "batchtools", "concurrent"],
      "inputModes": ["text/plain", "application/json"],
      "outputModes": ["application/json", "text/markdown"]
    },
    {
      "id": "INFORMATION_SYNTHESIS",
      "name": "information_synthesis",
      "description": "Advanced information synthesis with semantic analysis and pattern recognition",
      "tags": ["synthesis", "analysis", "patterns", "knowledge"],
      "inputModes": ["text/plain", "application/json"],
      "outputModes": ["application/json", "text/markdown"]
    }
  ]
}
```

### 2. SPARC Coder Agent
```json
{
  "protocolVersion": "0.2.9", 
  "name": "SPARC-Coder-Agent",
  "description": "Expert coding agent implementing SPARC methodology with TDD, parallel code analysis, and Batchtools optimization",
  "url": "http://localhost:8002/sparc-coder",
  "preferredTransport": "JSONRPC",
  "provider": {
    "organization": "Claude-Flow SPARC System",
    "url": "https://github.com/ruvnet/claude-code-flow"
  },
  "version": "1.0.0",
  "capabilities": {
    "streaming": true,
    "pushNotifications": true,
    "stateTransitionHistory": true
  },
  "defaultInputModes": ["text/plain", "application/json", "text/x-typescript", "text/x-python"],
  "defaultOutputModes": ["text/plain", "application/json", "text/x-typescript", "text/x-python"],
  "skills": [
    {
      "id": "SPARC_PSEUDOCODE",
      "name": "sparc_pseudocode",
      "description": "SPARC Pseudocode phase with concurrent logic design and algorithm optimization",
      "tags": ["sparc", "pseudocode", "algorithms", "design"],
      "inputModes": ["text/plain", "application/json"],
      "outputModes": ["text/plain", "application/json"]
    },
    {
      "id": "SPARC_REFINEMENT",
      "name": "sparc_refinement", 
      "description": "SPARC Refinement phase with parallel TDD implementation and code optimization",
      "tags": ["sparc", "tdd", "refinement", "testing"],
      "inputModes": ["text/plain", "application/json"],
      "outputModes": ["text/x-typescript", "text/x-python", "application/json"]
    },
    {
      "id": "PARALLEL_CODE_ANALYSIS",
      "name": "parallel_code_analysis",
      "description": "Concurrent code analysis with pattern recognition and dependency validation",
      "tags": ["analysis", "parallel", "patterns", "dependencies"],
      "inputModes": ["text/x-typescript", "text/x-python", "application/json"],
      "outputModes": ["application/json", "text/markdown"]
    }
  ]
}
```

### 3. SPARC Analyst Agent
```json
{
  "protocolVersion": "0.2.9",
  "name": "SPARC-Analyst-Agent", 
  "description": "Data analysis and pattern recognition agent with SPARC methodology and batch processing capabilities",
  "url": "http://localhost:8003/sparc-analyst",
  "preferredTransport": "JSONRPC",
  "provider": {
    "organization": "Claude-Flow SPARC System",
    "url": "https://github.com/ruvnet/claude-code-flow"
  },
  "version": "1.0.0",
  "capabilities": {
    "streaming": true,
    "pushNotifications": true,
    "stateTransitionHistory": true
  },
  "defaultInputModes": ["text/plain", "application/json", "text/csv", "application/vnd.ms-excel"],
  "defaultOutputModes": ["application/json", "text/markdown", "image/png"],
  "skills": [
    {
      "id": "BATCH_DATA_ANALYSIS",
      "name": "batch_data_analysis",
      "description": "High-performance batch data analysis with parallel processing and statistical methods",
      "tags": ["analysis", "batch", "statistics", "parallel"],
      "inputModes": ["application/json", "text/csv"],
      "outputModes": ["application/json", "text/markdown", "image/png"]
    },
    {
      "id": "PATTERN_RECOGNITION",
      "name": "pattern_recognition",
      "description": "Advanced pattern recognition with machine learning and concurrent processing",
      "tags": ["patterns", "ml", "recognition", "concurrent"],
      "inputModes": ["application/json", "text/csv"],
      "outputModes": ["application/json", "text/markdown"]
    },
    {
      "id": "INSIGHTS_GENERATION",
      "name": "insights_generation",
      "description": "Intelligent insights generation with visualization and reporting capabilities",
      "tags": ["insights", "visualization", "reporting", "intelligence"],
      "inputModes": ["application/json"],
      "outputModes": ["application/json", "text/markdown", "image/png"]
    }
  ]
}
```

### 4. SPARC Coordinator Agent  
```json
{
  "protocolVersion": "0.2.9",
  "name": "SPARC-Coordinator-Agent",
  "description": "Master coordinator implementing SPARC Architecture phase with parallel workflow management and agent orchestration",
  "url": "http://localhost:8004/sparc-coordinator", 
  "preferredTransport": "JSONRPC",
  "provider": {
    "organization": "Claude-Flow SPARC System",
    "url": "https://github.com/ruvnet/claude-code-flow"
  },
  "version": "1.0.0",
  "capabilities": {
    "streaming": true,
    "pushNotifications": true,
    "stateTransitionHistory": true
  },
  "defaultInputModes": ["text/plain", "application/json"],
  "defaultOutputModes": ["application/json", "text/markdown"],
  "skills": [
    {
      "id": "SPARC_ARCHITECTURE",
      "name": "sparc_architecture",
      "description": "SPARC Architecture phase with parallel component design and system architecture planning",
      "tags": ["sparc", "architecture", "design", "planning"],
      "inputModes": ["text/plain", "application/json"],
      "outputModes": ["application/json", "text/markdown"]
    },
    {
      "id": "SPARC_COMPLETION",
      "name": "sparc_completion",
      "description": "SPARC Completion phase with concurrent integration and final validation",
      "tags": ["sparc", "completion", "integration", "validation"],
      "inputModes": ["application/json"],
      "outputModes": ["application/json", "text/markdown"]
    },
    {
      "id": "PARALLEL_ORCHESTRATION",
      "name": "parallel_orchestration",
      "description": "Advanced agent orchestration with parallel task distribution and workflow management",
      "tags": ["orchestration", "parallel", "workflow", "management"],
      "inputModes": ["application/json"],
      "outputModes": ["application/json"]
    },
    {
      "id": "RESOURCE_ALLOCATION",
      "name": "resource_allocation", 
      "description": "Intelligent resource allocation with load balancing and performance optimization",
      "tags": ["resources", "allocation", "performance", "optimization"],
      "inputModes": ["application/json"],
      "outputModes": ["application/json"]
    }
  ]
}
```

## Common Specifications

### Security Schemes
```json
{
  "securitySchemes": {
    "bearer": {
      "type": "http",
      "scheme": "bearer",
      "description": "Bearer token authentication for A2A protocol"
    },
    "apiKey": {
      "type": "apiKey",
      "in": "header",
      "name": "X-API-Key",
      "description": "API key authentication for service access"
    }
  },
  "security": [
    {"bearer": []},
    {"apiKey": []}
  ]
}
```

### Extensions Support
```json
{
  "extensions": [
    {
      "name": "sparc-methodology",
      "version": "1.0.0",
      "documentationUrl": "https://github.com/ruvnet/claude-code-flow/docs/sparc.md"
    },
    {
      "name": "batchtools-optimization", 
      "version": "1.0.0",
      "documentationUrl": "https://github.com/ruvnet/claude-code-flow/docs/batchtools.md"
    }
  ]
}
```

## File Structure Requirements

```
agents/
├── .well-known/
│   ├── researcher-agent.json
│   ├── coder-agent.json  
│   ├── analyst-agent.json
│   └── coordinator-agent.json
├── researcher/
│   └── sparc-researcher-server.ts
├── coder/
│   └── sparc-coder-server.ts
├── analyst/ 
│   └── sparc-analyst-server.ts
└── coordinator/
    └── sparc-coordinator-server.ts
```

## Validation Requirements

### Agent Card Validation Schema
- Protocol version compliance (0.2.9)
- Required fields validation (name, description, url, capabilities, skills)
- Skills schema validation (id, name, description, tags, inputModes, outputModes)
- URL format validation (http/https)
- MIME type validation for input/output modes

### Runtime Requirements
- Agent Cards must be accessible via HTTP GET at `/.well-known/agent.json`
- Response must include proper CORS headers
- Content-Type must be `application/json`
- Agent Cards must be updated when agent capabilities change

## Integration Points

### SPARC Methodology Integration
- Each agent card reflects SPARC phase specialization
- Skills map to SPARC workflow stages
- Extensions declare SPARC methodology support

### Batchtools Integration  
- Capabilities reflect parallel processing support
- Skills indicate concurrent operation capabilities
- Performance optimizations declared in extensions

### Memory Bank Integration
- Agent cards reference memory namespaces
- Skills indicate memory operation capabilities
- State transition history enabled for memory tracking

This specification ensures full A2A protocol compliance while maintaining SPARC methodology and Batchtools optimization advantages.