// Sistema Anti-Jevons para Controle de Entropia A2A
// Mitigação do Paradoxo de Jevons através de controles sustentáveis

class JevonsParadoxMitigation {
  constructor() {
    this.systemName = 'A2A Anti-Jevons Control System';
    
    // Métricas para detectar o paradoxo
    this.jevonsMetrics = {
      efficiencyTrend: 0,        // Tendência de eficiência (%)
      demandGrowth: 0,           // Crescimento de demanda (%)  
      totalEnergyConsumption: 0, // Consumo total de energia (kWh)
      valueEfficiencyRatio: 0,   // Valor gerado por energia (valor/kWh)
      paradoxSeverity: 0         // Severidade do paradoxo (0-100)
    };
    
    // Configurações de controle
    this.controls = {
      carbonBudget: {
        enabled: true,
        monthlyLimitKWh: 10000,
        currentUsageKWh: 0,
        warningThreshold: 0.8,    // 80% do limite
        emergencyThreshold: 0.95  // 95% do limite
      },
      
      progressivePricing: {
        enabled: true,
        tiers: [
          { min: 1, max: 100, pricePerAgent: 0.01 },
          { min: 101, max: 500, pricePerAgent: 0.03 },
          { min: 501, max: 1000, pricePerAgent: 0.10 },
          { min: 1001, max: Infinity, pricePerAgent: 0.25 }
        ]
      },
      
      efficiencyCaps: {
        enabled: true,
        maxEfficiency: 0.95,      // 95% de eficiência máxima
        saturationPoint: 0.80,    // Ponto onde otimizações diminuem
        diminishingReturns: true  // Ativa retornos decrescentes
      },
      
      demandShaping: {
        enabled: true,
        greenHoursDiscount: 0.5,  // 50% desconto em horários verdes
        offPeakDiscount: 0.3,     // 30% desconto fora do pico
        loadBalancingActive: true
      },
      
      valueMetrics: {
        enabled: true,
        focusOnValue: true,       // Foco em valor, não volume
        qualityThreshold: 0.85,   // 85% qualidade mínima
        impactWeighting: 0.7      // 70% peso para impacto vs volume
      }
    };
  }

  // Detecção do Paradoxo de Jevons em tempo real
  detectJevonsParadox(currentMetrics) {
    const efficiency = currentMetrics.systemEfficiency || 0;
    const demand = currentMetrics.totalDemand || 0;
    const energy = currentMetrics.energyConsumption || 0;
    
    // Calcular tendências (precisa de dados históricos)
    this.jevonsMetrics.efficiencyTrend = this.calculateTrend('efficiency', efficiency);
    this.jevonsMetrics.demandGrowth = this.calculateTrend('demand', demand);
    this.jevonsMetrics.totalEnergyConsumption = energy;
    
    // Calcular Value Efficiency Ratio
    const businessValue = currentMetrics.businessValue || 1;
    this.jevonsMetrics.valueEfficiencyRatio = businessValue / Math.max(energy, 0.001);
    
    // Detectar paradoxo: eficiência ↑ + demanda ↑↑ + energia total ↑
    const paradoxIndicators = {
      efficiencyIncreasing: this.jevonsMetrics.efficiencyTrend > 0.05, // +5%
      demandSurging: this.jevonsMetrics.demandGrowth > 0.20,          // +20%
      energyIncreasing: this.jevonsMetrics.totalEnergyConsumption > 
                       this.getHistoricalAverage('energy') * 1.15,    // +15%
      valueDeclining: this.jevonsMetrics.valueEfficiencyRatio < 
                     this.getHistoricalAverage('ver') * 0.90         // -10%
    };
    
    // Calcular severidade do paradoxo
    const activeIndicators = Object.values(paradoxIndicators).filter(Boolean).length;
    this.jevonsMetrics.paradoxSeverity = (activeIndicators / 4) * 100;
    
    return {
      paradoxDetected: activeIndicators >= 3, // 3+ indicadores = paradoxo ativo
      severity: this.jevonsMetrics.paradoxSeverity,
      indicators: paradoxIndicators,
      recommendation: this.getRecommendation()
    };
  }

  // Sistema de Orçamento de Carbono
  enforceCarbonBudget(energyRequest) {
    if (!this.controls.carbonBudget.enabled) return { approved: true };
    
    const budget = this.controls.carbonBudget;
    const projectedUsage = budget.currentUsageKWh + energyRequest;
    const utilizationRate = projectedUsage / budget.monthlyLimitKWh;
    
    let action = 'approve';
    let message = '';
    
    if (utilizationRate >= budget.emergencyThreshold) {
      action = 'deny';
      message = 'Carbon budget exceeded - request denied for sustainability';
    } else if (utilizationRate >= budget.warningThreshold) {
      action = 'throttle';
      message = 'Approaching carbon limit - reducing performance to 70%';
    }
    
    if (action === 'approve' || action === 'throttle') {
      budget.currentUsageKWh += energyRequest;
    }
    
    return {
      approved: action !== 'deny',
      throttled: action === 'throttle',
      utilizationRate: utilizationRate,
      remainingBudget: budget.monthlyLimitKWh - budget.currentUsageKWh,
      message: message
    };
  }

  // Sistema de Preços Progressivos
  calculateProgressivePricing(agentCount) {
    if (!this.controls.progressivePricing.enabled) {
      return { totalCost: 0, tier: 'free' };
    }
    
    let totalCost = 0;
    let currentTier = '';
    
    for (const tier of this.controls.progressivePricing.tiers) {
      if (agentCount >= tier.min) {
        const agentsInTier = Math.min(agentCount, tier.max) - tier.min + 1;
        totalCost += agentsInTier * tier.pricePerAgent;
        currentTier = `${tier.min}-${tier.max === Infinity ? '∞' : tier.max}`;
      }
    }
    
    const marginalCost = this.getMarginalCost(agentCount);
    
    return {
      totalCost: totalCost,
      tier: currentTier,
      marginalCost: marginalCost,
      priceSignal: totalCost > 100 ? 'expensive' : totalCost > 50 ? 'moderate' : 'affordable'
    };
  }

  // Controle de Eficiência com Caps
  applyEfficiencyCaps(requestedOptimizations) {
    if (!this.controls.efficiencyCaps.enabled) return requestedOptimizations;
    
    const currentEfficiency = this.getCurrentSystemEfficiency();
    const caps = this.controls.efficiencyCaps;
    
    if (currentEfficiency >= caps.maxEfficiency) {
      return {
        ...requestedOptimizations,
        blocked: true,
        reason: 'Maximum efficiency reached - preventing Jevons paradox',
        appliedOptimizations: []
      };
    }
    
    if (currentEfficiency >= caps.saturationPoint) {
      // Aplicar retornos decrescentes
      const reductionFactor = 1 - ((currentEfficiency - caps.saturationPoint) / 
                                  (caps.maxEfficiency - caps.saturationPoint)) * 0.7;
      
      return {
        ...requestedOptimizations,
        reducedEffectiveness: true,
        reductionFactor: reductionFactor,
        reason: 'Diminishing returns applied to prevent demand surge'
      };
    }
    
    return requestedOptimizations;
  }

  // Moldagem Inteligente de Demanda
  shapeUserDemand(taskRequest) {
    if (!this.controls.demandShaping.enabled) return taskRequest;
    
    const currentHour = new Date().getHours();
    const isGreenHour = this.isGreenEnergyHour(currentHour);
    const isOffPeak = this.isOffPeakHour(currentHour);
    const loadLevel = this.getCurrentLoadLevel();
    
    let incentives = {
      discount: 0,
      priority: 'normal',
      suggestedDelay: 0,
      message: ''
    };
    
    // Horários verdes (energia renovável alta)
    if (isGreenHour) {
      incentives.discount += this.controls.demandShaping.greenHoursDiscount;
      incentives.priority = 'high';
      incentives.message += 'Green energy period - 50% discount! ';
    }
    
    // Horários fora do pico
    if (isOffPeak) {
      incentives.discount += this.controls.demandShaping.offPeakDiscount;
      incentives.message += 'Off-peak hours - 30% discount! ';
    }
    
    // Load balancing
    if (loadLevel > 0.85 && this.controls.demandShaping.loadBalancingActive) {
      incentives.suggestedDelay = this.calculateOptimalDelay(taskRequest);
      incentives.message += `High load detected - consider delaying ${incentives.suggestedDelay} minutes for better price. `;
    }
    
    return {
      ...taskRequest,
      incentives: incentives,
      shapingApplied: true
    };
  }

  // Sistema de Métricas Centradas em Valor
  evaluateValueMetrics(taskResult) {
    if (!this.controls.valueMetrics.enabled) return taskResult;
    
    const metrics = this.controls.valueMetrics;
    
    // Calcular Value Efficiency Ratio (VER)
    const businessImpact = this.assessBusinessImpact(taskResult);
    const qualityScore = this.assessQualityScore(taskResult);
    const energyUsed = taskResult.energyConsumption || 1;
    
    const ver = (businessImpact * metrics.impactWeighting + 
                qualityScore * (1 - metrics.impactWeighting)) / energyUsed;
    
    // Bloquear tarefas de baixo valor/alta energia
    if (qualityScore < metrics.qualityThreshold) {
      return {
        ...taskResult,
        blocked: true,
        reason: `Quality score ${qualityScore} below threshold ${metrics.qualityThreshold}`
      };
    }
    
    // Calcular ranking baseado em valor
    const valueRank = this.calculateValueRank(ver);
    
    return {
      ...taskResult,
      valueMetrics: {
        businessImpact: businessImpact,
        qualityScore: qualityScore,
        valueEfficiencyRatio: ver,
        valueRank: valueRank,
        energyJustified: ver > 1.0 // VER > 1 = energia bem gasta
      }
    };
  }

  // Recomendações Anti-Jevons
  getRecommendation() {
    const severity = this.jevonsMetrics.paradoxSeverity;
    
    if (severity >= 80) {
      return {
        urgency: 'critical',
        actions: [
          'Activate carbon budget emergency mode',
          'Implement immediate efficiency caps',
          'Increase pricing for new deployments',
          'Redirect focus to value optimization'
        ]
      };
    } else if (severity >= 50) {
      return {
        urgency: 'high', 
        actions: [
          'Enable demand shaping incentives',
          'Monitor usage patterns closely',
          'Consider efficiency saturation limits',
          'Promote off-peak usage'
        ]
      };
    } else if (severity >= 20) {
      return {
        urgency: 'medium',
        actions: [
          'Track value metrics more closely',
          'Prepare demand shaping strategies',
          'Review pricing structure'
        ]
      };
    }
    
    return {
      urgency: 'low',
      actions: ['Continue monitoring', 'Maintain current controls']
    };
  }

  // Helpers
  calculateTrend(metric, currentValue) {
    // Simplified trend calculation - needs historical data
    const historical = this.getHistoricalAverage(metric);
    return (currentValue - historical) / historical;
  }

  getHistoricalAverage(metric) {
    // Placeholder - would connect to actual metrics database
    const defaults = {
      efficiency: 0.75,
      demand: 1000,
      energy: 5000,
      ver: 1.2
    };
    return defaults[metric] || 1;
  }

  getCurrentSystemEfficiency() {
    // Placeholder - would get from actual system
    return 0.82;
  }

  isGreenEnergyHour(hour) {
    // Green energy typically peaks 10AM-3PM (solar)
    return hour >= 10 && hour <= 15;
  }

  isOffPeakHour(hour) {
    // Off-peak typically 11PM-7AM
    return hour >= 23 || hour <= 7;
  }

  getCurrentLoadLevel() {
    // Placeholder - would get from load balancer
    return Math.random() * 0.4 + 0.4; // 40-80%
  }

  calculateOptimalDelay(taskRequest) {
    // Simple delay calculation based on current load
    const loadLevel = this.getCurrentLoadLevel();
    return Math.round((loadLevel - 0.5) * 60); // 0-30 minutes
  }

  getMarginalCost(agentCount) {
    const tiers = this.controls.progressivePricing.tiers;
    for (const tier of tiers) {
      if (agentCount >= tier.min && agentCount <= tier.max) {
        return tier.pricePerAgent;
      }
    }
    return tiers[tiers.length - 1].pricePerAgent;
  }

  assessBusinessImpact(taskResult) {
    // Placeholder - would use actual business metrics
    return Math.random() * 5 + 1; // 1-6 scale
  }

  assessQualityScore(taskResult) {
    // Placeholder - would use actual quality metrics
    return Math.random() * 0.3 + 0.7; // 70-100%
  }

  calculateValueRank(ver) {
    if (ver >= 2.0) return 'excellent';
    if (ver >= 1.5) return 'good';
    if (ver >= 1.0) return 'acceptable';
    if (ver >= 0.5) return 'poor';
    return 'unacceptable';
  }

  // Dashboard para monitoramento do paradoxo
  getDashboardMetrics() {
    return {
      paradoxStatus: {
        severity: this.jevonsMetrics.paradoxSeverity,
        trend: this.jevonsMetrics.efficiencyTrend > 0 && 
               this.jevonsMetrics.demandGrowth > this.jevonsMetrics.efficiencyTrend ? 'worsening' : 'stable',
        recommendation: this.getRecommendation()
      },
      
      carbonBudget: {
        utilization: this.controls.carbonBudget.currentUsageKWh / 
                    this.controls.carbonBudget.monthlyLimitKWh,
        remaining: this.controls.carbonBudget.monthlyLimitKWh - 
                  this.controls.carbonBudget.currentUsageKWh,
        status: this.getBudgetStatus()
      },
      
      valueMetrics: {
        currentVER: this.jevonsMetrics.valueEfficiencyRatio,
        trend: this.calculateTrend('ver', this.jevonsMetrics.valueEfficiencyRatio),
        focus: this.controls.valueMetrics.focusOnValue ? 'value' : 'volume'
      },
      
      demandShaping: {
        activeIncentives: this.getActiveIncentives(),
        loadLevel: this.getCurrentLoadLevel(),
        nextGreenHour: this.getNextGreenHour()
      }
    };
  }

  getBudgetStatus() {
    const utilization = this.controls.carbonBudget.currentUsageKWh / 
                       this.controls.carbonBudget.monthlyLimitKWh;
    
    if (utilization >= 0.95) return 'critical';
    if (utilization >= 0.80) return 'warning';
    return 'normal';
  }

  getActiveIncentives() {
    const hour = new Date().getHours();
    return {
      greenDiscount: this.isGreenEnergyHour(hour),
      offPeakDiscount: this.isOffPeakHour(hour),
      loadBalancing: this.getCurrentLoadLevel() > 0.85
    };
  }

  getNextGreenHour() {
    const hour = new Date().getHours();
    if (hour < 10) return `in ${10 - hour} hours`;
    if (hour > 15) return `in ${10 + 24 - hour} hours`;
    return 'now';
  }
}

module.exports = { JevonsParadoxMitigation };