/**
 * Middleware system for DiegoTools
 */

import { ToolName, MCPError, ErrorCode } from './types.js';

// ==================== Types ====================

export interface ToolContext {
  toolName: ToolName;
  args: any;
  startTime: number;
  metadata: Map<string, any>;
}

export interface ToolResponse {
  content: Array<{ type: string; text?: string }>;
  [key: string]: any;
}

export type Middleware = (
  ctx: ToolContext,
  next: () => Promise<ToolResponse>
) => Promise<ToolResponse>;

export type ToolHandler = (args: any) => Promise<ToolResponse>;

// ==================== Middleware Implementation ====================

export class MiddlewareManager {
  private middlewares: Middleware[] = [];
  
  /**
   * Register a middleware
   */
  use(middleware: Middleware): void {
    this.middlewares.push(middleware);
  }
  
  /**
   * Compose middlewares and handler
   */
  compose(handler: ToolHandler): ToolHandler {
    return async (args: any) => {
      let index = -1;
      
      const dispatch = async (i: number): Promise<ToolResponse> => {
        if (i <= index) {
          throw new Error('next() called multiple times');
        }
        
        index = i;
        
        if (i === this.middlewares.length) {
          return handler(args);
        }
        
        const middleware = this.middlewares[i];
        if (!middleware) {
          throw new Error('Middleware not found');
        }
        const ctx: ToolContext = {
          toolName: args.toolName,
          args,
          startTime: Date.now(),
          metadata: new Map()
        };
        
        return middleware(ctx, () => dispatch(i + 1));
      };
      
      return dispatch(0);
    };
  }
}

// ==================== Built-in Middlewares ====================

/**
 * Logging middleware
 */
export const loggingMiddleware: Middleware = async (ctx, next) => {
  console.error(`[${new Date().toISOString()}] Starting ${ctx.toolName}`);
  
  try {
    const result = await next();
    const duration = Date.now() - ctx.startTime;
    console.error(`[${new Date().toISOString()}] Completed ${ctx.toolName} in ${duration}ms`);
    return result;
  } catch (error) {
    const duration = Date.now() - ctx.startTime;
    console.error(`[${new Date().toISOString()}] Failed ${ctx.toolName} in ${duration}ms:`, error);
    throw error;
  }
};

/**
 * Metrics middleware
 */
interface Metrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  responseTimes: number[];
}

const metrics: Record<ToolName, Metrics> = {} as Record<ToolName, Metrics>;

export const metricsMiddleware: Middleware = async (ctx, next) => {
  if (!metrics[ctx.toolName]) {
    metrics[ctx.toolName] = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      responseTimes: []
    };
  }
  
  const toolMetrics = metrics[ctx.toolName];
  toolMetrics.totalRequests++;
  
  try {
    const result = await next();
    const duration = Date.now() - ctx.startTime;
    
    toolMetrics.successfulRequests++;
    toolMetrics.responseTimes.push(duration);
    toolMetrics.averageResponseTime = 
      toolMetrics.responseTimes.reduce((a, b) => a + b, 0) / toolMetrics.responseTimes.length;
    
    return result;
  } catch (error) {
    toolMetrics.failedRequests++;
    throw error;
  }
};

/**
 * Rate limiting middleware
 */
interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

export function rateLimitMiddleware(config: RateLimitConfig): Middleware {
  const requests = new Map<string, number[]>();
  
  return async (ctx, next) => {
    const key = ctx.toolName;
    const now = Date.now();
    const windowStart = now - config.windowMs;
    
    // Get requests in current window
    const toolRequests = requests.get(key) || [];
    const recentRequests = toolRequests.filter(time => time > windowStart);
    
    if (recentRequests.length >= config.maxRequests) {
      throw new MCPError(
        ErrorCode.RATE_LIMIT_EXCEEDED,
        `Rate limit exceeded for ${key}. Max ${config.maxRequests} requests per ${config.windowMs}ms`
      );
    }
    
    // Add current request
    recentRequests.push(now);
    requests.set(key, recentRequests);
    
    return next();
  };
}

/**
 * Validation middleware
 */
export const validationMiddleware: Middleware = async (ctx, next) => {
  // Validation is handled in the main handler with Zod
  // This is a placeholder for additional validation logic
  if (!ctx.args || typeof ctx.args !== 'object') {
    throw new MCPError(
      ErrorCode.INVALID_PARAMS,
      'Invalid arguments provided'
    );
  }
  
  return next();
};

/**
 * Error handling middleware
 */
export const errorHandlingMiddleware: Middleware = async (_ctx, next) => {
  try {
    return await next();
  } catch (error) {
    // Transform errors into MCPError if needed
    if (!(error instanceof MCPError)) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new MCPError(ErrorCode.UNKNOWN, message, error);
    }
    throw error;
  }
};

/**
 * Caching middleware factory
 */
export function cachingMiddleware(ttl: number = 300000): Middleware {
  const cache = new Map<string, { data: ToolResponse; expiry: number }>();
  
  return async (ctx, next) => {
    // Only cache read operations
    const readOnlyTools: ToolName[] = [
      ToolName.PUPPETEER_GET_CONTENT,
      ToolName.GITHUB_LIST_ISSUES
    ];
    
    if (!readOnlyTools.includes(ctx.toolName)) {
      return next();
    }
    
    const cacheKey = `${ctx.toolName}:${JSON.stringify(ctx.args)}`;
    const cached = cache.get(cacheKey);
    
    if (cached && cached.expiry > Date.now()) {
      ctx.metadata.set('cached', true);
      return cached.data;
    }
    
    const result = await next();
    
    cache.set(cacheKey, {
      data: result,
      expiry: Date.now() + ttl
    });
    
    return result;
  };
}

/**
 * Get metrics for a tool
 */
export function getMetrics(toolName?: ToolName): Record<string, Metrics> | Metrics | null {
  if (toolName) {
    return metrics[toolName] || null;
  }
  return metrics;
}