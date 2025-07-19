# API Interfaces - Claude-20x Migration System

## Core Interfaces

### MigrationOrchestrator Interface

```typescript
interface IMigrationOrchestrator {
  /**
   * Executes the complete migration process
   * @param config Migration configuration
   * @returns Migration result with status and metrics
   */
  execute(config: MigrationConfig): Promise<MigrationResult>;

  /**
   * Rolls back migration to a specific checkpoint
   * @param checkpointId Checkpoint identifier
   * @returns Rollback result
   */
  rollback(checkpointId: string): Promise<RollbackResult>;

  /**
   * Gets current migration status
   * @returns Current status and progress
   */
  getStatus(): MigrationStatus;

  /**
   * Validates prerequisites before migration
   * @param config Migration configuration
   * @returns Validation result
   */
  validatePrerequisites(config: MigrationConfig): Promise<ValidationResult>;

  /**
   * Creates a checkpoint for rollback
   * @param name Checkpoint name
   * @returns Checkpoint ID
   */
  createCheckpoint(name: string): Promise<string>;

  /**
   * Pauses the migration process
   */
  pause(): Promise<void>;

  /**
   * Resumes the migration process
   */
  resume(): Promise<void>;

  /**
   * Cancels the migration process
   */
  cancel(): Promise<void>;
}
```

### FileManager Interface

```typescript
interface IFileManager {
  /**
   * Moves a file from source to destination
   * @param source Source file path
   * @param destination Destination file path
   * @param options Move options
   */
  moveFile(source: string, destination: string, options?: MoveOptions): Promise<void>;

  /**
   * Copies a directory recursively
   * @param source Source directory path
   * @param destination Destination directory path
   * @param options Copy options
   */
  copyDirectory(source: string, destination: string, options?: CopyOptions): Promise<void>;

  /**
   * Executes multiple file operations atomically
   * @param operations Array of file operations
   */
  atomicOperation(operations: FileOperation[]): Promise<void>;

  /**
   * Creates a directory with nested structure
   * @param path Directory path
   * @param options Creation options
   */
  createDirectory(path: string, options?: CreateDirectoryOptions): Promise<void>;

  /**
   * Deletes a file or directory
   * @param path File or directory path
   * @param options Deletion options
   */
  delete(path: string, options?: DeleteOptions): Promise<void>;

  /**
   * Checks if path exists
   * @param path File or directory path
   * @returns True if exists
   */
  exists(path: string): Promise<boolean>;

  /**
   * Gets file or directory stats
   * @param path File or directory path
   * @returns File stats
   */
  getStats(path: string): Promise<FileStats>;

  /**
   * Lists directory contents
   * @param path Directory path
   * @param options List options
   * @returns Array of file entries
   */
  listDirectory(path: string, options?: ListOptions): Promise<FileEntry[]>;
}
```

### ImportUpdater Interface

```typescript
interface IImportUpdater {
  /**
   * Updates imports in a specific file
   * @param filePath File path
   * @param mappings Import mappings
   */
  updateImports(filePath: string, mappings: ImportMapping[]): Promise<void>;

  /**
   * Analyzes imports in a directory
   * @param directory Directory path
   * @param options Analysis options
   * @returns Import analysis result
   */
  analyzeImports(directory: string, options?: AnalysisOptions): Promise<ImportAnalysis>;

  /**
   * Updates imports in multiple files
   * @param files Array of file paths
   * @param mappings Import mappings
   */
  batchUpdateImports(files: string[], mappings: ImportMapping[]): Promise<void>;

  /**
   * Validates import paths
   * @param filePath File path
   * @returns Validation result
   */
  validateImports(filePath: string): Promise<ImportValidationResult>;

  /**
   * Generates import mappings
   * @param sourceStructure Source structure
   * @param targetStructure Target structure
   * @returns Import mappings
   */
  generateMappings(sourceStructure: SourceStructure, targetStructure: TargetStructure): Promise<ImportMapping[]>;

  /**
   * Fixes broken imports
   * @param filePath File path
   * @param options Fix options
   */
  fixImports(filePath: string, options?: FixOptions): Promise<void>;
}
```

### WorkspaceManager Interface

```typescript
interface IWorkspaceManager {
  /**
   * Creates a new workspace
   * @param config Workspace configuration
   */
  createWorkspace(config: WorkspaceConfig): Promise<void>;

  /**
   * Updates workspace configuration
   * @param workspacePath Workspace path
   * @param config Updated configuration
   */
  updateConfig(workspacePath: string, config: Partial<WorkspaceConfig>): Promise<void>;

  /**
   * Validates workspace structure
   * @param workspacePath Workspace path
   * @returns Validation result
   */
  validateWorkspace(workspacePath: string): Promise<WorkspaceValidationResult>;

  /**
   * Generates package.json for workspace
   * @param packagePath Package path
   * @param config Package configuration
   */
  generatePackageJson(packagePath: string, config: PackageConfig): Promise<void>;

  /**
   * Links workspace packages
   * @param workspacePath Workspace path
   */
  linkPackages(workspacePath: string): Promise<void>;

  /**
   * Installs workspace dependencies
   * @param workspacePath Workspace path
   * @param options Install options
   */
  installDependencies(workspacePath: string, options?: InstallOptions): Promise<void>;

  /**
   * Gets workspace information
   * @param workspacePath Workspace path
   * @returns Workspace information
   */
  getWorkspaceInfo(workspacePath: string): Promise<WorkspaceInfo>;
}
```

### A2AValidator Interface

```typescript
interface IA2AValidator {
  /**
   * Validates A2A compatibility
   * @param structure Target structure
   * @param a2aConfig A2A configuration
   * @returns Validation result
   */
  validateA2ACompatibility(structure: TargetStructure, a2aConfig: A2AConfig): Promise<A2AValidationResult>;

  /**
   * Checks agent structure
   * @param agentPath Agent path
   * @returns Agent structure validation
   */
  checkAgentStructure(agentPath: string): Promise<AgentStructureResult>;

  /**
   * Validates A2A configuration
   * @param configPath Configuration path
   * @returns Configuration validation
   */
  validateConfig(configPath: string): Promise<ConfigValidationResult>;

  /**
   * Migrates A2A agents
   * @param sourceAgents Source agents
   * @param targetStructure Target structure
   * @returns Migration result
   */
  migrateAgents(sourceAgents: AgentInfo[], targetStructure: TargetStructure): Promise<AgentMigrationResult>;

  /**
   * Updates A2A references
   * @param agentPath Agent path
   * @param mappings Path mappings
   */
  updateReferences(agentPath: string, mappings: PathMapping[]): Promise<void>;

  /**
   * Validates agent dependencies
   * @param agentPath Agent path
   * @returns Dependency validation
   */
  validateDependencies(agentPath: string): Promise<DependencyValidationResult>;
}
```

### BackupManager Interface

```typescript
interface IBackupManager {
  /**
   * Creates a backup of the current state
   * @param backupName Backup name
   * @param options Backup options
   * @returns Backup ID
   */
  createBackup(backupName: string, options?: BackupOptions): Promise<string>;

  /**
   * Restores from a backup
   * @param backupId Backup ID
   * @param options Restore options
   */
  restoreBackup(backupId: string, options?: RestoreOptions): Promise<void>;

  /**
   * Validates backup integrity
   * @param backupId Backup ID
   * @returns Validation result
   */
  validateBackup(backupId: string): Promise<BackupValidationResult>;

  /**
   * Lists available backups
   * @param options List options
   * @returns Array of backup info
   */
  listBackups(options?: ListBackupsOptions): Promise<BackupInfo[]>;

  /**
   * Deletes a backup
   * @param backupId Backup ID
   */
  deleteBackup(backupId: string): Promise<void>;

  /**
   * Compresses backup data
   * @param backupId Backup ID
   * @param options Compression options
   */
  compressBackup(backupId: string, options?: CompressionOptions): Promise<void>;

  /**
   * Gets backup size and stats
   * @param backupId Backup ID
   * @returns Backup stats
   */
  getBackupStats(backupId: string): Promise<BackupStats>;
}
```

## Event System Interfaces

### EventBus Interface

```typescript
interface IEventBus {
  /**
   * Emits an event
   * @param event Event name
   * @param data Event data
   */
  emit(event: string, data: any): void;

  /**
   * Subscribes to an event
   * @param event Event name
   * @param handler Event handler
   */
  subscribe(event: string, handler: EventHandler): void;

  /**
   * Unsubscribes from an event
   * @param event Event name
   * @param handler Event handler
   */
  unsubscribe(event: string, handler: EventHandler): void;

  /**
   * Broadcasts to all subscribers
   * @param data Broadcast data
   */
  broadcast(data: any): void;

  /**
   * Gets active subscriptions
   * @returns Subscription info
   */
  getSubscriptions(): SubscriptionInfo[];
}
```

### Logger Interface

```typescript
interface ILogger {
  /**
   * Logs info message
   * @param message Log message
   * @param metadata Optional metadata
   */
  info(message: string, metadata?: LogMetadata): void;

  /**
   * Logs warning message
   * @param message Log message
   * @param metadata Optional metadata
   */
  warn(message: string, metadata?: LogMetadata): void;

  /**
   * Logs error message
   * @param message Log message
   * @param metadata Optional metadata
   */
  error(message: string, metadata?: LogMetadata): void;

  /**
   * Logs debug message
   * @param message Log message
   * @param metadata Optional metadata
   */
  debug(message: string, metadata?: LogMetadata): void;

  /**
   * Creates child logger
   * @param context Logger context
   * @returns Child logger
   */
  child(context: LogContext): ILogger;

  /**
   * Gets log entries
   * @param options Query options
   * @returns Log entries
   */
  getEntries(options?: LogQueryOptions): Promise<LogEntry[]>;
}
```

## REST API Endpoints

### Migration Management

```typescript
// POST /api/migration/start
interface StartMigrationRequest {
  config: MigrationConfig;
  options?: MigrationOptions;
}

interface StartMigrationResponse {
  migrationId: string;
  status: 'started' | 'queued';
  estimatedDuration?: number;
}

// GET /api/migration/:id/status
interface MigrationStatusResponse {
  migrationId: string;
  status: MigrationStatus;
  progress: ProgressInfo;
  logs: LogEntry[];
}

// POST /api/migration/:id/rollback
interface RollbackRequest {
  checkpointId?: string;
  reason?: string;
}

interface RollbackResponse {
  success: boolean;
  restoredState: string;
  rollbackId: string;
}

// GET /api/migration/:id/checkpoints
interface CheckpointListResponse {
  checkpoints: CheckpointInfo[];
  totalCount: number;
}

// POST /api/migration/:id/pause
interface PauseResponse {
  success: boolean;
  pausedAt: string;
}

// POST /api/migration/:id/resume
interface ResumeResponse {
  success: boolean;
  resumedAt: string;
}
```

### Validation Endpoints

```typescript
// POST /api/validation/prerequisites
interface PrerequisiteValidationRequest {
  config: MigrationConfig;
}

interface PrerequisiteValidationResponse {
  isValid: boolean;
  issues: ValidationIssue[];
  recommendations: string[];
}

// POST /api/validation/a2a
interface A2AValidationRequest {
  structure: TargetStructure;
  a2aConfig: A2AConfig;
}

interface A2AValidationResponse {
  isCompatible: boolean;
  issues: A2AValidationIssue[];
  migrationSteps: string[];
}
```

### Backup Management

```typescript
// POST /api/backup/create
interface CreateBackupRequest {
  name: string;
  description?: string;
  options?: BackupOptions;
}

interface CreateBackupResponse {
  backupId: string;
  size: number;
  createdAt: string;
}

// GET /api/backup/list
interface ListBackupsResponse {
  backups: BackupInfo[];
  totalCount: number;
  totalSize: number;
}

// POST /api/backup/:id/restore
interface RestoreBackupRequest {
  options?: RestoreOptions;
}

interface RestoreBackupResponse {
  success: boolean;
  restoredFiles: number;
  restoredAt: string;
}
```