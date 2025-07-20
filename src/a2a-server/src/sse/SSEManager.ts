import { FastifyRequest, FastifyReply } from 'fastify';
import { EventEmitter } from 'events';
import { Logger } from '../utils/Logger';

interface SSEConfig {
  pingInterval?: number;
  connectionTimeout?: number;
}

interface SSEEvent {
  type: string;
  data: any;
}

export class SSEConnection extends EventEmitter {
  private isAlive: boolean = true;
  private pingTimer?: NodeJS.Timeout;

  constructor(
    public readonly connectionId: string,
    private reply: FastifyReply,
    private config: SSEConfig
  ) {
    super();
    this.setupSSE();
  }

  private setupSSE(): void {
    // Set SSE headers
    this.reply.raw.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    });

    // Send initial ping
    this.ping();

    // Setup periodic ping
    if (this.config.pingInterval) {
      this.pingTimer = setInterval(() => {
        if (this.isAlive) {
          this.ping();
        } else {
          this.cleanup();
        }
      }, this.config.pingInterval);
    }

    // Handle client disconnect
    this.reply.raw.on('close', () => {
      this.close();
    });
  }

  sendEvent(event: SSEEvent): void {
    if (!this.isAlive) return;

    const eventData = `event: ${event.type}\ndata: ${JSON.stringify(event.data)}\n\n`;
    this.reply.raw.write(eventData);
  }

  ping(): void {
    this.sendEvent({
      type: 'ping',
      data: { timestamp: Date.now() }
    });
  }

  close(): void {
    this.isAlive = false;
    this.cleanup();
    this.reply.raw.end();
    this.emit('disconnect');
  }

  private cleanup(): void {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = undefined;
    }
  }
}export class SSEManager {
  private connections: Map<string, SSEConnection> = new Map();
  private logger: Logger;

  constructor(private config: SSEConfig) {
    this.logger = new Logger('SSEManager');
  }

  createConnection(connectionId: string): void {
    // This will be set up when the actual SSE request comes in
    this.logger.debug(`Connection registered: ${connectionId}`);
  }

  getConnection(connectionId: string): SSEConnection | undefined {
    return this.connections.get(connectionId);
  }

  async handleSSERequest(connectionId: string, request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const connection = new SSEConnection(connectionId, reply, this.config);
      this.connections.set(connectionId, connection);

      // Handle connection lifecycle
      connection.on('disconnect', () => {
        this.connections.delete(connectionId);
        this.logger.debug(`Connection removed: ${connectionId}`);
      });

      this.logger.info(`SSE connection established: ${connectionId}`);

      // Keep connection alive until client disconnects
      await new Promise<void>((resolve) => {
        connection.once('disconnect', resolve);
        request.raw.on('close', resolve);
        request.raw.on('error', resolve);
      });

    } catch (error) {
      this.logger.error(`SSE connection error for ${connectionId}:`, error);
      throw error;
    }
  }

  broadcastToAll(event: SSEEvent): void {
    for (const [connectionId, connection] of this.connections) {
      try {
        connection.sendEvent(event);
      } catch (error) {
        this.logger.warn(`Failed to send event to connection ${connectionId}:`, error);
      }
    }
  }

  closeConnection(connectionId: string): void {
    const connection = this.connections.get(connectionId);
    if (connection) {
      connection.close();
    }
  }

  getActiveConnections(): string[] {
    return Array.from(this.connections.keys());
  }

  getConnectionCount(): number {
    return this.connections.size;
  }

  closeAllConnections(): void {
    for (const connection of this.connections.values()) {
      connection.close();
    }
    this.connections.clear();
  }
}