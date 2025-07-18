/**
 * Sistema de Backup/Restore Automático para Memórias OSS
 * 
 * Garante que as memórias locais sejam preservadas e possam ser migradas
 * entre diferentes instâncias do sistema.
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { GuardianMemoryManagerOSS } from './guardian-memory-oss';
import { ChromaMemoryAdapter } from '../bridges/chroma-memory-adapter';

interface BackupMetadata {
  version: string;
  created_at: string;
  total_memories: number;
  collections: string[];
  source_system: 'chroma_oss' | 'mem0_cloud';
  checksum: string;
}

interface MemoryBackup {
  metadata: BackupMetadata;
  memories: Array<{
    id: string;
    content: string;
    user_id: string;
    metadata: Record<string, any>;
    created_at: string;
  }>;
}

export class MemoryBackupRestore {
  private backupDir: string;
  private ossMemory: GuardianMemoryManagerOSS;

  constructor(backupDir: string = './data/backups') {
    this.backupDir = backupDir;
    this.ossMemory = new GuardianMemoryManagerOSS();
  }

  /**
   * Cria backup completo das memórias
   */
  async createBackup(filename?: string): Promise<string> {
    try {
      console.log('💾 Iniciando backup das memórias...');

      // Garantir que diretório de backup existe
      await fs.mkdir(this.backupDir, { recursive: true });

      // Listar todas as memórias
      const memories = await this.ossMemory.listMemories(1000); // Pegar todas

      // Obter estatísticas para metadata
      const stats = await this.ossMemory.getMemoryStats();

      // Gerar filename se não fornecido
      if (!filename) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        filename = `claude-flow-backup-${timestamp}.json`;
      }

      // Criar backup object
      const backup: MemoryBackup = {
        metadata: {
          version: '1.0.0',
          created_at: new Date().toISOString(),
          total_memories: memories.length,
          collections: ['claude_flow_memories'],
          source_system: 'chroma_oss',
          checksum: this.generateChecksum(memories)
        },
        memories: memories.map(mem => ({
          id: mem.id,
          content: mem.content,
          user_id: 'guardian', // Assumindo user_id padrão
          metadata: mem.metadata || {},
          created_at: mem.metadata?.created_at || new Date().toISOString()
        }))
      };

      // Salvar backup
      const backupPath = path.join(this.backupDir, filename);
      await fs.writeFile(backupPath, JSON.stringify(backup, null, 2));

      console.log(`✅ Backup criado: ${backupPath}`);
      console.log(`📊 ${backup.metadata.total_memories} memórias salvas`);
      console.log(`🔒 Checksum: ${backup.metadata.checksum}`);

      return backupPath;
    } catch (error) {
      console.error('❌ Erro ao criar backup:', error);
      throw error;
    }
  }

  /**
   * Restaura memórias de um backup
   */
  async restoreBackup(backupPath: string, verify: boolean = true): Promise<void> {
    try {
      console.log(`📂 Restaurando backup: ${backupPath}`);

      // Verificar se arquivo existe
      const exists = await fs.access(backupPath).then(() => true).catch(() => false);
      if (!exists) {
        throw new Error(`Arquivo de backup não encontrado: ${backupPath}`);
      }

      // Ler backup
      const backupContent = await fs.readFile(backupPath, 'utf-8');
      const backup: MemoryBackup = JSON.parse(backupContent);

      // Verificar integridade se solicitado
      if (verify) {
        console.log('🔍 Verificando integridade do backup...');
        const calculatedChecksum = this.generateChecksum(backup.memories);
        if (calculatedChecksum !== backup.metadata.checksum) {
          throw new Error('Checksum do backup não confere - arquivo pode estar corrompido');
        }
        console.log('✅ Integridade verificada');
      }

      console.log(`📊 Restaurando ${backup.metadata.total_memories} memórias...`);

      // Restaurar cada memória
      let restored = 0;
      let errors = 0;

      for (const memory of backup.memories) {
        try {
          await this.ossMemory.addMemory({
            content: memory.content,
            metadata: {
              ...memory.metadata,
              restored_from_backup: true,
              original_id: memory.id,
              restore_timestamp: new Date().toISOString()
            },
            category: memory.metadata.category || 'restored',
            tags: memory.metadata.tags || ['restored']
          });
          restored++;
          
          if (restored % 10 === 0) {
            console.log(`  📝 Restauradas: ${restored}/${backup.metadata.total_memories}`);
          }
        } catch (error) {
          console.warn(`⚠️ Erro ao restaurar memória ${memory.id}:`, error.message);
          errors++;
        }
      }

      console.log(`✅ Restauração concluída:`);
      console.log(`  ✅ Restauradas: ${restored}`);
      console.log(`  ❌ Erros: ${errors}`);
      console.log(`  📅 Data do backup: ${backup.metadata.created_at}`);

    } catch (error) {
      console.error('❌ Erro ao restaurar backup:', error);
      throw error;
    }
  }

  /**
   * Lista backups disponíveis
   */
  async listBackups(): Promise<Array<{filename: string, path: string, size: number, created: Date}>> {
    try {
      const files = await fs.readdir(this.backupDir);
      const backupFiles = files.filter(f => f.endsWith('.json') && f.includes('backup'));
      
      const backups = [];
      for (const filename of backupFiles) {
        const fullPath = path.join(this.backupDir, filename);
        const stats = await fs.stat(fullPath);
        
        backups.push({
          filename,
          path: fullPath,
          size: stats.size,
          created: stats.mtime
        });
      }

      // Ordenar por data (mais recente primeiro)
      return backups.sort((a, b) => b.created.getTime() - a.created.getTime());
    } catch (error) {
      console.error('❌ Erro ao listar backups:', error);
      return [];
    }
  }

  /**
   * Backup automático agendado
   */
  async scheduleAutoBackup(intervalHours: number = 24): Promise<void> {
    console.log(`⏰ Agendando backup automático a cada ${intervalHours} horas`);

    const runBackup = async () => {
      try {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        await this.createBackup(`auto-backup-${timestamp}.json`);
        
        // Limpar backups antigos (manter apenas os 7 mais recentes)
        await this.cleanOldBackups(7);
      } catch (error) {
        console.error('❌ Erro no backup automático:', error);
      }
    };

    // Primeiro backup imediatamente
    await runBackup();

    // Agendar backups periódicos
    setInterval(runBackup, intervalHours * 60 * 60 * 1000);
  }

  /**
   * Remove backups antigos mantendo apenas os N mais recentes
   */
  async cleanOldBackups(keepCount: number = 5): Promise<void> {
    try {
      const backups = await this.listBackups();
      
      if (backups.length <= keepCount) {
        console.log(`📁 ${backups.length} backups encontrados, nenhum removido`);
        return;
      }

      const toRemove = backups.slice(keepCount);
      
      for (const backup of toRemove) {
        await fs.unlink(backup.path);
        console.log(`🗑️ Backup removido: ${backup.filename}`);
      }

      console.log(`✅ Limpeza concluída: ${toRemove.length} backups antigos removidos`);
    } catch (error) {
      console.error('❌ Erro na limpeza de backups:', error);
    }
  }

  /**
   * Migra memórias entre sistemas (Cloud → OSS ou OSS → Cloud)
   */
  async migrateMemories(fromSystem: 'cloud' | 'oss', toSystem: 'cloud' | 'oss'): Promise<void> {
    console.log(`🔄 Migrando memórias: ${fromSystem} → ${toSystem}`);

    if (fromSystem === toSystem) {
      throw new Error('Sistema de origem e destino não podem ser iguais');
    }

    // Criar backup do sistema de origem
    const backupPath = await this.createBackup(`migration-${fromSystem}-to-${toSystem}-${Date.now()}.json`);
    
    if (toSystem === 'oss') {
      // Restaurar para OSS
      await this.restoreBackup(backupPath);
    } else {
      console.warn('⚠️ Migração para Cloud requer implementação manual via API Mem0');
      console.log(`📂 Backup criado em: ${backupPath}`);
      console.log('💡 Use este backup para importar manualmente via dashboard Mem0');
    }
  }

  /**
   * Verifica saúde dos backups
   */
  async checkBackupHealth(): Promise<{healthy: boolean, issues: string[], recommendations: string[]}> {
    const issues: string[] = [];
    const recommendations: string[] = [];

    try {
      // Verificar se diretório existe
      const dirExists = await fs.access(this.backupDir).then(() => true).catch(() => false);
      if (!dirExists) {
        issues.push('Diretório de backup não existe');
        recommendations.push('Execute um backup inicial');
      }

      // Listar backups
      const backups = await this.listBackups();
      
      if (backups.length === 0) {
        issues.push('Nenhum backup encontrado');
        recommendations.push('Crie um backup imediatamente');
      } else {
        // Verificar backup mais recente
        const mostRecent = backups[0];
        const hoursSinceLastBackup = (Date.now() - mostRecent.created.getTime()) / (1000 * 60 * 60);
        
        if (hoursSinceLastBackup > 48) {
          issues.push(`Último backup há ${Math.round(hoursSinceLastBackup)} horas`);
          recommendations.push('Configure backup automático');
        }

        // Verificar integridade de backups
        for (const backup of backups.slice(0, 3)) { // Verificar os 3 mais recentes
          try {
            const content = await fs.readFile(backup.path, 'utf-8');
            const parsed = JSON.parse(content);
            if (!parsed.metadata || !parsed.memories) {
              issues.push(`Backup corrompido: ${backup.filename}`);
            }
          } catch (error) {
            issues.push(`Erro ao ler backup: ${backup.filename}`);
          }
        }
      }

      const healthy = issues.length === 0;
      return { healthy, issues, recommendations };

    } catch (error) {
      return {
        healthy: false,
        issues: [`Erro na verificação: ${error.message}`],
        recommendations: ['Verifique permissões do sistema de arquivos']
      };
    }
  }

  /**
   * Gera checksum simples para verificação de integridade
   */
  private generateChecksum(memories: any[]): string {
    const content = JSON.stringify(memories.map(m => ({ id: m.id, content: m.content })));
    
    // Checksum simples usando soma de caracteres
    let sum = 0;
    for (let i = 0; i < content.length; i++) {
      sum += content.charCodeAt(i);
    }
    
    return sum.toString(16);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  const backup = new MemoryBackupRestore();
  
  // Parse command line arguments
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'backup':
      backup.createBackup().then(path => {
        console.log(`Backup criado: ${path}`);
        process.exit(0);
      }).catch(error => {
        console.error('Erro:', error);
        process.exit(1);
      });
      break;

    case 'restore':
      const backupPath = args[1];
      if (!backupPath) {
        console.error('Uso: npm run backup restore <caminho-do-backup>');
        process.exit(1);
      }
      backup.restoreBackup(backupPath).then(() => {
        console.log('Restauração concluída');
        process.exit(0);
      }).catch(error => {
        console.error('Erro:', error);
        process.exit(1);
      });
      break;

    case 'list':
      backup.listBackups().then(backups => {
        console.log('Backups disponíveis:');
        backups.forEach(b => {
          console.log(`  ${b.filename} (${Math.round(b.size/1024)}KB) - ${b.created.toISOString()}`);
        });
        process.exit(0);
      }).catch(error => {
        console.error('Erro:', error);
        process.exit(1);
      });
      break;

    case 'health':
      backup.checkBackupHealth().then(health => {
        console.log(`Status: ${health.healthy ? '✅ Saudável' : '⚠️ Problemas encontrados'}`);
        if (health.issues.length > 0) {
          console.log('Problemas:');
          health.issues.forEach(issue => console.log(`  ❌ ${issue}`));
        }
        if (health.recommendations.length > 0) {
          console.log('Recomendações:');
          health.recommendations.forEach(rec => console.log(`  💡 ${rec}`));
        }
        process.exit(health.healthy ? 0 : 1);
      }).catch(error => {
        console.error('Erro:', error);
        process.exit(1);
      });
      break;

    case 'auto':
      const hours = parseInt(args[1]) || 24;
      backup.scheduleAutoBackup(hours).then(() => {
        console.log(`Backup automático ativo (${hours}h). Pressione Ctrl+C para parar.`);
      }).catch(error => {
        console.error('Erro:', error);
        process.exit(1);
      });
      break;

    default:
      console.log('Sistema de Backup/Restore - Claude Flow Memory');
      console.log('');
      console.log('Comandos disponíveis:');
      console.log('  backup           - Criar backup das memórias');
      console.log('  restore <path>   - Restaurar memórias de backup');
      console.log('  list             - Listar backups disponíveis');
      console.log('  health           - Verificar saúde dos backups');
      console.log('  auto [hours]     - Iniciar backup automático (padrão: 24h)');
      console.log('');
      console.log('Exemplos:');
      console.log('  npx tsx src/utils/memory-backup-restore.ts backup');
      console.log('  npx tsx src/utils/memory-backup-restore.ts restore ./data/backups/backup.json');
      console.log('  npx tsx src/utils/memory-backup-restore.ts auto 12');
      process.exit(0);
  }
}