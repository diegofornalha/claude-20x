import { Logger } from '../utils/Logger';

interface MemoryBankConfig {
  url: string;
  namespace: string;
  timeout?: number;
  retryAttempts?: number;
}

interface StoreOptions {
  namespace?: string;
  ttl?: number;
  metadata?: any;
}

interface RetrieveOptions {
  namespace?: string;
  defaultValue?: any;
}

interface SearchOptions {
  namespace?: string;
  limit?: number;
  pattern?: string;
}

export class MemoryBankClient {
  private logger: Logger;
  private baseUrl: string;
  private defaultNamespace: string;
  private timeout: number;
  private retryAttempts: number;

  constructor(config?: MemoryBankConfig) {
    this.logger = new Logger('MemoryBankClient');
    this.baseUrl = config?.url || 'http://localhost:5000';
    this.defaultNamespace = config?.namespace || 'default';
    this.timeout = config?.timeout || 5000;
    this.retryAttempts = config?.retryAttempts || 3;
  }

  async store(key: string, value: any, options: StoreOptions = {}): Promise<void> {
    const namespace = options.namespace || this.defaultNamespace;
    const payload = {
      action: 'store',
      key: this.namespaceKey(key, namespace),
      value,
      ttl: options.ttl,
      metadata: {
        ...options.metadata,
        timestamp: new Date().toISOString(),
        namespace
      }
    };

    try {
      await this.makeRequest('POST', '/memory', payload);
      this.logger.debug(`Stored key: ${key} in namespace: ${namespace}`);
    } catch (error) {
      this.logger.error(`Failed to store key ${key}:`, error);
      throw error;
    }
  }  async retrieve(key: string, options: RetrieveOptions = {}): Promise<any> {
    const namespace = options.namespace || this.defaultNamespace;
    const namespacedKey = this.namespaceKey(key, namespace);

    try {
      const response = await this.makeRequest('GET', `/memory/${encodeURIComponent(namespacedKey)}`);
      
      if (response.found) {
        this.logger.debug(`Retrieved key: ${key} from namespace: ${namespace}`);
        return response.value;
      } else {
        this.logger.debug(`Key not found: ${key} in namespace: ${namespace}`);
        return options.defaultValue || null;
      }
    } catch (error) {
      this.logger.error(`Failed to retrieve key ${key}:`, error);
      return options.defaultValue || null;
    }
  }

  async delete(key: string, namespace?: string): Promise<boolean> {
    const ns = namespace || this.defaultNamespace;
    const namespacedKey = this.namespaceKey(key, ns);

    try {
      await this.makeRequest('DELETE', `/memory/${encodeURIComponent(namespacedKey)}`);
      this.logger.debug(`Deleted key: ${key} from namespace: ${ns}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to delete key ${key}:`, error);
      return false;
    }
  }

  async list(options: SearchOptions = {}): Promise<string[]> {
    const namespace = options.namespace || this.defaultNamespace;
    const params = new URLSearchParams({
      action: 'list',
      namespace,
      ...(options.limit && { limit: options.limit.toString() }),
      ...(options.pattern && { pattern: options.pattern })
    });

    try {
      const response = await this.makeRequest('GET', `/memory?${params}`);
      return response.keys || [];
    } catch (error) {
      this.logger.error('Failed to list keys:', error);
      return [];
    }
  }  async search(pattern: string, options: SearchOptions = {}): Promise<any[]> {
    const namespace = options.namespace || this.defaultNamespace;
    const params = new URLSearchParams({
      action: 'search',
      pattern,
      namespace,
      ...(options.limit && { limit: options.limit.toString() })
    });

    try {
      const response = await this.makeRequest('GET', `/memory/search?${params}`);
      return response.results || [];
    } catch (error) {
      this.logger.error(`Failed to search pattern ${pattern}:`, error);
      return [];
    }
  }

  async exists(key: string, namespace?: string): Promise<boolean> {
    const ns = namespace || this.defaultNamespace;
    const namespacedKey = this.namespaceKey(key, ns);

    try {
      const response = await this.makeRequest('HEAD', `/memory/${encodeURIComponent(namespacedKey)}`);
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }

  async clear(namespace?: string): Promise<void> {
    const ns = namespace || this.defaultNamespace;

    try {
      await this.makeRequest('DELETE', `/memory/namespace/${encodeURIComponent(ns)}`);
      this.logger.info(`Cleared namespace: ${ns}`);
    } catch (error) {
      this.logger.error(`Failed to clear namespace ${ns}:`, error);
      throw error;
    }
  }

  async getStats(namespace?: string): Promise<any> {
    const ns = namespace || this.defaultNamespace;
    const params = new URLSearchParams({ namespace: ns });

    try {
      const response = await this.makeRequest('GET', `/memory/stats?${params}`);
      return response.stats || {};
    } catch (error) {
      this.logger.error(`Failed to get stats for namespace ${ns}:`, error);
      return {};
    }
  }  // SPARC Workflow Integration
  async storeSPARCState(contextId: string, phase: string, state: any): Promise<void> {
    const key = `sparc:${contextId}:${phase}`;
    await this.store(key, state, {
      namespace: 'sparc-workflow',
      ttl: 3600000, // 1 hour
      metadata: {
        phase,
        contextId,
        workflow: 'sparc'
      }
    });
  }

  async retrieveSPARCState(contextId: string, phase: string): Promise<any> {
    const key = `sparc:${contextId}:${phase}`;
    return await this.retrieve(key, { namespace: 'sparc-workflow' });
  }

  async getSPARCWorkflowHistory(contextId: string): Promise<any[]> {
    const pattern = `sparc:${contextId}:*`;
    return await this.search(pattern, { namespace: 'sparc-workflow' });
  }

  // A2A Protocol Integration
  async storeTaskState(taskId: string, state: any): Promise<void> {
    const key = `task:${taskId}`;
    await this.store(key, state, {
      namespace: 'a2a-tasks',
      ttl: 86400000, // 24 hours
      metadata: {
        taskId,
        protocol: 'a2a'
      }
    });
  }

  async retrieveTaskState(taskId: string): Promise<any> {
    const key = `task:${taskId}`;
    return await this.retrieve(key, { namespace: 'a2a-tasks' });
  }

  async storeAgentState(agentId: string, state: any): Promise<void> {
    const key = `agent:${agentId}`;
    await this.store(key, state, {
      namespace: 'a2a-agents',
      ttl: 3600000, // 1 hour
      metadata: {
        agentId,
        protocol: 'a2a'
      }
    });
  }  // Batchtools Integration
  async storeBatchResult(batchId: string, result: any): Promise<void> {
    const key = `batch:${batchId}`;
    await this.store(key, result, {
      namespace: 'batchtools',
      ttl: 1800000, // 30 minutes
      metadata: {
        batchId,
        optimization: 'batchtools'
      }
    });
  }

  async retrieveBatchResult(batchId: string): Promise<any> {
    const key = `batch:${batchId}`;
    return await this.retrieve(key, { namespace: 'batchtools' });
  }

  // Utility methods
  private namespaceKey(key: string, namespace: string): string {
    return `${namespace}:${key}`;
  }

  private async makeRequest(method: string, path: string, body?: any): Promise<any> {
    const url = `${this.baseUrl}${path}`;
    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'A2A-Server-MemoryBankClient/1.0'
      },
      signal: AbortSignal.timeout(this.timeout)
    };

    if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      options.body = JSON.stringify(body);
    }

    let lastError: Error;
    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        const response = await fetch(url, options);
        
        if (method === 'HEAD') {
          return { status: response.status };
        }

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const text = await response.text();
        return text ? JSON.parse(text) : {};

      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        if (attempt < this.retryAttempts) {
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
          this.logger.warn(`Request failed (attempt ${attempt}/${this.retryAttempts}), retrying in ${delay}ms:`, error);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError!;
  }

  // Health check
  async ping(): Promise<boolean> {
    try {
      await this.makeRequest('GET', '/health');
      return true;
    } catch (error) {
      this.logger.warn('Memory bank ping failed:', error);
      return false;
    }
  }
}