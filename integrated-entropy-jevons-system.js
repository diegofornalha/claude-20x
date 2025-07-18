// Sistema Integrado: Controle de Entropia A2A + Mitigação do Paradoxo de Jevons
// Combina controle de entropia com proteções contra crescimento insustentável

const { EntropyControlSystem } = require('./entropy-control-system');
const { JevonsParadoxMitigation } = require('./jevons-paradox-mitigation');

class IntegratedEntropyJevonsSystem extends EntropyControlSystem {
  constructor() {
    super();
    
    // Sistema anti-Jevons integrado
    this.jevonsControl = new JevonsParadoxMitigation();
    
    // Métricas estendidas para monitorar ambos os problemas
    this.integratedMetrics = {
      // Métricas originais de entropia
      systemEntropy: 0,
      cleanupOperations: 0,
      agentOptimizations: 0,
      
      // Métricas de sustentabilidade Jevons
      demandGrowthRate: 0,
      totalSystemUsage: 0,
      valueEfficiencyRatio: 0,
      carbonFootprint: 0,
      
      // Indicadores combinados
      sustainabilityScore: 0,
      paradoxRisk: 0,
      recommendedAction: 'monitor'
    };
    
    // Políticas integradas
    this.sustainabilityPolicies = {
      maxEfficiencyGrowthRate: 0.10,  // 10% por mês máximo
      carbonBudgetIntegration: true,
      valueBasedOptimization: true,
      demandShapingActive: true,
      emergencyThrottling: true
    };
    
    console.log('🌱 Sistema Integrado Entropia + Anti-Jevons inicializado');
  }

  // Override do loop de controle original para incluir controles Jevons
  async controlLoop() {
    try {
      // 1. Coletar métricas originais de entropia
      await this.monitor.collectMetrics();
      const entropy = this.monitor.calculateEntropyScore();
      const systemState = this.monitor.getSystemState();
      
      // 2. Detectar Paradoxo de Jevons
      const jevonsAnalysis = this.jevonsControl.detectJevonsParadox({
        systemEfficiency: this.calculateSystemEfficiency(),
        totalDemand: this.monitor.metrics.activeAgents,
        energyConsumption: this.estimateEnergyConsumption(),
        businessValue: this.calculateBusinessValue()
      });
      
      // 3. Análise integrada de risco
      const integratedRisk = this.analyzeIntegratedRisk(entropy, jevonsAnalysis);
      
      // 4. Decisão de ação baseada em ambos os fatores
      const actionPlan = this.createIntegratedActionPlan(systemState, jevonsAnalysis, integratedRisk);
      
      // 5. Execução de ações com proteções Jevons
      await this.executeProtectedActions(actionPlan);
      
      // 6. Logging integrado
      this.logIntegratedMetrics(entropy, jevonsAnalysis, integratedRisk);
      
    } catch (error) {
      console.error('❌ Erro no loop de controle integrado:', error);
    }
  }

  // Análise de risco que considera entropia E paradoxo de Jevons
  analyzeIntegratedRisk(entropy, jevonsAnalysis) {
    const entropyRisk = this.classifyEntropyRisk(entropy);
    const jevonsRisk = jevonsAnalysis.severity / 100; // 0-1 scale
    
    // Combinação ponderada dos riscos
    const weights = {
      entropy: 0.4,    // 40% peso para entropia
      jevons: 0.6      // 60% peso para sustentabilidade (maior peso!)
    };
    
    const combinedRisk = (entropyRisk * weights.entropy) + (jevonsRisk * weights.jevons);
    
    // Classificação do risco integrado
    let riskLevel = 'low';
    if (combinedRisk >= 0.8) riskLevel = 'critical';
    else if (combinedRisk >= 0.6) riskLevel = 'high';
    else if (combinedRisk >= 0.4) riskLevel = 'medium';
    
    return {
      combinedScore: combinedRisk,
      level: riskLevel,
      entropyComponent: entropyRisk,
      jevonsComponent: jevonsRisk,
      primaryConcern: jevonsRisk > entropyRisk ? 'sustainability' : 'entropy',
      urgency: this.calculateUrgency(entropyRisk, jevonsRisk)
    };
  }

  // Criação de plano de ação que balanceia entropia vs sustentabilidade
  createIntegratedActionPlan(systemState, jevonsAnalysis, integratedRisk) {
    const plan = {
      priority: integratedRisk.level,
      actions: [],
      constraints: [],
      monitoring: []
    };
    
    // Ações baseadas no risco primário
    if (integratedRisk.primaryConcern === 'entropy') {
      // Foco na entropia, mas com limites de sustentabilidade
      if (systemState === 'critical') {
        plan.actions.push({
          type: 'cleanup',
          strategy: 'conservative', // Menos agressivo para evitar rebound
          intensity: 'moderate',
          jevonsConstraint: 'respectCarbonBudget'
        });
      }
      
      plan.constraints.push('maxEfficiencyIncrease: 5%');
      plan.constraints.push('monitorDemandGrowth: true');
      
    } else {
      // Foco na sustentabilidade, entropia em segundo plano
      if (jevonsAnalysis.paradoxDetected) {
        plan.actions.push({
          type: 'sustainabilityFirst',
          strategy: 'demandShaping',
          intensity: 'high',
          entropyConstraint: 'allowHigherEntropy'
        });
        
        plan.actions.push({
          type: 'efficiencyCap',
          strategy: 'preventOptimization',
          reason: 'jevonsParadoxPrevention'
        });
      }
      
      plan.constraints.push('carbonBudgetStrictMode: true');
      plan.constraints.push('valueOptimizationOnly: true');
    }
    
    // Ações sempre aplicadas
    plan.monitoring.push('trackValueEfficiencyRatio');
    plan.monitoring.push('monitorDemandElasticity');
    plan.monitoring.push('measureRealWorldImpact');
    
    return plan;
  }

  // Execução de ações com proteções integradas
  async executeProtectedActions(actionPlan) {
    console.log(`🎯 Executando plano ${actionPlan.priority} com ${actionPlan.actions.length} ações`);
    
    for (const action of actionPlan.actions) {
      try {
        // Verificar orçamento de carbono antes de qualquer ação
        const carbonCheck = this.jevonsControl.enforceCarbonBudget(
          this.estimateActionEnergyCost(action)
        );
        
        if (!carbonCheck.approved) {
          console.log(`🚫 Ação ${action.type} bloqueada: ${carbonCheck.message}`);
          continue;
        }
        
        // Executar ação baseada no tipo
        switch (action.type) {
          case 'cleanup':
            await this.executeProtectedCleanup(action);
            break;
            
          case 'sustainabilityFirst':
            await this.executeSustainabilityAction(action);
            break;
            
          case 'efficiencyCap':
            await this.applyEfficiencyCap(action);
            break;
            
          default:
            console.log(`⚠️ Tipo de ação desconhecido: ${action.type}`);
        }
        
        // Aplicar throttling se necessário
        if (carbonCheck.throttled) {
          await this.applyPerformanceThrottling(0.7); // 70% performance
        }
        
      } catch (error) {
        console.error(`❌ Erro executando ação ${action.type}:`, error);
      }
    }
  }

  // Cleanup protegido que considera impacto na demanda
  async executeProtectedCleanup(action) {
    console.log(`🧹 Cleanup protegido: ${action.strategy} (${action.intensity})`);
    
    // Estimar impacto na eficiência
    const efficiencyImpact = this.estimateCleanupEfficiencyGain(action);
    
    // Verificar se vai disparar o paradoxo de Jevons
    const jevonsRisk = this.jevonsControl.applyEfficiencyCaps({
      expectedEfficiencyGain: efficiencyImpact,
      action: action
    });
    
    if (jevonsRisk.blocked) {
      console.log(`🛑 Cleanup bloqueado: ${jevonsRisk.reason}`);
      return;
    }
    
    // Executar cleanup com intensidade reduzida se necessário
    const adjustedIntensity = jevonsRisk.reducedEffectiveness ? 
      this.reduceIntensity(action.intensity, jevonsRisk.reductionFactor) : 
      action.intensity;
    
    // Usar cleanup original, mas com intensidade ajustada
    const result = await this.cleaner.executeCleanup(
      action.strategy === 'conservative' ? 'memory_garbage_collection' : 'idle_agent_termination',
      adjustedIntensity
    );
    
    // Monitorar impacto pós-cleanup
    this.schedulePostCleanupMonitoring(result);
    
    return result;
  }

  // Ações focadas em sustentabilidade
  async executeSustainabilityAction(action) {
    console.log(`🌱 Ação de sustentabilidade: ${action.strategy}`);
    
    switch (action.strategy) {
      case 'demandShaping':
        // Aplicar incentivos para reduzir demanda
        const incentives = this.jevonsControl.shapeUserDemand({
          currentLoad: this.monitor.metrics.activeAgents,
          timestamp: Date.now()
        });
        
        console.log(`💰 Incentivos aplicados: ${JSON.stringify(incentives.incentives)}`);
        break;
        
      case 'valueFocus':
        // Implementar métricas de valor em vez de volume
        await this.switchToValueMetrics();
        break;
        
      case 'carbonBudgetEnforcement':
        // Ativar modo estrito de orçamento de carbono
        this.jevonsControl.controls.carbonBudget.warningThreshold = 0.6; // 60%
        this.jevonsControl.controls.carbonBudget.emergencyThreshold = 0.8; // 80%
        break;
    }
  }

  // Aplicar caps de eficiência para prevenir paradoxo
  async applyEfficiencyCap(action) {
    console.log(`🔒 Aplicando cap de eficiência: ${action.reason}`);
    
    // Pausar otimizações automáticas
    this.monitor.pauseOptimizations = true;
    
    // Reduzir agressividade do cleanup
    this.cleaner.reduceAggressiveness(0.5); // 50% da agressividade normal
    
    // Focar em métricas de valor
    await this.switchToValueMetrics();
    
    // Programar reavaliação em 1 hora
    setTimeout(() => {
      this.reevaluateEfficiencyCaps();
    }, 3600000);
  }

  // Métricas de valor em vez de volume
  async switchToValueMetrics() {
    console.log('📊 Mudando foco para métricas de valor');
    
    // Reconfigurar sistema para otimizar valor/energia
    this.monitor.optimizationTarget = 'value_efficiency';
    this.coordinator.scalingPolicy = 'value_based';
    
    // Ativar controles de qualidade
    this.jevonsControl.controls.valueMetrics.enabled = true;
    this.jevonsControl.controls.valueMetrics.focusOnValue = true;
  }

  // Monitoramento pós-cleanup para detectar efeito rebound
  schedulePostCleanupMonitoring(cleanupResult) {
    console.log('📈 Agendando monitoramento de rebound effect');
    
    const baselineMetrics = {
      timestamp: Date.now(),
      agentCount: this.monitor.metrics.activeAgents,
      demandLevel: this.monitor.metrics.taskQueueLength,
      efficiency: this.calculateSystemEfficiency()
    };
    
    // Monitorar por 2 horas após cleanup
    const monitoringInterval = setInterval(() => {
      const currentMetrics = {
        agentCount: this.monitor.metrics.activeAgents,
        demandLevel: this.monitor.metrics.taskQueueLength,
        efficiency: this.calculateSystemEfficiency()
      };
      
      // Detectar rebound: demanda crescendo mais rápido que eficiência
      const demandGrowth = (currentMetrics.demandLevel - baselineMetrics.demandLevel) / 
                          baselineMetrics.demandLevel;
      const efficiencyGrowth = (currentMetrics.efficiency - baselineMetrics.efficiency) / 
                              baselineMetrics.efficiency;
      
      if (demandGrowth > efficiencyGrowth * 1.5) { // Demanda 50% maior que eficiência
        console.log('🚨 Rebound effect detectado após cleanup!');
        this.activateAntiReboundMeasures();
        clearInterval(monitoringInterval);
      }
    }, 600000); // A cada 10 minutos
    
    // Parar monitoramento após 2 horas
    setTimeout(() => {
      clearInterval(monitoringInterval);
      console.log('✅ Monitoramento pós-cleanup finalizado');
    }, 7200000);
  }

  // Medidas anti-rebound quando detectado crescimento excessivo
  activateAntiReboundMeasures() {
    console.log('🛡️ Ativando medidas anti-rebound');
    
    // Ativar pricing pressure imediato
    this.jevonsControl.controls.progressivePricing.enabled = true;
    
    // Reduzir caps de eficiência temporariamente
    this.jevonsControl.controls.efficiencyCaps.maxEfficiency = 0.85; // De 95% para 85%
    
    // Ativar demand shaping agressivo
    this.jevonsControl.controls.demandShaping.offPeakDiscount = 0.6; // De 30% para 60%
    
    // Alertar administradores
    this.sendRebalanceAlert('Rebound effect detectado - medidas anti-Jevons ativadas');
  }

  // Cálculos auxiliares
  calculateSystemEfficiency() {
    // Eficiência = Tasks completadas / Energia gasta
    const tasksCompleted = this.monitor.metrics.activeAgents * 0.8; // Estimativa
    const energyUsed = this.estimateEnergyConsumption();
    return tasksCompleted / Math.max(energyUsed, 1);
  }

  estimateEnergyConsumption() {
    // Estimativa baseada nas métricas do sistema
    const cpuEnergy = this.monitor.metrics.activeAgents * 0.05; // 50W por 100 agentes
    const memoryEnergy = this.monitor.metrics.memoryUsage * 0.01; // 1W por GB
    const ioEnergy = this.monitor.metrics.connectionCount * 0.001; // 1W por 1000 conexões
    
    return cpuEnergy + memoryEnergy + ioEnergy; // kWh estimado
  }

  calculateBusinessValue() {
    // Placeholder - seria integrado com métricas reais de negócio
    return this.monitor.metrics.activeAgents * 2.5 + 
           this.monitor.metrics.taskQueueLength * 0.1;
  }

  classifyEntropyRisk(entropy) {
    // Converter entropia em escala 0-1
    if (entropy < 200) return 0.1;  // low
    if (entropy < 500) return 0.3;  // medium
    if (entropy < 800) return 0.6;  // high  
    return 0.9; // critical
  }

  calculateUrgency(entropyRisk, jevonsRisk) {
    const maxRisk = Math.max(entropyRisk, jevonsRisk);
    if (maxRisk >= 0.9) return 'immediate';
    if (maxRisk >= 0.7) return 'high';
    if (maxRisk >= 0.5) return 'medium';
    return 'low';
  }

  estimateActionEnergyCost(action) {
    // Estimativa de custo energético por tipo de ação
    const costs = {
      cleanup: 2.0,              // 2 kWh
      sustainabilityFirst: 0.5,  // 0.5 kWh
      efficiencyCap: 0.1         // 0.1 kWh
    };
    return costs[action.type] || 1.0;
  }

  estimateCleanupEfficiencyGain(action) {
    // Estimativa de ganho de eficiência por tipo de cleanup
    const gains = {
      conservative: 0.05,  // 5%
      moderate: 0.10,      // 10%
      aggressive: 0.20     // 20%
    };
    return gains[action.strategy] || 0.05;
  }

  reduceIntensity(intensity, factor) {
    const intensityLevels = ['light', 'normal', 'high', 'aggressive'];
    const currentIndex = intensityLevels.indexOf(intensity);
    const newIndex = Math.max(0, Math.floor(currentIndex * factor));
    return intensityLevels[newIndex];
  }

  applyPerformanceThrottling(factor) {
    console.log(`🐌 Aplicando throttling de performance: ${factor * 100}%`);
    // Implementaria redução de performance do sistema
    this.monitor.throttlingFactor = factor;
  }

  reevaluateEfficiencyCaps() {
    console.log('🔄 Reavaliando caps de eficiência');
    const currentJevonsRisk = this.jevonsControl.detectJevonsParadox({
      systemEfficiency: this.calculateSystemEfficiency(),
      totalDemand: this.monitor.metrics.activeAgents,
      energyConsumption: this.estimateEnergyConsumption(),
      businessValue: this.calculateBusinessValue()
    });
    
    if (currentJevonsRisk.severity < 30) {
      // Relaxar caps se risco diminuiu
      this.jevonsControl.controls.efficiencyCaps.maxEfficiency = 0.95;
      this.monitor.pauseOptimizations = false;
      console.log('✅ Caps de eficiência relaxados - risco de Jevons reduzido');
    }
  }

  sendRebalanceAlert(message) {
    console.log(`🚨 ALERTA SISTEMA: ${message}`);
    // Implementaria notificação real para administradores
  }

  logIntegratedMetrics(entropy, jevonsAnalysis, integratedRisk) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      entropy: {
        score: entropy,
        state: this.monitor.getSystemState()
      },
      jevons: {
        severity: jevonsAnalysis.severity,
        detected: jevonsAnalysis.paradoxDetected,
        indicators: jevonsAnalysis.indicators
      },
      integrated: {
        riskLevel: integratedRisk.level,
        primaryConcern: integratedRisk.primaryConcern,
        urgency: integratedRisk.urgency
      },
      sustainability: {
        carbonBudgetStatus: this.jevonsControl.getDashboardMetrics().carbonBudget.status,
        valueEfficiencyRatio: this.jevonsControl.jevonsMetrics.valueEfficiencyRatio,
        energyConsumption: this.estimateEnergyConsumption()
      }
    };
    
    console.log('📊 Métricas integradas:', JSON.stringify(logEntry, null, 2));
  }

  // Override do método stop para cleanup completo
  stop() {
    console.log('🛑 Parando Sistema Integrado Entropia + Anti-Jevons');
    super.stop();
    
    // Salvar métricas finais
    const finalReport = {
      totalEnergyConsumed: this.estimateEnergyConsumption(),
      finalEfficiency: this.calculateSystemEfficiency(),
      jevonsParadoxPrevented: this.jevonsControl.jevonsMetrics.paradoxSeverity < 50,
      sustainabilityScore: this.calculateSustainabilityScore()
    };
    
    console.log('📋 Relatório final:', JSON.stringify(finalReport, null, 2));
  }

  calculateSustainabilityScore() {
    // Score baseado em múltiplos fatores
    const efficiency = this.calculateSystemEfficiency();
    const carbonUtilization = this.jevonsControl.getDashboardMetrics().carbonBudget.utilization;
    const valueRatio = this.jevonsControl.jevonsMetrics.valueEfficiencyRatio;
    const jevonsRisk = this.jevonsControl.jevonsMetrics.paradoxSeverity / 100;
    
    return Math.max(0, Math.min(100, 
      (efficiency * 30) + 
      ((1 - carbonUtilization) * 25) + 
      (valueRatio * 25) + 
      ((1 - jevonsRisk) * 20)
    ));
  }
}

module.exports = { IntegratedEntropyJevonsSystem };