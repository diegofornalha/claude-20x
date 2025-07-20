// JSON-RPC 2.0 Types
export interface JsonRpcRequest {
  jsonrpc: '2.0';
  method: string;
  params?: any;
  id: string | number | null;
}

export interface JsonRpcResponse {
  jsonrpc: '2.0';
  id: string | number | null;
  result?: any;
  error?: JsonRpcError;
}

export interface JsonRpcError {
  code: number;
  message: string;
  data?: any;
}

// A2A Protocol Types
export interface Message {
  role: 'user' | 'agent' | 'system';
  parts: MessagePart[];
  messageId: string;
  taskId?: string;
  metadata?: {
    [key: string]: any;
  };
}

export interface MessagePart {
  kind: 'text' | 'image' | 'file' | 'data';
  text?: string;
  data?: any;
  mimeType?: string;
}

export interface Task {
  id: string;
  contextId: string;
  status: TaskStatus;
  artifacts?: Artifact[];
  history: Message[];
  kind: 'task';
  metadata?: TaskMetadata;
}

export interface TaskStatus {
  state: 'submitted' | 'working' | 'completed' | 'failed' | 'canceled';
  message?: Message;
  timestamp: string;
}

export interface Artifact {
  artifactId: string;
  name: string;
  parts: MessagePart[];
}

export interface TaskMetadata {
  sparcPhase?: string;
  batchtoolsOptimized?: boolean;
  estimatedDuration?: number;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  [key: string]: any;
}