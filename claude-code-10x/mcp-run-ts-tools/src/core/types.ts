/**
 * Type definitions for MCP Server com 3 tools: agents, browser e puppeteer
 */

import { Browser, Page } from 'puppeteer';

// ==================== Enums ====================

export enum ToolName {
  // Puppeteer Tools
  PUPPETEER_NAVIGATE = 'puppeteer_navigate',
  PUPPETEER_SCREENSHOT = 'puppeteer_screenshot',
  PUPPETEER_CLICK = 'puppeteer_click',
  PUPPETEER_TYPE = 'puppeteer_type',
  PUPPETEER_GET_CONTENT = 'puppeteer_get_content',
  
  // Browser Tools
  BROWSER_OPEN_URL = 'browser_open_url',
  
  // Agents Tools
  AGENTS_LIST = 'agents_list',
  AGENTS_GET_DETAILS = 'agents_get_details',
  AGENTS_ANALYZE = 'agents_analyze',
  AGENTS_SEARCH = 'agents_search'
}

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error'
}

// ==================== Configuration Types ====================

export interface ServerConfig {
  name: string;
  version: string;
  description: string;
  logLevel?: LogLevel;
}

export interface PuppeteerConfig {
  headless?: boolean;
  defaultTimeout?: number;
  viewportWidth?: number;
  viewportHeight?: number;
}

// ==================== Tool Parameter Types ====================

// Puppeteer Tool Parameters
export interface NavigateParams {
  url: string;
}

export interface ScreenshotParams {
  path: string;
  fullPage?: boolean;
}

export interface ClickParams {
  selector: string;
}

export interface TypeParams {
  selector: string;
  text: string;
}

// Browser Tool Parameters
export interface OpenUrlParams {
  url: string;
}

// Agents Tool Parameters
export interface ListAgentsParams {
  type?: string;
}

export interface GetAgentDetailsParams {
  agentId: string;
}

export interface AnalyzeAgentParams {
  agentId: string;
  metrics?: string[];
}

export interface SearchAgentsParams {
  query: string;
  type?: string;
}

// ==================== Response Types ====================

export type ToolResult<T = any> = 
  | { success: true; data: T; content: ContentBlock[] }
  | { success: false; error: MCPError; content: ContentBlock[] };

export interface ContentBlock {
  type: 'text' | 'image' | 'resource';
  text?: string;
  uri?: string;
  mimeType?: string;
}

// ==================== Error Types ====================

export enum ErrorCode {
  // General errors
  UNKNOWN = 'UNKNOWN',
  INVALID_PARAMS = 'INVALID_PARAMS',
  NOT_FOUND = 'NOT_FOUND',
  TIMEOUT = 'TIMEOUT',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  METHOD_NOT_FOUND = 'METHOD_NOT_FOUND',
  
  // Puppeteer errors
  BROWSER_NOT_INITIALIZED = 'BROWSER_NOT_INITIALIZED',
  PAGE_LOAD_FAILED = 'PAGE_LOAD_FAILED',
  ELEMENT_NOT_FOUND = 'ELEMENT_NOT_FOUND',
  SCREENSHOT_FAILED = 'SCREENSHOT_FAILED'
}

export class MCPError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'MCPError';
  }
}

// ==================== State Management Types ====================

export interface ServerState {
  browser?: Browser;
  page?: Page;
  lastActivity: number;
  requestCount: number;
}

// ==================== Tool Definition Types ====================

export interface ToolDefinition {
  name: ToolName;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
  handler: (args: any) => Promise<ToolResult>;
}

// ==================== Type Guards ====================

export function isNavigateParams(params: any): params is NavigateParams {
  return typeof params?.url === 'string';
}

export function isScreenshotParams(params: any): params is ScreenshotParams {
  return typeof params?.path === 'string';
}

export function isMCPError(error: any): error is MCPError {
  return error instanceof MCPError;
}

// ==================== Utility Types ====================

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type AsyncReturnType<T extends (...args: any) => Promise<any>> = 
  T extends (...args: any) => Promise<infer U> ? U : never;

export type ExtractToolParams<T extends ToolName> = 
  T extends ToolName.PUPPETEER_NAVIGATE ? NavigateParams :
  T extends ToolName.PUPPETEER_SCREENSHOT ? ScreenshotParams :
  T extends ToolName.PUPPETEER_CLICK ? ClickParams :
  T extends ToolName.PUPPETEER_TYPE ? TypeParams :
  T extends ToolName.BROWSER_OPEN_URL ? OpenUrlParams :
  T extends ToolName.AGENTS_LIST ? ListAgentsParams :
  T extends ToolName.AGENTS_GET_DETAILS ? GetAgentDetailsParams :
  T extends ToolName.AGENTS_ANALYZE ? AnalyzeAgentParams :
  T extends ToolName.AGENTS_SEARCH ? SearchAgentsParams :
  never;