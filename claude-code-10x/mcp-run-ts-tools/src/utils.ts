/**
 * Utility functions with generics and type safety
 */

import { MCPError, ErrorCode, ContentBlock, ToolResult } from './core/types.js';

// ==================== Retry Logic ====================

interface RetryOptions {
  retries?: number;
  delay?: number;
  backoff?: boolean;
  onRetry?: (error: Error, attempt: number) => void;
}

/**
 * Execute a function with retry logic
 * @template T The return type of the function
 * @param fn The async function to execute
 * @param options Retry configuration options
 * @returns Promise with the function result
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    retries = 3,
    delay = 1000,
    backoff = true,
    onRetry
  } = options;

  let lastError: Error;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (attempt < retries) {
        const waitTime = backoff ? delay * Math.pow(2, attempt) : delay;
        onRetry?.(lastError, attempt + 1);
        await sleep(waitTime);
      }
    }
  }

  throw lastError!;
}

// ==================== Timeout Logic ====================

/**
 * Execute a function with timeout
 * @template T The return type of the function
 * @param fn The async function to execute
 * @param timeoutMs Timeout in milliseconds
 * @param errorMessage Custom error message
 * @returns Promise with the function result
 */
export async function withTimeout<T>(
  fn: () => Promise<T>,
  timeoutMs: number,
  errorMessage = 'Operation timed out'
): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new MCPError(ErrorCode.TIMEOUT, errorMessage));
    }, timeoutMs);
  });

  return Promise.race([fn(), timeoutPromise]);
}

// ==================== Result Pattern ====================

export type Result<T, E = Error> =
  | { ok: true; value: T }
  | { ok: false; error: E };

/**
 * Wrap an async function to return a Result type
 * @template T The success value type
 * @template E The error type
 * @param fn The async function to wrap
 * @returns Result with either success value or error
 */
export async function toResult<T, E = Error>(
  fn: () => Promise<T>
): Promise<Result<T, E>> {
  try {
    const value = await fn();
    return { ok: true, value };
  } catch (error) {
    return { ok: false, error: error as E };
  }
}

// ==================== Tool Response Helpers ====================

/**
 * Create a successful tool response
 * @template T The data type
 * @param data The response data
 * @param message Optional message
 * @returns Formatted tool result
 */
export function successResponse<T = any>(
  data: T,
  message?: string
): ToolResult<T> {
  const content: ContentBlock[] = [];
  
  if (message) {
    content.push({ type: 'text', text: message });
  }
  
  if (typeof data === 'string') {
    content.push({ type: 'text', text: data });
  } else {
    content.push({ type: 'text', text: JSON.stringify(data, null, 2) });
  }
  
  return {
    success: true,
    data,
    content
  };
}

/**
 * Create an error tool response
 * @param code Error code
 * @param message Error message
 * @param details Optional error details
 * @returns Formatted error result
 */
export function errorResponse(
  code: ErrorCode,
  message: string,
  details?: any
): ToolResult {
  const error = new MCPError(code, message, details);
  
  return {
    success: false,
    error,
    content: [{ type: 'text', text: `Error: ${message}` }]
  };
}

// ==================== Functional Helpers ====================

/**
 * Pipe functions together with type safety
 * @template T The input type
 * @template R The final return type
 * @param value The initial value
 * @param fns Functions to pipe
 * @returns The final result
 */
export function pipe<T, R>(
  value: T,
  ...fns: Array<(v: any) => any>
): R {
  return fns.reduce((acc, fn) => fn(acc), value as any) as R;
}

/**
 * Compose functions right to left
 * @template T The input type
 * @template R The final return type
 * @param fns Functions to compose
 * @returns Composed function
 */
export function compose<T, R>(
  ...fns: Array<(v: any) => any>
): (value: T) => R {
  return (value: T) => fns.reduceRight((acc, fn) => fn(acc), value as any) as R;
}

// ==================== Async Helpers ====================

/**
 * Sleep for specified milliseconds
 * @param ms Milliseconds to sleep
 * @returns Promise that resolves after timeout
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Debounce an async function
 * @template T The function arguments type
 * @template R The function return type
 * @param fn The function to debounce
 * @param delay Debounce delay in ms
 * @returns Debounced function
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Throttle an async function
 * @template T The function type
 * @param fn The function to throttle
 * @param limit Time limit in ms
 * @returns Throttled function
 */
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  limit: number
): T {
  let inThrottle = false;
  let lastResult: ReturnType<T>;
  
  return ((...args: Parameters<T>) => {
    if (!inThrottle) {
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
      lastResult = fn(...args);
    }
    return lastResult;
  }) as T;
}

// ==================== Batch Processing ====================

/**
 * Process items in batches
 * @template T The item type
 * @template R The result type
 * @param items Items to process
 * @param batchSize Size of each batch
 * @param processor Function to process each item
 * @returns Array of results
 */
export async function batchProcess<T, R>(
  items: T[],
  batchSize: number,
  processor: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = [];
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(processor));
    results.push(...batchResults);
  }
  
  return results;
}

// ==================== Cache Helper ====================

interface CacheEntry<T> {
  value: T;
  expiry: number;
}

export class SimpleCache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  
  constructor(private defaultTTL: number = 300000) {} // 5 minutes default
  
  /**
   * Get or compute a cached value
   * @param key Cache key
   * @param compute Function to compute value if not cached
   * @param ttl Time to live in ms
   * @returns Cached or computed value
   */
  async getOrCompute(
    key: string,
    compute: () => Promise<T>,
    ttl: number = this.defaultTTL
  ): Promise<T> {
    const entry = this.cache.get(key);
    
    if (entry && entry.expiry > Date.now()) {
      return entry.value;
    }
    
    const value = await compute();
    this.cache.set(key, {
      value,
      expiry: Date.now() + ttl
    });
    
    return value;
  }
  
  clear(): void {
    this.cache.clear();
  }
  
  delete(key: string): boolean {
    return this.cache.delete(key);
  }
}