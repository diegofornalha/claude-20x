/**
 * Git + Memory Integration
 * 
 * Sistema híbrido que vincula memórias dos agentes aos commits Git,
 * criando um histórico completo de "what the agent was thinking" por mudança.
 */

import { execSync } from 'child_process';
import * as fs from 'fs/promises';
import * as path from 'path';
import { GuardianMemoryManagerOSS } from './guardian-memory-oss';
import { MemoryBackupRestore } from './memory-backup-restore';

interface GitCommitContext {
  hash: string;
  shortHash: string;
  message: string;
  author: string;
  date: string;
  filesChanged: string[];
  additions: number;
  deletions: number;
  branch: string;
}

interface AgentDecisionRecord {
  commitHash: string;
  agentName: string;
  decisionTimestamp: string;
  preCommitState: {
    memorySnapshot: any[];
    activeDecisions: string[];
    organizationScore?: number;
  };
  reasoning: string;
  filesAffected: string[];
  expectedImpact: string;
}

interface GitMemoryTimeline {
  commit: GitCommitContext;
  agentDecisions: AgentDecisionRecord[];
  memoryBackup?: string; // Path to backup file
  summary: string;
}

export class GitMemoryIntegration {
  private memory: GuardianMemoryManagerOSS;
  private backup: MemoryBackupRestore;
  private projectRoot: string;

  constructor(bridgeUrl: string = 'http://localhost:3002') {
    this.memory = new GuardianMemoryManagerOSS(bridgeUrl);
    this.backup = new MemoryBackupRestore('./data/git-memory-backups');
    this.projectRoot = process.cwd();
  }

  /**
   * Cria snapshot das memórias vinculado ao commit atual
   */
  async createCommitMemorySnapshot(commitMessage?: string): Promise<string> {
    try {
      console.log('📸 Criando snapshot Git+Memory...');

      // Obter contexto do commit atual/pendente
      const gitContext = await this.getGitContext();
      
      // Obter estado atual das memórias
      const currentMemories = await this.memory.listMemories(1000);
      
      // Criar backup com contexto Git
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFilename = `git-memory-${gitContext.shortHash}-${timestamp}.json`;
      
      // Backup especial com contexto Git
      const gitMemoryBackup = {
        metadata: {
          version: '1.0.0',
          created_at: new Date().toISOString(),
          commit_hash: gitContext.hash,
          commit_message: commitMessage || gitContext.message,
          branch: gitContext.branch,
          files_changed: gitContext.filesChanged,
          agent_context: 'pre_commit_snapshot',
          total_memories: currentMemories.length
        },
        git_context: gitContext,
        memories: currentMemories,
        agent_state: {
          active_decisions: await this.getActiveDecisions(),
          recent_patterns: await this.getRecentPatterns(),
          organization_insights: await this.getOrganizationInsights()
        }
      };

      // Salvar backup especial
      const backupPath = path.join('./data/git-memory-backups', backupFilename);
      await fs.mkdir(path.dirname(backupPath), { recursive: true });
      await fs.writeFile(backupPath, JSON.stringify(gitMemoryBackup, null, 2));

      // Registrar no sistema de memória
      await this.memory.addMemory({
        content: `Snapshot Git+Memory criado para commit ${gitContext.shortHash}: ${commitMessage || gitContext.message}`,
        category: 'git_integration',
        metadata: {
          commit_hash: gitContext.hash,
          commit_short: gitContext.shortHash,
          backup_file: backupFilename,
          files_changed: gitContext.filesChanged.length,
          branch: gitContext.branch,
          snapshot_type: 'pre_commit'
        },
        tags: ['git', 'snapshot', 'integration', gitContext.branch]
      });

      console.log(`✅ Snapshot criado: ${backupFilename}`);
      console.log(`🔗 Vinculado ao commit: ${gitContext.shortHash}`);
      
      return backupPath;
    } catch (error) {
      console.error('❌ Erro ao criar snapshot Git+Memory:', error);
      throw error;
    }
  }

  /**
   * Registra decisão do agente vinculada ao contexto Git atual
   */
  async recordAgentDecision(
    agentName: string,
    reasoning: string,
    expectedImpact: string,
    filesAffected: string[] = []
  ): Promise<void> {
    try {
      console.log(`🤖 Registrando decisão do agente ${agentName}...`);

      const gitContext = await this.getGitContext();
      const currentMemories = await this.memory.listMemories(50);

      const decision: AgentDecisionRecord = {
        commitHash: gitContext.hash,
        agentName,
        decisionTimestamp: new Date().toISOString(),
        preCommitState: {
          memorySnapshot: currentMemories,
          activeDecisions: await this.getActiveDecisions(),
          organizationScore: await this.getOrganizationScore()
        },
        reasoning,
        filesAffected,
        expectedImpact
      };

      // Salvar decisão como memória estruturada
      await this.memory.addMemory({
        content: `Decisão do agente ${agentName}: ${reasoning}`,
        category: 'agent_decision',
        metadata: {
          commit_hash: gitContext.hash,
          commit_short: gitContext.shortHash,
          agent_name: agentName,
          decision_type: 'pre_commit',
          files_affected: filesAffected,
          expected_impact: expectedImpact,
          branch: gitContext.branch,
          decision_timestamp: decision.decisionTimestamp
        },
        tags: ['agent_decision', 'git_integration', agentName.toLowerCase(), gitContext.branch]
      });

      console.log(`✅ Decisão registrada para commit ${gitContext.shortHash}`);
    } catch (error) {
      console.error('❌ Erro ao registrar decisão:', error);
      throw error;
    }
  }

  /**
   * Cria timeline completa Git+Memory para um período
   */
  async createGitMemoryTimeline(days: number = 7): Promise<GitMemoryTimeline[]> {
    try {
      console.log(`📅 Criando timeline Git+Memory dos últimos ${days} dias...`);

      // Obter commits recentes
      const commits = await this.getRecentCommits(days);
      const timeline: GitMemoryTimeline[] = [];

      for (const commit of commits) {
        // Buscar decisões dos agentes para este commit
        const agentDecisions = await this.memory.searchMemories(
          `commit ${commit.shortHash} decisão agente`,
          10
        );

        // Buscar backup de memória se existir
        const memoryBackup = await this.findMemoryBackupForCommit(commit.hash);

        const timelineEntry: GitMemoryTimeline = {
          commit,
          agentDecisions: agentDecisions.map(decision => ({
            commitHash: commit.hash,
            agentName: decision.metadata?.agent_name || 'Unknown',
            decisionTimestamp: decision.metadata?.decision_timestamp || commit.date,
            preCommitState: {
              memorySnapshot: [],
              activeDecisions: []
            },
            reasoning: decision.content,
            filesAffected: decision.metadata?.files_affected || [],
            expectedImpact: decision.metadata?.expected_impact || 'N/A'
          })),
          memoryBackup,
          summary: this.generateTimelineSummary(commit, agentDecisions)
        };

        timeline.push(timelineEntry);
      }

      console.log(`✅ Timeline criada: ${timeline.length} entradas`);
      return timeline;
    } catch (error) {
      console.error('❌ Erro ao criar timeline:', error);
      return [];
    }
  }

  /**
   * Instala hook Git automático para capturar memórias
   */
  async installGitHooks(): Promise<void> {
    try {
      console.log('🔧 Instalando hooks Git automáticos...');

      const hooksDir = path.join(this.projectRoot, '.git', 'hooks');
      
      // Hook pre-commit: captura estado antes do commit
      const preCommitHook = `#!/bin/sh
# Git+Memory Integration - Pre-commit Hook
echo "🧠 Capturando estado das memórias dos agentes..."

# Executar captura de memórias
node -e "
const { GitMemoryIntegration } = require('./claude-flow/src/utils/git-memory-integration');
const integration = new GitMemoryIntegration();
integration.createCommitMemorySnapshot().catch(console.error);
"

echo "✅ Estado das memórias capturado"
`;

      // Hook post-commit: registra commit concluído
      const postCommitHook = `#!/bin/sh
# Git+Memory Integration - Post-commit Hook
echo "📝 Registrando commit concluído no sistema de memórias..."

COMMIT_HASH=$(git rev-parse HEAD)
COMMIT_MSG=$(git log -1 --pretty=%B)

node -e "
const { GitMemoryIntegration } = require('./claude-flow/src/utils/git-memory-integration');
const integration = new GitMemoryIntegration();
integration.recordCommitCompletion('$COMMIT_HASH', '$COMMIT_MSG').catch(console.error);
"

echo "✅ Commit registrado no sistema de memórias"
`;

      // Salvar hooks
      await fs.writeFile(path.join(hooksDir, 'pre-commit'), preCommitHook);
      await fs.writeFile(path.join(hooksDir, 'post-commit'), postCommitHook);

      // Tornar executáveis
      await fs.chmod(path.join(hooksDir, 'pre-commit'), 0o755);
      await fs.chmod(path.join(hooksDir, 'post-commit'), 0o755);

      console.log('✅ Hooks Git instalados:');
      console.log('  📋 pre-commit: Captura memórias antes do commit');
      console.log('  📝 post-commit: Registra commit concluído');

    } catch (error) {
      console.error('❌ Erro ao instalar hooks:', error);
      throw error;
    }
  }

  /**
   * Visualiza histórico de decisões por arquivo
   */
  async getFileDecisionHistory(filePath: string): Promise<any[]> {
    const decisions = await this.memory.searchMemories(
      `arquivo ${filePath} decisão modificação`,
      20
    );

    return decisions.map(decision => ({
      timestamp: decision.metadata?.decision_timestamp,
      commit: decision.metadata?.commit_short,
      agent: decision.metadata?.agent_name,
      reasoning: decision.content,
      impact: decision.metadata?.expected_impact
    }));
  }

  /**
   * Métodos auxiliares privados
   */
  private async getGitContext(): Promise<GitCommitContext> {
    try {
      const hash = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
      const shortHash = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
      const message = execSync('git log -1 --pretty=%B', { encoding: 'utf8' }).trim();
      const author = execSync('git log -1 --pretty=%an', { encoding: 'utf8' }).trim();
      const date = execSync('git log -1 --pretty=%ai', { encoding: 'utf8' }).trim();
      const branch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
      
      // Arquivos modificados
      const filesChanged = execSync('git diff --name-only HEAD~1 HEAD', { encoding: 'utf8' })
        .split('\n').filter(f => f.trim());
      
      // Estatísticas
      const stats = execSync('git diff --stat HEAD~1 HEAD', { encoding: 'utf8' });
      const additions = (stats.match(/(\d+) insertion/)?.[1]) ? parseInt(stats.match(/(\d+) insertion/)[1]) : 0;
      const deletions = (stats.match(/(\d+) deletion/)?.[1]) ? parseInt(stats.match(/(\d+) deletion/)[1]) : 0;

      return {
        hash,
        shortHash,
        message,
        author,
        date,
        filesChanged,
        additions,
        deletions,
        branch
      };
    } catch (error) {
      // Se não há commits, retornar contexto mínimo
      return {
        hash: 'initial',
        shortHash: 'init',
        message: 'Initial setup',
        author: 'System',
        date: new Date().toISOString(),
        filesChanged: [],
        additions: 0,
        deletions: 0,
        branch: 'main'
      };
    }
  }

  private async getRecentCommits(days: number): Promise<GitCommitContext[]> {
    try {
      const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
      const output = execSync(`git log --since="${since}" --pretty=format:"%H|%h|%s|%an|%ai" --name-only`, 
        { encoding: 'utf8' });
      
      // Parse output (implementação simplificada)
      const commits: GitCommitContext[] = [];
      const lines = output.split('\n').filter(l => l.trim());
      
      for (const line of lines) {
        if (line.includes('|')) {
          const [hash, shortHash, message, author, date] = line.split('|');
          commits.push({
            hash,
            shortHash,
            message,
            author,
            date,
            filesChanged: [],
            additions: 0,
            deletions: 0,
            branch: 'main' // Simplificado
          });
        }
      }

      return commits;
    } catch (error) {
      console.warn('⚠️ Erro ao obter commits recentes:', error.message);
      return [];
    }
  }

  private async getActiveDecisions(): Promise<string[]> {
    const recent = await this.memory.searchMemories('decisão ativa', 5);
    return recent.map(r => r.content);
  }

  private async getRecentPatterns(): Promise<string[]> {
    const patterns = await this.memory.searchMemories('padrão aprendido', 5);
    return patterns.map(p => p.content);
  }

  private async getOrganizationInsights(): Promise<string[]> {
    const insights = await this.memory.searchMemories('organização score 100', 3);
    return insights.map(i => i.content);
  }

  private async getOrganizationScore(): Promise<number | undefined> {
    const scores = await this.memory.searchMemories('score organização', 1);
    if (scores.length > 0) {
      const match = scores[0].content.match(/(\d+)%/);
      return match ? parseInt(match[1]) : undefined;
    }
    return undefined;
  }

  private async findMemoryBackupForCommit(commitHash: string): Promise<string | undefined> {
    try {
      const backupDir = './data/git-memory-backups';
      const files = await fs.readdir(backupDir);
      const commitBackup = files.find(f => f.includes(commitHash.substring(0, 7)));
      return commitBackup ? path.join(backupDir, commitBackup) : undefined;
    } catch {
      return undefined;
    }
  }

  private generateTimelineSummary(commit: GitCommitContext, decisions: any[]): string {
    if (decisions.length === 0) {
      return `Commit ${commit.shortHash}: ${commit.message} (sem decisões de agentes registradas)`;
    }
    
    const agentCount = new Set(decisions.map(d => d.metadata?.agent_name)).size;
    return `Commit ${commit.shortHash}: ${commit.message} (${decisions.length} decisões de ${agentCount} agentes)`;
  }

  /**
   * Registra conclusão do commit
   */
  async recordCommitCompletion(commitHash: string, commitMessage: string): Promise<void> {
    await this.memory.addMemory({
      content: `Commit concluído: ${commitMessage}`,
      category: 'git_commit_completed',
      metadata: {
        commit_hash: commitHash,
        commit_short: commitHash.substring(0, 7),
        commit_message: commitMessage,
        completion_timestamp: new Date().toISOString()
      },
      tags: ['git', 'commit', 'completed']
    });
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  const integration = new GitMemoryIntegration();
  
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'snapshot':
      const message = args[1];
      integration.createCommitMemorySnapshot(message).then(path => {
        console.log(`Snapshot criado: ${path}`);
        process.exit(0);
      }).catch(error => {
        console.error('Erro:', error);
        process.exit(1);
      });
      break;

    case 'decision':
      const [agent, reasoning, impact] = args.slice(1);
      if (!agent || !reasoning) {
        console.error('Uso: decision <agent> <reasoning> [impact]');
        process.exit(1);
      }
      integration.recordAgentDecision(agent, reasoning, impact || 'TBD').then(() => {
        console.log('Decisão registrada');
        process.exit(0);
      }).catch(error => {
        console.error('Erro:', error);
        process.exit(1);
      });
      break;

    case 'timeline':
      const days = parseInt(args[1]) || 7;
      integration.createGitMemoryTimeline(days).then(timeline => {
        console.log(`Timeline dos últimos ${days} dias:`);
        timeline.forEach(entry => {
          console.log(`  ${entry.summary}`);
        });
        process.exit(0);
      }).catch(error => {
        console.error('Erro:', error);
        process.exit(1);
      });
      break;

    case 'install-hooks':
      integration.installGitHooks().then(() => {
        console.log('Hooks instalados com sucesso');
        process.exit(0);
      }).catch(error => {
        console.error('Erro:', error);
        process.exit(1);
      });
      break;

    case 'file-history':
      const filePath = args[1];
      if (!filePath) {
        console.error('Uso: file-history <caminho-do-arquivo>');
        process.exit(1);
      }
      integration.getFileDecisionHistory(filePath).then(history => {
        console.log(`Histórico de decisões para ${filePath}:`);
        history.forEach(h => {
          console.log(`  ${h.timestamp}: ${h.agent} - ${h.reasoning}`);
        });
        process.exit(0);
      }).catch(error => {
        console.error('Erro:', error);
        process.exit(1);
      });
      break;

    default:
      console.log('Git + Memory Integration - Claude Flow');
      console.log('');
      console.log('Comandos disponíveis:');
      console.log('  snapshot [message]     - Criar snapshot das memórias para commit');
      console.log('  decision <agent> <reasoning> [impact] - Registrar decisão do agente');
      console.log('  timeline [days]        - Mostrar timeline Git+Memory (padrão: 7 dias)');
      console.log('  install-hooks          - Instalar hooks Git automáticos');
      console.log('  file-history <path>    - Histórico de decisões para arquivo');
      console.log('');
      console.log('Exemplos:');
      console.log('  npx tsx src/utils/git-memory-integration.ts snapshot "feat: add new feature"');
      console.log('  npx tsx src/utils/git-memory-integration.ts decision "Guardian" "Detected disorganization" "Will auto-fix"');
      console.log('  npx tsx src/utils/git-memory-integration.ts timeline 30');
      console.log('  npx tsx src/utils/git-memory-integration.ts install-hooks');
      process.exit(0);
  }
}