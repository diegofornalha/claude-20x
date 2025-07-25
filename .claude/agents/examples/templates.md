# 📝 Templates de Uso - A2A Agents

## 🎯 Template 1: Sistema A2A Básico

### Cenário: Implementar servidor A2A simples

```bash
Task("You are a2a-implementation-specialist. 

🎯 OBJECTIVE: Create basic A2A server based on real patterns

📁 BASE PATTERNS: Use /Users/agents/Desktop/claude-20x/agents/helloworld/app.py as foundation

📋 REQUIREMENTS:
- FastAPI server with agent card at /.well-known/agent.json
- JSON-RPC 2.0 endpoint for message processing  
- Basic hello_world and super_hello_world skills
- Health check endpoint
- Proper error handling and logging

🔧 IMPLEMENTATION:
- Copy the working patterns from helloworld app.py
- Add proper typing with Pydantic models
- Include uvicorn server setup
- Add basic request validation
- Follow A2A Protocol specification

Generate complete, runnable Python code that I can execute immediately.")
```

---

## 🏗️ Template 2: Sistema Completo com Database

### Cenário: A2A com persistência e autenticação

```bash
# Mensagem 1: Inicializar coordenação
mcp__claude-flow__swarm_init --topology hierarchical --maxAgents 5 --strategy specialized

# Mensagem 2: Coordenação completa
Task("You are a2a-queen-coordinator. Build production A2A system with database persistence.")

Task("You are a2a-implementation-specialist. Use real patterns from a2a-python for SQLAlchemy integration.")

Task("You are a2a-authn-authz-manager. Implement JWT authentication with refresh tokens.")

Task("You are a2a-task-manager. Create task lifecycle with database persistence.")

TodoWrite({ todos: [
  {id: "db-setup", content: "Setup SQLAlchemy with TaskModel and UserModel", status: "in_progress", priority: "high"},
  {id: "auth-system", content: "Implement JWT authentication system", status: "pending", priority: "high"},
  {id: "task-mgmt", content: "Create task lifecycle management", status: "pending", priority: "high"},
  {id: "server-impl", content: "Build FastAPI server with all endpoints", status: "pending", priority: "high"},
  {id: "integration", content: "Integration testing and validation", status: "pending", priority: "medium"},
  {id: "deployment", content: "Docker setup and deployment scripts", status: "pending", priority: "low"}
]})
```

---

## ⚡ Template 3: Streaming & Real-time

### Cenário: Sistema com SSE streaming e push notifications

```bash
Task("You are a2a-streaming-handler. Implement real-time SSE streaming for A2A tasks.")

Task("You are a2a-push-notification-handler. Create webhook system for async notifications.")

Task("You are a2a-neural-optimizer. Optimize streaming performance and connection management.")

TodoWrite({ todos: [
  {id: "sse-impl", content: "Implement Server-Sent Events streaming", status: "in_progress", priority: "high"},
  {id: "webhook-sys", content: "Create push notification webhook system", status: "in_progress", priority: "high"},
  {id: "perf-opt", content: "Optimize streaming performance", status: "in_progress", priority: "high"},
  {id: "connection-mgmt", content: "Implement connection management and heartbeat", status: "pending", priority: "high"},
  {id: "fallback-sys", content: "Create fallback mechanisms for connection failures", status: "pending", priority: "medium"},
  {id: "monitoring", content: "Add streaming metrics and monitoring", status: "pending", priority: "low"}
]})
```

---

## 🔐 Template 4: Sistema de Segurança

### Cenário: A2A com segurança avançada

```bash
Task("You are a2a-authn-authz-manager. 

🛡️ SECURITY OBJECTIVE: Implement comprehensive security for A2A Protocol

📋 SECURITY REQUIREMENTS:
- OAuth2 with PKCE for public clients
- JWT tokens with proper claims and validation
- API key authentication for service-to-service
- Scope-based authorization for agent capabilities
- Rate limiting and DDoS protection
- Audit logging for all authentication events

🔧 IMPLEMENTATION PATTERNS:
- Use FastAPI security utilities
- Implement proper token lifecycle management
- Add middleware for authentication and authorization
- Include security headers and CORS configuration
- Follow OWASP security best practices

Generate production-ready security implementation with proper error handling, logging, and monitoring.")
```

---

## 🧪 Template 5: Testing & Quality Assurance

### Cenário: Testes e validação do sistema A2A

```bash
Task("You are a2a-implementation-specialist. Create comprehensive test suite for A2A system.")

TodoWrite({ todos: [
  {id: "unit-tests", content: "Create unit tests for all A2A components", status: "in_progress", priority: "high"},
  {id: "integration-tests", content: "Build integration tests for client-server interaction", status: "pending", priority: "high"},
  {id: "auth-tests", content: "Test authentication and authorization flows", status: "pending", priority: "high"},
  {id: "streaming-tests", content: "Test SSE streaming and push notifications", status: "pending", priority: "high"},
  {id: "performance-tests", content: "Load testing and performance benchmarks", status: "pending", priority: "medium"},
  {id: "security-tests", content: "Security testing and vulnerability assessment", status: "pending", priority: "medium"},
  {id: "e2e-tests", content: "End-to-end workflow testing", status: "pending", priority: "medium"},
  {id: "ci-setup", content: "Setup CI/CD pipeline with automated testing", status: "pending", priority: "low"}
]})
```

---

## 🔄 Template 6: Otimização e Monitoramento

### Cenário: Sistema A2A em produção com monitoring

```bash
Task("You are a2a-neural-optimizer. 

📊 OPTIMIZATION OBJECTIVE: Production monitoring and performance optimization

🎯 MONITORING TARGETS:
- Task processing latency and throughput
- Database query performance and connection pooling
- Memory usage and garbage collection patterns
- HTTP request/response times and error rates
- Authentication success/failure rates
- Streaming connection health and reconnection patterns

🧠 NEURAL LEARNING FOCUS:
- Identify performance bottlenecks from real usage patterns
- Learn optimal configuration parameters
- Predict scaling needs based on usage trends
- Adapt to changing load patterns automatically

🔧 IMPLEMENTATION:
- Integrate with Prometheus/Grafana for metrics
- Add structured logging with correlation IDs
- Implement distributed tracing with OpenTelemetry
- Create performance dashboards and alerts
- Add automated performance optimization

Generate monitoring and optimization implementation with real-time metrics, alerting, and adaptive performance tuning.")
```

---

## 🚀 Template 7: Deployment & DevOps

### Cenário: Deploy A2A system para produção

```bash
Task("You are a2a-implementation-specialist. Create production deployment setup for A2A system.")

TodoWrite({ todos: [
  {id: "docker-setup", content: "Create Dockerfile and docker-compose for all services", status: "in_progress", priority: "high"},
  {id: "k8s-config", content: "Create Kubernetes manifests for container orchestration", status: "pending", priority: "high"},
  {id: "env-config", content: "Setup environment configuration management", status: "pending", priority: "high"},
  {id: "db-migrations", content: "Create database migration scripts and procedures", status: "pending", priority: "high"},
  {id: "ssl-setup", content: "Configure SSL/TLS certificates and HTTPS", status: "pending", priority: "medium"},
  {id: "load-balancer", content: "Setup load balancer and reverse proxy", status: "pending", priority: "medium"},
  {id: "monitoring-deploy", content: "Deploy monitoring stack (Prometheus/Grafana)", status: "pending", priority: "medium"},
  {id: "backup-strategy", content: "Implement backup and disaster recovery", status: "pending", priority: "low"}
]})
```

---

## 🎨 Template 8: Frontend Integration

### Cenário: A2A com interface web

```bash
Task("You are a2a-client. Create JavaScript/TypeScript client for web frontend integration.")

Task("You are a2a-streaming-handler. Implement WebSocket fallback for browsers that don't support SSE.")

TodoWrite({ todos: [
  {id: "js-client", content: "Create JavaScript A2A client library", status: "in_progress", priority: "high"},
  {id: "websocket-fallback", content: "Implement WebSocket fallback for streaming", status: "in_progress", priority: "high"},
  {id: "react-integration", content: "Create React hooks for A2A integration", status: "pending", priority: "high"},
  {id: "auth-flow", content: "Implement OAuth2 flow in frontend", status: "pending", priority: "high"},
  {id: "error-handling", content: "Add comprehensive error handling and user feedback", status: "pending", priority: "medium"},
  {id: "offline-support", content: "Add offline capabilities and sync", status: "pending", priority: "low"}
]})
```

---

## 🔧 Template 9: Microservices Architecture

### Cenário: A2A em arquitetura de microserviços

```bash
Task("You are a2a-queen-coordinator. 

🏗️ ARCHITECTURE OBJECTIVE: Design A2A microservices architecture

🐝 MICROSERVICES COORDINATION:
- Authentication Service (JWT/OAuth2)
- Task Processing Service (Core A2A logic)
- Streaming Service (SSE/WebSocket)
- Notification Service (Push notifications)
- Agent Registry Service (Agent card management)
- Gateway Service (API Gateway with routing)

🧠 HIVE MIND STRATEGY:
- Use 8 specialized workers for service implementation
- Apply systems and convergent neural patterns
- Implement service mesh coordination
- Add distributed tracing and monitoring
- Use collective memory for cross-service state

🔧 IMPLEMENTATION FOCUS:
- Each service as independent A2A agent
- Inter-service communication via A2A Protocol
- Shared authentication and authorization
- Distributed task processing and coordination
- Fault tolerance and circuit breaker patterns

Coordinate the implementation of all microservices with proper service boundaries, communication patterns, and deployment strategies.")
```

---

## 📱 Template 10: Mobile Integration

### Cenário: A2A para aplicações mobile

```bash
Task("You are a2a-client. Create mobile-optimized A2A client for iOS/Android.")

Task("You are a2a-push-notification-handler. Implement mobile push notifications via FCM/APNS.")

TodoWrite({ todos: [
  {id: "mobile-client", content: "Create mobile A2A client SDK", status: "in_progress", priority: "high"},
  {id: "push-mobile", content: "Implement mobile push notifications", status: "in_progress", priority: "high"},
  {id: "offline-sync", content: "Add offline synchronization capabilities", status: "pending", priority: "high"},
  {id: "battery-opt", content: "Optimize for battery usage and background processing", status: "pending", priority: "high"},
  {id: "network-opt", content: "Optimize for mobile network conditions", status: "pending", priority": "medium"},
  {id: "security-mobile", content: "Implement mobile-specific security measures", status: "pending", priority: "medium"}
]})
```

---

## 🎯 Como Escolher o Template Certo

### **Projeto Simples** → Template 1
- Servidor básico, poucas funcionalidades
- Prototipagem rápida

### **Projeto Médio** → Templates 2, 3, 4
- Sistema com database
- Funcionalidades de streaming
- Segurança robusta

### **Projeto Complexo** → Templates 6, 7, 9
- Sistema em produção
- Arquitetura de microserviços
- Monitoramento avançado

### **Integração** → Templates 8, 10
- Frontend web
- Aplicações mobile

---

## 🚨 Lembrete de Execução Concorrente

**TODOS OS TEMPLATES seguem a regra:**

```bash
# ✅ Uma mensagem com tudo
Task("Agent 1...")
Task("Agent 2...")
TodoWrite({ todos: [...] })

# ❌ Nunca separar em múltiplas mensagens
```

**Escolha seu template e comece a implementar!** 🚀