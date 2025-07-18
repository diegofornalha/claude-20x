/**
 * Configuração centralizada do DiegoTools
 */

import dotenv from 'dotenv';
import { z } from 'zod';

// Carregar variáveis de ambiente
dotenv.config();

/**
 * Schema de validação para configuração
 */
const ConfigSchema = z.object({
  // Servidor
  server: z.object({
    name: z.string().default('DiegoTools'),
    version: z.string().default('2.0.0'),
    description: z.string().default('Servidor MCP com ferramentas diversas')
  }),
  
  // GitHub
  github: z.object({
    token: z.string().optional(),
    apiUrl: z.string().default('https://api.github.com')
  }),
  
  // Mem0
  mem0: z.object({
    apiKey: z.string().optional(),
    baseUrl: z.string().default('https://api.mem0.ai')
  }),
  
  // Puppeteer
  puppeteer: z.object({
    headless: z.boolean().default(true),
    defaultTimeout: z.number().default(30000),
    cleanupInterval: z.number().default(300000), // 5 minutos
    maxIdleTime: z.number().default(600000) // 10 minutos
  }),
  
  // Logging
  logging: z.object({
    level: z.enum(['DEBUG', 'INFO', 'WARN', 'ERROR', 'NONE']).default('INFO'),
    console: z.boolean().default(true),
    file: z.boolean().default(false),
    dir: z.string().default('./logs')
  }),
  
  // Cache
  cache: z.object({
    enabled: z.boolean().default(true),
    ttl: z.number().default(300000) // 5 minutos
  }),
  
  // Git
  git: z.object({
    autoPush: z.boolean().default(false),
    defaultBranch: z.string().default('main'),
    commitPrefix: z.boolean().default(false)
  })
});

/**
 * Tipo da configuração
 */
export type Config = z.infer<typeof ConfigSchema>;

/**
 * Função para criar configuração a partir do ambiente
 */
function createConfig(): Config {
  const rawConfig = {
    server: {
      name: process.env.SERVER_NAME,
      version: process.env.SERVER_VERSION,
      description: process.env.SERVER_DESCRIPTION
    },
    github: {
      token: process.env.GITHUB_TOKEN,
      apiUrl: process.env.GITHUB_API_URL
    },
    mem0: {
      apiKey: process.env.MEM0_API_KEY,
      baseUrl: process.env.MEM0_BASE_URL
    },
    puppeteer: {
      headless: process.env.PUPPETEER_HEADLESS !== 'false',
      defaultTimeout: process.env.PUPPETEER_TIMEOUT 
        ? parseInt(process.env.PUPPETEER_TIMEOUT) 
        : undefined,
      cleanupInterval: process.env.PUPPETEER_CLEANUP_INTERVAL
        ? parseInt(process.env.PUPPETEER_CLEANUP_INTERVAL)
        : undefined,
      maxIdleTime: process.env.PUPPETEER_MAX_IDLE_TIME
        ? parseInt(process.env.PUPPETEER_MAX_IDLE_TIME)
        : undefined
    },
    logging: {
      level: process.env.LOG_LEVEL as any,
      console: process.env.LOG_CONSOLE !== 'false',
      file: process.env.LOG_FILE === 'true',
      dir: process.env.LOG_DIR
    },
    cache: {
      enabled: process.env.CACHE_ENABLED !== 'false',
      ttl: process.env.CACHE_TTL 
        ? parseInt(process.env.CACHE_TTL)
        : undefined
    },
    git: {
      autoPush: process.env.GIT_AUTO_PUSH === 'true',
      defaultBranch: process.env.GIT_DEFAULT_BRANCH,
      commitPrefix: process.env.GIT_COMMIT_PREFIX === 'true'
    }
  };
  
  // Validar e aplicar defaults
  return ConfigSchema.parse(rawConfig);
}

/**
 * Configuração global
 */
export const config = createConfig();

/**
 * Validar configurações obrigatórias
 */
export function validateRequiredConfig(): string[] {
  const missing: string[] = [];
  
  // GitHub token é necessário para muitas ferramentas
  if (!config.github.token) {
    missing.push('GITHUB_TOKEN');
  }
  
  return missing;
}

/**
 * Helper para obter configuração tipada
 */
export function getConfig<K extends keyof Config>(key: K): Config[K] {
  return config[key];
}

/**
 * Exportar configurações específicas para compatibilidade
 */
export const serverConfig = config.server;
export const githubConfig = config.github;
export const puppeteerConfig = config.puppeteer;
export const loggingConfig = config.logging;
export const cacheConfig = config.cache;
export const gitConfig = config.git;