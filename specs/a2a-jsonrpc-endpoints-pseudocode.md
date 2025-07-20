# SPARC Pseudocode: A2A JSON-RPC Endpoints Logic

## Overview
Mapeamento detalhado da lógica de implementação dos endpoints A2A JSON-RPC 2.0, incluindo routing, middleware, SPARC integration e Batchtools optimization.

## Core Server Logic

### 1. JSON-RPC Server Foundation
```pseudocode
CLASS A2AJsonRpcServer:
    PROPERTIES:
        port: number
        agentType: string
        agentCard: AgentCard
        sparcIntegration: SPARCIntegrator
        batchtoolsOptimizer: BatchtoolsOptimizer
        taskManager: TaskManager
        sseManager: SSEManager
        memoryBank: MemoryBankClient
        
    FUNCTION initialize():
        // Load agent configuration
        config = loadAgentConfig(agentType)
        
        // Initialize core components
        taskManager = new TaskManager(config.tasks)
        sseManager = new SSEManager(config.sse)
        sparcIntegration = new SPARCIntegrator(config.sparc)
        batchtoolsOptimizer = new BatchtoolsOptimizer(config.batchtools)
        memoryBank = new MemoryBankClient(config.memory)
        
        // Setup HTTP server with JSON-RPC routing
        httpServer = createHttpServer()
        httpServer.addRoute("POST", "/", handleJsonRpcRequest)
        httpServer.addRoute("GET", "/.well-known/agent.json", serveAgentCard)
        httpServer.addRoute("GET", "/health", handleHealthCheck)
        httpServer.addRoute("GET", "/metrics", handleMetrics)
        
        // Start server
        httpServer.listen(port)
        
    FUNCTION handleJsonRpcRequest(request, response):
        TRY:
            // Parse JSON-RPC request
            jsonRpcRequest = parseJsonRpcRequest(request.body)
            
            // Validate request structure
            IF NOT validateJsonRpcRequest(jsonRpcRequest):
                RETURN createErrorResponse(-32600, "Invalid Request")
            
            // Route to appropriate handler
            result = routeRequest(jsonRpcRequest)
            
            // Create JSON-RPC response
            jsonRpcResponse = createSuccessResponse(jsonRpcRequest.id, result)
            
            // Send response
            response.setHeader("Content-Type", "application/json")
            response.send(jsonRpcResponse)
            
        CATCH ValidationError AS e:
            response.send(createErrorResponse(-32602, "Invalid params", e.details))
        CATCH NotFoundError AS e:
            response.send(createErrorResponse(-32001, "TaskNotFoundError", e.details))
        CATCH Exception AS e:
            response.send(createErrorResponse(-32603, "Internal error", e.message))
```

### 2. Request Routing Logic
```pseudocode
FUNCTION routeRequest(jsonRpcRequest):
    method = jsonRpcRequest.method
    params = jsonRpcRequest.params
    
    SWITCH method:
        CASE "message/send":
            RETURN handleMessageSend(params)
        CASE "message/stream":
            RETURN handleMessageStream(params, jsonRpcRequest.id)
        CASE "tasks/get":
            RETURN handleTaskGet(params)
        CASE "tasks/cancel":
            RETURN handleTaskCancel(params)
        CASE "tasks/list":
            RETURN handleTaskList(params)
        CASE "tasks/pushNotificationConfig/set":
            RETURN handlePushConfigSet(params)
        CASE "tasks/pushNotificationConfig/get":
            RETURN handlePushConfigGet(params)
        CASE "tasks/resubscribe":
            RETURN handleTaskResubscribe(params)
        CASE "sparc/phase/set":
            RETURN handleSPARCPhaseSet(params)
        CASE "batchtools/execute":
            RETURN handleBatchtoolsExecute(params)
        CASE "memory/store":
            RETURN handleMemoryStore(params)
        CASE "memory/retrieve":
            RETURN handleMemoryRetrieve(params)
        DEFAULT:
            THROW MethodNotFoundError("Method not found: " + method)

FUNCTION validateJsonRpcRequest(request):
    // Check required fields
    IF NOT request.hasField("jsonrpc") OR request.jsonrpc != "2.0":
        RETURN false
    
    IF NOT request.hasField("method"):
        RETURN false
        
    IF NOT request.hasField("id"):
        RETURN false
        
    // Validate method format
    IF NOT isValidMethodName(request.method):
        RETURN false
        
    RETURN true
```

### 3. Message Send Handler
```pseudocode
FUNCTION handleMessageSend(params):
    // Extract parameters
    message = params.message
    configuration = params.configuration OR {}
    metadata = params.metadata OR {}
    
    // Validate message structure
    IF NOT validateMessage(message):
        THROW ValidationError("Invalid message structure")
    
    // Determine processing strategy
    processingStrategy = determineProcessingStrategy(message, configuration)
    
    IF processingStrategy == "quick_response":
        // Handle as immediate response
        RETURN processQuickMessage(message, configuration, metadata)
    ELSE:
        // Handle as long-running task
        task = createTask(message, configuration, metadata)
        taskManager.addTask(task)
        
        // Start task processing asynchronously
        ASYNC processTaskInBackground(task)
        
        RETURN task

FUNCTION processQuickMessage(message, configuration, metadata):
    // Apply SPARC phase optimization
    sparcContext = sparcIntegration.createContext(configuration.sparcPhase)
    
    // Apply Batchtools optimization if enabled
    IF configuration.batchtoolsOptimized:
        optimizer = batchtoolsOptimizer.createOptimizer(message)
    
    // Process message based on agent type and SPARC phase
    processingResult = processMessageByPhase(message, sparcContext, optimizer)
    
    // Store result in memory bank if needed
    IF metadata.storeInMemory:
        memoryBank.store(
            namespace: metadata.namespace OR "default",
            key: generateMemoryKey(message, sparcContext),
            data: processingResult,
            ttl: configuration.memoryTtl OR 3600
        )
    
    // Create response message
    RETURN createResponseMessage(processingResult, sparcContext, metadata)

FUNCTION determineProcessingStrategy(message, configuration):
    // Quick response criteria
    quickResponsePatterns = [
        "simple question",
        "status check", 
        "quick analysis",
        "validation request"
    ]
    
    longRunningPatterns = [
        "generate code",
        "complete analysis",
        "SPARC workflow",
        "batch processing"
    ]
    
    messageText = extractTextFromMessage(message)
    
    FOR pattern IN quickResponsePatterns:
        IF messageText.contains(pattern):
            RETURN "quick_response"
    
    FOR pattern IN longRunningPatterns:
        IF messageText.contains(pattern):
            RETURN "task"
    
    // Default based on configuration
    IF configuration.forceTask:
        RETURN "task"
    ELSE:
        RETURN "quick_response"
```

### 4. Message Stream Handler
```pseudocode
FUNCTION handleMessageStream(params, requestId):
    // Create SSE connection
    sseConnection = sseManager.createConnection(requestId)
    
    // Create task for streaming
    task = createTask(params.message, params.configuration, params.metadata)
    task.streamingEnabled = true
    task.sseConnectionId = requestId
    
    // Add task to manager
    taskManager.addTask(task)
    
    // Setup SSE event handlers
    task.onStatusChange(FUNCTION(status):
        sseConnection.sendEvent("task-status-update", {
            jsonrpc: "2.0",
            id: requestId,
            result: {
                taskId: task.id,
                contextId: task.contextId,
                status: status,
                kind: "task"
            }
        })
    )
    
    task.onArtifactUpdate(FUNCTION(artifact, append, lastChunk):
        sseConnection.sendEvent("artifact-update", {
            jsonrpc: "2.0", 
            id: requestId,
            result: {
                taskId: task.id,
                contextId: task.contextId,
                artifact: artifact,
                append: append,
                lastChunk: lastChunk,
                kind: "artifact-update"
            }
        })
    )
    
    task.onComplete(FUNCTION(finalResult):
        sseConnection.sendEvent("status-update", {
            jsonrpc: "2.0",
            id: requestId,
            result: {
                taskId: task.id,
                status: {
                    state: "completed",
                    timestamp: getCurrentTimestamp()
                },
                final: true,
                kind: "status-update"
            }
        })
        
        // Close SSE connection
        sseConnection.close()
    )
    
    // Start task processing
    ASYNC processTaskWithStreaming(task)
    
    // Return initial task state
    RETURN task

FUNCTION processTaskWithStreaming(task):
    TRY:
        // Set task to working state
        task.updateStatus("working", "Processing started with streaming enabled")
        
        // Get SPARC context
        sparcContext = sparcIntegration.createContext(task.configuration.sparcPhase)
        
        // Process based on SPARC phase
        SWITCH sparcContext.phase:
            CASE "specification":
                RETURN processSpecificationPhase(task, sparcContext)
            CASE "pseudocode":
                RETURN processPseudocodePhase(task, sparcContext) 
            CASE "architecture":
                RETURN processArchitecturePhase(task, sparcContext)
            CASE "refinement":
                RETURN processRefinementPhase(task, sparcContext)
            CASE "completion":
                RETURN processCompletionPhase(task, sparcContext)
            DEFAULT:
                RETURN processGeneralTask(task, sparcContext)
                
    CATCH Exception AS e:
        task.updateStatus("failed", "Task processing failed: " + e.message)
        THROW e
```

### 5. Task Management Handlers
```pseudocode
FUNCTION handleTaskGet(params):
    taskId = params.taskId
    
    task = taskManager.getTask(taskId)
    IF NOT task:
        THROW TaskNotFoundError("Task not found: " + taskId)
    
    // Add runtime performance metrics
    task.metadata.currentMetrics = batchtoolsOptimizer.getTaskMetrics(taskId)
    
    RETURN task

FUNCTION handleTaskCancel(params):
    taskId = params.taskId
    
    task = taskManager.getTask(taskId)
    IF NOT task:
        THROW TaskNotFoundError("Task not found: " + taskId)
    
    // Check if task can be canceled
    IF task.status.state IN ["completed", "failed", "canceled"]:
        THROW TaskNotCancelableError("Task is in terminal state: " + task.status.state)
    
    // Cancel task
    taskManager.cancelTask(taskId)
    
    // Cleanup resources
    batchtoolsOptimizer.cleanupTask(taskId)
    sseManager.closeConnection(task.sseConnectionId)
    
    RETURN {
        taskId: taskId,
        status: "canceled",
        timestamp: getCurrentTimestamp()
    }

FUNCTION handleTaskList(params):
    filters = {
        limit: params.limit OR 50,
        status: params.status,
        agentType: params.agentType,
        sparcPhase: params.sparcPhase
    }
    
    tasks = taskManager.listTasks(filters)
    
    // Add performance metrics to each task
    FOR task IN tasks:
        task.metadata.metrics = batchtoolsOptimizer.getTaskMetrics(task.id)
    
    RETURN {
        tasks: tasks,
        total: taskManager.getTotalTaskCount(filters),
        filters: filters
    }
```

### 6. SPARC Phase Processing
```pseudocode
FUNCTION processSpecificationPhase(task, sparcContext):
    // Update task status
    task.updateStatus("working", "Starting SPARC specification analysis")
    
    // Extract requirements from message
    requirements = extractRequirements(task.message)
    
    // Parallel analysis if Batchtools enabled
    IF task.configuration.batchtoolsOptimized:
        analysisResults = PARALLEL FOR requirement IN requirements:
            analyzeRequirement(requirement, sparcContext)
    ELSE:
        analysisResults = []
        FOR requirement IN requirements:
            analysisResults.add(analyzeRequirement(requirement, sparcContext))
    
    // Synthesize specification
    specification = synthesizeSpecification(analysisResults, sparcContext)
    
    // Create artifact
    artifact = createArtifact(
        name: "specification.md",
        content: specification,
        type: "specification"
    )
    
    task.addArtifact(artifact)
    
    // Store in memory bank
    memoryBank.store(
        namespace: "sparc",
        key: task.id + "_specification",
        data: specification,
        ttl: 7200
    )
    
    task.updateStatus("completed", "SPARC specification phase completed")
    
    RETURN task

FUNCTION processRefinementPhase(task, sparcContext):
    task.updateStatus("working", "Starting SPARC refinement with TDD")
    
    // Check if TDD is enabled
    IF task.configuration.tddEnabled:
        // Red phase: Generate failing tests
        task.updateStatus("working", "TDD Red Phase: Generating failing tests")
        tests = generateFailingTests(task.message, sparcContext)
        
        testArtifact = createArtifact(
            name: "tests.ts",
            content: tests,
            type: "test"
        )
        task.addArtifact(testArtifact)
        
        // Green phase: Implement to pass tests
        task.updateStatus("working", "TDD Green Phase: Implementing solution")
        implementation = implementSolution(tests, task.message, sparcContext)
        
        codeArtifact = createArtifact(
            name: "implementation.ts", 
            content: implementation,
            type: "code"
        )
        task.addArtifact(codeArtifact)
        
        // Blue phase: Refactor and optimize
        task.updateStatus("working", "TDD Blue Phase: Refactoring and optimization")
        optimizedCode = refactorAndOptimize(implementation, sparcContext)
        
        finalArtifact = createArtifact(
            name: "final_implementation.ts",
            content: optimizedCode,
            type: "code"
        )
        task.addArtifact(finalArtifact)
    ELSE:
        // Standard implementation without TDD
        implementation = implementDirectly(task.message, sparcContext)
        
        artifact = createArtifact(
            name: "implementation.ts",
            content: implementation,
            type: "code"
        )
        task.addArtifact(artifact)
    
    task.updateStatus("completed", "SPARC refinement phase completed")
    RETURN task
```

### 7. Batchtools Integration
```pseudocode
FUNCTION handleBatchtoolsExecute(params):
    operation = params.operation
    tasks = params.tasks
    configuration = params.configuration
    
    // Validate operation
    IF NOT isValidBatchtoolsOperation(operation):
        THROW ValidationError("Invalid batchtools operation: " + operation)
    
    // Create batch execution context
    batchContext = batchtoolsOptimizer.createBatchContext(configuration)
    
    SWITCH operation:
        CASE "parallel_analysis":
            RETURN executeParallelAnalysis(tasks, batchContext)
        CASE "concurrent_processing":
            RETURN executeConcurrentProcessing(tasks, batchContext)
        CASE "batch_optimization":
            RETURN executeBatchOptimization(tasks, batchContext)
        DEFAULT:
            THROW UnsupportedOperationError("Operation not supported: " + operation)

FUNCTION executeParallelAnalysis(taskIds, batchContext):
    // Get all tasks
    tasks = taskIds.map(id => taskManager.getTask(id))
    
    // Validate all tasks exist
    FOR task IN tasks:
        IF NOT task:
            THROW TaskNotFoundError("One or more tasks not found")
    
    // Execute in parallel with Batchtools optimization
    results = PARALLEL FOR task IN tasks:
        analyzeTaskWithOptimization(task, batchContext)
    
    // Aggregate results
    aggregatedResult = aggregateAnalysisResults(results, batchContext)
    
    // Update performance metrics
    batchContext.recordMetrics(results)
    
    RETURN {
        operation: "parallel_analysis",
        taskCount: tasks.length,
        results: aggregatedResult,
        metrics: batchContext.getMetrics()
    }
```

### 8. Memory Integration
```pseudocode
FUNCTION handleMemoryStore(params):
    namespace = params.namespace OR "default"
    key = params.key
    data = params.data
    ttl = params.ttl OR 3600
    
    // Validate namespace access
    IF NOT hasNamespaceAccess(namespace):
        THROW AuthorizationError("Access denied to namespace: " + namespace)
    
    // Store in memory bank
    result = memoryBank.store(namespace, key, data, ttl)
    
    RETURN {
        namespace: namespace,
        key: key,
        stored: true,
        ttl: ttl,
        timestamp: getCurrentTimestamp()
    }

FUNCTION handleMemoryRetrieve(params):
    namespace = params.namespace OR "default" 
    key = params.key
    
    // Validate namespace access
    IF NOT hasNamespaceAccess(namespace):
        THROW AuthorizationError("Access denied to namespace: " + namespace)
    
    // Retrieve from memory bank
    data = memoryBank.retrieve(namespace, key)
    
    IF NOT data:
        THROW NotFoundError("Key not found: " + key)
    
    RETURN {
        namespace: namespace,
        key: key,
        data: data,
        retrieved: true,
        timestamp: getCurrentTimestamp()
    }
```

### 9. Error Handling and Recovery
```pseudocode
FUNCTION createErrorResponse(code, message, data):
    RETURN {
        jsonrpc: "2.0",
        error: {
            code: code,
            message: message,
            data: data
        },
        id: null
    }

FUNCTION handleTaskError(task, error):
    // Log error
    logger.error("Task error", {
        taskId: task.id,
        error: error.message,
        stack: error.stack
    })
    
    // Update task status
    task.updateStatus("failed", error.message)
    
    // Cleanup resources
    batchtoolsOptimizer.cleanupTask(task.id)
    
    // Send notification if SSE enabled
    IF task.sseConnectionId:
        sseConnection = sseManager.getConnection(task.sseConnectionId)
        IF sseConnection:
            sseConnection.sendEvent("error", {
                jsonrpc: "2.0",
                error: {
                    code: -32603,
                    message: "Task processing failed",
                    data: {
                        taskId: task.id,
                        error: error.message
                    }
                }
            })
    
    // Store error in memory for debugging
    memoryBank.store(
        namespace: "errors",
        key: task.id + "_error",
        data: {
            error: error.message,
            stack: error.stack,
            timestamp: getCurrentTimestamp()
        },
        ttl: 86400
    )
```

Esta lógica de pseudocódigo mapeia completamente a implementação dos endpoints A2A JSON-RPC com integração SPARC e Batchtools optimization.