# Component Architecture Diagrams - Claude-20x Reorganization

## System Overview

```mermaid
graph TB
    subgraph "Migration System"
        MO[MigrationOrchestrator]
        FM[FileManager]
        IU[ImportUpdater]
        WM[WorkspaceManager]
        A2AV[A2AValidator]
        BM[BackupManager]
    end
    
    subgraph "Target Structure"
        PC[packages/core/]
        PA[packages/agents/]
        PU[packages/ui/]
        PM[packages/memory/]
        PT[packages/tools/]
    end
    
    subgraph "Source Structure"
        CC[claude-code-10x/]
        AG[agents/]
        UI[ui/]
        MEM[memory/]
        SCR[scripts/]
    end
    
    MO --> FM
    MO --> IU
    MO --> WM
    MO --> A2AV
    MO --> BM
    
    FM --> PC
    FM --> PA
    FM --> PU
    FM --> PM
    FM --> PT
    
    CC --> PC
    AG --> PA
    UI --> PU
    MEM --> PM
    SCR --> PT
```

## MigrationOrchestrator Architecture

```mermaid
classDiagram
    class MigrationOrchestrator {
        -config: MigrationConfig
        -status: MigrationStatus
        -progress: MigrationProgress
        -logger: Logger
        
        +executeMigration(config: MigrationConfig): Promise~MigrationResult~
        +validatePreConditions(): Promise~ValidationResult~
        +createBackup(): Promise~BackupInfo~
        +rollback(backupId: string): Promise~RollbackResult~
        +getProgress(): MigrationProgress
        +getStatus(): MigrationStatus
        +getLogs(): LogEntry[]
        +on(event: string, callback: Function): void
    }
    
    class FileManager {
        +migrateFiles(mapping: FileMapping[]): Promise~FileResult[]~
        +validateStructure(path: string): Promise~boolean~
        +createDirectory(path: string): Promise~boolean~
        +copyFile(source: string, target: string): Promise~boolean~
        +moveFile(source: string, target: string): Promise~boolean~
        +calculateChecksum(file: string): Promise~string~
    }
    
    class ImportUpdater {
        +analyzeImports(projectRoot: string): Promise~ImportAnalysis~
        +updateImports(files: string[], mapping: PathMapping[]): Promise~UpdateResult~
        +validateSyntax(content: string, language: string): Promise~boolean~
        +createPathMapping(migration: MigrationConfig): PathMapping[]
    }
    
    class A2AValidator {
        +validateCompatibility(projectRoot: string): Promise~A2AReport~
        +testAgentCommunication(agents: Agent[]): Promise~CommunicationResult~
        +validateMemorySystem(): Promise~MemoryValidation~
        +runCriticalTests(): Promise~TestResult[]~
    }
    
    MigrationOrchestrator --> FileManager
    MigrationOrchestrator --> ImportUpdater
    MigrationOrchestrator --> A2AValidator
    MigrationOrchestrator --> WorkspaceManager
    MigrationOrchestrator --> BackupManager
```

## Data Flow Diagram

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Source    │    │ Migration   │    │   Target    │
│ Structure   │───▶│  Process    │───▶│ Structure   │
│             │    │             │    │ (packages/) │
└─────────────┘    └─────────────┘    └─────────────┘
       │                  │                  │
       │                  ▼                  │
       │           ┌─────────────┐           │
       │           │   Backup    │           │
       │           │   System    │           │
       │           └─────────────┘           │
       │                  │                  │
       │                  ▼                  │
       │           ┌─────────────┐           │
       │           │    Logs     │           │
       │           │  & Metrics  │           │
       │           └─────────────┘           │
       │                                     │
       └─────────────────────────────────────┘
              (Rollback if needed)
```

## Service Dependencies

```
MigrationOrchestrator
├── FileManager
│   ├── fs (Node.js)
│   ├── path (Node.js)
│   └── BackupManager
├── ImportUpdater
│   ├── @babel/parser
│   ├── @babel/traverse
│   └── @babel/generator
├── WorkspaceManager
│   ├── package.json templates
│   └── workspace configs
├── A2AValidator
│   ├── schema validators
│   └── compatibility checkers
├── BackupManager
│   ├── compression libs
│   └── integrity checkers
└── LoggingService
    ├── Winston
    └── structured logs
```

## Error Handling Flow

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Error     │    │   Error     │    │   Recovery  │
│ Detection   │───▶│  Handler    │───▶│  Strategy   │
└─────────────┘    └─────────────┘    └─────────────┘
       │                  │                  │
       │                  ▼                  │
       │           ┌─────────────┐           │
       │           │ Rollback    │           │
       │           │ Manager     │           │
       │           └─────────────┘           │
       │                  │                  │
       │                  ▼                  │
       │           ┌─────────────┐           │
       │           │ Checkpoint  │           │
       │           │ Restore     │           │
       │           └─────────────┘           │
       │                                     │
       └─────────────────────────────────────┘
              (Notify & Log)
```

## Performance Optimization

```
┌─────────────────────────────────────────────────────────────┐
│                  Parallel Processing                        │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │  Worker 1   │  │  Worker 2   │  │  Worker 3   │        │
│  │ (File Ops)  │  │ (Import     │  │ (Validation)│        │
│  │             │  │  Updates)   │  │             │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
│         │                 │                 │              │
│         └─────────────────┼─────────────────┘              │
│                           │                                │
│                           ▼                                │
│                 ┌─────────────────┐                        │
│                 │  Result         │                        │
│                 │  Aggregator     │                        │
│                 └─────────────────┘                        │
└─────────────────────────────────────────────────────────────┘
```

## Technology Stack Architecture

```mermaid
graph TB
    subgraph "Frontend Layer"
        Mesop[Mesop UI]
        FastAPI[FastAPI]
        Streamlit[Streamlit Components]
    end
    
    subgraph "Backend Layer"
        Node[Node.js/TypeScript]
        Python[Python/FastAPI]
        A2ACore[A2A Core]
    end
    
    subgraph "Integration Layer"
        MCP[MCP Protocol]
        gRPC[gRPC Communication]
        REST[REST APIs]
    end
    
    subgraph "Storage Layer"
        JSON[JSON Files]
        Memory[In-Memory Cache]
        Backup[Backup Storage]
    end
    
    subgraph "Tools Layer"
        TypeScript[TypeScript Compiler]
        Jest[Jest Testing]
        PyTest[PyTest Testing]
        ESLint[ESLint]
        Ruff[Ruff Linting]
    end
    
    Mesop --> FastAPI
    FastAPI --> Python
    Python --> A2ACore
    Node --> MCP
    MCP --> gRPC
    gRPC --> REST
    
    Python --> JSON
    A2ACore --> Memory
    Memory --> Backup
    
    Node --> TypeScript
    Node --> Jest
    Python --> PyTest
    Python --> Ruff
    Node --> ESLint
```

## Performance Optimization

```mermaid
graph LR
    subgraph "Parallel Processing"
        P1[File Operations]
        P2[Import Analysis]
        P3[Validation Tests]
    end
    
    subgraph "Batch Operations"
        B1[File Batching]
        B2[Import Batching]
        B3[Test Batching]
    end
    
    subgraph "Caching"
        C1[File Cache]
        C2[Analysis Cache]
        C3[Result Cache]
    end
    
    P1 --> B1
    P2 --> B2
    P3 --> B3
    
    B1 --> C1
    B2 --> C2
    B3 --> C3
```