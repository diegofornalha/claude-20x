# Data Structures - Claude-20x Migration System

## Core Data Structures

### Migration Configuration

```typescript
interface MigrationConfig {
  /** Migration unique identifier */
  id: string;
  
  /** Source project structure */
  sourceStructure: SourceStructure;
  
  /** Target project structure */
  targetStructure: TargetStructure;
  
  /** Migration rules and mappings */
  migrationRules: MigrationRule[];
  
  /** Validation rules */
  validationRules: ValidationRule[];
  
  /** Backup configuration */
  backupConfig: BackupConfig;
  
  /** A2A specific configuration */
  a2aConfig: A2AConfig;
  
  /** Migration options */
  options: MigrationOptions;
}

interface SourceStructure {
  /** Root directory path */
  rootPath: string;
  
  /** Source packages or modules */
  packages: SourcePackage[];
  
  /** Configuration files */
  configFiles: ConfigFile[];
  
  /** Dependencies */
  dependencies: DependencyInfo[];
  
  /** A2A agents */
  a2aAgents: A2AAgent[];
}

interface TargetStructure {
  /** Root directory path */
  rootPath: string;
  
  /** Target packages structure */
  packages: TargetPackage[];
  
  /** Workspace configuration */
  workspaceConfig: WorkspaceConfig;
  
  /** Package mappings */
  packageMappings: PackageMapping[];
  
  /** A2A structure */
  a2aStructure: A2AStructure;
}

interface SourcePackage {
  /** Package name */
  name: string;
  
  /** Package path */
  path: string;
  
  /** Package type */
  type: 'library' | 'application' | 'utility' | 'agent';
  
  /** Dependencies */
  dependencies: string[];
  
  /** Files included */
  files: string[];
  
  /** Configuration */
  config: PackageConfig;
}

interface TargetPackage {
  /** Package name */
  name: string;
  
  /** Package path in packages/ */
  path: string;
  
  /** Package type */
  type: 'library' | 'application' | 'utility' | 'agent';
  
  /** Dependencies */
  dependencies: string[];
  
  /** Source mapping */
  sourceMapping: SourceMapping;
  
  /** Package.json configuration */
  packageJson: PackageJsonConfig;
}
```

### Migration State Management

```typescript
interface MigrationState {
  /** Current migration step */
  currentStep: MigrationStep;
  
  /** Completed steps */
  completedSteps: string[];
  
  /** Failed steps */
  failedSteps: FailedStep[];
  
  /** Migration errors */
  errors: MigrationError[];
  
  /** Progress information */
  progress: ProgressInfo;
  
  /** Current checkpoint */
  currentCheckpoint: string;
  
  /** Available checkpoints */
  checkpoints: CheckpointInfo[];
  
  /** Migration metrics */
  metrics: MigrationMetrics;
}

interface MigrationStep {
  /** Step identifier */
  id: string;
  
  /** Step name */
  name: string;
  
  /** Step description */
  description: string;
  
  /** Step status */
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  
  /** Start time */
  startTime?: Date;
  
  /** End time */
  endTime?: Date;
  
  /** Step result */
  result?: StepResult;
  
  /** Sub-steps */
  subSteps?: MigrationStep[];
}

interface ProgressInfo {
  /** Current progress percentage */
  percentage: number;
  
  /** Current operation */
  currentOperation: string;
  
  /** Total steps */
  totalSteps: number;
  
  /** Completed steps */
  completedSteps: number;
  
  /** Estimated time remaining */
  estimatedTimeRemaining?: number;
  
  /** Files processed */
  filesProcessed: number;
  
  /** Total files */
  totalFiles: number;
}

interface MigrationError {
  /** Error code */
  code: string;
  
  /** Error message */
  message: string;
  
  /** Error stack trace */
  stack?: string;
  
  /** Context information */
  context: ErrorContext;
  
  /** Timestamp */
  timestamp: Date;
  
  /** Severity level */
  severity: 'low' | 'medium' | 'high' | 'critical';
  
  /** Recovery suggestions */
  recoverySuggestions?: string[];
}
```

### File Management Structures

```typescript
interface FileOperation {
  /** Operation type */
  type: 'move' | 'copy' | 'delete' | 'create' | 'update';
  
  /** Source path */
  sourcePath: string;
  
  /** Destination path */
  destinationPath?: string;
  
  /** Operation options */
  options: FileOperationOptions;
  
  /** Operation priority */
  priority: number;
  
  /** Dependencies */
  dependencies: string[];
}

interface FileOperationOptions {
  /** Overwrite existing files */
  overwrite?: boolean;
  
  /** Create directories if needed */
  createDirectories?: boolean;
  
  /** Preserve file permissions */
  preservePermissions?: boolean;
  
  /** Preserve timestamps */
  preserveTimestamps?: boolean;
  
  /** Backup before operation */
  backup?: boolean;
  
  /** Validation after operation */
  validate?: boolean;
}

interface FileStats {
  /** File size in bytes */
  size: number;
  
  /** Creation time */
  createdAt: Date;
  
  /** Last modified time */
  modifiedAt: Date;
  
  /** File permissions */
  permissions: string;
  
  /** File type */
  type: 'file' | 'directory' | 'symlink';
  
  /** Is executable */
  executable: boolean;
  
  /** File hash */
  hash: string;
}

interface FileEntry {
  /** File name */
  name: string;
  
  /** Full path */
  path: string;
  
  /** File stats */
  stats: FileStats;
  
  /** File type */
  type: 'file' | 'directory' | 'symlink';
  
  /** Is hidden */
  hidden: boolean;
}
```

### Import Management Structures

```typescript
interface ImportMapping {
  /** Original import path */
  originalPath: string;
  
  /** New import path */
  newPath: string;
  
  /** Import type */
  type: 'relative' | 'absolute' | 'package';
  
  /** Import specifiers */
  specifiers: ImportSpecifier[];
  
  /** File pattern */
  filePattern: string;
  
  /** Priority */
  priority: number;
}

interface ImportSpecifier {
  /** Specifier type */
  type: 'default' | 'named' | 'namespace' | 'side-effect';
  
  /** Original name */
  originalName: string;
  
  /** Imported name */
  importedName: string;
  
  /** Local name */
  localName: string;
}

interface ImportAnalysis {
  /** Total imports found */
  totalImports: number;
  
  /** Import by type */
  importsByType: Record<string, number>;
  
  /** Import dependencies */
  dependencies: ImportDependency[];
  
  /** Circular dependencies */
  circularDependencies: string[][];
  
  /** Unused imports */
  unusedImports: string[];
  
  /** Missing imports */
  missingImports: string[];
}

interface ImportDependency {
  /** Source file */
  sourceFile: string;
  
  /** Target file */
  targetFile: string;
  
  /** Import type */
  type: string;
  
  /** Import specifiers */
  specifiers: string[];
  
  /** Line number */
  lineNumber: number;
}
```

### Workspace Management Structures

```typescript
interface WorkspaceConfig {
  /** Workspace name */
  name: string;
  
  /** Workspace version */
  version: string;
  
  /** Workspace packages */
  packages: string[];
  
  /** Workspace dependencies */
  dependencies: Record<string, string>;
  
  /** Dev dependencies */
  devDependencies: Record<string, string>;
  
  /** Workspace settings */
  settings: WorkspaceSettings;
  
  /** Scripts */
  scripts: Record<string, string>;
}

interface WorkspaceSettings {
  /** Package manager */
  packageManager: 'npm' | 'yarn' | 'pnpm';
  
  /** Node version */
  nodeVersion: string;
  
  /** TypeScript configuration */
  typescript: TypeScriptConfig;
  
  /** Linting configuration */
  linting: LintingConfig;
  
  /** Testing configuration */
  testing: TestingConfig;
}

interface PackageConfig {
  /** Package name */
  name: string;
  
  /** Package version */
  version: string;
  
  /** Package description */
  description: string;
  
  /** Main entry point */
  main: string;
  
  /** Type definitions */
  types: string;
  
  /** Dependencies */
  dependencies: Record<string, string>;
  
  /** Dev dependencies */
  devDependencies: Record<string, string>;
  
  /** Peer dependencies */
  peerDependencies: Record<string, string>;
  
  /** Scripts */
  scripts: Record<string, string>;
  
  /** Files to include */
  files: string[];
  
  /** Package keywords */
  keywords: string[];
  
  /** Package author */
  author: string;
  
  /** Package license */
  license: string;
}
```

### A2A System Structures

```typescript
interface A2AConfig {
  /** A2A version */
  version: string;
  
  /** A2A agents */
  agents: A2AAgent[];
  
  /** A2A settings */
  settings: A2ASettings;
  
  /** Communication protocols */
  protocols: A2AProtocol[];
  
  /** Security configuration */
  security: A2ASecurityConfig;
}

interface A2AAgent {
  /** Agent ID */
  id: string;
  
  /** Agent name */
  name: string;
  
  /** Agent type */
  type: string;
  
  /** Agent configuration */
  config: A2AAgentConfig;
  
  /** Agent dependencies */
  dependencies: string[];
  
  /** Agent files */
  files: string[];
  
  /** Agent capabilities */
  capabilities: A2ACapability[];
}

interface A2AAgentConfig {
  /** Entry point */
  entryPoint: string;
  
  /** Runtime configuration */
  runtime: A2ARuntimeConfig;
  
  /** Communication settings */
  communication: A2ACommunicationConfig;
  
  /** Resource limits */
  resources: A2AResourceConfig;
}

interface A2AStructure {
  /** A2A root directory */
  rootPath: string;
  
  /** Agents directory */
  agentsPath: string;
  
  /** Shared directory */
  sharedPath: string;
  
  /** Configuration directory */
  configPath: string;
  
  /** Agent mappings */
  agentMappings: A2AAgentMapping[];
}
```

### Backup System Structures

```typescript
interface BackupConfig {
  /** Backup strategy */
  strategy: 'full' | 'incremental' | 'differential';
  
  /** Backup directory */
  backupDirectory: string;
  
  /** Compression settings */
  compression: CompressionConfig;
  
  /** Retention policy */
  retention: RetentionPolicy;
  
  /** Backup validation */
  validation: BackupValidationConfig;
}

interface BackupInfo {
  /** Backup ID */
  id: string;
  
  /** Backup name */
  name: string;
  
  /** Backup description */
  description: string;
  
  /** Creation time */
  createdAt: Date;
  
  /** Backup size */
  size: number;
  
  /** Backup type */
  type: 'full' | 'incremental' | 'differential';
  
  /** Backup status */
  status: 'creating' | 'completed' | 'failed' | 'corrupted';
  
  /** Files included */
  filesIncluded: number;
  
  /** Backup hash */
  hash: string;
}

interface BackupStats {
  /** Total backups */
  totalBackups: number;
  
  /** Total size */
  totalSize: number;
  
  /** Oldest backup */
  oldestBackup: Date;
  
  /** Newest backup */
  newestBackup: Date;
  
  /** Backup success rate */
  successRate: number;
  
  /** Storage utilization */
  storageUtilization: number;
}
```

### Logging and Monitoring Structures

```typescript
interface LogEntry {
  /** Log timestamp */
  timestamp: Date;
  
  /** Log level */
  level: 'debug' | 'info' | 'warn' | 'error' | 'fatal';
  
  /** Component name */
  component: string;
  
  /** Operation name */
  operation: string;
  
  /** Log message */
  message: string;
  
  /** Additional metadata */
  metadata: Record<string, any>;
  
  /** Request ID */
  requestId: string;
  
  /** User ID */
  userId?: string;
  
  /** Session ID */
  sessionId?: string;
}

interface MigrationMetrics {
  /** Start time */
  startTime: Date;
  
  /** End time */
  endTime?: Date;
  
  /** Total duration */
  duration: number;
  
  /** Files processed */
  filesProcessed: number;
  
  /** Bytes processed */
  bytesProcessed: number;
  
  /** Success rate */
  successRate: number;
  
  /** Error count */
  errorCount: number;
  
  /** Performance metrics */
  performance: PerformanceMetrics;
}

interface PerformanceMetrics {
  /** CPU usage */
  cpuUsage: number;
  
  /** Memory usage */
  memoryUsage: number;
  
  /** Disk I/O */
  diskIO: DiskIOMetrics;
  
  /** Network I/O */
  networkIO: NetworkIOMetrics;
  
  /** Throughput */
  throughput: number;
  
  /** Latency */
  latency: number;
}
```

### Validation Structures

```typescript
interface ValidationRule {
  /** Rule ID */
  id: string;
  
  /** Rule name */
  name: string;
  
  /** Rule description */
  description: string;
  
  /** Rule type */
  type: 'structure' | 'dependency' | 'content' | 'security' | 'performance';
  
  /** Rule severity */
  severity: 'info' | 'warning' | 'error' | 'critical';
  
  /** Rule condition */
  condition: ValidationCondition;
  
  /** Rule action */
  action: ValidationAction;
}

interface ValidationResult {
  /** Validation ID */
  id: string;
  
  /** Is valid */
  isValid: boolean;
  
  /** Validation issues */
  issues: ValidationIssue[];
  
  /** Validation warnings */
  warnings: ValidationWarning[];
  
  /** Validation recommendations */
  recommendations: ValidationRecommendation[];
  
  /** Validation metrics */
  metrics: ValidationMetrics;
}

interface ValidationIssue {
  /** Issue code */
  code: string;
  
  /** Issue message */
  message: string;
  
  /** Issue severity */
  severity: 'info' | 'warning' | 'error' | 'critical';
  
  /** Issue location */
  location: IssueLocation;
  
  /** Fix suggestions */
  fixSuggestions: string[];
  
  /** Auto-fixable */
  autoFixable: boolean;
}
```