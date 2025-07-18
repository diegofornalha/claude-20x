/**
 * CacheMiddleware - Advanced Cache Middleware for A2A Endpoints
 * 
 * Features:
 * - Endpoint-specific caching strategies
 * - Intelligent cache invalidation
 * - Response compression
 * - Cache warming and preloading
 * - Request fingerprinting for cache keys
 */

const crypto = require('crypto');

class CacheMiddleware {
  /**
   * Create cache middleware instance
   * @param {RedisCache} redisCache - Redis cache instance
   * @param {Object} options - Middleware options
   */
  constructor(redisCache, options = {}) {
    this.cache = redisCache;
    this.options = {
      enableCompression: true,
      cacheKeyPrefix: 'endpoint:',
      includeHeaders: ['x-a2a-protocol', 'user-agent'],
      excludeFromCache: [],
      warmupEndpoints: ['/discover', '/health'],
      maxCacheSize: '50mb',
      ...options
    };

    this.cacheStats = {
      requests: 0,
      cacheHits: 0,
      cacheMisses: 0,
      errors: 0
    };
  }

  /**
   * Generate cache key for request
   * @param {Object} req - Express request object
   * @returns {string} Cache key
   */
  generateCacheKey(req) {
    const baseKey = `${this.options.cacheKeyPrefix}${req.path}`;
    
    // Include query parameters in cache key
    const queryString = Object.keys(req.query)
      .sort()
      .map(key => `${key}=${req.query[key]}`)
      .join('&');

    // Include specific headers for cache fingerprinting
    const headerString = this.options.includeHeaders
      .map(header => req.get(header) || '')
      .join('|');

    // Create hash for complex cache keys
    const keyContent = `${baseKey}?${queryString}|${headerString}`;
    return crypto.createHash('md5').update(keyContent).digest('hex');
  }

  /**
   * Check if endpoint should be cached
   * @param {string} path - Request path
   * @returns {boolean} Should cache
   */
  shouldCache(path) {
    return !this.options.excludeFromCache.some(pattern => 
      path.match(new RegExp(pattern))
    );
  }

  /**
   * Get TTL for specific endpoint
   * @param {string} path - Request path
   * @returns {number} TTL in seconds
   */
  getTTLForPath(path) {
    switch (path) {
      case '/discover':
        return 60; // 1 minute
      case '/health':
        return 30; // 30 seconds
      case '/agent.json':
        return 600; // 10 minutes
      default:
        return 300; // 5 minutes
    }
  }

  /**
   * Cache middleware for discovery endpoint
   * @returns {Function} Express middleware
   */
  cacheDiscovery() {
    return async (req, res, next) => {
      if (!this.shouldCache(req.path)) {
        return next();
      }

      const cacheKey = `discovery:${this.generateCacheKey(req)}`;
      this.cacheStats.requests++;

      try {
        // Try to get from cache
        const cached = await this.cache.get(cacheKey);
        if (cached) {
          this.cacheStats.cacheHits++;
          res.set('X-Cache', 'HIT');
          res.set('X-Cache-Key', cacheKey);
          return res.json(cached);
        }

        // Cache miss - continue to next middleware
        this.cacheStats.cacheMisses++;
        res.set('X-Cache', 'MISS');
        res.set('X-Cache-Key', cacheKey);

        // Override res.json to cache response
        const originalJson = res.json;
        res.json = async function(data) {
          // Cache the response
          await this.cache.set(cacheKey, data, this.getTTLForPath(req.path));
          res.set('X-Cache-Stored', 'true');
          return originalJson.call(this, data);
        }.bind(this);

        next();
      } catch (error) {
        console.error('Cache middleware error:', error);
        this.cacheStats.errors++;
        next();
      }
    };
  }

  /**
   * Cache middleware for health endpoint
   * @returns {Function} Express middleware
   */
  cacheHealth() {
    return async (req, res, next) => {
      if (!this.shouldCache(req.path)) {
        return next();
      }

      const cacheKey = `health:${this.generateCacheKey(req)}`;
      this.cacheStats.requests++;

      try {
        // For health endpoint, we might want fresher data
        const cached = await this.cache.get(cacheKey);
        if (cached) {
          // Add cache age to health response
          const cacheAge = Math.floor((Date.now() - new Date(cached.timestamp)) / 1000);
          if (cacheAge < this.getTTLForPath(req.path)) {
            this.cacheStats.cacheHits++;
            res.set('X-Cache', 'HIT');
            res.set('X-Cache-Age', cacheAge.toString());
            cached.cacheAge = cacheAge;
            return res.json(cached);
          }
        }

        this.cacheStats.cacheMisses++;
        res.set('X-Cache', 'MISS');

        // Override res.json to cache response
        const originalJson = res.json;
        res.json = async function(data) {
          // Add timestamp for cache age calculation
          const dataWithTimestamp = {
            ...data,
            timestamp: new Date().toISOString()
          };
          
          await this.cache.set(cacheKey, dataWithTimestamp, this.getTTLForPath(req.path));
          res.set('X-Cache-Stored', 'true');
          return originalJson.call(this, data);
        }.bind(this);

        next();
      } catch (error) {
        console.error('Health cache middleware error:', error);
        this.cacheStats.errors++;
        next();
      }
    };
  }

  /**
   * Generic cache middleware for any endpoint
   * @param {Object} options - Endpoint-specific options
   * @returns {Function} Express middleware
   */
  cache(options = {}) {
    const endpointOptions = {
      ttl: 300,
      keyPrefix: 'generic',
      ...options
    };

    return async (req, res, next) => {
      if (!this.shouldCache(req.path)) {
        return next();
      }

      const cacheKey = `${endpointOptions.keyPrefix}:${this.generateCacheKey(req)}`;
      this.cacheStats.requests++;

      try {
        const cached = await this.cache.get(cacheKey);
        if (cached) {
          this.cacheStats.cacheHits++;
          res.set('X-Cache', 'HIT');
          res.set('X-Cache-Key', cacheKey);
          return res.json(cached);
        }

        this.cacheStats.cacheMisses++;
        res.set('X-Cache', 'MISS');

        const originalJson = res.json;
        res.json = async function(data) {
          await this.cache.set(cacheKey, data, endpointOptions.ttl);
          res.set('X-Cache-Stored', 'true');
          return originalJson.call(this, data);
        }.bind(this);

        next();
      } catch (error) {
        console.error('Generic cache middleware error:', error);
        this.cacheStats.errors++;
        next();
      }
    };
  }

  /**
   * Invalidate cache for specific patterns
   * @param {string} pattern - Cache key pattern
   * @returns {Promise<number>} Number of invalidated keys
   */
  async invalidate(pattern) {
    try {
      if (pattern === 'discovery') {
        // Invalidate all discovery cache
        return await this.cache.mdel(['discovery:*']);
      } else if (pattern === 'health') {
        // Invalidate all health cache
        return await this.cache.mdel(['health:*']);
      } else if (pattern === 'all') {
        // Clear entire cache
        return await this.cache.clear();
      }
      
      // Invalidate specific pattern
      return await this.cache.del(pattern);
    } catch (error) {
      console.error('Cache invalidation error:', error);
      return 0;
    }
  }

  /**
   * Warm up cache for critical endpoints
   * @param {Object} agent - Agent instance
   * @returns {Promise<boolean>} Success status
   */
  async warmupCache(agent) {
    try {
      console.log('🔥 Warming up cache for critical endpoints...');
      
      const warmupResults = await Promise.allSettled([
        this.warmupDiscovery(agent),
        this.warmupHealth(agent)
      ]);

      const successful = warmupResults.filter(result => result.status === 'fulfilled').length;
      console.log(`✅ Cache warmup completed: ${successful}/${warmupResults.length} endpoints`);
      
      return successful === warmupResults.length;
    } catch (error) {
      console.error('Cache warmup error:', error);
      return false;
    }
  }

  /**
   * Warm up discovery endpoint cache
   * @param {Object} agent - Agent instance
   */
  async warmupDiscovery(agent) {
    try {
      const discovery = await agent.discover();
      const cacheKey = 'discovery:warmup';
      await this.cache.set(cacheKey, discovery, this.getTTLForPath('/discover'));
      console.log('🔥 Discovery cache warmed up');
    } catch (error) {
      console.error('Discovery warmup error:', error);
    }
  }

  /**
   * Warm up health endpoint cache
   * @param {Object} agent - Agent instance
   */
  async warmupHealth(agent) {
    try {
      const health = await agent.health();
      const cacheKey = 'health:warmup';
      await this.cache.set(cacheKey, health, this.getTTLForPath('/health'));
      console.log('🔥 Health cache warmed up');
    } catch (error) {
      console.error('Health warmup error:', error);
    }
  }

  /**
   * Get cache middleware statistics
   * @returns {Object} Cache stats
   */
  getStats() {
    const hitRate = this.cacheStats.requests > 0 
      ? (this.cacheStats.cacheHits / this.cacheStats.requests * 100).toFixed(2)
      : 0;

    return {
      requests: this.cacheStats.requests,
      hits: this.cacheStats.cacheHits,
      misses: this.cacheStats.cacheMisses,
      errors: this.cacheStats.errors,
      hitRate: `${hitRate}%`,
      redisStats: this.cache.getStats()
    };
  }

  /**
   * Reset cache statistics
   */
  resetStats() {
    this.cacheStats = {
      requests: 0,
      cacheHits: 0,
      cacheMisses: 0,
      errors: 0
    };
  }
}

module.exports = CacheMiddleware;