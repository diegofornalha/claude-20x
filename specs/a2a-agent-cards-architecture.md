# SPARC Architecture: Agent Cards System Design

## Overview
Arquitetura completa do sistema de Agent Cards A2A com validação, registro dinâmico, monitoramento e integração com SPARC workflow e Batchtools optimization.

## System Architecture

### 1. Layer Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                    Presentation Layer                       │
├─────────────────────────────────────────────────────────────┤
│  HTTP Endpoints  │  WebSocket  │  CLI Interface  │  Dashboard │
└─────────────────────────────────────────────────────────────┘
                                │
┌─────────────────────────────────────────────────────────────┐
│                    Service Layer                            │
├─────────────────────────────────────────────────────────────┤
│ AgentCardManager │ ValidationService │ RegistryService │ ... │
└─────────────────────────────────────────────────────────────┘
                                │
┌─────────────────────────────────────────────────────────────┐
│                    Business Logic Layer                     │
├─────────────────────────────────────────────────────────────┤
│ CardFactory │ SPARCIntegration │ BatchtoolsOptimizer │ ... │
└─────────────────────────────────────────────────────────────┘
                                │
┌─────────────────────────────────────────────────────────────┐
│                    Data Access Layer                        │
├─────────────────────────────────────────────────────────────┤
│ FileSystemRepo │ MemoryRepo │ ConfigRepo │ ValidationRepo │
└─────────────────────────────────────────────────────────────┘
                                │
┌─────────────────────────────────────────────────────────────┐
│                    Infrastructure Layer                     │
├─────────────────────────────────────────────────────────────┤
│ File System │ Memory Bank │ Config Files │ External APIs │
└─────────────────────────────────────────────────────────────┘
```

### 2. Core Components

#### AgentCardManager (Central Orchestrator)
```typescript
interface AgentCardManager {
  // Core operations
  generateCard(agentType: AgentType, config?: AgentConfig): Promise<AgentCard>;
  registerCard(agentCard: AgentCard): Promise<RegistrationResult>;
  updateCard(agentType: AgentType, updates: Partial<AgentCard>): Promise<void>;
  validateCard(agentCard: AgentCard): ValidationResult;
  
  // Discovery and management
  listCards(): Promise<AgentCard[]>;
  getCard(agentType: AgentType): Promise<AgentCard | null>;
  isCardAccessible(agentType: AgentType): Promise<boolean>;
  
  // Integration hooks
  onSPARCPhaseChange(callback: (phase: SPARCPhase, agentType: AgentType) => void): void;
  onBatchtoolsMetrics(callback: (metrics: BatchtoolsMetrics) => void): void;
  onCardUpdate(callback: (agentType: AgentType, card: AgentCard) => void): void;
}
```

#### ValidationService (A2A Compliance)
```typescript
interface ValidationService {
  validateA2ACompliance(card: AgentCard): ValidationResult;
  validateSkills(skills: AgentSkill[]): SkillValidationResult;
  validateCapabilities(capabilities: AgentCapabilities): boolean;
  validateSecuritySchemes(schemes: SecurityScheme[]): boolean;
  validateExtensions(extensions: AgentExtension[]): boolean;
  
  // Schema validation
  validateAgainstSchema(card: AgentCard, schema: JSONSchema): boolean;
  getValidationErrors(card: AgentCard): ValidationError[];
  suggestFixes(errors: ValidationError[]): ValidationFix[];
}
```

#### RegistryService (Dynamic Registration)
```typescript
interface RegistryService {
  register(agentType: AgentType, card: AgentCard): Promise<void>;
  unregister(agentType: AgentType): Promise<void>;
  update(agentType: AgentType, updates: Partial<AgentCard>): Promise<void>;
  
  // Discovery
  discover(): Promise<AgentCard[]>;
  findByCapability(capability: string): Promise<AgentCard[]>;
  findBySkill(skillId: string): Promise<AgentCard[]>;
  
  // Health monitoring
  checkHealth(agentType: AgentType): Promise<HealthStatus>;
  monitorAvailability(): AsyncIterable<AvailabilityEvent>;
}
```

### 3. Data Models

#### Core Data Structures
```typescript
// Agent Card (A2A v0.2.9 compliant)
interface AgentCard {
  protocolVersion: "0.2.9";
  name: string;
  description: string;
  url: string;
  preferredTransport: "JSONRPC" | "GRPC" | "HTTP+JSON";
  additionalInterfaces?: AgentInterface[];
  provider: AgentProvider;
  iconUrl?: string;
  version: string;
  documentationUrl?: string;
  capabilities: AgentCapabilities;
  securitySchemes?: Record<string, SecurityScheme>;
  security?: SecurityRequirement[];
  defaultInputModes: string[];
  defaultOutputModes: string[];
  skills: AgentSkill[];
  extensions?: AgentExtension[];
  
  // SPARC-specific metadata
  sparcPhase?: SPARCPhase;
  batchtoolsOptimized?: boolean;
  lastUpdated?: string;
  performance?: PerformanceMetrics;
}

// SPARC Integration Metadata
interface SPARCMetadata {
  supportedPhases: SPARCPhase[];
  currentPhase?: SPARCPhase;
  phaseOptimizations: Record<SPARCPhase, string[]>;
  workflowId?: string;
  batchProcessingEnabled: boolean;
  parallelCapabilities: ParallelCapability[];
}

// Batchtools Performance Data
interface PerformanceMetrics {
  parallelEfficiency: number;
  concurrentTasks: number;
  averageResponseTime: number;
  throughput: number;
  resourceUtilization: ResourceUsage;
  lastMeasured: string;
}
```

#### Configuration Models
```typescript
interface AgentSystemConfig {
  registry: {
    basePort: number;
    portRange: [number, number];
    enableAutoDiscovery: boolean;
    healthCheckInterval: number;
  };
  
  validation: {
    strictMode: boolean;
    allowedExtensions: string[];
    requiredCapabilities: string[];
    customValidators: ValidationRule[];
  };
  
  sparc: {
    enablePhaseTracking: boolean;
    autoUpdateOnPhaseChange: boolean;
    phaseOptimizations: Record<SPARCPhase, OptimizationConfig>;
  };
  
  batchtools: {
    enableMetricsCollection: boolean;
    performanceThresholds: PerformanceThreshold[];
    optimizationTriggers: OptimizationTrigger[];
  };
  
  security: {
    defaultSchemes: string[];
    enforceHTTPS: boolean;
    allowedOrigins: string[];
    tokenValidation: TokenValidationConfig;
  };
}
```

### 4. Service Implementation Architecture

#### Agent Card Factory
```typescript
class AgentCardFactory {
  private templateEngine: TemplateEngine;
  private skillGenerator: SkillGenerator;
  private capabilityResolver: CapabilityResolver;
  private sparcIntegrator: SPARCIntegrator;
  
  async generateCard(
    agentType: AgentType, 
    config: AgentConfig,
    sparcContext?: SPARCContext
  ): Promise<AgentCard> {
    // 1. Load base template
    const template = await this.templateEngine.load(agentType);
    
    // 2. Generate skills based on SPARC phase and agent type
    const skills = await this.skillGenerator.generate(agentType, sparcContext);
    
    // 3. Resolve capabilities with Batchtools optimization
    const capabilities = await this.capabilityResolver.resolve(agentType, config);
    
    // 4. Apply SPARC-specific enhancements
    const sparcEnhancements = await this.sparcIntegrator.enhance(template, sparcContext);
    
    // 5. Merge and validate
    const card = this.mergeComponents(template, skills, capabilities, sparcEnhancements);
    
    return card;
  }
}
```

#### Registry Service Implementation
```typescript
class RegistryServiceImpl implements RegistryService {
  private fileSystem: FileSystemRepository;
  private memoryCache: MemoryRepository;
  private healthMonitor: HealthMonitor;
  private eventBus: EventBus;
  
  async register(agentType: AgentType, card: AgentCard): Promise<void> {
    // 1. Validate card
    const validationResult = await this.validateCard(card);
    if (!validationResult.isValid) {
      throw new ValidationError(validationResult.errors);
    }
    
    // 2. Determine file path
    const filePath = this.getCardPath(agentType);
    
    // 3. Ensure directory exists
    await this.fileSystem.ensureDirectory(path.dirname(filePath));
    
    // 4. Write to file system
    await this.fileSystem.writeJSON(filePath, card);
    
    // 5. Update memory cache
    await this.memoryCache.set(agentType, card);
    
    // 6. Start health monitoring
    await this.healthMonitor.startMonitoring(agentType, card.url);
    
    // 7. Emit registration event
    this.eventBus.emit('agent.registered', { agentType, card });
    
    // 8. Update central registry
    await this.updateCentralRegistry(agentType, card);
  }
  
  private getCardPath(agentType: AgentType): string {
    return `./agents/.well-known/${agentType}-agent.json`;
  }
}
```

### 5. Integration Architecture

#### SPARC Workflow Integration
```typescript
class SPARCIntegrationService {
  private cardManager: AgentCardManager;
  private workflowMonitor: SPARCWorkflowMonitor;
  private phaseOptimizer: PhaseOptimizer;
  
  async initialize(): Promise<void> {
    // Monitor SPARC phase changes
    this.workflowMonitor.onPhaseChange(async (phase, context) => {
      await this.handlePhaseChange(phase, context);
    });
    
    // Monitor workflow completion
    this.workflowMonitor.onWorkflowComplete(async (workflowId, results) => {
      await this.handleWorkflowCompletion(workflowId, results);
    });
  }
  
  private async handlePhaseChange(phase: SPARCPhase, context: SPARCContext): Promise<void> {
    // Get relevant agents for this phase
    const relevantAgents = this.getAgentsForPhase(phase);
    
    // Update agent cards in parallel
    await Promise.all(relevantAgents.map(async (agentType) => {
      const optimizations = await this.phaseOptimizer.getOptimizations(phase, agentType);
      
      await this.cardManager.updateCard(agentType, {
        sparcPhase: phase,
        phaseOptimizations: optimizations,
        lastUpdated: new Date().toISOString()
      });
    }));
  }
}
```

#### Batchtools Performance Integration
```typescript
class BatchtoolsIntegrationService {
  private performanceCollector: PerformanceCollector;
  private cardOptimizer: CardOptimizer;
  private thresholdMonitor: ThresholdMonitor;
  
  async initialize(): Promise<void> {
    // Collect performance metrics
    this.performanceCollector.onMetrics(async (metrics) => {
      await this.handlePerformanceMetrics(metrics);
    });
    
    // Monitor performance thresholds
    this.thresholdMonitor.onThresholdExceeded(async (threshold, agent) => {
      await this.handleThresholdExceeded(threshold, agent);
    });
  }
  
  private async handlePerformanceMetrics(metrics: BatchtoolsMetrics): Promise<void> {
    for (const [agentType, agentMetrics] of Object.entries(metrics.agents)) {
      // Update agent card with performance data
      await this.cardManager.updateCard(agentType, {
        performance: {
          parallelEfficiency: agentMetrics.efficiency,
          concurrentTasks: agentMetrics.concurrentTasks,
          averageResponseTime: agentMetrics.avgResponseTime,
          throughput: agentMetrics.throughput,
          resourceUtilization: agentMetrics.resources,
          lastMeasured: new Date().toISOString()
        }
      });
      
      // Apply optimizations if needed
      if (agentMetrics.efficiency > 0.8) {
        await this.cardOptimizer.enhanceParallelCapabilities(agentType);
      }
    }
  }
}
```

### 6. Deployment Architecture

#### File System Structure
```
agents/
├── .well-known/                     # A2A Agent Cards
│   ├── researcher-agent.json        # Researcher agent card
│   ├── coder-agent.json             # Coder agent card
│   ├── analyst-agent.json           # Analyst agent card
│   └── coordinator-agent.json       # Coordinator agent card
├── registry/                        # Registry data
│   ├── central-registry.json        # Central agent registry
│   ├── health-status.json           # Health monitoring data
│   └── performance-cache.json       # Performance metrics cache
├── templates/                       # Agent card templates
│   ├── base-template.json           # Base A2A template
│   ├── sparc-enhancements.json      # SPARC-specific enhancements
│   └── batchtools-optimizations.json # Batchtools optimizations
├── validation/                      # Validation schemas and rules
│   ├── a2a-schema.json              # A2A protocol schema
│   ├── sparc-extensions.json        # SPARC extension schemas
│   └── custom-validators.ts         # Custom validation rules
└── config/                          # Configuration files
    ├── agent-system.config.json     # Main system configuration
    ├── security.config.json         # Security configuration
    └── performance.config.json      # Performance thresholds
```

#### Service Deployment
```typescript
// Main service orchestrator
class AgentCardSystemOrchestrator {
  private services: Map<string, Service> = new Map();
  
  async initialize(): Promise<void> {
    // Initialize core services
    this.services.set('cardManager', new AgentCardManager());
    this.services.set('validation', new ValidationService());
    this.services.set('registry', new RegistryService());
    this.services.set('sparcIntegration', new SPARCIntegrationService());
    this.services.set('batchtoolsIntegration', new BatchtoolsIntegrationService());
    
    // Initialize all services
    for (const service of this.services.values()) {
      await service.initialize();
    }
    
    // Setup service dependencies
    await this.setupDependencies();
    
    // Start health monitoring
    await this.startHealthMonitoring();
  }
  
  async shutdown(): Promise<void> {
    for (const service of this.services.values()) {
      await service.shutdown();
    }
  }
}
```

### 7. Monitoring and Observability

#### Health Monitoring Architecture
```typescript
interface HealthMonitoringSystem {
  // Agent card accessibility
  checkCardAccessibility(agentType: AgentType): Promise<AccessibilityStatus>;
  
  // Service health
  checkServiceHealth(): Promise<ServiceHealthStatus>;
  
  // Performance monitoring
  collectPerformanceMetrics(): Promise<PerformanceMetrics>;
  
  // Error tracking
  trackValidationErrors(errors: ValidationError[]): void;
  
  // Alerting
  setupAlerts(config: AlertConfig): void;
}
```

#### Logging and Tracing
```typescript
interface LoggingSystem {
  // Structured logging
  logCardGeneration(agentType: AgentType, duration: number, success: boolean): void;
  logCardUpdate(agentType: AgentType, changes: Partial<AgentCard>): void;
  logValidationResult(card: AgentCard, result: ValidationResult): void;
  
  // Distributed tracing
  traceCardLifecycle(agentType: AgentType): Span;
  traceValidationFlow(card: AgentCard): Span;
  traceSPARCIntegration(phase: SPARCPhase, agents: AgentType[]): Span;
}
```

Esta arquitetura garante um sistema robusto, escalável e totalmente integrado com SPARC methodology e Batchtools optimization, mantendo compliance total com A2A protocol v0.2.9.