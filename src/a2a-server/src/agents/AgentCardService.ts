import { Logger } from '../utils/Logger';

interface AgentCard {
  protocolVersion: string;
  name: string;
  description: string;
  url: string;
  preferredTransport: string;
  additionalInterfaces: AgentInterface[];
  provider: AgentProvider;
  version: string;
  documentationUrl: string;
  capabilities: AgentCapabilities;
  securitySchemes: Record<string, SecurityScheme>;
  security: Security[];
  defaultInputModes: string[];
  defaultOutputModes: string[];
  skills: AgentSkill[];
  supportsAuthenticatedExtendedCard: boolean;
}

interface AgentInterface {
  url: string;
  transport: string;
}

interface AgentProvider {
  url: string;
  organization: string;
}

interface AgentCapabilities {
  streaming: boolean;
  pushNotifications: boolean;
  extensions: AgentExtension[];
}

interface AgentExtension {
  uri: string;
  description: string;
  required: boolean;
  params: Record<string, any>;
}

interface AgentSkill {
  id: string;
  name: string;
  description: string;
  tags: string[];
  examples: string[];
  inputModes: string[];
  outputModes: string[];
}

interface SecurityScheme {
  type: string;
  description: string;
  name?: string;
  location?: string;
}

interface Security {
  schemes: Record<string, string[]>;
}

export class AgentCardService {
  private logger: Logger;
  private agentCard: AgentCard;

  constructor() {
    this.logger = new Logger('AgentCardService');
    this.agentCard = this.createDefaultAgentCard();
  }

  async getAgentCard(): Promise<AgentCard> {
    return this.agentCard;
  }

  async updateAgentCard(updates: Partial<AgentCard>): Promise<void> {
    this.agentCard = { ...this.agentCard, ...updates };
    this.logger.info('Agent card updated');
  }

  async getAgentHealth(): Promise<any> {
    return {
      status: 'healthy',
      lastUpdated: new Date().toISOString(),
      capabilities: this.agentCard.capabilities,
      activeSkills: this.agentCard.skills.length
    };
  }

  private createDefaultAgentCard(): AgentCard {
    return {
      protocolVersion: "1.0",
      name: "SPARC A2A JSON-RPC Server",
      description: "Servidor JSON-RPC A2A com integração SPARC, Batchtools e Memory Bank para Claude Flow",
      url: "http://localhost:3000",
      preferredTransport: "jsonrpc",
      additionalInterfaces: [
        {
          url: "http://localhost:3000/stream",
          transport: "sse"
        }
      ],
      provider: {
        url: "https://github.com/claude-flow",
        organization: "Claude Flow Development Team"
      },
      version: "1.0.0",
      documentationUrl: "https://github.com/claude-flow/docs/a2a-integration",
      capabilities: {
        streaming: true,
        pushNotifications: true,
        extensions: [
          {
            uri: "sparc://workflow",
            description: "SPARC (Specification, Pseudocode, Architecture, Refinement, Completion) workflow integration",
            required: false,
            params: {
              "supportedPhases": ["specification", "pseudocode", "architecture", "refinement", "completion"],
              "enableBatchtools": true
            }
          },
          {
            uri: "memory://bank",
            description: "Memory Bank integration for persistent context and knowledge storage",
            required: false,
            params: {
              "storageTypes": ["context", "memory", "artifacts"],
              "namespaceSupport": true
            }
          },
          {
            uri: "batchtools://optimization",
            description: "Batchtools optimization for parallel processing and performance enhancement",
            required: false,
            params: {
              "concurrentOperations": true,
              "performanceOptimization": true
            }
          }
        ]
      },
      securitySchemes: {
        "apiKey": {
          type: "apiKey",
          description: "API Key authentication",
          name: "X-API-Key",
          location: "header"
        },
        "bearer": {
          type: "http",
          description: "Bearer token authentication"
        }
      },
      security: [
        {
          schemes: {
            "apiKey": [],
            "bearer": []
          }
        }
      ],
      defaultInputModes: ["text", "json", "multipart"],
      defaultOutputModes: ["text", "json", "stream"],
      skills: [
        {
          id: "message_processing",
          name: "Message Processing",
          description: "Processa mensagens A2A com workflow SPARC integrado",
          tags: ["messaging", "sparc", "workflow"],
          examples: [
            "Processar mensagem de usuário com análise SPARC",
            "Executar workflow de desenvolvimento com Batchtools"
          ],
          inputModes: ["text", "json"],
          outputModes: ["text", "json", "stream"]
        },
        {
          id: "task_management",
          name: "Task Management", 
          description: "Gerencia ciclo de vida de tarefas A2A com estados e transições",
          tags: ["tasks", "lifecycle", "state-machine"],
          examples: [
            "Criar e executar tarefa com SPARC workflow",
            "Monitorar progresso de tarefa com streaming"
          ],
          inputModes: ["json"],
          outputModes: ["json", "stream"]
        },
        {
          id: "sparc_integration",
          name: "SPARC Workflow Integration",
          description: "Executa fases SPARC com otimização Batchtools",
          tags: ["sparc", "workflow", "development", "tdd"],
          examples: [
            "Executar especificação SPARC para feature request",
            "Gerar pseudocódigo com análise de dependências",
            "Criar arquitetura com validação de padrões"
          ],
          inputModes: ["text", "json"],
          outputModes: ["text", "json", "stream"]
        },
        {
          id: "memory_operations",
          name: "Memory Bank Operations",
          description: "Operações de armazenamento e recuperação de contexto/conhecimento",
          tags: ["memory", "context", "knowledge", "persistence"],
          examples: [
            "Armazenar contexto de desenvolvimento em namespace",
            "Recuperar histórico de decisões arquiteturais",
            "Buscar padrões de código similares"
          ],
          inputModes: ["text", "json"],
          outputModes: ["json"]
        },
        {
          id: "streaming_communication",
          name: "Streaming Communication",
          description: "Comunicação em tempo real via Server-Sent Events",
          tags: ["streaming", "sse", "realtime", "events"],
          examples: [
            "Stream de progresso de execução SPARC",
            "Notificações de mudança de estado de tarefa",
            "Updates em tempo real de métricas"
          ],
          inputModes: ["json"],
          outputModes: ["stream"]
        }
      ],
      supportsAuthenticatedExtendedCard: true
    };
  }
}