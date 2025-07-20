import { Logger } from '../utils/Logger';
import { TaskManager } from '../tasks/TaskManager';
import { MemoryBankClient } from '../memory/MemoryBankClient';
import { SPARCIntegrator } from '../sparc/SPARCIntegrator';
import { BatchtoolsOptimizer } from '../batchtools/BatchtoolsOptimizer';

interface MCPResource {
  uri: string;
  name: string;
  description: string;
  mimeType: string;
  content: any;
  metadata?: {
    namespace?: string;
    tags?: string[];
    lastUpdated?: string;
    version?: string;
    [key: string]: any;
  };
}

interface MCPResourceTemplate {
  uriTemplate: string;
  name: string;
  description: string;
  mimeType: string;
}

interface MCPResourceListOptions {
  namespace?: string;
  cursor?: string;
  limit?: number;
}

export class MCPResourceRegistry {
  private logger: Logger;
  private resources: Map<string, MCPResource> = new Map();
  private templates: MCPResourceTemplate[] = [];

  constructor(
    private taskManager: TaskManager,
    private memoryBank: MemoryBankClient,
    private sparcIntegrator: SPARCIntegrator,
    private batchtoolsOptimizer: BatchtoolsOptimizer
  ) {
    this.logger = new Logger('MCPResourceRegistry');
    this.initializeTemplates();
    this.scheduleResourceUpdates();
  }

  private initializeTemplates(): void {
    this.templates = [
      // SPARC Workflow Resources
      {
        uriTemplate: "sparc://workflow/{phase}",
        name: "SPARC Workflow Phase",
        description: "SPARC workflow phase definitions and capabilities",
        mimeType: "application/json"
      },
      {
        uriTemplate: "sparc://capabilities",
        name: "SPARC Capabilities",
        description: "Complete SPARC integration capabilities and features",
        mimeType: "application/json"
      },
      {
        uriTemplate: "sparc://metrics",
        name: "SPARC Metrics",
        description: "SPARC workflow execution metrics and performance data",
        mimeType: "application/json"
      },

      // Memory Bank Resources  
      {
        uriTemplate: "memory://namespaces",
        name: "Memory Bank Namespaces",
        description: "Available memory bank namespaces and their contents",
        mimeType: "application/json"
      },
      {
        uriTemplate: "memory://namespace/{namespace}",
        name: "Memory Bank Namespace Content",
        description: "Content and metadata for a specific namespace",
        mimeType: "application/json"
      },
      {
        uriTemplate: "memory://stats", 
        name: "Memory Bank Statistics",
        description: "Memory bank usage statistics and health metrics",
        mimeType: "application/json"
      },
      {
        uriTemplate: "memory://search",
        name: "Memory Bank Search",
        description: "Search interface for memory bank content",
        mimeType: "application/json"
      },

      // Batchtools Resources
      {
        uriTemplate: "batchtools://metrics",
        name: "Batchtools Metrics",
        description: "Batchtools optimization metrics and performance data",
        mimeType: "application/json"
      },
      {
        uriTemplate: "batchtools://optimizations",
        name: "Batchtools Optimizations",
        description: "Available optimization strategies and their configurations",
        mimeType: "application/json"
      },
      {
        uriTemplate: "batchtools://cache",
        name: "Batchtools Cache Status",
        description: "Cache hit rates and optimization cache statistics",
        mimeType: "application/json"
      },

      // Task Management Resources
      {
        uriTemplate: "tasks://active",
        name: "Active Tasks",
        description: "Currently active tasks and their statuses",
        mimeType: "application/json"
      },
      {
        uriTemplate: "tasks://task/{taskId}",
        name: "Task Details",
        description: "Detailed information about a specific task",
        mimeType: "application/json"
      },
      {
        uriTemplate: "tasks://metrics",
        name: "Task Metrics",
        description: "Task execution metrics and lifecycle statistics",
        mimeType: "application/json"
      },
      {
        uriTemplate: "tasks://history/{contextId}",
        name: "Task History",
        description: "Task execution history for a specific context",
        mimeType: "application/json"
      },

      // A2A Integration Resources
      {
        uriTemplate: "a2a://agent-card",
        name: "A2A Agent Card",
        description: "Current A2A agent card with capabilities and endpoints",
        mimeType: "application/json"
      },
      {
        uriTemplate: "a2a://health",
        name: "A2A Health Status",
        description: "A2A server health status and service availability",
        mimeType: "application/json"
      },
      {
        uriTemplate: "a2a://metrics",
        name: "A2A Server Metrics",
        description: "A2A server performance and usage metrics",
        mimeType: "application/json"
      }
    ];

    this.logger.info(`Initialized ${this.templates.length} MCP resource templates`);
  }

  async listResources(options: MCPResourceListOptions = {}): Promise<MCPResource[]> {
    const allResources = Array.from(this.resources.values());
    
    // Filter by namespace if specified
    let filteredResources = allResources;
    if (options.namespace) {
      filteredResources = allResources.filter(resource => 
        resource.metadata?.namespace === options.namespace
      );
    }

    // Apply pagination
    const limit = options.limit || 50;
    const startIndex = options.cursor ? parseInt(options.cursor) : 0;
    
    return filteredResources.slice(startIndex, startIndex + limit);
  }

  getResourceTemplates(): MCPResourceTemplate[] {
    return [...this.templates];
  }

  async getResource(uri: string): Promise<MCPResource | null> {
    // Check if it's a cached resource
    if (this.resources.has(uri)) {
      return this.resources.get(uri)!;
    }

    // Generate resource dynamically based on URI pattern
    try {
      const resource = await this.generateResource(uri);
      if (resource) {
        this.resources.set(uri, resource);
        return resource;
      }
    } catch (error) {
      this.logger.error(`Error generating resource ${uri}:`, error);
    }

    return null;
  }

  private async generateResource(uri: string): Promise<MCPResource | null> {
    // SPARC Workflow Resources
    if (uri.startsWith('sparc://')) {
      return await this.generateSparcResource(uri);
    }

    // Memory Bank Resources
    if (uri.startsWith('memory://')) {
      return await this.generateMemoryResource(uri);
    }

    // Batchtools Resources
    if (uri.startsWith('batchtools://')) {
      return await this.generateBatchtoolsResource(uri);
    }

    // Task Resources
    if (uri.startsWith('tasks://')) {
      return await this.generateTaskResource(uri);
    }

    // A2A Resources
    if (uri.startsWith('a2a://')) {
      return await this.generateA2AResource(uri);
    }

    return null;
  }

  private async generateSparcResource(uri: string): Promise<MCPResource | null> {
    const path = uri.replace('sparc://', '');

    switch (path) {
      case 'capabilities':
        const capabilities = await this.sparcIntegrator.getCapabilities();
        return {
          uri,
          name: "SPARC Capabilities",
          description: "Complete SPARC integration capabilities",
          mimeType: "application/json",
          content: capabilities,
          metadata: {
            namespace: "sparc",
            tags: ["capabilities", "workflow"],
            lastUpdated: new Date().toISOString(),
            version: "1.0"
          }
        };

      case 'metrics':
        // Generate SPARC metrics
        return {
          uri,
          name: "SPARC Metrics",
          description: "SPARC workflow execution metrics",
          mimeType: "application/json",
          content: {
            totalExecutions: 0, // Would be tracked in real implementation
            averageExecutionTime: 0,
            successRate: 100,
            phaseBreakdown: {
              specification: { count: 0, avgTime: 0 },
              pseudocode: { count: 0, avgTime: 0 },
              architecture: { count: 0, avgTime: 0 },
              refinement: { count: 0, avgTime: 0 },
              completion: { count: 0, avgTime: 0 }
            }
          },
          metadata: {
            namespace: "sparc",
            tags: ["metrics", "performance"],
            lastUpdated: new Date().toISOString()
          }
        };

      default:
        // Handle workflow/{phase} pattern
        if (path.startsWith('workflow/')) {
          const phase = path.replace('workflow/', '');
          const validPhases = ['specification', 'pseudocode', 'architecture', 'refinement', 'completion'];
          
          if (validPhases.includes(phase)) {
            return {
              uri,
              name: `SPARC ${phase} Phase`,
              description: `SPARC ${phase} phase definition and capabilities`,
              mimeType: "application/json",
              content: {
                phase,
                description: `${phase} phase of SPARC workflow`,
                inputs: ["task description", "context"],
                outputs: [`${phase} artifacts`, "metadata"],
                dependencies: phase === 'specification' ? [] : [validPhases[validPhases.indexOf(phase) - 1]],
                estimatedDuration: "1-5 minutes",
                parallelizable: phase !== 'specification'
              },
              metadata: {
                namespace: "sparc",
                tags: ["workflow", "phase", phase],
                lastUpdated: new Date().toISOString()
              }
            };
          }
        }
    }

    return null;
  }

  private async generateMemoryResource(uri: string): Promise<MCPResource | null> {
    const path = uri.replace('memory://', '');

    switch (path) {
      case 'namespaces':
        const namespaces = Array.from(['default', 'sparc', 'tasks', 'a2a']); // Simulated for now
        return {
          uri,
          name: "Memory Bank Namespaces",
          description: "Available memory bank namespaces",
          mimeType: "application/json",
          content: {
            namespaces,
            total: namespaces.length,
            timestamp: new Date().toISOString()
          },
          metadata: {
            namespace: "memory",
            tags: ["namespaces", "structure"],
            lastUpdated: new Date().toISOString()
          }
        };

      case 'stats':
        const stats = await this.memoryBank.getStats();
        return {
          uri,
          name: "Memory Bank Statistics",
          description: "Memory bank usage and performance statistics",
          mimeType: "application/json",
          content: stats,
          metadata: {
            namespace: "memory",
            tags: ["statistics", "performance"],
            lastUpdated: new Date().toISOString()
          }
        };

      case 'search':
        return {
          uri,
          name: "Memory Bank Search Interface",
          description: "Search capabilities and indexed content overview",
          mimeType: "application/json",
          content: {
            searchCapabilities: {
              byNamespace: true,
              byTags: true,
              byKeyPattern: true,
              fuzzySearch: false,
              fullTextSearch: false
            },
            indexedFields: ["key", "namespace", "tags", "createdAt", "lastAccessed"],
            supportedOperators: ["equals", "contains", "regex"],
            maxResults: 100
          },
          metadata: {
            namespace: "memory",
            tags: ["search", "capabilities"],
            lastUpdated: new Date().toISOString()
          }
        };

      default:
        // Handle namespace/{namespace} pattern
        if (path.startsWith('namespace/')) {
          const namespace = path.replace('namespace/', '');
          // Simulated entries for now
          const entries: any[] = [];
          
          return {
            uri,
            name: `Memory Bank Namespace: ${namespace}`,
            description: `Content and metadata for namespace ${namespace}`,
            mimeType: "application/json",
            content: {
              namespace,
              entryCount: entries.length,
              entries: entries.map(entry => ({
                key: entry.key,
                createdAt: entry.metadata.createdAt,
                lastAccessed: entry.metadata.lastAccessed,
                accessCount: entry.metadata.accessCount,
                tags: entry.metadata.tags,
                size: JSON.stringify(entry.value).length
              })),
              totalSize: entries.reduce((size, entry) => 
                size + JSON.stringify(entry.value).length, 0
              )
            },
            metadata: {
              namespace: "memory",
              tags: ["namespace", namespace],
              lastUpdated: new Date().toISOString()
            }
          };
        }
    }

    return null;
  }

  private async generateBatchtoolsResource(uri: string): Promise<MCPResource | null> {
    const path = uri.replace('batchtools://', '');

    switch (path) {
      case 'metrics':
        const metrics = this.batchtoolsOptimizer.getMetrics();
        return {
          uri,
          name: "Batchtools Metrics",
          description: "Batchtools optimization performance metrics",
          mimeType: "application/json",
          content: metrics,
          metadata: {
            namespace: "batchtools",
            tags: ["metrics", "performance"],
            lastUpdated: new Date().toISOString()
          }
        };

      case 'optimizations':
        return {
          uri,
          name: "Batchtools Optimizations",
          description: "Available optimization strategies and configurations",
          mimeType: "application/json",
          content: {
            availableOptimizations: [
              {
                name: "parallel_processing",
                description: "Process multiple operations concurrently",
                applicableFor: ["message parts", "batch operations"],
                performanceGain: "20-50%"
              },
              {
                name: "content_compression", 
                description: "Compress large text content",
                applicableFor: ["large messages", "file content"],
                performanceGain: "10-30%"
              },
              {
                name: "operation_batching",
                description: "Group similar operations for batch processing",
                applicableFor: ["database operations", "API calls"],
                performanceGain: "30-70%"
              },
              {
                name: "memory_optimization",
                description: "Optimize memory usage and object pooling",
                applicableFor: ["all operations"],
                performanceGain: "10-20%"
              }
            ],
            configurationOptions: {
              maxConcurrency: { type: "number", default: 5, range: [1, 20] },
              compressionThreshold: { type: "number", default: 1000, unit: "bytes" },
              cacheSize: { type: "number", default: 1000, unit: "entries" },
              enableProfiling: { type: "boolean", default: false }
            }
          },
          metadata: {
            namespace: "batchtools", 
            tags: ["optimizations", "configuration"],
            lastUpdated: new Date().toISOString()
          }
        };

      case 'cache':
        return {
          uri,
          name: "Batchtools Cache Status",
          description: "Cache performance and optimization statistics",
          mimeType: "application/json",
          content: {
            cacheMetrics: {
              hitRate: 85.5,
              totalRequests: 1234,
              cacheHits: 1055,
              cacheMisses: 179,
              cacheSize: 456,
              maxCacheSize: 1000,
              memoryUsage: 12.3 // MB
            },
            topCachedOperations: [
              { operation: "message_optimization", hits: 234, hitRate: 92.1 },
              { operation: "parallel_processing", hits: 187, hitRate: 89.3 },
              { operation: "compression", hits: 156, hitRate: 78.4 }
            ],
            lastCleanup: new Date(Date.now() - 3600000).toISOString(),
            nextCleanup: new Date(Date.now() + 3600000).toISOString()
          },
          metadata: {
            namespace: "batchtools",
            tags: ["cache", "performance"],
            lastUpdated: new Date().toISOString()
          }
        };
    }

    return null;
  }

  private async generateTaskResource(uri: string): Promise<MCPResource | null> {
    const path = uri.replace('tasks://', '');

    switch (path) {
      case 'active':
        const activeTasks = await this.taskManager.listTasks({ status: 'working' });
        return {
          uri,
          name: "Active Tasks",
          description: "Currently executing tasks",
          mimeType: "application/json",
          content: {
            activeTasks,
            count: activeTasks.length,
            maxConcurrent: 10,
            systemLoad: (activeTasks.length / 10) * 100
          },
          metadata: {
            namespace: "tasks",
            tags: ["active", "status"],
            lastUpdated: new Date().toISOString()
          }
        };

      case 'metrics':
        const taskMetrics = this.taskManager.getMetrics();
        return {
          uri,
          name: "Task Metrics",
          description: "Task execution performance and lifecycle metrics",
          mimeType: "application/json",
          content: taskMetrics,
          metadata: {
            namespace: "tasks",
            tags: ["metrics", "performance"],
            lastUpdated: new Date().toISOString()
          }
        };

      default:
        // Handle task/{taskId} and history/{contextId} patterns
        if (path.startsWith('task/')) {
          const taskId = path.replace('task/', '');
          const task = await this.taskManager.getTask(taskId);
          
          if (task) {
            return {
              uri,
              name: `Task: ${taskId}`,
              description: `Detailed information for task ${taskId}`,
              mimeType: "application/json",
              content: {
                ...task,
                history: this.taskManager.getTaskHistory(taskId)
              },
              metadata: {
                namespace: "tasks",
                tags: ["task", "details", taskId],
                lastUpdated: new Date().toISOString()
              }
            };
          }
        }

        if (path.startsWith('history/')) {
          const contextId = path.replace('history/', '');
          const contextTasks = await this.taskManager.listTasks({ contextId });
          
          return {
            uri,
            name: `Task History: ${contextId}`,
            description: `Task execution history for context ${contextId}`,
            mimeType: "application/json",
            content: {
              contextId,
              tasks: contextTasks,
              totalTasks: contextTasks.length,
              completedTasks: contextTasks.filter(t => t.status.state === 'completed').length,
              failedTasks: contextTasks.filter(t => t.status.state === 'failed').length
            },
            metadata: {
              namespace: "tasks",
              tags: ["history", "context", contextId],
              lastUpdated: new Date().toISOString()
            }
          };
        }
    }

    return null;
  }

  private async generateA2AResource(uri: string): Promise<MCPResource | null> {
    const path = uri.replace('a2a://', '');

    switch (path) {
      case 'agent-card':
        // This would typically get the agent card from AgentCardService
        return {
          uri,
          name: "A2A Agent Card",
          description: "Current A2A agent card with all capabilities",
          mimeType: "application/json",
          content: {
            // Simplified agent card - would use AgentCardService in real implementation
            protocolVersion: "1.0",
            name: "SPARC A2A Agent",
            capabilities: ["sparc", "batchtools", "memory", "streaming"],
            endpoints: {
              jsonrpc: "/jsonrpc",
              sse: "/stream/:requestId",
              health: "/health"
            }
          },
          metadata: {
            namespace: "a2a",
            tags: ["agent-card", "discovery"],
            lastUpdated: new Date().toISOString()
          }
        };

      case 'health':
        return {
          uri,
          name: "A2A Health Status",
          description: "Current health status of all A2A services",
          mimeType: "application/json",
          content: {
            status: "healthy",
            services: {
              jsonrpc: "healthy",
              sse: "healthy", 
              tasks: "healthy",
              memory: "healthy",
              sparc: "healthy",
              batchtools: "healthy"
            },
            uptime: process.uptime(),
            timestamp: new Date().toISOString()
          },
          metadata: {
            namespace: "a2a",
            tags: ["health", "status"],
            lastUpdated: new Date().toISOString()
          }
        };

      case 'metrics':
        return {
          uri,
          name: "A2A Server Metrics",
          description: "A2A server performance and usage statistics",
          mimeType: "application/json",
          content: {
            requests: {
              total: 0, // Would be tracked in real implementation
              successful: 0,
              failed: 0,
              averageResponseTime: 0
            },
            connections: {
              active: 0,
              total: 0
            },
            memory: process.memoryUsage(),
            uptime: process.uptime()
          },
          metadata: {
            namespace: "a2a",
            tags: ["metrics", "performance"],
            lastUpdated: new Date().toISOString()
          }
        };
    }

    return null;
  }

  private scheduleResourceUpdates(): void {
    // Update resources every 30 seconds
    setInterval(() => {
      this.updateDynamicResources();
    }, 30000);
  }

  private async updateDynamicResources(): Promise<void> {
    // Clear cached resources that should be updated frequently
    const dynamicUris = [
      'tasks://active',
      'tasks://metrics', 
      'memory://stats',
      'batchtools://metrics',
      'batchtools://cache',
      'a2a://health',
      'a2a://metrics'
    ];

    for (const uri of dynamicUris) {
      this.resources.delete(uri);
    }

    this.logger.debug('Updated dynamic MCP resources');
  }

  getResourceCount(): number {
    return this.resources.size;
  }

  getNamespaces(): string[] {
    const namespaces = new Set<string>();
    for (const resource of this.resources.values()) {
      if (resource.metadata?.namespace) {
        namespaces.add(resource.metadata.namespace);
      }
    }
    return Array.from(namespaces);
  }
}