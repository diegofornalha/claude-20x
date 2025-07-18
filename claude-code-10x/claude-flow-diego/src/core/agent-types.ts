/**
 * Tipos e enums compartilhados para agentes
 * Arquivo separado para evitar dependências circulares
 */

export enum AgentType {
  RESEARCHER = "researcher",
  IMPLEMENTER = "implementer",
  ANALYST = "analyst",
  COORDINATOR = "coordinator",
  CUSTOM = "custom"
}

export enum AgentStatus {
  IDLE = "idle",
  WORKING = "working",
  WAITING = "waiting",
  ERROR = "error"
}