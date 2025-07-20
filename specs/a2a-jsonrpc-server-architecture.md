# SPARC Architecture: JSON-RPC Server Design

## Overview
Arquitetura detalhada do servidor JSON-RPC 2.0 para A2A protocol compliance, com routing avançado, middleware pipeline, SPARC integration, e Batchtools optimization.

## System Architecture

### 1. Layered Architecture Overview
```
┌─────────────────────────────────────────────────────────────┐
│                    HTTP/WebSocket Layer                     │
├─────────────────────────────────────────────────────────────┤
│    Request Parser   │   Response Builder   │   SSE Manager   │
└─────────────────────────────────────────────────────────────┘
                                │
┌─────────────────────────────────────────────────────────────┐
│                    Middleware Pipeline                      │
├─────────────────────────────────────────────────────────────┤
│ Auth │ Validation │ Rate Limit │ CORS │ Metrics │ Logging │
└─────────────────────────────────────────────────────────────┘
                                │
┌─────────────────────────────────────────────────────────────┐
│                    JSON-RPC Router                          │
├─────────────────────────────────────────────────────────────┤
│  Method Router  │  Parameter Validator  │  Handler Registry │
└─────────────────────────────────────────────────────────────┘
                                │
┌─────────────────────────────────────────────────────────────┐
│                    Business Logic Layer                     │
├─────────────────────────────────────────────────────────────┤
│ Message Handler │ Task Manager │ SPARC Integration │ etc... │
└─────────────────────────────────────────────────────────────┘
                                │
┌─────────────────────────────────────────────────────────────┐
│                    Service Layer                            │
├─────────────────────────────────────────────────────────────┤
│ Memory Bank │ Batchtools │ SSE Service │ Notification Svc │
└─────────────────────────────────────────────────────────────┘
```

### 2. Core Components Architecture

#### HTTP Server Foundation
```typescript
interface HttpServerConfig {
  port: number;
  host: string;
  maxConnections: number;
  keepAliveTimeout: number;
  requestTimeout: number;
  bodyLimit: string;
  corsConfig: CorsConfig;
  sslConfig?: SslConfig;
}

class A2AHttpServer {
  private server: HttpServer;
  private middlewarePipeline: MiddlewarePipeline;
  private jsonRpcRouter: JsonRpcRouter;
  private sseManager: SSEManager;
  private metricsCollector: MetricsCollector;
  
  constructor(config: HttpServerConfig) {
    this.server = createHttpServer(config);
    this.setupMiddleware();
    this.setupRouting();
    this.setupSSE();
  }
  
  private setupMiddleware(): void {
    this.middlewarePipeline = new MiddlewarePipeline([
      new SecurityMiddleware(),
      new AuthenticationMiddleware(), 
      new ValidationMiddleware(),
      new RateLimitingMiddleware(),
      new CorsMiddleware(),
      new MetricsMiddleware(),
      new LoggingMiddleware()
    ]);
  }
}
```

#### Middleware Pipeline Architecture
```typescript
interface Middleware {
  name: string;
  priority: number;
  handle(context: RequestContext, next: NextFunction): Promise<void>;
}

class MiddlewarePipeline {
  private middlewares: Middleware[];
  
  constructor(middlewares: Middleware[]) {
    this.middlewares = middlewares.sort((a, b) => a.priority - b.priority);
  }
  
  async execute(context: RequestContext): Promise<void> {
    let index = 0;
    
    const next = async (): Promise<void> => {
      if (index < this.middlewares.length) {
        const middleware = this.middlewares[index++];
        await middleware.handle(context, next);
      }
    };
    
    await next();
  }
}

// Security Middleware
class SecurityMiddleware implements Middleware {
  name = "security";
  priority = 1;
  
  async handle(context: RequestContext, next: NextFunction): Promise<void> {
    // Add security headers
    context.response.setHeader("X-Content-Type-Options", "nosniff");
    context.response.setHeader("X-Frame-Options", "DENY");
    context.response.setHeader("X-XSS-Protection", "1; mode=block");
    
    // Validate request size
    if (context.request.body.length > MAX_REQUEST_SIZE) {
      throw new ValidationError("Request too large");
    }
    
    await next();
  }
}

// Authentication Middleware
class AuthenticationMiddleware implements Middleware {
  name = "authentication";
  priority = 2;
  
  async handle(context: RequestContext, next: NextFunction): Promise<void> {
    const authHeader = context.request.headers.authorization;
    const apiKey = context.request.headers["x-api-key"];
    
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      context.user = await this.validateBearerToken(token);
    } else if (apiKey) {
      context.user = await this.validateApiKey(apiKey);
    } else {
      throw new AuthenticationError("Authentication required");
    }
    
    await next();
  }
}

// Rate Limiting Middleware
class RateLimitingMiddleware implements Middleware {
  name = "rateLimit";
  priority = 3;
  private rateLimiter: RateLimiter;
  
  async handle(context: RequestContext, next: NextFunction): Promise<void> {
    const clientId = context.user?.id || context.request.ip;
    const allowed = await this.rateLimiter.checkLimit(clientId);
    
    if (!allowed) {
      throw new RateLimitError("Rate limit exceeded");
    }
    
    await next();
  }
}
```

#### JSON-RPC Router Architecture
```typescript
interface JsonRpcRoute {
  method: string;
  handler: JsonRpcHandler;
  validator?: ParameterValidator;
  middleware?: Middleware[];
  rateLimit?: RateLimitConfig;
}

class JsonRpcRouter {
  private routes: Map<string, JsonRpcRoute> = new Map();
  private defaultHandler: JsonRpcHandler;
  
  register(route: JsonRpcRoute): void {
    this.routes.set(route.method, route);
  }
  
  async route(request: JsonRpcRequest, context: RequestContext): Promise<JsonRpcResponse> {
    const route = this.routes.get(request.method);
    
    if (!route) {
      return this.createErrorResponse(
        request.id,
        -32601,
        "Method not found",
        { method: request.method }
      );
    }
    
    try {
      // Validate parameters
      if (route.validator) {
        const validation = route.validator.validate(request.params);
        if (!validation.isValid) {
          return this.createErrorResponse(
            request.id,
            -32602,
            "Invalid params",
            validation.errors
          );
        }
      }
      
      // Execute route-specific middleware
      if (route.middleware) {
        for (const middleware of route.middleware) {
          await middleware.handle(context, () => Promise.resolve());
        }
      }
      
      // Execute handler
      const result = await route.handler.handle(request.params, context);
      
      return this.createSuccessResponse(request.id, result);
      
    } catch (error) {
      return this.handleError(request.id, error);
    }
  }
}

// Route Registration
class A2ARouteRegistry {
  static registerRoutes(router: JsonRpcRouter): void {
    // Message operations
    router.register({
      method: "message/send",
      handler: new MessageSendHandler(),
      validator: new MessageSendValidator(),
      middleware: [new SPARCMiddleware()],
      rateLimit: { maxRequests: 60, windowMs: 60000 }
    });
    
    router.register({
      method: "message/stream", 
      handler: new MessageStreamHandler(),
      validator: new MessageSendValidator(),
      middleware: [new SSEMiddleware(), new SPARCMiddleware()]
    });
    
    // Task operations
    router.register({
      method: "tasks/get",
      handler: new TaskGetHandler(),
      validator: new TaskIdValidator()
    });
    
    router.register({
      method: "tasks/cancel",
      handler: new TaskCancelHandler(),
      validator: new TaskIdValidator()
    });
    
    router.register({
      method: "tasks/list",
      handler: new TaskListHandler(),
      validator: new TaskListValidator()
    });
    
    // SPARC operations
    router.register({
      method: "sparc/phase/set",
      handler: new SPARCPhaseHandler(),
      validator: new SPARCPhaseValidator(),
      middleware: [new SPARCAuthMiddleware()]
    });
    
    // Batchtools operations
    router.register({
      method: "batchtools/execute",
      handler: new BatchtoolsHandler(),
      validator: new BatchtoolsValidator(),
      middleware: [new BatchtoolsMiddleware()]
    });
  }
}
```

### 3. Handler Architecture

#### Base Handler Pattern
```typescript
abstract class BaseJsonRpcHandler {
  abstract handle(params: any, context: RequestContext): Promise<any>;
  
  protected validateParams(params: any, schema: JsonSchema): void {
    const validator = new JsonSchemaValidator(schema);
    const result = validator.validate(params);
    
    if (!result.isValid) {
      throw new ValidationError("Invalid parameters", result.errors);
    }
  }
  
  protected async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3
  ): Promise<T> {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await operation();
      } catch (error) {
        if (i === maxRetries - 1) throw error;
        await this.delay(Math.pow(2, i) * 1000); // Exponential backoff
      }
    }
    throw new Error("Max retries exceeded");
  }
  
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Message Send Handler
class MessageSendHandler extends BaseJsonRpcHandler {
  private sparcIntegrator: SPARCIntegrator;
  private batchtoolsOptimizer: BatchtoolsOptimizer;
  private taskManager: TaskManager;
  
  async handle(params: MessageSendParams, context: RequestContext): Promise<Message | Task> {
    // Extract and validate message
    const { message, configuration, metadata } = params;
    
    // Determine processing strategy
    const strategy = this.determineProcessingStrategy(message, configuration);
    
    if (strategy === "quick_response") {
      return await this.processQuickMessage(message, configuration, metadata, context);
    } else {
      return await this.createLongRunningTask(message, configuration, metadata, context);
    }
  }
  
  private async processQuickMessage(
    message: Message,
    config: MessageSendConfiguration,
    metadata: any,
    context: RequestContext
  ): Promise<Message> {
    // Create SPARC context
    const sparcContext = await this.sparcIntegrator.createContext(
      config.sparcPhase,
      context.user.agentType
    );
    
    // Apply Batchtools optimization
    const optimizer = config.batchtoolsOptimized 
      ? await this.batchtoolsOptimizer.createOptimizer(message)
      : null;
    
    // Process message
    const result = await this.processMessage(message, sparcContext, optimizer);
    
    // Create response message
    return this.createResponseMessage(result, sparcContext, metadata);
  }
}

// Task Get Handler
class TaskGetHandler extends BaseJsonRpcHandler {
  private taskManager: TaskManager;
  
  async handle(params: TaskGetParams, context: RequestContext): Promise<Task> {
    const { taskId } = params;
    
    const task = await this.taskManager.getTask(taskId);
    
    if (!task) {
      throw new TaskNotFoundError(`Task not found: ${taskId}`);
    }
    
    // Check permissions
    if (!this.canAccessTask(task, context.user)) {
      throw new AuthorizationError("Access denied to task");
    }
    
    // Add real-time metrics
    task.metadata.currentMetrics = await this.getTaskMetrics(taskId);
    
    return task;
  }
}
```

### 4. SSE (Server-Sent Events) Architecture

#### SSE Manager
```typescript
class SSEManager {
  private connections: Map<string, SSEConnection> = new Map();
  private eventBus: EventBus;
  
  createConnection(requestId: string, response: HttpResponse): SSEConnection {
    const connection = new SSEConnection(requestId, response);
    this.connections.set(requestId, connection);
    
    // Setup cleanup on disconnect
    connection.onDisconnect(() => {
      this.connections.delete(requestId);
    });
    
    return connection;
  }
  
  broadcast(event: SSEEvent): void {
    for (const connection of this.connections.values()) {
      connection.send(event);
    }
  }
  
  sendToConnection(connectionId: string, event: SSEEvent): void {
    const connection = this.connections.get(connectionId);
    if (connection) {
      connection.send(event);
    }
  }
}

class SSEConnection {
  private response: HttpResponse;
  private connectionId: string;
  private isAlive: boolean = true;
  
  constructor(connectionId: string, response: HttpResponse) {
    this.connectionId = connectionId;
    this.response = response;
    this.setupSSE();
  }
  
  private setupSSE(): void {
    this.response.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Cache-Control"
    });
    
    // Send initial ping
    this.ping();
    
    // Setup periodic ping
    const pingInterval = setInterval(() => {
      if (this.isAlive) {
        this.ping();
      } else {
        clearInterval(pingInterval);
      }
    }, 30000);
  }
  
  send(event: SSEEvent): void {
    if (!this.isAlive) return;
    
    const data = `event: ${event.type}\ndata: ${JSON.stringify(event.data)}\n\n`;
    this.response.write(data);
  }
  
  ping(): void {
    this.send({
      type: "ping",
      data: { timestamp: Date.now() }
    });
  }
  
  close(): void {
    this.isAlive = false;
    this.response.end();
  }
}
```

### 5. SPARC Integration Architecture

#### SPARC Middleware
```typescript
class SPARCMiddleware implements Middleware {
  name = "sparc";
  priority = 5;
  
  private sparcIntegrator: SPARCIntegrator;
  
  async handle(context: RequestContext, next: NextFunction): Promise<void> {
    // Extract SPARC configuration from request
    const jsonRpcRequest = context.jsonRpcRequest;
    const sparcConfig = jsonRpcRequest.params?.configuration?.sparc;
    
    if (sparcConfig) {
      // Create SPARC context
      context.sparcContext = await this.sparcIntegrator.createContext(
        sparcConfig.phase,
        context.user.agentType,
        sparcConfig.workflowId
      );
      
      // Validate phase transition
      if (sparcConfig.phase) {
        await this.validatePhaseTransition(
          context.sparcContext,
          sparcConfig.phase
        );
      }
    }
    
    await next();
  }
  
  private async validatePhaseTransition(
    context: SPARCContext,
    requestedPhase: SPARCPhase
  ): Promise<void> {
    const currentPhase = context.currentPhase;
    const validTransitions = this.getValidTransitions(currentPhase);
    
    if (!validTransitions.includes(requestedPhase)) {
      throw new SPARCPhaseError(
        `Invalid phase transition from ${currentPhase} to ${requestedPhase}`
      );
    }
  }
}

class SPARCIntegrator {
  private workflowManager: SPARCWorkflowManager;
  private phaseExecutors: Map<SPARCPhase, PhaseExecutor>;
  
  async createContext(
    phase: SPARCPhase,
    agentType: string,
    workflowId?: string
  ): Promise<SPARCContext> {
    const workflow = workflowId 
      ? await this.workflowManager.getWorkflow(workflowId)
      : await this.workflowManager.createWorkflow(agentType);
    
    return new SPARCContext({
      workflow,
      currentPhase: phase,
      agentType,
      executor: this.phaseExecutors.get(phase)
    });
  }
  
  async executePhase(
    context: SPARCContext,
    input: any
  ): Promise<SPARCPhaseResult> {
    const executor = context.executor;
    
    if (!executor) {
      throw new SPARCError(`No executor found for phase: ${context.currentPhase}`);
    }
    
    return await executor.execute(input, context);
  }
}
```

### 6. Batchtools Integration Architecture

#### Batchtools Optimizer
```typescript
class BatchtoolsOptimizer {
  private resourceMonitor: ResourceMonitor;
  private loadBalancer: LoadBalancer;
  private taskScheduler: TaskScheduler;
  
  async createOptimizer(message: Message): Promise<BatchOptimizer> {
    const complexity = this.analyzeComplexity(message);
    const resources = await this.resourceMonitor.getAvailableResources();
    
    return new BatchOptimizer({
      complexity,
      resources,
      strategy: this.selectOptimizationStrategy(complexity, resources)
    });
  }
  
  async executeBatchOperation(
    operation: BatchOperation,
    context: BatchContext
  ): Promise<BatchResult> {
    // Determine optimal parallelization
    const parallelization = this.calculateOptimalParallelization(
      operation,
      context.resources
    );
    
    // Create execution plan
    const executionPlan = this.createExecutionPlan(operation, parallelization);
    
    // Execute with monitoring
    return await this.executeWithMonitoring(executionPlan, context);
  }
  
  private async executeWithMonitoring(
    plan: ExecutionPlan,
    context: BatchContext
  ): Promise<BatchResult> {
    const monitor = new ExecutionMonitor(plan.id);
    
    try {
      monitor.start();
      
      const results = await Promise.all(
        plan.tasks.map(task => this.executeTask(task, context))
      );
      
      monitor.recordSuccess(results);
      return this.aggregateResults(results);
      
    } catch (error) {
      monitor.recordError(error);
      throw error;
    } finally {
      monitor.stop();
    }
  }
}

class BatchOptimizer {
  private strategy: OptimizationStrategy;
  private resources: ResourceAllocation;
  
  async optimize<T>(
    operation: () => Promise<T>,
    context: OptimizationContext
  ): Promise<T> {
    // Apply pre-optimization
    await this.applyPreOptimization(context);
    
    // Execute with optimization
    const result = await this.executeOptimized(operation, context);
    
    // Apply post-optimization
    await this.applyPostOptimization(context, result);
    
    return result;
  }
}
```

### 7. Error Handling Architecture

#### Error Handler Pipeline
```typescript
class ErrorHandler {
  private errorProcessors: ErrorProcessor[] = [
    new ValidationErrorProcessor(),
    new AuthenticationErrorProcessor(),
    new TaskErrorProcessor(),
    new SPARCErrorProcessor(),
    new GenericErrorProcessor()
  ];
  
  async handleError(
    error: Error,
    context: RequestContext
  ): Promise<JsonRpcErrorResponse> {
    for (const processor of this.errorProcessors) {
      if (processor.canHandle(error)) {
        return await processor.process(error, context);
      }
    }
    
    // Fallback to generic error
    return this.createGenericErrorResponse(error, context);
  }
}

class TaskErrorProcessor implements ErrorProcessor {
  canHandle(error: Error): boolean {
    return error instanceof TaskNotFoundError ||
           error instanceof TaskNotCancelableError;
  }
  
  async process(
    error: Error,
    context: RequestContext
  ): Promise<JsonRpcErrorResponse> {
    if (error instanceof TaskNotFoundError) {
      return {
        jsonrpc: "2.0",
        id: context.jsonRpcRequest.id,
        error: {
          code: -32001,
          message: "TaskNotFoundError",
          data: {
            taskId: error.taskId,
            details: error.message
          }
        }
      };
    }
    
    // Handle other task errors...
  }
}
```

### 8. Performance and Monitoring

#### Metrics Collection
```typescript
class MetricsCollector {
  private registry: MetricsRegistry;
  
  recordRequest(method: string, duration: number, success: boolean): void {
    this.registry.histogram("jsonrpc_request_duration", duration, {
      method,
      success: success.toString()
    });
    
    this.registry.counter("jsonrpc_requests_total", 1, {
      method,
      status: success ? "success" : "error"
    });
  }
  
  recordTaskCreation(agentType: string, sparcPhase: string): void {
    this.registry.counter("tasks_created_total", 1, {
      agent_type: agentType,
      sparc_phase: sparcPhase
    });
  }
  
  recordSSEConnection(action: "connect" | "disconnect"): void {
    this.registry.gauge("sse_connections_active", 
      action === "connect" ? 1 : -1
    );
  }
}

class HealthChecker {
  private dependencies: HealthCheckDependency[] = [
    new DatabaseHealthCheck(),
    new MemoryBankHealthCheck(),
    new SPARCServiceHealthCheck(),
    new BatchtoolsHealthCheck()
  ];
  
  async checkHealth(): Promise<HealthStatus> {
    const results = await Promise.allSettled(
      this.dependencies.map(dep => dep.check())
    );
    
    const healthy = results.every(result => 
      result.status === "fulfilled" && result.value.healthy
    );
    
    return {
      status: healthy ? "healthy" : "unhealthy",
      timestamp: new Date().toISOString(),
      dependencies: results.map((result, index) => ({
        name: this.dependencies[index].name,
        status: result.status === "fulfilled" ? result.value : { healthy: false, error: result.reason }
      }))
    };
  }
}
```

Esta arquitetura garante um servidor JSON-RPC robusto, escalável e totalmente integrado com SPARC methodology e Batchtools optimization, mantendo compliance completa com A2A protocol v0.2.9.