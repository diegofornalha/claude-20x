/**
 * Base class for all agents
 */
export abstract class BaseAgent {
  protected name: string;
  protected config: any;
  protected isRunning: boolean = false;

  constructor(name: string, config: any = {}) {
    this.name = name;
    this.config = config;
  }

  async initialize(): Promise<void> {
    console.log(`🚀 Initializing ${this.name}...`);
    this.isRunning = true;
  }

  async start(): Promise<void> {
    if (!this.isRunning) {
      await this.initialize();
    }
    await this.executeTask();
  }

  async stop(): Promise<void> {
    console.log(`🛑 Stopping ${this.name}...`);
    this.isRunning = false;
  }

  protected abstract executeTask(): Promise<void>;
}