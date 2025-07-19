import { BaseAgent, AgentConfig, Task } from '../core/base-agent';
import { exec } from 'child_process';
import * as path from 'path';

// Configuração específica para agentes que chamam APIs externas via script
export interface CustomApiAgentConfig extends AgentConfig {
  scriptPath: string; // Caminho para o script python
  runtime: string; // Ex: 'python3'
}

export class CustomApiAgent extends BaseAgent {
  private scriptPath: string;
  private runtime: string;

  constructor(config: CustomApiAgentConfig) {
    super(config);
    this.runtime = config.runtime;
    // Resolve o caminho do script relativo à raiz do projeto
    this.scriptPath = path.resolve(__dirname, '../../../../../', config.scriptPath);
  }

  protected async _processTask(task: Task): Promise<any> {
    this.log(`Iniciando tarefa customizada: ${task.description}`);
    
    const taskJson = JSON.stringify(task);
    const command = `${this.runtime} ${this.scriptPath}`;

    return new Promise((resolve, reject) => {
      // Executa o script python como um processo filho
      const child = exec(command, (error, stdout, stderr) => {
        if (error) {
          this.error(`Erro ao executar script: ${error.message}`);
          return reject(error);
        }
        if (stderr) {
          this.warn(`Stderr do script: ${stderr}`);
        }
        
        try {
          const result = JSON.parse(stdout);
          this.log(`Tarefa customizada concluída: ${task.id}`);
          resolve(result);
        } catch (e) {
          this.error(`Erro ao parsear resultado do script: ${stdout}`);
          reject(e);
        }
      });

      // Envia a tarefa para o stdin do processo filho
      child.stdin?.write(taskJson);
      child.stdin?.end();
    });
  }
}
