/**
 * Guardian Agent Analyzer
 * 
 * Extensão do Guardian para analisar e otimizar agentes
 * Detecta sobreposições, sugere melhorias e mantém histórico
 */

import { GuardianMemoryManager } from '../utils/guardian-memory';
import { execSync } from 'child_process';
import * as path from 'path';

interface AgentInfo {
  name: string;
  file: string;
  type: string;
  tools: string[];
  description: string;
}

interface OverlapAnalysis {
  agent1: string;
  agent2: string;
  sharedTools: string[];
  overlapPercentage: number;
  recommendation: string;
}

export class GuardianAgentAnalyzer {
  private memory: GuardianMemoryManager;
  private readonly mcpToolsPath: string;
  
  constructor() {
    this.memory = new GuardianMemoryManager();
    this.mcpToolsPath = path.join(
      process.cwd().includes('claude-flow') ? process.cwd() : path.join(process.cwd(), 'claude-flow'),
      '..', 'mcp-run-ts-tools'
    );
  }

  /**
   * Analisa todos os agentes e detecta sobreposições
   */
  async analyzeAgentOverlaps(): Promise<OverlapAnalysis[]> {
    try {
      console.log('🔍 Guardian analisando agentes...');
      
      // Listar todos os agentes
      const agents = await this.listAgents();
      const overlaps: OverlapAnalysis[] = [];
      
      // Comparar cada par de agentes
      for (let i = 0; i < agents.length; i++) {
        for (let j = i + 1; j < agents.length; j++) {
          const overlap = this.compareAgents(agents[i], agents[j]);
          if (overlap.overlapPercentage > 30) { // Threshold de 30%
            overlaps.push(overlap);
          }
        }
      }
      
      // Memorizar análise
      if (overlaps.length > 0) {
        await this.memory.addMemory({
          content: `Análise de sobreposição: ${overlaps.length} pares de agentes com sobreposição significativa detectados`,
          category: 'agent_analysis',
          metadata: {
            date: new Date().toISOString(),
            overlapsFound: overlaps.length,
            totalAgents: agents.length
          },
          tags: ['agent_overlap', 'optimization']
        });
      }
      
      return overlaps;
    } catch (error) {
      console.error('❌ Erro ao analisar agentes:', error);
      return [];
    }
  }

  /**
   * Compara dois agentes e calcula sobreposição
   */
  private compareAgents(agent1: AgentInfo, agent2: AgentInfo): OverlapAnalysis {
    const sharedTools = agent1.tools.filter(tool => agent2.tools.includes(tool));
    const totalUniqueTools = new Set([...agent1.tools, ...agent2.tools]).size;
    const overlapPercentage = (sharedTools.length / totalUniqueTools) * 100;
    
    let recommendation = '';
    
    if (overlapPercentage > 80) {
      recommendation = `Considere mesclar ${agent1.name} e ${agent2.name} - alta sobreposição`;
    } else if (overlapPercentage > 50) {
      recommendation = `Revisar responsabilidades de ${agent1.name} e ${agent2.name}`;
    } else if (sharedTools.length > 3) {
      recommendation = `Considere extrair ferramentas compartilhadas em um agente base`;
    }
    
    return {
      agent1: agent1.name,
      agent2: agent2.name,
      sharedTools,
      overlapPercentage: Math.round(overlapPercentage),
      recommendation
    };
  }

  /**
   * Monitora uso de agentes e aprende padrões
   */
  async monitorAgentUsage(agentName: string, taskType: string, success: boolean) {
    await this.memory.addMemory({
      content: `Agente ${agentName} ${success ? 'completou' : 'falhou'} tarefa: ${taskType}`,
      category: 'agent_usage',
      metadata: {
        agent: agentName,
        taskType,
        success,
        timestamp: new Date().toISOString()
      },
      tags: ['usage', agentName, success ? 'success' : 'failure']
    });
  }

  /**
   * Sugere otimizações baseadas no histórico
   */
  async suggestOptimizations(): Promise<string[]> {
    const suggestions: string[] = [];
    
    // Buscar padrões de uso
    const usagePatterns = await this.memory.searchMemories('agent_usage', 50);
    
    // Analisar falhas recorrentes
    const failures = usagePatterns.filter(m => 
      m.metadata?.success === false
    );
    
    if (failures.length > 5) {
      const failingAgents = [...new Set(failures.map(f => f.metadata?.agent))];
      suggestions.push(
        `⚠️ Agentes com falhas recorrentes: ${failingAgents.join(', ')}. Considere revisar suas ferramentas.`
      );
    }
    
    // Buscar agentes não utilizados
    const allAgents = await this.listAgents();
    const usedAgents = new Set(usagePatterns.map(p => p.metadata?.agent));
    const unusedAgents = allAgents.filter(a => !usedAgents.has(a.name));
    
    if (unusedAgents.length > 0) {
      suggestions.push(
        `💤 Agentes não utilizados: ${unusedAgents.map(a => a.name).join(', ')}. Considere remover.`
      );
    }
    
    // Buscar sobreposições anteriores
    const overlapAnalyses = await this.memory.searchMemories('agent_overlap', 10);
    if (overlapAnalyses.length > 0) {
      suggestions.push(
        `🔄 Sobreposições detectadas em análises anteriores. Execute nova análise para verificar melhorias.`
      );
    }
    
    return suggestions;
  }

  /**
   * Gera relatório completo de otimização
   */
  async generateOptimizationReport(): Promise<void> {
    console.log('\n📊 RELATÓRIO DE OTIMIZAÇÃO DE AGENTES\n');
    console.log('=' * 50);
    
    // 1. Análise de sobreposições
    const overlaps = await this.analyzeAgentOverlaps();
    if (overlaps.length > 0) {
      console.log('\n🔍 SOBREPOSIÇÕES DETECTADAS:');
      overlaps.forEach(overlap => {
        console.log(`\n• ${overlap.agent1} ↔️ ${overlap.agent2}`);
        console.log(`  Sobreposição: ${overlap.overlapPercentage}%`);
        console.log(`  Ferramentas compartilhadas: ${overlap.sharedTools.join(', ')}`);
        console.log(`  💡 ${overlap.recommendation}`);
      });
    } else {
      console.log('\n✅ Nenhuma sobreposição significativa detectada');
    }
    
    // 2. Sugestões baseadas em histórico
    const suggestions = await this.suggestOptimizations();
    if (suggestions.length > 0) {
      console.log('\n💡 SUGESTÕES DE OTIMIZAÇÃO:');
      suggestions.forEach(s => console.log(`\n${s}`));
    }
    
    // 3. Memorizar relatório
    await this.memory.addMemory({
      content: `Relatório de otimização gerado: ${overlaps.length} sobreposições, ${suggestions.length} sugestões`,
      category: 'optimization_report',
      metadata: {
        date: new Date().toISOString(),
        overlapsCount: overlaps.length,
        suggestionsCount: suggestions.length
      },
      tags: ['report', 'optimization']
    });
    
    console.log('\n' + '=' * 50);
    console.log('📅 Relatório salvo na memória do Guardian\n');
  }

  /**
   * Lista todos os agentes usando a ferramenta MCP
   */
  private async listAgents(): Promise<AgentInfo[]> {
    try {
      const toolData = {
        tool: 'agents_list',
        params: {}
      };
      
      const jsonData = JSON.stringify(toolData).replace(/'/g, "'\\'''");
      const command = `cd "${this.mcpToolsPath}" && npm run execute-tool -- '${jsonData}'`;
      
      const output = execSync(command, {
        encoding: 'utf8',
        env: { ...process.env }
      });
      
      const lines = output.split('\n').filter(line => line.trim());
      const jsonLine = lines.find(line => {
        try {
          JSON.parse(line);
          return true;
        } catch {
          return false;
        }
      });
      
      if (jsonLine) {
        const result = JSON.parse(jsonLine);
        if (result.success && result.data?.data?.agents) {
          return result.data.data.agents;
        }
      }
      
      return [];
    } catch (error) {
      console.error('Erro ao listar agentes:', error);
      return [];
    }
  }
}

// Função para executar análise standalone
export async function runAgentAnalysis() {
  const analyzer = new GuardianAgentAnalyzer();
  await analyzer.generateOptimizationReport();
}

// Se executado diretamente
if (require.main === module) {
  runAgentAnalysis();
}