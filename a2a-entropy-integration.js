// Integração do Sistema de Controle de Entropia com A2A
// Exemplo prático de como usar os agentes especializados

const { EntropyControlSystem } = require('./entropy-control-system');

class A2AEntropyIntegration {
  constructor(a2aServer) {
    this.a2aServer = a2aServer;
    this.entropySystem = new EntropyControlSystem();
    this.agentCards = new Map();
    
    // Configurar agentes especializados como Agent Cards A2A
    this.setupSpecializedAgents();
  }

  setupSpecializedAgents() {
    // Agent Card para EntropyMonitor
    this.agentCards.set('entropy-monitor', {
      name: 'Entropy Monitor Agent',
      description: 'Monitora métricas de entropia do sistema A2A em tempo real',
      version: '1.0.0',
      capabilities: [
        'system_monitoring',
        'entropy_calculation', 
        'threshold_detection',
        'metrics_collection'
      ],
      endpoints: {
        monitor: '/api/entropy/monitor',
        metrics: '/api/entropy/metrics',
        status: '/api/entropy/status'
      }
    });

    // Agent Card para CleanupCoordinator
    this.agentCards.set('cleanup-coordinator', {
      name: 'Cleanup Coordinator Agent', 
      description: 'Coordena limpeza automática e garbage collection do sistema',
      version: '1.0.0',
      capabilities: [
        'agent_lifecycle_management',
        'memory_cleanup',
        'connection_cleanup',
        'log_rotation'
      ],
      endpoints: {
        cleanup: '/api/cleanup/execute',
        status: '/api/cleanup/status',
        strategies: '/api/cleanup/strategies'
      }
    });

    // Agent Card para SwarmCoordinator
    this.agentCards.set('swarm-coordinator', {
      name: 'Swarm Coordinator Agent',
      description: 'Gerencia scaling dinâmico e otimização de swarms A2A',
      version: '1.0.0', 
      capabilities: [
        'dynamic_scaling',
        'load_balancing',
        'performance_optimization',
        'agent_orchestration'
      ],
      endpoints: {
        scale: '/api/swarm/scale',
        optimize: '/api/swarm/optimize',
        status: '/api/swarm/status'
      }
    });

    console.log('✅ Agentes especializados configurados como Agent Cards A2A');
  }

  async registerAgentsWithA2A() {
    // Registra os agentes especializados no servidor A2A
    for (const [agentId, card] of this.agentCards) {
      try {
        await this.a2aServer.registerAgent(agentId, card);
        console.log(`✅ Agente ${agentId} registrado no A2A`);
      } catch (error) {
        console.error(`❌ Erro ao registrar ${agentId}:`, error);
      }
    }
  }

  async startEntropyControl() {
    console.log('🚀 Iniciando controle de entropia integrado com A2A');
    
    // 1. Registrar agentes especializados
    await this.registerAgentsWithA2A();
    
    // 2. Configurar hooks de integração com A2A
    this.setupA2AHooks();
    
    // 3. Iniciar sistema de controle
    await this.entropySystem.start();
  }

  setupA2AHooks() {
    // Hook: Novo agente criado
    this.a2aServer.on('agent:created', (agentInfo) => {
      this.entropySystem.monitor.metrics.activeAgents++;
      console.log(`📈 Novo agente criado: ${agentInfo.id}, Total: ${this.entropySystem.monitor.metrics.activeAgents}`);
    });

    // Hook: Agente terminado
    this.a2aServer.on('agent:terminated', (agentInfo) => {
      this.entropySystem.monitor.metrics.activeAgents--;
      console.log(`📉 Agente terminado: ${agentInfo.id}, Total: ${this.entropySystem.monitor.metrics.activeAgents}`);
    });

    // Hook: Task adicionada à queue
    this.a2aServer.on('task:queued', (taskInfo) => {
      this.entropySystem.monitor.metrics.taskQueueLength++;
    });

    // Hook: Task completada
    this.a2aServer.on('task:completed', (taskInfo) => {
      this.entropySystem.monitor.metrics.taskQueueLength--;
      this.entropySystem.monitor.metrics.avgResponseTime = 
        (this.entropySystem.monitor.metrics.avgResponseTime + taskInfo.duration) / 2;
    });

    // Hook: Conexão estabelecida
    this.a2aServer.on('connection:established', () => {
      this.entropySystem.monitor.metrics.connectionCount++;
    });

    // Hook: Conexão fechada
    this.a2aServer.on('connection:closed', () => {
      this.entropySystem.monitor.metrics.connectionCount--;
    });

    console.log('🔗 Hooks de integração A2A configurados');
  }

  // API para controle manual do sistema
  async getEntropyStatus() {
    return {
      entropy_score: this.entropySystem.monitor.entropyScore,
      system_state: this.entropySystem.monitor.getSystemState(),
      metrics: this.entropySystem.monitor.metrics,
      active_agents: this.entropySystem.coordinator.activeAgents.size,
      recommendations: this.getRecommendations()
    };
  }

  getRecommendations() {
    const state = this.entropySystem.monitor.getSystemState();
    const recommendations = [];

    switch(state) {
      case 'critical':
        recommendations.push('Executar limpeza agressiva imediatamente');
        recommendations.push('Reduzir número de agentes ativos em 50%');
        recommendations.push('Pausar criação de novos agentes');
        break;
      case 'elevated':
        recommendations.push('Executar limpeza moderada');
        recommendations.push('Monitorar crescimento de agentes');
        recommendations.push('Otimizar uso de memória');
        break;
      case 'optimal':
        recommendations.push('Sistema funcionando bem');
        recommendations.push('Pode permitir expansão controlada');
        break;
    }

    return recommendations;
  }

  async executeManualCleanup(strategy = 'comprehensive', intensity = 'normal') {
    console.log(`🧹 Executando limpeza manual: ${strategy} (${intensity})`);
    
    const strategies = {
      comprehensive: ['idle_agent_termination', 'memory_garbage_collection', 'connection_pool_cleanup'],
      memory_focused: ['memory_garbage_collection', 'cache_eviction'],
      agent_focused: ['idle_agent_termination', 'connection_pool_cleanup'],
      logs_focused: ['log_rotation']
    };

    const selectedStrategies = strategies[strategy] || strategies.comprehensive;
    const results = [];

    for (const strategyName of selectedStrategies) {
      const result = await this.entropySystem.cleaner.executeCleanup(strategyName, intensity);
      results.push({ strategy: strategyName, result });
    }

    return {
      executed_strategies: selectedStrategies,
      results: results,
      new_entropy_score: this.entropySystem.monitor.calculateEntropyScore()
    };
  }

  async forceScaling(action, count = 1) {
    console.log(`⚖️ Scaling forçado: ${action} (${count} agentes)`);
    
    const decision = {
      action: action, // 'scale_up' ou 'scale_down'
      reason: 'Manual intervention',
      agentCount: count
    };

    return await this.entropySystem.coordinator.executeScaling(decision);
  }

  // Configuração de alertas baseados em entropia
  setupEntropyAlerts() {
    setInterval(() => {
      const entropy = this.entropySystem.monitor.entropyScore;
      const state = this.entropySystem.monitor.getSystemState();
      
      if (state === 'critical') {
        this.sendAlert('CRITICAL', `Entropia crítica detectada: ${entropy.toFixed(2)}`);
      } else if (state === 'elevated') {
        this.sendAlert('WARNING', `Entropia elevada: ${entropy.toFixed(2)}`);
      }
    }, 30000); // Check a cada 30s
  }

  sendAlert(level, message) {
    console.log(`🚨 [${level}] ALERTA DE ENTROPIA: ${message}`);
    
    // Aqui poderia integrar com:
    // - Slack/Discord notifications
    // - Email alerts  
    // - SMS alerts
    // - Dashboard notifications
    // - Webhook calls
  }
}

// Exemplo de uso prático
class ExampleA2AServer {
  constructor() {
    this.agents = new Map();
    this.eventHandlers = new Map();
  }

  on(event, handler) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event).push(handler);
  }

  emit(event, data) {
    const handlers = this.eventHandlers.get(event) || [];
    handlers.forEach(handler => handler(data));
  }

  async registerAgent(agentId, card) {
    this.agents.set(agentId, card);
    this.emit('agent:created', { id: agentId, card });
    return { success: true };
  }

  simulateActivity() {
    // Simula atividade do sistema para teste
    setInterval(() => {
      // Simula criação/terminação de agentes
      if (Math.random() > 0.7) {
        const agentId = `agent_${Date.now()}`;
        this.emit('agent:created', { id: agentId });
        
        // Agenda terminação após um tempo aleatório
        setTimeout(() => {
          this.emit('agent:terminated', { id: agentId });
        }, Math.random() * 60000); // 0-60s
      }

      // Simula tasks
      if (Math.random() > 0.5) {
        this.emit('task:queued', { id: `task_${Date.now()}` });
        
        setTimeout(() => {
          this.emit('task:completed', { 
            id: `task_${Date.now()}`, 
            duration: Math.random() * 5000 
          });
        }, Math.random() * 10000);
      }

      // Simula conexões
      if (Math.random() > 0.8) {
        this.emit('connection:established');
        
        setTimeout(() => {
          this.emit('connection:closed');
        }, Math.random() * 30000);
      }
    }, 5000); // A cada 5s
  }
}

// Demonstração completa
async function demonstrateEntropyControl() {
  console.log('🎯 === DEMONSTRAÇÃO DO CONTROLE DE ENTROPIA A2A ===');
  
  // 1. Criar servidor A2A de exemplo
  const a2aServer = new ExampleA2AServer();
  
  // 2. Criar sistema de controle integrado
  const entropyIntegration = new A2AEntropyIntegration(a2aServer);
  
  // 3. Configurar alertas
  entropyIntegration.setupEntropyAlerts();
  
  // 4. Simular atividade do sistema
  a2aServer.simulateActivity();
  
  // 5. Iniciar controle de entropia
  // await entropyIntegration.startEntropyControl();
  
  console.log('✅ Sistema de controle de entropia configurado e ativo');
  console.log('📊 Para ver status: entropyIntegration.getEntropyStatus()');
  console.log('🧹 Para limpeza manual: entropyIntegration.executeManualCleanup()');
  console.log('⚖️ Para scaling manual: entropyIntegration.forceScaling("scale_down", 5)');
  
  return entropyIntegration;
}

module.exports = {
  A2AEntropyIntegration,
  ExampleA2AServer,
  demonstrateEntropyControl
};

// Para testar:
// const integration = demonstrateEntropyControl();