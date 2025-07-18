/**
 * Sistema de spawn do Claude Flow
 * Cria instâncias de Claude com configurações avançadas
 * Integrado com DiegoTools MCP
 */

import { spawn, ChildProcess } from 'child_process';
import { EventEmitter } from 'events';
import { MCPBridge } from '../mcp/mcp-bridge';
import { MCP_TOOLS } from '../mcp/mcp-integration';

export interface ClaudeSpawnConfig {
  name: string;
  instruction: string;
  mode?: 'researcher' | 'implementer' | 'analyst' | 'coordinator';
  research?: boolean;
  parallel?: boolean;
  coverage?: number;
  commitStrategy?: 'atomic' | 'feature' | 'monolithic';
  tools?: string[];
  maxRetries?: number;
  timeout?: number;
}

export interface ClaudeInstance {
  id: string;
  name: string;
  process: ChildProcess;
  config: ClaudeSpawnConfig;
  status: 'idle' | 'working' | 'completed' | 'failed';
}

export class ClaudeSpawner extends EventEmitter {
  private instances: Map<string, ClaudeInstance> = new Map();
  private mcpBridge: MCPBridge;

  constructor(mcpBridge: MCPBridge) {
    super();
    this.mcpBridge = mcpBridge;
  }

  /**
   * Spawna uma nova instância do Claude com configuração específica
   */
  async spawn(config: ClaudeSpawnConfig): Promise<ClaudeInstance> {
    const id = this.generateId();
    
    // Construir comando baseado na configuração
    const command = this.buildCommand(config);
    
    // Criar processo
    const claudeProcess = spawn('claude', command.args, {
      env: {
        ...process.env,
        CLAUDE_MODE: config.mode || 'general',
        CLAUDE_TOOLS: JSON.stringify(config.tools || [])
      },
      stdio: ['pipe', 'pipe', 'pipe']
    });

    const instance: ClaudeInstance = {
      id,
      name: config.name,
      process: claudeProcess,
      config,
      status: 'idle'
    };

    // Configurar handlers
    this.setupHandlers(instance);
    
    // Registrar instância
    this.instances.set(id, instance);
    
    // Enviar instrução inicial
    await this.sendInstruction(instance, config.instruction);
    
    // Salvar contexto na memória
    await this.saveSpawnContext(instance);
    
    this.emit('spawn', { id, name: config.name, config });
    
    return instance;
  }

  /**
   * Constrói argumentos do comando baseado na configuração
   */
  private buildCommand(config: ClaudeSpawnConfig): { args: string[] } {
    const args: string[] = [];
    
    // Modo de operação
    if (config.mode) {
      args.push('--mode', config.mode);
    }
    
    // Flags booleanas
    if (config.research) {
      args.push('--research');
    }
    
    if (config.parallel) {
      args.push('--parallel');
    }
    
    // Cobertura
    if (config.coverage) {
      args.push('--coverage', config.coverage.toString());
    }
    
    // Estratégia de commit
    if (config.commitStrategy) {
      args.push('--commit-strategy', config.commitStrategy);
    }
    
    // Timeout
    if (config.timeout) {
      args.push('--timeout', config.timeout.toString());
    }
    
    return { args };
  }

  /**
   * Configura handlers para a instância
   */
  private setupHandlers(instance: ClaudeInstance): void {
    // Handler de saída
    instance.process.stdout?.on('data', async (data) => {
      const output = data.toString();
      
      // Detectar comandos de ferramentas
      const toolCommands = this.extractToolCommands(output);
      
      for (const cmd of toolCommands) {
        await this.executeToolCommand(instance, cmd);
      }
      
      this.emit('output', { 
        instanceId: instance.id, 
        output,
        timestamp: new Date()
      });
    });

    // Handler de erro
    instance.process.stderr?.on('data', (data) => {
      this.emit('error', { 
        instanceId: instance.id, 
        error: data.toString() 
      });
    });

    // Handler de saída
    instance.process.on('close', (code) => {
      instance.status = code === 0 ? 'completed' : 'failed';
      this.emit('close', { 
        instanceId: instance.id, 
        code,
        status: instance.status
      });
    });
  }

  /**
   * Envia instrução para a instância
   */
  private async sendInstruction(instance: ClaudeInstance, instruction: string): Promise<void> {
    if (!instance.process.stdin) {
      throw new Error('Process stdin not available');
    }

    // Construir prompt com ferramentas disponíveis
    const enhancedInstruction = this.enhanceInstruction(instruction, instance.config);
    
    instance.process.stdin.write(enhancedInstruction + '\n');
    instance.status = 'working';
  }

  /**
   * Aprimora instrução com contexto de ferramentas
   */
  private enhanceInstruction(instruction: string, config: ClaudeSpawnConfig): string {
    let enhanced = instruction;
    
    // Adicionar contexto do modo
    if (config.mode) {
      const modeContext = this.getModeContext(config.mode);
      enhanced = `${modeContext}\n\n${enhanced}`;
    }
    
    // Adicionar ferramentas disponíveis
    if (config.tools && config.tools.length > 0) {
      const toolsContext = `
Ferramentas MCP disponíveis:
${config.tools.map(t => `- ${t}`).join('\n')}

Para usar uma ferramenta, use o formato:
[TOOL: nome_da_ferramenta] { "param": "valor" }
`;
      enhanced = `${enhanced}\n\n${toolsContext}`;
    }
    
    return enhanced;
  }

  /**
   * Extrai comandos de ferramentas da saída
   */
  private extractToolCommands(output: string): Array<{tool: string, params: any}> {
    const commands: Array<{tool: string, params: any}> = [];
    const regex = /\[TOOL:\s*(\w+)\]\s*({[^}]+})/g;
    let match;
    
    while ((match = regex.exec(output)) !== null) {
      try {
        const tool = match[1];
        const params = JSON.parse(match[2]);
        commands.push({ tool, params });
      } catch (e) {
        console.error('Error parsing tool command:', e);
      }
    }
    
    return commands;
  }

  /**
   * Executa comando de ferramenta via MCP
   */
  private async executeToolCommand(
    instance: ClaudeInstance, 
    cmd: {tool: string, params: any}
  ): Promise<void> {
    try {
      const result = await this.mcpBridge.callTool(cmd.tool, cmd.params);
      
      // Enviar resultado de volta para a instância
      if (instance.process.stdin) {
        instance.process.stdin.write(
          `[TOOL_RESULT: ${cmd.tool}] ${JSON.stringify(result)}\n`
        );
      }
      
      // Salvar na memória
      await this.mcpBridge.addMemory(
        instance.id,
        `Tool executed: ${cmd.tool}\nResult: ${JSON.stringify(result)}`,
        {
          type: 'tool_execution',
          tool: cmd.tool,
          instanceId: instance.id
        }
      );
      
    } catch (error) {
      console.error(`Error executing tool ${cmd.tool}:`, error);
      
      if (instance.process.stdin) {
        instance.process.stdin.write(
          `[TOOL_ERROR: ${cmd.tool}] ${error instanceof Error ? error.message : String(error)}\n`
        );
      }
    }
  }

  /**
   * Salva contexto do spawn na memória
   */
  private async saveSpawnContext(instance: ClaudeInstance): Promise<void> {
    await this.mcpBridge.addMemory(
      instance.id,
      `Claude instance spawned: ${instance.name}
Mode: ${instance.config.mode || 'general'}
Instruction: ${instance.config.instruction}
Tools: ${instance.config.tools?.join(', ') || 'none'}`,
      {
        type: 'spawn_context',
        instanceId: instance.id,
        config: instance.config
      }
    );
  }

  /**
   * Obtém contexto específico do modo
   */
  private getModeContext(mode: string): string {
    const contexts = {
      researcher: 'Você é um pesquisador especializado. Foque em coletar e analisar informações detalhadamente.',
      implementer: 'Você é um implementador. Foque em criar soluções práticas e código funcional.',
      analyst: 'Você é um analista. Foque em identificar padrões, problemas e oportunidades.',
      coordinator: 'Você é um coordenador. Foque em organizar tarefas e gerenciar o fluxo de trabalho.'
    };
    
    return contexts[mode as keyof typeof contexts] || '';
  }

  /**
   * Gera ID único
   */
  private generateId(): string {
    return `claude_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Obtém status de todas as instâncias
   */
  getInstances(): Array<{id: string, name: string, status: string}> {
    return Array.from(this.instances.values()).map(inst => ({
      id: inst.id,
      name: inst.name,
      status: inst.status
    }));
  }

  /**
   * Para uma instância específica
   */
  kill(instanceId: string): void {
    const instance = this.instances.get(instanceId);
    if (instance) {
      instance.process.kill();
      this.instances.delete(instanceId);
    }
  }

  /**
   * Para todas as instâncias
   */
  killAll(): void {
    for (const instance of this.instances.values()) {
      instance.process.kill();
    }
    this.instances.clear();
  }
}