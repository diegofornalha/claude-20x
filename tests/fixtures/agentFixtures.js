/**
 * Agent Fixtures - Dados de teste para agentes A2A
 */

const agentFixtures = {
  // Discover responses típicas
  discovery: {
    standard: {
      name: 'StandardAgent',
      version: '1.0.0',
      description: 'Standard A2A agent for testing',
      capabilities: ['communicate', 'delegate'],
      endpoints: {
        communicate: '/communicate',
        delegate: '/delegate',
        health: '/health'
      },
      protocols: ['A2A/1.0'],
      timestamp: '2024-01-01T00:00:00.000Z'
    },

    advanced: {
      name: 'AdvancedAgent',
      version: '2.1.0',
      description: 'Advanced agent with extended capabilities',
      capabilities: ['communicate', 'delegate', 'stream', 'batch'],
      endpoints: {
        communicate: '/communicate',
        delegate: '/delegate',
        health: '/health',
        stream: '/stream',
        batch: '/batch'
      },
      protocols: ['A2A/1.0', 'A2A/2.0'],
      metadata: {
        maxConcurrentTasks: 10,
        supportedLanguages: ['en', 'pt-BR'],
        features: ['caching', 'compression']
      },
      timestamp: '2024-01-01T00:00:00.000Z'
    }
  },

  // Communication payloads
  communication: {
    simple: {
      message: 'Hello from test',
      type: 'greeting',
      data: { test: true }
    },

    complex: {
      message: 'Process this data',
      type: 'data_processing',
      data: {
        items: [1, 2, 3, 4, 5],
        options: {
          format: 'json',
          compress: true
        }
      },
      metadata: {
        priority: 'high',
        timeout: 30000
      }
    }
  },

  // Task delegation payloads
  delegation: {
    simple: {
      task: 'calculate_sum',
      parameters: {
        numbers: [1, 2, 3, 4, 5]
      }
    },

    complex: {
      task: 'process_workflow',
      parameters: {
        steps: [
          { action: 'validate', config: { strict: true } },
          { action: 'transform', config: { format: 'json' } },
          { action: 'notify', config: { channel: 'webhook' } }
        ],
        data: { source: 'test_data.json' }
      },
      options: {
        async: true,
        retries: 3,
        timeout: 60000
      }
    }
  },

  // Health responses
  health: {
    healthy: {
      status: 'healthy',
      agent: 'TestAgent',
      version: '1.0.0',
      uptime: 3600,
      memory: {
        used: '45MB',
        total: '256MB'
      },
      lastCheck: '2024-01-01T00:00:00.000Z',
      timestamp: '2024-01-01T00:00:00.000Z'
    },

    unhealthy: {
      status: 'unhealthy',
      agent: 'TestAgent',
      version: '1.0.0',
      error: 'High memory usage',
      uptime: 3600,
      memory: {
        used: '240MB',
        total: '256MB'
      },
      lastCheck: '2024-01-01T00:00:00.000Z',
      timestamp: '2024-01-01T00:00:00.000Z'
    }
  },

  // Error scenarios
  errors: {
    discovery: {
      message: 'Agent discovery failed',
      code: 'DISCOVERY_ERROR',
      details: 'Agent not responding to discovery requests'
    },

    communication: {
      message: 'Communication timeout',
      code: 'COMM_TIMEOUT',
      details: 'Agent did not respond within 30 seconds'
    },

    delegation: {
      message: 'Task delegation failed',
      code: 'DELEGATION_ERROR',
      details: 'Agent cannot accept new tasks at this time'
    }
  }
};

module.exports = agentFixtures;