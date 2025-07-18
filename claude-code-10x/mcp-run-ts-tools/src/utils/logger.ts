/**
 * Sistema de logging estruturado para DiegoTools
 */

import * as fs from 'fs';
import * as path from 'path';

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 99
}

export interface LogEntry {
  timestamp: string;
  level: keyof typeof LogLevel;
  tool?: string;
  message: string;
  data?: any;
  error?: Error;
}

export class Logger {
  private static instance: Logger;
  private logLevel: LogLevel;
  private logFile?: string;
  private useConsole: boolean;
  private useFile: boolean;

  private constructor() {
    // Configurar baseado em variáveis de ambiente
    this.logLevel = this.parseLogLevel(process.env.LOG_LEVEL || 'INFO');
    this.useConsole = process.env.LOG_CONSOLE !== 'false';
    this.useFile = process.env.LOG_FILE === 'true';
    
    if (this.useFile) {
      const logDir = process.env.LOG_DIR || path.join(process.cwd(), 'logs');
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }
      
      const date = new Date().toISOString().split('T')[0];
      this.logFile = path.join(logDir, `diego-tools-${date}.log`);
    }
  }

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private parseLogLevel(level: string): LogLevel {
    return LogLevel[level.toUpperCase() as keyof typeof LogLevel] || LogLevel.INFO;
  }

  private formatMessage(entry: LogEntry): string {
    const { timestamp, level, tool, message, data } = entry;
    const toolPrefix = tool ? `[${tool}] ` : '';
    
    let formatted = `[${timestamp}] [${level}] ${toolPrefix}${message}`;
    
    if (data) {
      formatted += ` ${JSON.stringify(data)}`;
    }
    
    return formatted;
  }

  private log(level: keyof typeof LogLevel, message: string, options?: {
    tool?: string;
    data?: any;
    error?: Error;
  }) {
    if (LogLevel[level] < this.logLevel) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...options
    };

    const formatted = this.formatMessage(entry);

    // Log para console
    if (this.useConsole) {
      // Usar process.stderr.write diretamente para evitar recursão
      process.stderr.write(formatted + '\n');
      
      if (options?.error) {
        process.stderr.write(options.error.stack + '\n');
      }
    }

    // Log para arquivo
    if (this.useFile && this.logFile) {
      try {
        fs.appendFileSync(this.logFile, formatted + '\n');
        if (options?.error) {
          fs.appendFileSync(this.logFile, options.error.stack + '\n');
        }
      } catch (err) {
        // Falha silenciosa se não conseguir escrever
      }
    }
  }

  debug(message: string, options?: { tool?: string; data?: any }) {
    this.log('DEBUG', message, options);
  }

  info(message: string, options?: { tool?: string; data?: any }) {
    this.log('INFO', message, options);
  }

  warn(message: string, options?: { tool?: string; data?: any }) {
    this.log('WARN', message, options);
  }

  error(message: string, options?: { tool?: string; data?: any; error?: Error }) {
    this.log('ERROR', message, options);
  }

  // Método para criar logger específico de ferramenta
  forTool(toolName: string) {
    const logger = this;
    return {
      debug: (message: string, data?: any) => 
        logger.debug(message, { tool: toolName, data }),
      info: (message: string, data?: any) => 
        logger.info(message, { tool: toolName, data }),
      warn: (message: string, data?: any) => 
        logger.warn(message, { tool: toolName, data }),
      error: (message: string, error?: Error, data?: any) => 
        logger.error(message, { tool: toolName, error, data })
    };
  }
}

// Exportar instância única
export const logger = Logger.getInstance();

// Helper para substituir console.log/error existentes
export function replaceConsoleWithLogger() {
  const originalLog = console.log;
  const originalError = console.error;
  const originalWarn = console.warn;

  console.log = (...args: any[]) => {
    logger.info(args.map(a => String(a)).join(' '));
  };

  console.error = (...args: any[]) => {
    // Preservar logs MCP que começam com [DiegoTools]
    const message = args.map(a => String(a)).join(' ');
    if (message.includes('[DiegoTools]')) {
      originalError(...args);
    } else {
      logger.error(message);
    }
  };

  console.warn = (...args: any[]) => {
    logger.warn(args.map(a => String(a)).join(' '));
  };

  // Retornar função para restaurar
  return () => {
    console.log = originalLog;
    console.error = originalError;
    console.warn = originalWarn;
  };
}