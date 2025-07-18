/**
 * MockAgent - Agent simulado para testes
 * Simula comportamento de agente A2A com configuração de latência e erros
 */

class MockAgent {
  constructor(options = {}) {
    this.name = options.name || 'TestAgent';
    this.version = options.version || '1.0.0';
    this.latency = options.latency || 0; // Simular latência em ms
    this.errorRate = options.errorRate || 0; // % de erro (0-1)
    this.capabilities = options.capabilities || ['communicate', 'delegate'];
    this.isHealthy = options.isHealthy !== false;
    
    // Contadores para verificação nos testes
    this.callCounts = {
      discover: 0,
      communicate: 0,
      delegate: 0,
      health: 0
    };
    
    // Responses customizáveis
    this.responses = {
      discover: null,
      communicate: null,
      delegate: null,
      health: null
    };
  }

  /**
   * Simular latência se configurada
   */
  async _simulateLatency() {
    if (this.latency > 0) {
      await new Promise(resolve => setTimeout(resolve, this.latency));
    }
  }

  /**
   * Simular erro baseado na taxa configurada
   */
  _shouldSimulateError() {
    return Math.random() < this.errorRate;
  }

  /**
   * Endpoint discovery - retorna capacidades do agente
   */
  async discover() {
    this.callCounts.discover++;
    await this._simulateLatency();
    
    if (this._shouldSimulateError()) {
      throw new Error('Mock discovery error');
    }

    if (this.responses.discover) {
      return this.responses.discover;
    }

    return {
      name: this.name,
      version: this.version,
      description: `Mock agent for testing: ${this.name}`,
      capabilities: this.capabilities,
      endpoints: {
        communicate: '/communicate',
        delegate: '/delegate',
        health: '/health'
      },
      protocols: ['A2A/1.0'],
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Endpoint communicate - comunicação direta
   */
  async communicate(data) {
    this.callCounts.communicate++;
    await this._simulateLatency();
    
    if (this._shouldSimulateError()) {
      throw new Error('Mock communication error');
    }

    if (this.responses.communicate) {
      return this.responses.communicate;
    }

    return {
      success: true,
      agent: this.name,
      message: `Received communication: ${JSON.stringify(data)}`,
      echo: data,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Endpoint delegate - delegação de tarefas
   */
  async delegate(task) {
    this.callCounts.delegate++;
    await this._simulateLatency();
    
    if (this._shouldSimulateError()) {
      throw new Error('Mock delegation error');
    }

    if (this.responses.delegate) {
      return this.responses.delegate;
    }

    return {
      success: true,
      agent: this.name,
      taskId: `task_${Date.now()}`,
      task: task,
      status: 'accepted',
      estimatedCompletion: new Date(Date.now() + 5000).toISOString(),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Endpoint health - verificação de saúde
   */
  async health() {
    this.callCounts.health++;
    await this._simulateLatency();
    
    if (this._shouldSimulateError()) {
      throw new Error('Mock health check error');
    }

    if (this.responses.health) {
      return this.responses.health;
    }

    return {
      status: this.isHealthy ? 'healthy' : 'unhealthy',
      agent: this.name,
      version: this.version,
      uptime: Math.floor(Math.random() * 10000),
      memory: {
        used: Math.floor(Math.random() * 100) + 'MB',
        total: '256MB'
      },
      lastCheck: new Date().toISOString(),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Configurar response customizada para endpoint
   */
  setResponse(endpoint, response) {
    if (this.responses.hasOwnProperty(endpoint)) {
      this.responses[endpoint] = response;
    }
  }

  /**
   * Reset contadores e responses
   */
  reset() {
    this.callCounts = {
      discover: 0,
      communicate: 0,
      delegate: 0,
      health: 0
    };
    
    this.responses = {
      discover: null,
      communicate: null,
      delegate: null,
      health: null
    };
  }

  /**
   * Getter para verificar total de chamadas
   */
  get totalCalls() {
    return Object.values(this.callCounts).reduce((sum, count) => sum + count, 0);
  }
}

module.exports = MockAgent;