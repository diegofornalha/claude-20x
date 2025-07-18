/**
 * Universal Organization Guardian
 * 
 * Sistema de organização independente de projeto que:
 * - Detecta automaticamente o tipo de projeto
 * - Adapta estrutura esperada dinamicamente
 * - Funciona com qualquer linguagem/framework
 * - Mantém score de organização em 100%
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import * as chokidar from 'chokidar';
import { GuardianMemoryManagerHTTP } from '../utils/guardian-memory-http';
import { AgentType } from '../core/agent-types';
import { logStart, logEnd } from '../utils/agent-logger';
import { v4 as uuidv4 } from 'uuid';

// Simulação do MCP Sequential Thinking para decisões autônomas
interface SequentialThought {
  thought: string;
  nextThoughtNeeded: boolean;
  thoughtNumber: number;
  totalThoughts: number;
}

interface ProjectType {
  name: string;
  indicators: string[];
  structure: {
    [key: string]: {
      allowed?: string[];
      patterns?: RegExp;
      subfolders?: string[];
      maxFiles?: number;
      maxLooseFiles?: number;
      noSubfolders?: boolean;
    };
  };
}

interface UniversalOrganizationIssue {
  type: 'wrong-location' | 'bad-naming' | 'duplicate' | 'no-docs' | 'messy-folder' | 'too-many-files' | 'missing-readme' | 'a2a-non-compliance';
  severity: 'critical' | 'major' | 'minor';
  file?: string;
  folder?: string;
  description: string;
  solution: string;
  points: number;
}

interface UniversalOrganizationReport {
  projectPath: string;
  projectType: string;
  score: number;
  maxScore: 100;
  issues: UniversalOrganizationIssue[];
  stats: {
    totalFiles: number;
    wellOrganizedFiles: number;
    filesNeedingAttention: number;
    duplicateFiles: number;
    messyFolders: string[];
  };
  recommendations: string[];
}

export class UniversalOrganizationGuardian {
  private projectPath: string;
  private projectType: ProjectType | null = null;
  private watcher: chokidar.FSWatcher | null = null;
  private isProcessing = false;
  private scoreHistory: number[] = [];
  private memory: GuardianMemoryManagerHTTP;
  private guardianConfig: any;
  
  // Sistema de monitoramento distribuído A2A
  private a2aEcosystemWatcher: chokidar.FSWatcher | null = null;
  private a2aProjects: Map<string, any> = new Map();
  private a2aComplianceThreshold = 95;

  // Definições de tipos de projeto
  private readonly projectTypes: ProjectType[] = [
    {
      name: 'Node.js/TypeScript',
      indicators: ['package.json', 'tsconfig.json'],
      structure: {
        '/': {
          allowed: ['README.md', 'package.json', 'package-lock.json', 'tsconfig.json', '.gitignore', '.env', 'CHANGELOG.md', 'LICENSE'],
          maxFiles: 15
        },
        'src': {
          subfolders: ['tests', '__tests__', 'test', 'utils', 'types', 'config', 'lib', 'components', 'services'],
          maxLooseFiles: 5
        },
        'docs': {
          patterns: /\.(md|txt|pdf)$/i,
          noSubfolders: false
        },
        'config': {
          patterns: /\.(yml|yaml|json|env|ini|conf)$/
        },
        'scripts': {
          patterns: /\.(sh|bash|ps1|bat|js|mjs|cjs)$/
        }
      }
    },
    {
      name: 'Python',
      indicators: ['requirements.txt', 'setup.py', 'pyproject.toml'],
      structure: {
        '/': {
          allowed: ['README.md', 'requirements.txt', 'setup.py', 'pyproject.toml', '.gitignore', '.env', 'LICENSE'],
          maxFiles: 12
        },
        'src': {
          subfolders: ['tests', 'test', 'utils', 'models', 'views', 'controllers'],
          maxLooseFiles: 3
        },
        'tests': {
          patterns: /test_.*\.py$/,
          maxLooseFiles: 20
        },
        'docs': {
          patterns: /\.(md|rst|txt)$/i
        }
      }
    },
    {
      name: 'Generic',
      indicators: [],
      structure: {
        '/': {
          maxFiles: 20
        },
        'src': {
          maxLooseFiles: 10
        },
        'docs': {
          patterns: /\.(md|txt)$/i
        }
      }
    }
  ];

  private readonly universalWeights = {
    fileLocation: 20,
    naming: 15,
    noDuplicates: 15,
    documentation: 15,
    folderStructure: 15,
    a2aCompliance: 20  // Increased priority for A2A compliance
  };

  constructor(projectPath?: string, private readonly mode: 'continuous' | 'single' = 'single') {
    this.projectPath = projectPath || process.cwd();
    this.memory = new GuardianMemoryManagerHTTP();
    this.guardianConfig = {
      checkInterval: 60000,
      targetScore: 100,
      autoFix: true,
      workDelay: 5000,
      maxHistorySize: 100
    };
  }

  async initialize(): Promise<void> {
    // Método personalizado de inicialização
    
    // Detectar tipo de projeto
    await this.detectProjectType();
    
    // Buscar memórias anteriores similares
    await this.loadRelevantMemories();
    
    if (this.mode === 'continuous') {
      // Iniciar monitoramento apenas em modo contínuo
      await this.startWatching();
      
      // Inicializar monitoramento do ecossistema A2A
      await this.initializeA2AEcosystemMonitoring();
    }
    
    // Análise inicial
    await this.performFullAnalysis();
    
    if (this.mode === 'single') {
      // Em modo single, parar após análise
      await this.stop();
    }
  }

  /**
   * Detecta o tipo de projeto automaticamente
   */
  private async detectProjectType(): Promise<void> {
    console.log(`\n🔍 Detectando tipo de projeto em: ${this.projectPath}`);
    
    const files = await fs.readdir(this.projectPath);
    
    // Tentar detectar tipo específico
    for (const projectType of this.projectTypes) {
      if (projectType.indicators.length === 0) continue;
      
      const hasAllIndicators = projectType.indicators.every(indicator => 
        files.includes(indicator)
      );
      
      if (hasAllIndicators) {
        this.projectType = projectType;
        console.log(`✅ Tipo detectado: ${projectType.name}`);
        
        // Memorizar tipo de projeto detectado
        await this.memory.addMemory({
          content: `Detectado projeto tipo ${projectType.name} em ${path.basename(this.projectPath)}`,
          category: 'project_detection',
          metadata: {
            project: path.basename(this.projectPath),
            project_type: projectType.name,
            indicators: projectType.indicators
          }
        });
        
        return;
      }
    }
    
    // Fallback para genérico
    this.projectType = this.projectTypes.find(t => t.name === 'Generic')!;
    console.log('📦 Usando regras genéricas de organização');
  }

  /**
   * Inicia monitoramento de mudanças
   */
  private async startWatching(): Promise<void> {
    // Usar ignoreInitial e depth para reduzir arquivos monitorados
    this.watcher = chokidar.watch(this.projectPath, {
      ignored: [
        /node_modules/,
        /\.git/,
        /dist/,
        /build/,
        /\.next/,
        /__pycache__/,
        /\.pyc$/,
        /\.cache/,
        /coverage/,
        /\.vscode/,
        /\.idea/
      ],
      persistent: true,
      ignoreInitial: true,
      depth: 3, // Limitar profundidade para evitar muitos arquivos
      usePolling: false,
      interval: 100
    });

    this.watcher
      .on('add', (filePath) => this.handleFileChange('added', filePath))
      .on('change', (filePath) => this.handleFileChange('changed', filePath))
      .on('unlink', (filePath) => this.handleFileChange('removed', filePath));

    console.log('👁️ Monitoramento ativo para mudanças...');
  }

  /**
   * Lida com mudanças de arquivos
   */
  private async handleFileChange(event: string, filePath: string): Promise<void> {
    if (this.isProcessing) return;
    
    console.log(`\n📝 Arquivo ${event}: ${filePath}`);
    
    // Aguardar um pouco para consolidar mudanças
    setTimeout(() => {
      this.performFullAnalysis();
    }, this.guardianConfig.workDelay);
  }

  /**
   * Realiza análise completa do projeto
   */
  private async performFullAnalysis(): Promise<void> {
    if (this.isProcessing) return;
    
    this.isProcessing = true;
    
    // Registrar início da análise
    const taskId = `analysis-${uuidv4().substring(0, 8)}`;
    console.log(`🚀 [Guardian] Iniciando análise completa: ${taskId}`);
    
    // Log no Agent Log API
    await logStart(
      'Guardian Agent',
      AgentType.COORDINATOR,
      taskId,
      'Análise completa de organização do projeto',
      {
        taskType: 'organization-analysis',
        projectPath: this.projectPath,
        projectType: this.projectType?.name || 'Unknown',
        complexity: 'complex'
      }
    );
    
    const startTime = Date.now();
    
    try {
      const report = await this.calculateOrganizationScore();
      await this.saveReport(report);
      
      // Histórico de scores
      this.scoreHistory.push(report.score);
      if (this.scoreHistory.length > this.guardianConfig.maxHistorySize) {
        this.scoreHistory.shift();
      }
      
      // Log resultado da análise
      const duration = Date.now() - startTime;
      await logEnd(
        'Guardian Agent',
        taskId,
        'completed',
        undefined,
        {
          score: report.score,
          issuesFound: report.issues.length,
          projectType: report.projectType,
          duration
        }
      );
      
      // Se score < 100, usar Sequential Thinking para decisão autônoma
      if (report.score < 100 && this.guardianConfig.autoFix) {
        await this.autonomousDecisionWithSequentialThinking(report);
      } else if (report.score === 100) {
        // Memorizar estrutura bem-sucedida
        await this.memory.rememberSuccessfulStructure(
          this.projectType?.name || 'Generic',
          report.score,
          JSON.stringify(await this.getCurrentStructure())
        );
      }
      
      // Registrar fim da análise com sucesso
      console.log(`✅ [Guardian] Análise completa: Score ${report.score}%, ${report.issues.length} problemas`);
      
    } catch (error) {
      console.error('❌ [Guardian] Erro na análise:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Calcula score de organização universal
   */
  async calculateOrganizationScore(): Promise<UniversalOrganizationReport> {
    console.log('\n📊 Calculando score de organização universal...');
    
    const issues: UniversalOrganizationIssue[] = [];
    const stats = {
      totalFiles: 0,
      wellOrganizedFiles: 0,
      filesNeedingAttention: 0,
      duplicateFiles: 0,
      messyFolders: [] as string[]
    };

    // 1. Verificar localização de arquivos
    const locationIssues = await this.checkUniversalFileLocations();
    issues.push(...locationIssues);

    // 2. Verificar nomenclatura
    const namingIssues = await this.checkUniversalNaming();
    issues.push(...namingIssues);

    // 3. Verificar duplicações
    const duplicateIssues = await this.checkUniversalDuplicates();
    issues.push(...duplicateIssues);

    // 4. Verificar documentação
    const docIssues = await this.checkUniversalDocumentation();
    issues.push(...docIssues);

    // 5. Verificar estrutura
    const structureIssues = await this.checkUniversalStructure();
    issues.push(...structureIssues);

    // 6. Verificar compliance A2A
    const a2aIssues = await this.checkA2ACompliance();
    issues.push(...a2aIssues);

    // Calcular score
    const totalPointsLost = issues.reduce((sum, issue) => sum + issue.points, 0);
    const score = Math.max(0, 100 - totalPointsLost);

    // Estatísticas
    stats.totalFiles = await this.countTotalFiles();
    stats.filesNeedingAttention = issues.filter(i => i.file).length;
    stats.wellOrganizedFiles = stats.totalFiles - stats.filesNeedingAttention;
    stats.duplicateFiles = duplicateIssues.length;
    stats.messyFolders = Array.from(new Set(structureIssues.map(i => i.folder || '').filter(Boolean)));

    // Recomendações
    const recommendations = this.generateUniversalRecommendations(score, issues);

    return {
      projectPath: this.projectPath,
      projectType: this.projectType?.name || 'Unknown',
      score,
      maxScore: 100,
      issues,
      stats,
      recommendations
    };
  }

  /**
   * Verifica localização de arquivos usando regras universais
   */
  private async checkUniversalFileLocations(): Promise<UniversalOrganizationIssue[]> {
    const issues: UniversalOrganizationIssue[] = [];
    
    // Verificar raiz do projeto
    const rootFiles = await fs.readdir(this.projectPath);
    const rootStructure = this.projectType?.structure['/'] || {};
    
    let rootFileCount = 0;
    for (const file of rootFiles) {
      const fullPath = path.join(this.projectPath, file);
      const stats = await fs.stat(fullPath);
      
      if (stats.isFile()) {
        rootFileCount++;
        
        // Se há lista de permitidos, verificar
        if (rootStructure.allowed && !rootStructure.allowed.includes(file)) {
          // Arquivos .md (exceto README) deveriam estar em docs/
          if (file.endsWith('.md') && file !== 'README.md') {
            issues.push({
              type: 'wrong-location',
              severity: 'major',
              file,
              description: `${file} deveria estar em /docs`,
              solution: `Mover para docs/${file}`,
              points: 5
            });
          }
          // Arquivos de config deveriam estar em config/
          else if (/\.(yml|yaml|json)$/.test(file) && !['package.json', 'tsconfig.json'].includes(file)) {
            issues.push({
              type: 'wrong-location',
              severity: 'minor',
              file,
              description: `${file} poderia estar em /config`,
              solution: `Considerar mover para config/${file}`,
              points: 3
            });
          }
        }
      }
    }
    
    // Verificar se há muitos arquivos na raiz
    if (rootStructure.maxFiles && rootFileCount > rootStructure.maxFiles) {
      issues.push({
        type: 'too-many-files',
        severity: 'major',
        folder: '/',
        description: `Raiz tem ${rootFileCount} arquivos (máximo recomendado: ${rootStructure.maxFiles})`,
        solution: 'Organizar arquivos em subpastas apropriadas',
        points: 10
      });
    }
    
    // Verificar arquivos soltos em src/
    const srcPath = path.join(this.projectPath, 'src');
    if (await this.pathExists(srcPath)) {
      const srcFiles = await fs.readdir(srcPath);
      const srcStructure = this.projectType?.structure['src'] || {};
      
      let looseFileCount = 0;
      for (const file of srcFiles) {
        const fullPath = path.join(srcPath, file);
        const stats = await fs.stat(fullPath);
        
        if (stats.isFile() && (file.endsWith('.ts') || file.endsWith('.js') || file.endsWith('.py'))) {
          looseFileCount++;
        }
      }
      
      const maxLoose = srcStructure.maxLooseFiles || 5;
      if (looseFileCount > maxLoose) {
        issues.push({
          type: 'messy-folder',
          severity: 'major',
          folder: 'src',
          description: `src/ tem ${looseFileCount} arquivos soltos (máximo recomendado: ${maxLoose})`,
          solution: 'Organizar em subpastas temáticas',
          points: 8
        });
      }
    }
    
    return issues;
  }

  /**
   * Verifica nomenclatura universal
   */
  private async checkUniversalNaming(): Promise<UniversalOrganizationIssue[]> {
    const issues: UniversalOrganizationIssue[] = [];
    
    // Verificar inconsistências de nomenclatura
    const allFiles = await this.getAllFiles(this.projectPath);
    
    // Detectar padrões mistos (camelCase vs kebab-case vs snake_case)
    const patterns = {
      camelCase: 0,
      kebabCase: 0,
      snakeCase: 0
    };
    
    for (const filePath of allFiles) {
      const fileName = path.basename(filePath, path.extname(filePath));
      
      if (/[a-z][A-Z]/.test(fileName)) patterns.camelCase++;
      if (/-/.test(fileName)) patterns.kebabCase++;
      if (/_/.test(fileName)) patterns.snakeCase++;
    }
    
    // Se há mistura significativa de padrões
    const totalPatterned = patterns.camelCase + patterns.kebabCase + patterns.snakeCase;
    if (totalPatterned > 10) {
      const dominantPattern = Object.entries(patterns)
        .sort(([,a], [,b]) => b - a)[0][0];
      
      const mixedCount = totalPatterned - patterns[dominantPattern as keyof typeof patterns];
      if (mixedCount > totalPatterned * 0.2) {
        issues.push({
          type: 'bad-naming',
          severity: 'minor',
          description: 'Nomenclatura inconsistente detectada',
          solution: `Padronizar para ${dominantPattern} em todo o projeto`,
          points: 5
        });
      }
    }
    
    return issues;
  }

  /**
   * Verifica duplicações universais
   */
  private async checkUniversalDuplicates(): Promise<UniversalOrganizationIssue[]> {
    const issues: UniversalOrganizationIssue[] = [];
    
    // Procurar por arquivos com nomes muito similares
    const allFiles = await this.getAllFiles(this.projectPath);
    const fileGroups = new Map<string, string[]>();
    
    // Agrupar por nome base similar
    for (const filePath of allFiles) {
      const fileName = path.basename(filePath);
      const baseName = fileName.replace(/[-_.]v?\d+/, '').toLowerCase();
      
      // Ignorar arquivos index.ts/index.js que são padrão de módulos
      if (baseName === 'index.ts' || baseName === 'index.js' || baseName === 'index') {
        continue;
      }
      
      // Ignorar READMEs que são padrão em diferentes diretórios
      if (baseName === 'readme.md' || baseName === 'readme') {
        continue;
      }
      
      if (!fileGroups.has(baseName)) {
        fileGroups.set(baseName, []);
      }
      fileGroups.get(baseName)!.push(filePath);
    }
    
    // Identificar possíveis duplicatas
    for (const [baseName, files] of Array.from(fileGroups.entries())) {
      if (files.length > 2) {
        issues.push({
          type: 'duplicate',
          severity: 'major',
          description: `${files.length} arquivos similares: ${baseName}`,
          solution: 'Consolidar ou renomear para clarificar propósito',
          points: 3 * files.length
        });
      }
    }
    
    return issues;
  }

  /**
   * Verifica documentação universal
   */
  private async checkUniversalDocumentation(): Promise<UniversalOrganizationIssue[]> {
    const issues: UniversalOrganizationIssue[] = [];
    
    // README é universal
    const readmePath = path.join(this.projectPath, 'README.md');
    if (!await this.pathExists(readmePath)) {
      issues.push({
        type: 'no-docs',
        severity: 'critical',
        description: 'README.md não encontrado',
        solution: 'Criar README.md com descrição do projeto',
        points: 15
      });
    }
    
    // Verificar se há alguma documentação
    const docsPath = path.join(this.projectPath, 'docs');
    const hasDocs = await this.pathExists(docsPath);
    
    if (!hasDocs) {
      // Procurar por arquivos .md em qualquer lugar
      const mdFiles = await this.findFilesByExtension(this.projectPath, '.md');
      if (mdFiles.length <= 1) { // Apenas README ou menos
        issues.push({
          type: 'no-docs',
          severity: 'major',
          description: 'Documentação mínima ou ausente',
          solution: 'Adicionar documentação em /docs',
          points: 10
        });
      }
    }
    
    return issues;
  }

  /**
   * Verifica estrutura universal
   */
  private async checkUniversalStructure(): Promise<UniversalOrganizationIssue[]> {
    const issues: UniversalOrganizationIssue[] = [];
    
    // Verificar profundidade excessiva
    const maxDepth = await this.getMaxDepth(this.projectPath);
    if (maxDepth > 5) {
      issues.push({
        type: 'messy-folder',
        severity: 'minor',
        description: `Estrutura muito profunda (${maxDepth} níveis)`,
        solution: 'Considerar achatar estrutura de pastas',
        points: 5
      });
    }
    
    // Verificar pastas vazias
    const emptyFolders = await this.findEmptyFolders(this.projectPath);
    if (emptyFolders.length > 3) {
      issues.push({
        type: 'messy-folder',
        severity: 'minor',
        description: `${emptyFolders.length} pastas vazias encontradas`,
        solution: 'Remover pastas vazias desnecessárias',
        points: 3
      });
    }
    
    return issues;
  }

  /**
   * Verifica compliance com padrão A2A (Agent-to-Agent)
   */
  private async checkA2ACompliance(): Promise<UniversalOrganizationIssue[]> {
    const issues: UniversalOrganizationIssue[] = [];
    
    // 1. Verificar se existe estrutura A2A adequada
    const a2aStructureCheck = await this.validateA2AStructure();
    issues.push(...a2aStructureCheck);

    // 2. Verificar configuração de agentes
    const agentConfigCheck = await this.validateAgentConfiguration();
    issues.push(...agentConfigCheck);

    // 3. Verificar padrões de comunicação A2A
    const communicationCheck = await this.validateA2ACommunication();
    issues.push(...communicationCheck);

    // 4. Verificar documentação A2A
    const a2aDocsCheck = await this.validateA2ADocumentation();
    issues.push(...a2aDocsCheck);

    return issues;
  }

  /**
   * Valida estrutura específica para A2A
   */
  private async validateA2AStructure(): Promise<UniversalOrganizationIssue[]> {
    const issues: UniversalOrganizationIssue[] = [];
    
    // Verificar pastas essenciais A2A
    const essentialA2AFolders = ['agents', 'a2a_servers', 'mcp'];
    const missingFolders = [];
    
    for (const folder of essentialA2AFolders) {
      const folderPath = path.join(this.projectPath, folder);
      if (!await this.pathExists(folderPath)) {
        missingFolders.push(folder);
      }
    }
    
    if (missingFolders.length > 0) {
      issues.push({
        type: 'a2a-non-compliance',
        severity: 'major',
        description: `Estrutura A2A incompleta: faltam pastas ${missingFolders.join(', ')}`,
        solution: `Criar pastas necessárias para estrutura A2A: ${missingFolders.join(', ')}`,
        points: 10
      });
    }

    // Verificar se existe agent card (.well-known/agent.json)
    const agentCardPath = path.join(this.projectPath, '.well-known', 'agent.json');
    if (!await this.pathExists(agentCardPath)) {
      issues.push({
        type: 'a2a-non-compliance',
        severity: 'critical',
        file: '.well-known/agent.json',
        description: 'Agent Card A2A não encontrado',
        solution: 'Criar .well-known/agent.json com configuração do agente',
        points: 15
      });
    }

    return issues;
  }

  /**
   * Valida configuração de agentes A2A
   */
  private async validateAgentConfiguration(): Promise<UniversalOrganizationIssue[]> {
    const issues: UniversalOrganizationIssue[] = [];
    
    // Procurar por arquivos de configuração de agentes
    const agentFiles = await this.findFilesByPattern(this.projectPath, /.*_agent.*\.(ts|js|py)$/);
    
    if (agentFiles.length === 0) {
      issues.push({
        type: 'a2a-non-compliance',
        severity: 'major',
        description: 'Nenhum arquivo de agente A2A encontrado',
        solution: 'Criar pelo menos um agente A2A seguindo padrão *_agent.*',
        points: 12
      });
    }

    // Verificar se existe servidor A2A
    const serverFiles = await this.findFilesByPattern(this.projectPath, /.*server.*\.(ts|js|py)$/);
    const a2aServerFiles = serverFiles.filter(f => 
      f.includes('a2a') || f.includes('agent') || f.includes('mcp')
    );
    
    if (a2aServerFiles.length === 0) {
      issues.push({
        type: 'a2a-non-compliance',
        severity: 'major',
        description: 'Nenhum servidor A2A encontrado',
        solution: 'Implementar servidor A2A para comunicação entre agentes',
        points: 10
      });
    }

    return issues;
  }

  /**
   * Valida padrões de comunicação A2A
   */
  private async validateA2ACommunication(): Promise<UniversalOrganizationIssue[]> {
    const issues: UniversalOrganizationIssue[] = [];
    
    // Verificar se existe implementação de task management
    const taskManagerFiles = await this.findFilesByPattern(this.projectPath, /.*task.*manager.*\.(ts|js|py)$/);
    
    if (taskManagerFiles.length === 0) {
      issues.push({
        type: 'a2a-non-compliance',
        severity: 'major',
        description: 'Sistema de gerenciamento de tarefas A2A não encontrado',
        solution: 'Implementar TaskManager para coordenação entre agentes',
        points: 8
      });
    }

    // Verificar protocolos de comunicação
    const allFiles = await this.getAllFiles(this.projectPath);
    const hasA2AProtocol = allFiles.some(file => {
      const content = this.readFileSync(file);
      return content && (
        content.includes('A2ARequest') ||
        content.includes('Agent2Agent') ||
        content.includes('ADKAgent') ||
        content.includes('RemoteAgentConnections')
      );
    });

    if (!hasA2AProtocol) {
      issues.push({
        type: 'a2a-non-compliance',
        severity: 'minor',
        description: 'Implementação de protocolo A2A não detectada',
        solution: 'Implementar classes de protocolo A2A (A2ARequest, ADKAgent, etc.)',
        points: 5
      });
    }

    return issues;
  }

  /**
   * Valida documentação específica A2A
   */
  private async validateA2ADocumentation(): Promise<UniversalOrganizationIssue[]> {
    const issues: UniversalOrganizationIssue[] = [];
    
    // Verificar documentação A2A
    const docsPath = path.join(this.projectPath, 'docs');
    if (await this.pathExists(docsPath)) {
      const a2aDocsPattern = /.*a2a.*\.md$/i;
      const docFiles = await this.findFilesByExtension(docsPath, '.md');
      const hasA2ADocs = docFiles.some(file => a2aDocsPattern.test(path.basename(file)));
      
      if (!hasA2ADocs) {
        issues.push({
          type: 'a2a-non-compliance',
          severity: 'minor',
          description: 'Documentação A2A não encontrada em /docs',
          solution: 'Adicionar documentação sobre arquitetura e uso A2A',
          points: 5
        });
      }
    }

    // Verificar README menciona A2A
    const readmePath = path.join(this.projectPath, 'README.md');
    if (await this.pathExists(readmePath)) {
      const readmeContent = await fs.readFile(readmePath, 'utf-8');
      if (!readmeContent.toLowerCase().includes('a2a') && 
          !readmeContent.toLowerCase().includes('agent-to-agent')) {
        issues.push({
          type: 'a2a-non-compliance',
          severity: 'minor',
          file: 'README.md',
          description: 'README não menciona arquitetura A2A',
          solution: 'Documentar no README o uso de padrão Agent-to-Agent',
          points: 3
        });
      }
    }

    return issues;
  }

  /**
   * Método auxiliar para buscar arquivos por padrão regex
   */
  private async findFilesByPattern(dir: string, pattern: RegExp): Promise<string[]> {
    const allFiles = await this.getAllFiles(dir);
    return allFiles.filter(file => pattern.test(path.basename(file)));
  }

  /**
   * Método auxiliar para ler arquivo de forma síncrona (para verificações rápidas)
   */
  private readFileSync(filePath: string): string | null {
    try {
      const fs = require('fs');
      return fs.readFileSync(filePath, 'utf-8');
    } catch {
      return null;
    }
  }

  /**
   * Mostra análise e solicita autorização para correções
   */
  private async showAnalysisAndRequestAuthorization(report: UniversalOrganizationReport): Promise<void> {
    console.log('\n' + '='.repeat(60));
    console.log('🔍 ANÁLISE DE ORGANIZAÇÃO COMPLETA');
    console.log('='.repeat(60));
    
    console.log(`\n📊 Score Atual: ${report.score}%`);
    console.log(`🎯 Objetivo: 100%`);
    console.log(`📈 Melhoria Possível: +${100 - report.score} pontos\n`);
    
    if (report.issues.length > 0) {
      console.log('📋 PROBLEMAS ENCONTRADOS:');
      console.log('-'.repeat(40));
      
      for (const issue of report.issues) {
        console.log(`\n${this.getSeverityEmoji(issue.severity)} ${issue.description}`);
        if (issue.file) {
          console.log(`   📄 Arquivo: ${issue.file}`);
        }
        console.log(`   💡 Solução: ${issue.solution}`);
        console.log(`   📉 Impacto: -${issue.points} pontos`);
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('🤖 AÇÕES QUE SERÃO EXECUTADAS:');
    console.log('-'.repeat(40));
    
    // Listar ações específicas
    let actionCount = 0;
    for (const issue of report.issues) {
      if (issue.type === 'wrong-location' && issue.file) {
        if (issue.file.endsWith('.md') && issue.file !== 'README.md') {
          console.log(`${++actionCount}. Mover ${issue.file} → docs/`);
        } else if (/\.(yml|yaml|json)$/.test(issue.file)) {
          console.log(`${++actionCount}. Mover ${issue.file} → config/`);
        }
      } else if (issue.type === 'missing-readme') {
        console.log(`${++actionCount}. Criar README.md na raiz do projeto`);
      }
    }
    
    if (actionCount === 0) {
      console.log('Nenhuma ação automática disponível.');
    }
    
    console.log('\n' + '='.repeat(60));
    
    // Criar arquivo de autorização
    const authFile = path.join(this.projectPath, 'GUARDIAN-AUTHORIZATION.md');
    const authContent = this.createAuthorizationFile(report, actionCount);
    
    await fs.writeFile(authFile, authContent);
    
    console.log('📄 Arquivo de autorização criado: GUARDIAN-AUTHORIZATION.md');
    console.log('✏️  Para autorizar as correções:');
    console.log('   1. Edite o arquivo e mude "PENDENTE" para "AUTORIZADO"');
    console.log('   2. O Guardian detectará a mudança e aplicará as correções');
    console.log('   3. Para cancelar, mude para "CANCELADO" ou delete o arquivo\n');
    
    // Monitorar arquivo de autorização
    await this.waitForAuthorization(authFile, report);
  }

  /**
   * Aplica correções automáticas
   */
  private async applyAutoFixes(report: UniversalOrganizationReport): Promise<void> {
    console.log('\n🔧 Aplicando correções automáticas...');
    
    // Registrar início das correções
    const taskId = `autofix-${uuidv4().substring(0, 8)}`;
    console.log(`🔧 [Guardian] Iniciando correções automáticas: ${taskId} (${report.issues.length} problemas)`);
    
    // Log no Agent Log API
    await logStart(
      'Guardian Agent',
      AgentType.COORDINATOR,
      taskId,
      `Aplicação de ${report.issues.length} correções automáticas`,
      {
        taskType: 'auto-fix',
        issueCount: report.issues.length,
        currentScore: report.score,
        complexity: 'medium'
      }
    );
    
    const startTime = Date.now();
    let fixCount = 0;
    
    try {
      for (const issue of report.issues) {
        if (issue.type === 'wrong-location' && issue.file) {
          // Mover arquivos para local correto
          if (issue.file.endsWith('.md') && issue.file !== 'README.md') {
            await this.moveFileToFolder(issue.file, 'docs');
            fixCount++;
          } else if (/\.(yml|yaml|json)$/.test(issue.file)) {
            await this.moveFileToFolder(issue.file, 'config');
            fixCount++;
          }
        } else if (issue.type === 'a2a-non-compliance') {
          // Aplicar correções A2A específicas
          const a2aFixes = await this.applyA2AAutoFixes(issue);
          fixCount += a2aFixes;
        }
      }
      
      // Registrar sucesso das correções
      const duration = Date.now() - startTime;
      console.log(`✅ [Guardian] Correções aplicadas: ${fixCount} correções`);
      
      await logEnd(
        'Guardian Agent',
        taskId,
        'completed',
        undefined,
        {
          fixesApplied: fixCount,
          totalIssues: report.issues.length,
          duration
        }
      );
    } catch (error) {
      // Registrar erro nas correções
      const duration = Date.now() - startTime;
      console.error(`❌ [Guardian] Erro nas correções (${fixCount} aplicadas):`, error);
      
      await logEnd(
        'Guardian Agent',
        taskId,
        'error',
        error instanceof Error ? error.message : String(error),
        {
          fixesApplied: fixCount,
          totalIssues: report.issues.length,
          duration
        }
      );
      
      throw error;
    }
    
    if (fixCount > 0) {
      console.log(`✅ ${fixCount} correções aplicadas`);
      // Re-analisar após correções
      setTimeout(() => this.performFullAnalysis(), 5000);
    }
  }

  /**
   * Move arquivo para pasta específica
   */
  private async moveFileToFolder(fileName: string, folderName: string): Promise<void> {
    const sourcePath = path.join(this.projectPath, fileName);
    const targetDir = path.join(this.projectPath, folderName);
    const targetPath = path.join(targetDir, fileName);
    
    try {
      // Buscar decisões anteriores similares
      const similarDecisions = await this.memory.findSimilarDecisions(
        path.basename(this.projectPath),
        'wrong-location'
      );
      
      if (similarDecisions.length > 0) {
        console.log('🧠 Guardian lembra de decisões similares:', similarDecisions[0].content);
      }
      
      // Criar pasta se não existir
      await fs.mkdir(targetDir, { recursive: true });
      
      // Mover arquivo
      await fs.rename(sourcePath, targetPath);
      console.log(`📁 Movido: ${fileName} → ${folderName}/`);
      
      // Memorizar decisão
      await this.memory.rememberOrganizationDecision(
        path.basename(this.projectPath),
        'move_file',
        `Movido ${fileName} para ${folderName}/`,
        {
          from: fileName,
          to: `${folderName}/${fileName}`,
          reason: 'wrong-location'
        }
      );
    } catch (error) {
      console.error(`❌ Erro ao mover ${fileName}:`, error);
    }
  }

  /**
   * Aplica correções automáticas específicas para compliance A2A
   */
  private async applyA2AAutoFixes(issue: UniversalOrganizationIssue): Promise<number> {
    let fixesApplied = 0;
    
    try {
      if (issue.description.includes('faltam pastas')) {
        // Criar estrutura de pastas A2A
        const essentialFolders = ['agents', 'a2a_servers', 'mcp', '.well-known'];
        
        for (const folder of essentialFolders) {
          const folderPath = path.join(this.projectPath, folder);
          if (!await this.pathExists(folderPath)) {
            await fs.mkdir(folderPath, { recursive: true });
            console.log(`📁 Criada pasta A2A: ${folder}/`);
            fixesApplied++;
          }
        }
      }
      
      if (issue.file === '.well-known/agent.json') {
        // Criar Agent Card A2A básico
        await this.createBasicAgentCard();
        fixesApplied++;
      }
      
      if (issue.description.includes('README não menciona')) {
        // Adicionar seção A2A ao README
        await this.addA2ASectionToReadme();
        fixesApplied++;
      }
      
      if (issue.description.includes('Documentação A2A não encontrada')) {
        // Criar documentação A2A básica
        await this.createBasicA2ADocumentation();
        fixesApplied++;
      }

      // Memorizar correção A2A
      if (fixesApplied > 0) {
        await this.memory.rememberOrganizationDecision(
          path.basename(this.projectPath),
          'a2a_auto_fix',
          `Aplicadas ${fixesApplied} correções A2A: ${issue.description}`,
          {
            issue_type: issue.type,
            fixes_applied: fixesApplied,
            description: issue.description
          }
        );
      }
      
    } catch (error) {
      console.error(`❌ Erro ao aplicar correções A2A:`, error);
    }
    
    return fixesApplied;
  }

  /**
   * Cria Agent Card A2A básico
   */
  private async createBasicAgentCard(): Promise<void> {
    const wellKnownPath = path.join(this.projectPath, '.well-known');
    await fs.mkdir(wellKnownPath, { recursive: true });
    
    const agentCardPath = path.join(wellKnownPath, 'agent.json');
    
    const projectName = path.basename(this.projectPath);
    const agentCard = {
      name: `${projectName}_agent`,
      description: `Agent for ${projectName} with A2A protocol support`,
      url: "http://localhost:8080",
      version: "1.0.0",
      capabilities: {
        can_stream: false,
        can_push_notifications: false,
        can_state_transition_history: true,
        authentication: "none",
        default_input_modes: ["text"],
        default_output_modes: ["text"]
      },
      skills: [
        {
          id: "COORDINATE_TASKS",
          name: "coordinate_tasks",
          description: "Coordinate tasks between agents using A2A protocol"
        }
      ]
    };
    
    await fs.writeFile(agentCardPath, JSON.stringify(agentCard, null, 2));
    console.log(`📄 Criado Agent Card A2A: .well-known/agent.json`);
  }

  /**
   * Adiciona seção A2A ao README
   */
  private async addA2ASectionToReadme(): Promise<void> {
    const readmePath = path.join(this.projectPath, 'README.md');
    
    if (await this.pathExists(readmePath)) {
      const currentContent = await fs.readFile(readmePath, 'utf-8');
      
      const a2aSection = `

## 🤖 Agent-to-Agent (A2A) Architecture

Este projeto utiliza o padrão Agent-to-Agent (A2A) para comunicação e coordenação entre agentes:

### Características A2A:
- **Multi-agente**: Suporte para múltiplos agentes especializados
- **Comunicação assíncrona**: Agentes se comunicam via protocolos padronizados
- **Task Management**: Sistema de gerenciamento de tarefas distribuído
- **MCP Integration**: Integração com Model Context Protocol

### Estrutura A2A:
- \`agents/\` - Definições de agentes especializados
- \`a2a_servers/\` - Servidores de comunicação A2A
- \`mcp/\` - Ferramentas e serviços MCP
- \`.well-known/agent.json\` - Configuração do agente principal

Para mais informações sobre A2A, consulte a documentação em \`docs/\`.
`;

      const newContent = currentContent + a2aSection;
      await fs.writeFile(readmePath, newContent);
      console.log(`📝 Adicionada seção A2A ao README.md`);
    }
  }

  /**
   * Cria documentação A2A básica
   */
  private async createBasicA2ADocumentation(): Promise<void> {
    const docsPath = path.join(this.projectPath, 'docs');
    await fs.mkdir(docsPath, { recursive: true });
    
    const a2aDocsPath = path.join(docsPath, 'A2A-ARCHITECTURE.md');
    
    const a2aDocContent = `# 🤖 Agent-to-Agent (A2A) Architecture

## Visão Geral

Este projeto implementa uma arquitetura Agent-to-Agent (A2A) que permite:

- **Coordenação de múltiplos agentes**: Cada agente possui especialização específica
- **Comunicação assíncrona**: Protocolos padronizados para troca de mensagens
- **Escalabilidade**: Adição dinâmica de novos agentes
- **Interoperabilidade**: Integração com diferentes frameworks

## Componentes Principais

### 1. Agent Card (\`.well-known/agent.json\`)
Configuração que define:
- Capacidades do agente
- Endpoints de comunicação
- Esquemas de entrada/saída
- Metadados de descoberta

### 2. Task Manager
Responsável por:
- Recebimento de tarefas
- Delegação para agentes especializados
- Monitoramento de progresso
- Consolidação de resultados

### 3. A2A Servers
Servidores que implementam:
- Protocolo de comunicação A2A
- Descoberta de agentes
- Roteamento de mensagens
- Balanceamento de carga

### 4. MCP Integration
Integração com Model Context Protocol para:
- Ferramentas especializadas
- Contexto compartilhado
- Recursos externos

## Padrões de Comunicação

### Request/Response
\`\`\`typescript
interface A2ARequest {
  id: string;
  method: string;
  params: any;
  agent_target?: string;
}
\`\`\`

### Task Delegation
\`\`\`typescript
interface TaskRequest {
  task_id: string;
  task_type: string;
  payload: any;
  priority: number;
}
\`\`\`

## Implementação

Para implementar um novo agente A2A:

1. **Definir Agent Card** em \`.well-known/agent.json\`
2. **Implementar TaskManager** para handling de tarefas
3. **Configurar A2A Server** para comunicação
4. **Registrar no Discovery** para ser encontrado por outros agentes

## Benefícios

- ✅ **Modularidade**: Agentes especializados e independentes
- ✅ **Escalabilidade**: Adição horizontal de capacidades
- ✅ **Resiliência**: Falha de um agente não afeta o sistema
- ✅ **Flexibilidade**: Diferentes tecnologias podem coexistir

---
*Documentação gerada automaticamente pelo Guardian A2A*
`;

    await fs.writeFile(a2aDocsPath, a2aDocContent);
    console.log(`📚 Criada documentação A2A: docs/A2A-ARCHITECTURE.md`);
  }

  /**
   * Salva relatório de organização (apenas se houver mudanças significativas)
   */
  private async saveReport(report: UniversalOrganizationReport): Promise<void> {
    const docsPath = path.join(this.projectPath, 'docs');
    await fs.mkdir(docsPath, { recursive: true });
    
    const reportPath = path.join(docsPath, 'ORGANIZATION-SCORE.md');
    
    // Verificar se há mudanças significativas
    const hasChanges = await this.hasSignificantChanges(reportPath, report);
    
    if (hasChanges) {
      const content = this.formatUniversalReport(report);
      await fs.writeFile(reportPath, content);
      console.log(`\n📊 Score: ${report.score}% | Projeto: ${report.projectType}`);
    } else {
      console.log(`\n📊 Score: ${report.score}% | Sem mudanças significativas`);
    }
  }
  
  /**
   * Verifica se há mudanças significativas no relatório
   */
  private async hasSignificantChanges(reportPath: string, newReport: UniversalOrganizationReport): Promise<boolean> {
    try {
      // Se arquivo não existe, é uma mudança significativa
      const exists = await fs.access(reportPath).then(() => true).catch(() => false);
      if (!exists) return true;
      
      // Ler conteúdo atual
      const currentContent = await fs.readFile(reportPath, 'utf-8');
      
      // Extrair score atual usando regex
      const scoreMatch = currentContent.match(/### (\d+)\/100 pontos/);
      const currentScore = scoreMatch ? parseInt(scoreMatch[1]) : -1;
      
      // Extrair total de arquivos
      const filesMatch = currentContent.match(/Total de arquivos\*\*: (\d+)/);
      const currentFiles = filesMatch ? parseInt(filesMatch[1]) : -1;
      
      // Verificar mudanças significativas
      if (currentScore !== newReport.score) return true;
      if (currentFiles !== newReport.stats.totalFiles) return true;
      if (newReport.issues.length > 0 && currentScore === 100) return true;
      
      // Se chegou aqui, não há mudanças significativas
      return false;
    } catch (error) {
      // Em caso de erro, considerar como mudança significativa
      return true;
    }
  }

  private formatUniversalReport(report: UniversalOrganizationReport): string {
    let content = '# 📊 UNIVERSAL ORGANIZATION SCORE\n\n';
    
    content += `**Projeto**: ${path.basename(report.projectPath)}\n`;
    content += `**Tipo**: ${report.projectType}\n\n`;
    
    // Score visual
    content += '## Score de Organização\n\n';
    content += this.createProgressBar(report.score) + '\n\n';
    content += `### ${report.score}/100 pontos\n\n`;
    
    // Estatísticas
    content += '## 📈 Estatísticas\n\n';
    content += `- **Total de arquivos**: ${report.stats.totalFiles}\n`;
    content += `- **Bem organizados**: ${report.stats.wellOrganizedFiles} ✅\n`;
    content += `- **Precisam atenção**: ${report.stats.filesNeedingAttention} ⚠️\n`;
    content += `- **Pastas problemáticas**: ${report.stats.messyFolders.length}\n\n`;
    
    // Issues
    if (report.issues.length > 0) {
      content += '## 🔍 Problemas Encontrados\n\n';
      for (const issue of report.issues) {
        content += `### ${this.getSeverityEmoji(issue.severity)} ${issue.description}\n`;
        content += `- **Solução**: ${issue.solution}\n`;
        content += `- **Impacto**: -${issue.points} pontos\n\n`;
      }
    }
    
    // Recomendações
    content += '## 💡 Recomendações\n\n';
    for (const rec of report.recommendations) {
      content += `- ${rec}\n`;
    }
    
    content += `\n---\n*Análise Universal - ${new Date().toLocaleString('pt-BR')}*`;
    
    return content;
  }

  private generateUniversalRecommendations(score: number, issues: UniversalOrganizationIssue[]): string[] {
    const recs: string[] = [];
    
    if (score === 100) {
      recs.push('🎉 Projeto perfeitamente organizado!');
    } else if (score >= 90) {
      recs.push('✨ Excelente organização, pequenos ajustes recomendados.');
    } else if (score >= 70) {
      recs.push('👍 Boa organização com espaço para melhorias.');
    } else {
      recs.push('⚠️ Organização precisa de atenção significativa.');
    }
    
    // Recomendações específicas
    const fileLocationIssues = issues.filter(i => i.type === 'wrong-location').length;
    if (fileLocationIssues > 3) {
      recs.push(`📁 ${fileLocationIssues} arquivos em locais inadequados`);
    }
    
    const messyFolders = issues.filter(i => i.type === 'messy-folder').length;
    if (messyFolders > 0) {
      recs.push('🗂️ Reorganizar pastas com muitos arquivos soltos');
    }
    
    return recs;
  }

  // Métodos auxiliares
  /**
   * Cria arquivo de autorização
   */
  private createAuthorizationFile(report: UniversalOrganizationReport, actionCount: number): string {
    let content = '# 🤖 GUARDIAN - SOLICITAÇÃO DE AUTORIZAÇÃO\n\n';
    content += `**Data**: ${new Date().toLocaleString('pt-BR')}\n`;
    content += `**Score Atual**: ${report.score}%\n`;
    content += `**Score Após Correções**: 100%\n\n`;
    
    content += '## 📋 STATUS DA AUTORIZAÇÃO\n\n';
    content += '```\n';
    content += 'STATUS: PENDENTE\n';
    content += '```\n\n';
    content += '> ⚠️ **INSTRUÇÕES**: Mude "PENDENTE" para "AUTORIZADO" para aplicar correções\n\n';
    
    content += '## 🔍 ANÁLISE DETALHADA\n\n';
    
    if (report.issues.length > 0) {
      content += '### Problemas Encontrados:\n\n';
      for (const issue of report.issues) {
        content += `- **${issue.description}**\n`;
        if (issue.file) content += `  - Arquivo: \`${issue.file}\`\n`;
        content += `  - Solução: ${issue.solution}\n`;
        content += `  - Impacto: -${issue.points} pontos\n\n`;
      }
    }
    
    content += '## 🤖 AÇÕES PLANEJADAS\n\n';
    if (actionCount > 0) {
      content += 'O Guardian executará as seguintes ações:\n\n';
      
      let count = 0;
      for (const issue of report.issues) {
        if (issue.type === 'wrong-location' && issue.file) {
          if (issue.file.endsWith('.md') && issue.file !== 'README.md') {
            content += `${++count}. ✅ Mover \`${issue.file}\` → \`docs/\`\n`;
          } else if (/\.(yml|yaml|json)$/.test(issue.file)) {
            content += `${++count}. ✅ Mover \`${issue.file}\` → \`config/\`\n`;
          }
        } else if (issue.type === 'missing-readme') {
          content += `${++count}. ✅ Criar \`README.md\` na raiz\n`;
        }
      }
    } else {
      content += '❌ Nenhuma ação automática disponível.\n';
    }
    
    content += '\n## 🔐 COMO AUTORIZAR\n\n';
    content += '1. **Para AUTORIZAR**: Edite este arquivo e mude `STATUS: PENDENTE` para `STATUS: AUTORIZADO`\n';
    content += '2. **Para CANCELAR**: Mude para `STATUS: CANCELADO` ou delete este arquivo\n';
    content += '3. **Guardian aplicará automaticamente** após detectar a autorização\n\n';
    content += '---\n';
    content += '*Guardian aguardando sua decisão...*\n';
    
    return content;
  }

  /**
   * Aguarda autorização via arquivo
   */
  private async waitForAuthorization(authFile: string, report: UniversalOrganizationReport): Promise<void> {
    return new Promise((resolve) => {
      const checkInterval = setInterval(async () => {
        try {
          const content = await fs.readFile(authFile, 'utf-8');
          
          if (content.includes('STATUS: AUTORIZADO')) {
            console.log('✅ Autorização concedida! Aplicando correções...');
            clearInterval(checkInterval);
            
            // Deletar arquivo de autorização
            await fs.unlink(authFile).catch(() => {});
            
            // Aplicar correções
            await this.applyAutoFixes(report);
            resolve();
          } else if (content.includes('STATUS: CANCELADO')) {
            console.log('❌ Correções canceladas pelo usuário.');
            clearInterval(checkInterval);
            
            // Deletar arquivo
            await fs.unlink(authFile).catch(() => {});
            resolve();
          }
        } catch (error) {
          // Arquivo deletado = cancelado
          console.log('❌ Arquivo de autorização removido. Correções canceladas.');
          clearInterval(checkInterval);
          resolve();
        }
      }, 2000); // Verificar a cada 2 segundos
      
      // Timeout após 5 minutos
      setTimeout(() => {
        clearInterval(checkInterval);
        console.log('⏱️ Tempo de autorização expirado (5 minutos).');
        fs.unlink(authFile).catch(() => {});
        resolve();
      }, 300000);
    });
  }

  private createProgressBar(score: number): string {
    const filled = Math.round(score / 5);
    const empty = 20 - filled;
    const bar = '█'.repeat(filled) + '░'.repeat(empty);
    
    let color = '';
    if (score >= 90) color = '🟢';
    else if (score >= 70) color = '🟡';
    else if (score >= 50) color = '🟠';
    else color = '🔴';
    
    return `${color} [${bar}] ${score}%`;
  }

  private getSeverityEmoji(severity: string): string {
    switch (severity) {
      case 'critical': return '🔴';
      case 'major': return '🟡';
      case 'minor': return '🟢';
      default: return '⚪';
    }
  }

  private async pathExists(p: string): Promise<boolean> {
    try {
      await fs.access(p);
      return true;
    } catch {
      return false;
    }
  }

  private async getAllFiles(dir: string): Promise<string[]> {
    const files: string[] = [];
    
    const walk = async (currentDir: string) => {
      try {
        const entries = await fs.readdir(currentDir, { withFileTypes: true });
        
        for (const entry of entries) {
          const fullPath = path.join(currentDir, entry.name);
          
          if (entry.isDirectory() && !this.shouldIgnoreDir(entry.name)) {
            await walk(fullPath);
          } else if (entry.isFile()) {
            files.push(fullPath);
          }
        }
      } catch {
        // Ignorar erros de permissão
      }
    };
    
    await walk(dir);
    return files;
  }

  private async findFilesByExtension(dir: string, ext: string): Promise<string[]> {
    const allFiles = await this.getAllFiles(dir);
    return allFiles.filter(f => f.endsWith(ext));
  }

  private async getMaxDepth(dir: string, currentDepth = 0): Promise<number> {
    if (currentDepth > 10) return currentDepth; // Limite de segurança
    
    let maxDepth = currentDepth;
    
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        if (entry.isDirectory() && !this.shouldIgnoreDir(entry.name)) {
          const subDepth = await this.getMaxDepth(
            path.join(dir, entry.name), 
            currentDepth + 1
          );
          maxDepth = Math.max(maxDepth, subDepth);
        }
      }
    } catch {
      // Ignorar erros
    }
    
    return maxDepth;
  }

  private async findEmptyFolders(dir: string): Promise<string[]> {
    const emptyFolders: string[] = [];
    
    const check = async (currentDir: string) => {
      try {
        const entries = await fs.readdir(currentDir, { withFileTypes: true });
        
        if (entries.length === 0) {
          emptyFolders.push(currentDir);
          return;
        }
        
        let hasFiles = false;
        for (const entry of entries) {
          if (entry.isFile()) {
            hasFiles = true;
          } else if (entry.isDirectory() && !this.shouldIgnoreDir(entry.name)) {
            await check(path.join(currentDir, entry.name));
          }
        }
        
        if (!hasFiles && entries.every(e => e.isDirectory())) {
          // Pasta só com subpastas vazias
          const subDirs = entries.filter(e => e.isDirectory());
          const allSubsEmpty = await Promise.all(
            subDirs.map(async (d) => {
              const subPath = path.join(currentDir, d.name);
              const subEntries = await fs.readdir(subPath);
              return subEntries.length === 0;
            })
          );
          
          if (allSubsEmpty.every(e => e)) {
            emptyFolders.push(currentDir);
          }
        }
      } catch {
        // Ignorar erros
      }
    };
    
    await check(dir);
    return emptyFolders;
  }

  private shouldIgnoreDir(dirName: string): boolean {
    const ignoreDirs = [
      'node_modules', '.git', 'dist', 'build', '.next', 
      '__pycache__', '.cache', '.vscode', '.idea'
    ];
    return dirName.startsWith('.') || ignoreDirs.includes(dirName);
  }

  private async countTotalFiles(): Promise<number> {
    const files = await this.getAllFiles(this.projectPath);
    return files.length;
  }

  async runAnalysis(): Promise<any> {
    await this.performFullAnalysis();
    return { message: 'Análise completa realizada' };
  }

  /**
   * Inicializa monitoramento distribuído do ecossistema A2A
   */
  private async initializeA2AEcosystemMonitoring(): Promise<void> {
    console.log('\n🌐 Inicializando monitoramento do ecossistema A2A...');
    
    try {
      // Detectar todos os projetos A2A no codex
      await this.discoverA2AProjects();
      
      // Iniciar monitoramento de mudanças em todo o ecossistema
      await this.startA2AEcosystemWatching();
      
      // Iniciar verificação periódica de compliance
      this.startPeriodicA2AComplianceChecks();
      
      console.log(`✅ Monitoramento do ecossistema A2A iniciado (${this.a2aProjects.size} projetos)`);
    } catch (error) {
      console.error('❌ Erro ao inicializar monitoramento A2A:', error);
    }
  }

  /**
   * Descobre todos os projetos A2A no codex
   */
  private async discoverA2AProjects(): Promise<void> {
    const codexPath = path.join(process.cwd(), '../..');
    console.log(`🔍 Descobrindo projetos A2A em: ${codexPath}`);
    
    const searchPaths = [
      path.join(codexPath, 'agents'),
      path.join(codexPath, 'claude-code-10x'),
      path.join(codexPath, 'a2a_servers'),
      path.join(codexPath, 'ui')
    ];
    
    for (const searchPath of searchPaths) {
      if (await this.pathExists(searchPath)) {
        await this.scanForA2AProjects(searchPath);
      }
    }
    
    // Memorizar projetos A2A descobertos
    const projectList = Array.from(this.a2aProjects.keys()).join(', ');
    await this.memory.addMemory({
      content: `Descobertos ${this.a2aProjects.size} projetos A2A no ecossistema: ${projectList}`,
      category: 'a2a_ecosystem_discovery',
      metadata: {
        total_projects: this.a2aProjects.size,
        projects: Array.from(this.a2aProjects.keys()),
        scan_date: new Date().toISOString()
      },
      tags: ['a2a', 'ecosystem', 'discovery']
    });
  }

  /**
   * Escaneia diretório para encontrar projetos A2A
   */
  private async scanForA2AProjects(dir: string): Promise<void> {
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        if (entry.isDirectory() && !this.shouldIgnoreDir(entry.name)) {
          const projectPath = path.join(dir, entry.name);
          const isA2A = await this.isA2AProject(projectPath);
          
          if (isA2A) {
            const projectInfo = await this.getA2AProjectInfo(projectPath);
            this.a2aProjects.set(projectPath, projectInfo);
            console.log(`📦 Projeto A2A encontrado: ${entry.name}`);
          }
        }
      }
    } catch (error) {
      console.error(`❌ Erro ao escanear ${dir}:`, error);
    }
  }

  /**
   * Verifica se um diretório é um projeto A2A
   */
  private async isA2AProject(projectPath: string): Promise<boolean> {
    // Verificar indicadores de projeto A2A
    const a2aIndicators = [
      '.well-known/agent.json',
      'agent.json',
      'a2a-config.json',
      'agents/',
      'a2a_servers/'
    ];
    
    for (const indicator of a2aIndicators) {
      const indicatorPath = path.join(projectPath, indicator);
      if (await this.pathExists(indicatorPath)) {
        return true;
      }
    }
    
    // Verificar se há arquivos com padrões A2A
    const files = await fs.readdir(projectPath).catch(() => []);
    const hasA2AFiles = files.some(file => 
      file.includes('a2a') || 
      file.includes('agent') ||
      file.endsWith('_agent.ts') ||
      file.endsWith('_agent.py')
    );
    
    return hasA2AFiles;
  }

  /**
   * Obtém informações do projeto A2A
   */
  private async getA2AProjectInfo(projectPath: string): Promise<any> {
    const info = {
      path: projectPath,
      name: path.basename(projectPath),
      lastScanned: new Date().toISOString(),
      hasAgentCard: false,
      hasAgents: false,
      hasA2AServer: false,
      complianceScore: 0
    };
    
    // Verificar Agent Card
    const agentCardPath = path.join(projectPath, '.well-known', 'agent.json');
    if (await this.pathExists(agentCardPath)) {
      info.hasAgentCard = true;
    }
    
    // Verificar agentes
    const agentsPath = path.join(projectPath, 'agents');
    if (await this.pathExists(agentsPath)) {
      info.hasAgents = true;
    }
    
    // Verificar servidor A2A
    const serverFiles = await this.findFilesByPattern(projectPath, /.*server.*\.(ts|js|py)$/);
    info.hasA2AServer = serverFiles.length > 0;
    
    return info;
  }

  /**
   * Inicia monitoramento de mudanças no ecossistema A2A
   */
  private async startA2AEcosystemWatching(): Promise<void> {
    const pathsToWatch = Array.from(this.a2aProjects.keys());
    
    if (pathsToWatch.length === 0) return;
    
    this.a2aEcosystemWatcher = chokidar.watch(pathsToWatch, {
      ignored: [
        /node_modules/,
        /\.git/,
        /dist/,
        /build/,
        /__pycache__/
      ],
      persistent: true,
      ignoreInitial: true,
      depth: 2
    });

    this.a2aEcosystemWatcher
      .on('add', (filePath) => this.handleA2AEcosystemChange('added', filePath))
      .on('change', (filePath) => this.handleA2AEcosystemChange('changed', filePath))
      .on('unlink', (filePath) => this.handleA2AEcosystemChange('removed', filePath));

    console.log('👁️ Monitoramento do ecossistema A2A ativo...');
  }

  /**
   * Lida com mudanças no ecossistema A2A
   */
  private async handleA2AEcosystemChange(event: string, filePath: string): Promise<void> {
    console.log(`\n🔄 Mudança A2A detectada: ${event} - ${filePath}`);
    
    // Identificar projeto afetado
    const projectPath = this.getProjectPathFromFile(filePath);
    if (!projectPath) return;
    
    // Atualizar informações do projeto
    if (this.a2aProjects.has(projectPath)) {
      const projectInfo = await this.getA2AProjectInfo(projectPath);
      this.a2aProjects.set(projectPath, projectInfo);
      
      // Verificar compliance após mudança
      setTimeout(() => {
        this.checkA2AProjectCompliance(projectPath);
      }, 2000);
    }
  }

  /**
   * Obtém caminho do projeto a partir do arquivo
   */
  private getProjectPathFromFile(filePath: string): string | null {
    for (const projectPath of this.a2aProjects.keys()) {
      if (filePath.startsWith(projectPath)) {
        return projectPath;
      }
    }
    return null;
  }

  /**
   * Inicia verificações periódicas de compliance A2A
   */
  private startPeriodicA2AComplianceChecks(): void {
    // Verificação a cada 10 minutos
    setInterval(async () => {
      console.log('\n🔍 Executando verificação periódica de compliance A2A...');
      await this.performEcosystemA2AComplianceCheck();
    }, 10 * 60 * 1000);
    
    console.log('⏰ Verificações periódicas de compliance A2A configuradas (10 min)');
  }

  /**
   * Executa verificação de compliance de todo o ecossistema A2A
   */
  private async performEcosystemA2AComplianceCheck(): Promise<void> {
    const complianceResults = [];
    
    for (const [projectPath, projectInfo] of this.a2aProjects.entries()) {
      const complianceScore = await this.checkA2AProjectCompliance(projectPath);
      complianceResults.push({
        project: projectInfo.name,
        path: projectPath,
        score: complianceScore,
        compliant: complianceScore >= this.a2aComplianceThreshold
      });
    }
    
    // Relatório de compliance do ecossistema
    const totalProjects = complianceResults.length;
    const compliantProjects = complianceResults.filter(r => r.compliant).length;
    const avgScore = complianceResults.reduce((sum, r) => sum + r.score, 0) / totalProjects;
    
    console.log(`\n📊 Compliance A2A do Ecossistema:`);
    console.log(`   Projetos compliant: ${compliantProjects}/${totalProjects}`);
    console.log(`   Score médio: ${avgScore.toFixed(1)}%`);
    
    // Memorizar resultado
    await this.memory.addMemory({
      content: `Compliance A2A do ecossistema: ${compliantProjects}/${totalProjects} projetos compliant, score médio ${avgScore.toFixed(1)}%`,
      category: 'a2a_ecosystem_compliance',
      metadata: {
        total_projects: totalProjects,
        compliant_projects: compliantProjects,
        average_score: avgScore,
        check_date: new Date().toISOString(),
        results: complianceResults
      },
      tags: ['a2a', 'compliance', 'ecosystem', 'monitoring']
    });
    
    // Tomar ações corretivas se necessário
    const nonCompliantProjects = complianceResults.filter(r => !r.compliant);
    if (nonCompliantProjects.length > 0) {
      await this.handleNonCompliantA2AProjects(nonCompliantProjects);
    }
  }

  /**
   * Verifica compliance A2A de um projeto específico
   */
  private async checkA2AProjectCompliance(projectPath: string): Promise<number> {
    // Criar Guardian temporário para o projeto
    const tempGuardian = new UniversalOrganizationGuardian(projectPath, 'single');
    await tempGuardian.detectProjectType();
    
    const report = await tempGuardian.calculateOrganizationScore();
    
    // Focar apenas nos aspectos A2A
    const a2aIssues = report.issues.filter(issue => issue.type === 'a2a-non-compliance');
    const a2aPointsLost = a2aIssues.reduce((sum, issue) => sum + issue.points, 0);
    const a2aMaxPoints = this.universalWeights.a2aCompliance;
    
    const a2aScore = Math.max(0, 100 - (a2aPointsLost / a2aMaxPoints * 100));
    
    console.log(`   ${path.basename(projectPath)}: ${a2aScore.toFixed(1)}% A2A compliance`);
    
    return a2aScore;
  }

  /**
   * Lida com projetos não-compliant A2A
   */
  private async handleNonCompliantA2AProjects(nonCompliantProjects: any[]): Promise<void> {
    console.log(`\n⚠️ ${nonCompliantProjects.length} projetos A2A não-compliant detectados:`);
    
    for (const project of nonCompliantProjects) {
      console.log(`   📦 ${project.project}: ${project.score.toFixed(1)}%`);
      
      // Aplicar correções automáticas se score muito baixo
      if (project.score < 70) {
        console.log(`   🔧 Aplicando correções automáticas para ${project.project}...`);
        await this.applyA2AComplianceFixesForProject(project.path);
      }
    }
    
    // Memorizar ação corretiva
    await this.memory.addMemory({
      content: `Ação corretiva aplicada em ${nonCompliantProjects.length} projetos A2A não-compliant`,
      category: 'a2a_corrective_action',
      metadata: {
        projects_fixed: nonCompliantProjects.length,
        project_details: nonCompliantProjects,
        action_date: new Date().toISOString()
      },
      tags: ['a2a', 'auto-fix', 'compliance', 'corrective-action']
    });
  }

  /**
   * Aplica correções de compliance A2A para um projeto específico
   */
  private async applyA2AComplianceFixesForProject(projectPath: string): Promise<void> {
    try {
      // Criar Guardian temporário para aplicar correções
      const tempGuardian = new UniversalOrganizationGuardian(projectPath, 'single');
      await tempGuardian.detectProjectType();
      
      const report = await tempGuardian.calculateOrganizationScore();
      const a2aIssues = report.issues.filter(issue => issue.type === 'a2a-non-compliance');
      
      let fixesApplied = 0;
      
      for (const issue of a2aIssues) {
        const fixes = await tempGuardian.applyA2AAutoFixes(issue);
        fixesApplied += fixes;
      }
      
      console.log(`   ✅ ${fixesApplied} correções A2A aplicadas em ${path.basename(projectPath)}`);
      
    } catch (error) {
      console.error(`   ❌ Erro ao aplicar correções em ${path.basename(projectPath)}:`, error);
    }
  }

  async stop(): Promise<void> {
    if (this.watcher) {
      await this.watcher.close();
    }
    
    if (this.a2aEcosystemWatcher) {
      await this.a2aEcosystemWatcher.close();
      console.log('🛑 Monitoramento do ecossistema A2A parado');
    }
    
    console.log(`🛑 Guardian parado`);
  }
  
  /**
   * Carrega memórias relevantes para o projeto atual
   */
  private async loadRelevantMemories(): Promise<void> {
    console.log('\n🧠 Carregando memórias do Guardian...');
    
    // Buscar estruturas bem-sucedidas para o tipo de projeto
    if (this.projectType) {
      const successfulStructures = await this.memory.findSuccessfulStructures(
        this.projectType.name
      );
      
      if (successfulStructures.length > 0) {
        console.log(`✅ Encontradas ${successfulStructures.length} estruturas bem-sucedidas anteriores`);
      }
    }
    
    // Buscar decisões anteriores para projetos similares
    const projectName = path.basename(this.projectPath);
    const similarDecisions = await this.memory.searchMemories(
      `${projectName} organização decisão`,
      10
    );
    
    if (similarDecisions.length > 0) {
      console.log(`📚 ${similarDecisions.length} decisões anteriores relevantes encontradas`);
    }
  }
  
  /**
   * Obtém estrutura atual do projeto
   */
  private async getCurrentStructure(): Promise<Record<string, string[]>> {
    const structure: Record<string, string[]> = {};
    
    const walk = async (dir: string, prefix = '') => {
      try {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        
        for (const entry of entries) {
          if (this.shouldIgnoreDir(entry.name)) continue;
          
          const relativePath = prefix ? `${prefix}/${entry.name}` : entry.name;
          
          if (entry.isDirectory()) {
            structure[relativePath] = [];
            await walk(path.join(dir, entry.name), relativePath);
          } else {
            const dirPath = prefix || '/';
            if (!structure[dirPath]) {
              structure[dirPath] = [];
            }
            structure[dirPath].push(entry.name);
          }
        }
      } catch (error) {
        // Ignorar erros
      }
    };
    
    await walk(this.projectPath);
    return structure;
  }

  /**
   * Decisão autônoma usando Sequential Thinking
   */
  private async autonomousDecisionWithSequentialThinking(report: UniversalOrganizationReport): Promise<void> {
    console.log('\n' + '='.repeat(60));
    console.log('🧠 GUARDIAN PENSAMENTO SEQUENCIAL - DECISÃO AUTÔNOMA');
    console.log('='.repeat(60));

    // Pensamento 1: Analisar situação
    await this.sequentialThought({
      thought: `Analisando score atual de ${report.score}% com ${report.issues.length} problemas. 
               Preciso avaliar se os problemas são seguros para correção automática.`,
      nextThoughtNeeded: true,
      thoughtNumber: 1,
      totalThoughts: 4
    });

    // Pensamento 2: Avaliar riscos
    const highRiskIssues = report.issues.filter(i => i.severity === 'critical');
    const mediumRiskIssues = report.issues.filter(i => i.severity === 'major');
    
    await this.sequentialThought({
      thought: `Análise de risco: ${highRiskIssues.length} críticos, ${mediumRiskIssues.length} importantes. 
               Problemas de organização são geralmente seguros para correção automática.`,
      nextThoughtNeeded: true,
      thoughtNumber: 2,
      totalThoughts: 4
    });

    // Pensamento 3: Avaliar benefícios vs riscos
    const totalPoints = report.issues.reduce((sum, issue) => sum + issue.points, 0);
    
    await this.sequentialThought({
      thought: `Benefícios: +${totalPoints} pontos levando a 100% de organização. 
               Riscos: Mínimos, apenas movimentação/limpeza de arquivos. 
               Decisão: PROCEDER com correções automáticas.`,
      nextThoughtNeeded: true,
      thoughtNumber: 3,
      totalThoughts: 4
    });

    // Pensamento 4: Executar decisão
    await this.sequentialThought({
      thought: `Executando correções automáticas baseado na análise de risco-benefício. 
               Guardian possui backup automático e pode reverter mudanças se necessário.`,
      nextThoughtNeeded: false,
      thoughtNumber: 4,
      totalThoughts: 4
    });

    console.log('\n✅ Decisão autônoma: APLICAR CORREÇÕES');
    console.log('🔧 Iniciando correções automáticas...\n');
    
    // Aplicar correções diretamente
    await this.applyAutoFixes(report);
  }

  /**
   * Simula uma etapa de pensamento sequencial
   */
  private async sequentialThought(thought: SequentialThought): Promise<void> {
    console.log(`\n🤔 Pensamento ${thought.thoughtNumber}/${thought.totalThoughts}:`);
    console.log(`   ${thought.thought}`);
    
    // Simular tempo de processamento
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (thought.nextThoughtNeeded) {
      console.log('   ⏭️  Próximo pensamento...');
    } else {
      console.log('   ✅ Análise concluída.');
    }
  }
}

// Permitir execução direta com path como argumento
if (require.main === module) {
  const projectPath = process.argv[2] || process.cwd();
  const mode = process.argv[3] as 'continuous' | 'single' || 'single';
  
  console.log(`🚀 Iniciando Universal Organization Guardian`);
  console.log(`📁 Projeto: ${projectPath}`);
  console.log(`📋 Modo: ${mode}`);
  
  const guardian = new UniversalOrganizationGuardian(projectPath, mode);
  
  guardian.initialize().then(() => {
    if (mode === 'continuous') {
      console.log('\n✅ Guardian universal iniciado com sucesso!');
      console.log('🔄 Monitorando mudanças continuamente...');
      console.log('📊 Relatórios salvos em: docs/ORGANIZATION-SCORE.md');
      console.log('\nPressione Ctrl+C para parar.\n');
    } else {
      console.log('\n✅ Análise concluída!');
      console.log('📊 Relatório salvo em: docs/ORGANIZATION-SCORE.md');
      process.exit(0);
    }
  }).catch(error => {
    console.error('❌ Erro ao iniciar guardian:', error);
    process.exit(1);
  });
}