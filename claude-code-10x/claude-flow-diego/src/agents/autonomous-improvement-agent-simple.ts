/**
 * Agente Autônomo de Melhoria Simplificado
 * 
 * Versão que funciona diretamente com Claude Code CLI
 * sem necessidade de MCP Bridge completo
 */

import { spawn } from 'child_process';
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';

interface ImprovementTask {
  id: string;
  description: string;
  status: 'pending' | 'analyzing' | 'implementing' | 'testing' | 'completed' | 'failed';
  progress: number;
  subtasks?: ImprovementTask[];
  findings?: string[];
  decisions?: string[];
  result?: any;
}

export class AutonomousImprovementAgentSimple {
  private currentTask: ImprovementTask | null = null;
  private taskHistory: ImprovementTask[] = [];
  private thoughtLog: string[] = [];
  private workingDir: string;
  
  constructor(workingDir: string = process.cwd()) {
    this.workingDir = workingDir;
  }

  async run(taskDescription: string): Promise<void> {
    console.log('🚀 Iniciando análise e melhoria autônoma...\n');
    
    // Criar tarefa principal
    this.currentTask = {
      id: Date.now().toString(),
      description: taskDescription,
      status: 'analyzing',
      progress: 0
    };

    try {
      // Fase 1: Análise inicial
      await this.analyzeTask();
      
      // Fase 2: Planejamento detalhado
      await this.planImplementation();
      
      // Fase 3: Execução iterativa
      await this.executeImprovements();
      
      // Fase 4: Validação
      await this.validateChanges();
      
      console.log('\n✅ Melhorias concluídas com sucesso!');
      this.saveReport();
      
    } catch (error) {
      console.error('❌ Erro durante melhoria:', error);
      if (this.currentTask) {
        this.currentTask.status = 'failed';
      }
    }
  }

  private async analyzeTask(): Promise<void> {
    console.log('🔍 Fase 1: Analisando tarefa...\n');
    
    // Simular análise com Claude
    const analysisPrompt = `
Analise a seguinte tarefa de melhoria e forneça:
1. Lista de arquivos que precisam ser modificados
2. Dependências entre as modificações
3. Riscos e considerações
4. Ordem recomendada de implementação

Tarefa: ${this.currentTask?.description}

Responda de forma estruturada e objetiva.
`;

    const analysis = await this.executeClaudeCommand(analysisPrompt);
    
    if (this.currentTask) {
      this.currentTask.findings = this.parseFindings(analysis);
      this.currentTask.progress = 20;
      this.currentTask.status = 'analyzing';
    }

    console.log('📊 Análise concluída. Principais descobertas:');
    this.currentTask?.findings?.forEach((f, i) => {
      console.log(`  ${i + 1}. ${f}`);
    });
  }

  private async planImplementation(): Promise<void> {
    console.log('\n📋 Fase 2: Planejando implementação...\n');
    
    const planPrompt = `
Com base na análise anterior, crie um plano detalhado de implementação.

Para cada passo:
- Descreva a ação específica
- Identifique os arquivos a modificar
- Defina critérios de sucesso

Tarefa: ${this.currentTask?.description}
Análise: ${this.currentTask?.findings?.join('\n')}

Formate como lista numerada de subtarefas.
`;

    const plan = await this.executeClaudeCommand(planPrompt);
    
    if (this.currentTask) {
      this.currentTask.subtasks = this.parsePlan(plan);
      this.currentTask.progress = 30;
      this.currentTask.status = 'implementing';
    }

    console.log('📝 Plano criado com', this.currentTask?.subtasks?.length, 'subtarefas');
  }

  private async executeImprovements(): Promise<void> {
    console.log('\n🔧 Fase 3: Executando melhorias...\n');
    
    if (!this.currentTask?.subtasks) return;

    for (let i = 0; i < this.currentTask.subtasks.length; i++) {
      const subtask = this.currentTask.subtasks[i];
      console.log(`\n📌 Subtarefa ${i + 1}/${this.currentTask.subtasks.length}: ${subtask.description}`);
      
      // Executar subtarefa
      const result = await this.executeSubtask(subtask);
      subtask.result = result;
      subtask.status = 'completed';
      
      // Atualizar progresso
      const progressPerTask = 50 / this.currentTask.subtasks.length;
      this.currentTask.progress = 30 + (i + 1) * progressPerTask;
      
      // Verificação intermediária a cada 3 subtarefas
      if ((i + 1) % 3 === 0 && i < this.currentTask.subtasks.length - 1) {
        console.log('\n🔍 Verificação intermediária...');
        await this.intermediateCheck();
      }
    }
  }

  private async executeSubtask(subtask: ImprovementTask): Promise<any> {
    const executePrompt = `
Execute a seguinte subtarefa:
${subtask.description}

Contexto da tarefa principal: ${this.currentTask?.description}

Implemente as mudanças necessárias e retorne um resumo do que foi feito.
`;

    return await this.executeClaudeCommand(executePrompt, true);
  }

  private async intermediateCheck(): Promise<void> {
    const checkPrompt = `
Verifique o progresso até agora:
- Subtarefas completadas: ${this.currentTask?.subtasks?.filter(t => t.status === 'completed').length}
- Total de subtarefas: ${this.currentTask?.subtasks?.length}

Há algum problema ou ajuste necessário? Responda brevemente.
`;

    const check = await this.executeClaudeCommand(checkPrompt);
    console.log('Resultado da verificação:', check.substring(0, 200) + '...');
  }

  private async validateChanges(): Promise<void> {
    console.log('\n✔️  Fase 4: Validando mudanças...\n');
    
    const validationPrompt = `
Valide as mudanças realizadas:
1. Verifique se todos os objetivos foram alcançados
2. Execute testes relevantes (npm test, lint, etc)
3. Verifique por possíveis regressões
4. Confirme que o código está funcionando

Tarefa original: ${this.currentTask?.description}
`;

    const validation = await this.executeClaudeCommand(validationPrompt, true);
    
    if (this.currentTask) {
      this.currentTask.status = 'completed';
      this.currentTask.progress = 100;
    }

    console.log('✅ Validação concluída');
  }

  private async executeClaudeCommand(prompt: string, allowExecution = false): Promise<string> {
    return new Promise((resolve, reject) => {
      const args = allowExecution ? [] : ['--no-execute'];
      const claude = spawn('claude', [...args, prompt], {
        cwd: this.workingDir,
        shell: true
      });

      let output = '';
      let error = '';

      claude.stdout?.on('data', (data) => {
        const text = data.toString();
        output += text;
        // Mostrar saída em tempo real para tarefas de execução
        if (allowExecution) {
          process.stdout.write(text);
        }
      });

      claude.stderr?.on('data', (data) => {
        error += data.toString();
      });

      claude.on('close', (code) => {
        if (code === 0) {
          this.thoughtLog.push(`[${new Date().toISOString()}] Comando executado com sucesso`);
          resolve(output);
        } else {
          this.thoughtLog.push(`[${new Date().toISOString()}] Erro no comando: ${error}`);
          reject(new Error(`Claude exit with code ${code}: ${error}`));
        }
      });

      claude.on('error', (err) => {
        reject(err);
      });
    });
  }

  private parseFindings(analysis: string): string[] {
    // Extrair principais pontos da análise
    const lines = analysis.split('\n');
    const findings: string[] = [];
    
    for (const line of lines) {
      if (line.match(/^\d+\.|^-|^•/) && line.trim().length > 10) {
        findings.push(line.replace(/^[\d\.\-•]\s*/, '').trim());
      }
    }
    
    return findings.slice(0, 5); // Limitar a 5 principais findings
  }

  private parsePlan(plan: string): ImprovementTask[] {
    const lines = plan.split('\n');
    const subtasks: ImprovementTask[] = [];
    
    for (const line of lines) {
      if (line.match(/^\d+\./) && line.trim().length > 10) {
        subtasks.push({
          id: Date.now().toString() + Math.random(),
          description: line.replace(/^\d+\.\s*/, '').trim(),
          status: 'pending',
          progress: 0
        });
      }
    }
    
    return subtasks;
  }

  private saveReport(): void {
    const report = {
      task: this.currentTask,
      thoughtLog: this.thoughtLog,
      timestamp: new Date().toISOString(),
      workingDir: this.workingDir
    };

    const reportPath = join(this.workingDir, `improvement-report-${Date.now()}.json`);
    writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📄 Relatório salvo em: ${reportPath}`);
  }
}

// Função helper para criar e executar o agente
export async function runAutonomousImprovement(taskDescription: string, workingDir?: string) {
  const agent = new AutonomousImprovementAgentSimple(workingDir);
  await agent.run(taskDescription);
}