/**
 * RedisCache - Advanced Redis Cache System for A2A Servers
 * 
 * Features:
 * - Connection pooling with automatic failover
 * - Intelligent TTL management
 * - Batch operations for performance
 * - Health monitoring and metrics
 * - Graceful degradation when Redis unavailable
 */

const Redis = require('ioredis');

class RedisCache {
  /**
   * Create Redis cache instance with connection pooling
   * @param {Object} options - Redis configuration options
   */
  constructor(options = {}) {
    this.options = {
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD || null,
      db: process.env.REDIS_DB || 0,
      keyPrefix: 'a2a:',
      maxRetriesPerRequest: 3,
      retryDelayOnFailover: 100,
      enableOfflineQueue: false,
      lazyConnect: true,
      maxMemoryPolicy: 'allkeys-lru',
      // Connection pool settings
      family: 4,
      keepAlive: true,
      connectTimeout: 10000,
      commandTimeout: 5000,
      // Default TTL settings
      defaultTTL: 300, // 5 minutes
      discoveryTTL: 60,  // 1 minute for discovery endpoint
      healthTTL: 30,     // 30 seconds for health endpoint
      agentCardTTL: 600, // 10 minutes for agent cards
      ...options
    };

    this.redis = null;
    this.isConnected = false;
    this.metrics = {
      hits: 0,
      misses: 0,
      errors: 0,
      lastError: null
    };

    this.init();
  }

  /**
   * Initialize Redis connection with error handling
   */
  async init() {
    try {
      this.redis = new Redis(this.options);

      this.redis.on('connect', () => {
        console.log('🔗 Redis cache connected');
        this.isConnected = true;
      });

      this.redis.on('ready', () => {
        console.log('✅ Redis cache ready');
      });

      this.redis.on('error', (error) => {
        console.error('❌ Redis cache error:', error.message);
        this.isConnected = false;
        this.metrics.errors++;
        this.metrics.lastError = error.message;
      });

      this.redis.on('close', () => {
        console.log('🔌 Redis cache connection closed');
        this.isConnected = false;
      });

      this.redis.on('reconnecting', () => {
        console.log('🔄 Redis cache reconnecting...');
      });

      // Test connection
      await this.redis.ping();
      
    } catch (error) {
      console.error('Failed to initialize Redis cache:', error.message);
      this.redis = null;
    }
  }

  /**
   * Get cache key with prefix
   * @param {string} key - Cache key
   * @returns {string} Prefixed key
   */
  getKey(key) {
    return `${this.options.keyPrefix}${key}`;
  }

  /**
   * Get value from cache
   * @param {string} key - Cache key
   * @returns {Promise<any>} Cached value or null
   */
  async get(key) {
    if (!this.isConnected || !this.redis) {
      this.metrics.misses++;
      return null;
    }

    try {
      const value = await this.redis.get(this.getKey(key));
      if (value) {
        this.metrics.hits++;
        return JSON.parse(value);
      } else {
        this.metrics.misses++;
        return null;
      }
    } catch (error) {
      console.error(`Redis get error for key ${key}:`, error.message);
      this.metrics.errors++;
      this.metrics.lastError = error.message;
      return null;
    }
  }

  /**
   * Set value in cache with TTL
   * @param {string} key - Cache key
   * @param {any} value - Value to cache
   * @param {number} ttl - TTL in seconds (optional)
   * @returns {Promise<boolean>} Success status
   */
  async set(key, value, ttl = null) {
    if (!this.isConnected || !this.redis) {
      return false;
    }

    try {
      const serialized = JSON.stringify(value);
      const finalTTL = ttl || this.getTTLForKey(key);
      
      await this.redis.setex(this.getKey(key), finalTTL, serialized);
      return true;
    } catch (error) {
      console.error(`Redis set error for key ${key}:`, error.message);
      this.metrics.errors++;
      this.metrics.lastError = error.message;
      return false;
    }
  }

  /**
   * Get multiple values in batch
   * @param {string[]} keys - Array of cache keys
   * @returns {Promise<Object>} Key-value pairs
   */
  async mget(keys) {
    if (!this.isConnected || !this.redis || !keys.length) {
      return {};
    }

    try {
      const prefixedKeys = keys.map(key => this.getKey(key));
      const values = await this.redis.mget(...prefixedKeys);
      
      const result = {};
      keys.forEach((key, index) => {
        if (values[index]) {
          try {
            result[key] = JSON.parse(values[index]);
            this.metrics.hits++;
          } catch (parseError) {
            console.error(`JSON parse error for key ${key}:`, parseError.message);
            this.metrics.misses++;
          }
        } else {
          this.metrics.misses++;
        }
      });

      return result;
    } catch (error) {
      console.error('Redis mget error:', error.message);
      this.metrics.errors++;
      return {};
    }
  }

  /**
   * Set multiple values in batch
   * @param {Object} keyValuePairs - Object with key-value pairs
   * @param {number} ttl - TTL in seconds (optional)
   * @returns {Promise<boolean>} Success status
   */
  async mset(keyValuePairs, ttl = null) {
    if (!this.isConnected || !this.redis || !Object.keys(keyValuePairs).length) {
      return false;
    }

    try {
      const pipeline = this.redis.pipeline();
      
      Object.entries(keyValuePairs).forEach(([key, value]) => {
        const serialized = JSON.stringify(value);
        const finalTTL = ttl || this.getTTLForKey(key);
        pipeline.setex(this.getKey(key), finalTTL, serialized);
      });

      await pipeline.exec();
      return true;
    } catch (error) {
      console.error('Redis mset error:', error.message);
      this.metrics.errors++;
      return false;
    }
  }

  /**
   * Delete value from cache
   * @param {string} key - Cache key
   * @returns {Promise<boolean>} Success status
   */
  async del(key) {
    if (!this.isConnected || !this.redis) {
      return false;
    }

    try {
      const result = await this.redis.del(this.getKey(key));
      return result > 0;
    } catch (error) {
      console.error(`Redis delete error for key ${key}:`, error.message);
      this.metrics.errors++;
      return false;
    }
  }

  /**
   * Delete multiple keys in batch
   * @param {string[]} keys - Array of cache keys
   * @returns {Promise<number>} Number of deleted keys
   */
  async mdel(keys) {
    if (!this.isConnected || !this.redis || !keys.length) {
      return 0;
    }

    try {
      const prefixedKeys = keys.map(key => this.getKey(key));
      return await this.redis.del(...prefixedKeys);
    } catch (error) {
      console.error('Redis mdel error:', error.message);
      this.metrics.errors++;
      return 0;
    }
  }

  /**
   * Clear all cache entries with prefix
   * @returns {Promise<number>} Number of deleted keys
   */
  async clear() {
    if (!this.isConnected || !this.redis) {
      return 0;
    }

    try {
      const keys = await this.redis.keys(`${this.options.keyPrefix}*`);
      if (keys.length > 0) {
        return await this.redis.del(...keys);
      }
      return 0;
    } catch (error) {
      console.error('Redis clear error:', error.message);
      this.metrics.errors++;
      return 0;
    }
  }

  /**
   * Get TTL for specific key type
   * @param {string} key - Cache key
   * @returns {number} TTL in seconds
   */
  getTTLForKey(key) {
    if (key.includes('discover')) return this.options.discoveryTTL;
    if (key.includes('health')) return this.options.healthTTL;
    if (key.includes('agent-card')) return this.options.agentCardTTL;
    return this.options.defaultTTL;
  }

  /**
   * Get cache statistics
   * @returns {Object} Cache metrics
   */
  getStats() {
    const hitRate = this.metrics.hits + this.metrics.misses > 0 
      ? (this.metrics.hits / (this.metrics.hits + this.metrics.misses) * 100).toFixed(2)
      : 0;

    return {
      connected: this.isConnected,
      hits: this.metrics.hits,
      misses: this.metrics.misses,
      errors: this.metrics.errors,
      hitRate: `${hitRate}%`,
      lastError: this.metrics.lastError,
      uptime: this.redis ? this.redis.status : 'disconnected'
    };
  }

  /**
   * Health check for Redis connection
   * @returns {Promise<Object>} Health status
   */
  async health() {
    try {
      if (!this.redis) {
        return { status: 'down', reason: 'not_initialized' };
      }

      const start = Date.now();
      await this.redis.ping();
      const latency = Date.now() - start;

      return {
        status: 'up',
        latency: `${latency}ms`,
        connected: this.isConnected,
        stats: this.getStats()
      };
    } catch (error) {
      return {
        status: 'down',
        reason: error.message,
        connected: false
      };
    }
  }

  /**
   * Graceful shutdown
   */
  async close() {
    if (this.redis) {
      try {
        await this.redis.quit();
        console.log('✅ Redis cache connection closed gracefully');
      } catch (error) {
        console.error('Error closing Redis connection:', error.message);
        this.redis.disconnect();
      }
    }
  }
}

module.exports = RedisCache;