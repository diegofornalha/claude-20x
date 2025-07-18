/**
 * BaseA2AServer - Unified A2A Protocol Server Implementation
 * Eliminates code duplication across multiple a2a-server.js files
 * 
 * Features:
 * - Standardized A2A Protocol endpoints (/discover, /communicate, /delegate, /health)
 * - Configurable port and agent injection
 * - Built-in CORS and security headers
 * - Redis cache with connection pooling for performance optimization
 * - Advanced caching middleware with intelligent TTL management
 * - Response compression and cache warming
 * - Comprehensive logging and monitoring
 */

const express = require('express');
const compression = require('compression');
const fs = require('fs').promises;
const path = require('path');
const RedisCache = require('./RedisCache');
const CacheMiddleware = require('./CacheMiddleware');

class BaseA2AServer {
  /**
   * Create a new A2A Server instance
   * @param {Object} agent - Agent instance implementing A2A protocol methods
   * @param {number|null} port - Server port (defaults to env var or 8080)
   * @param {Object} options - Configuration options
   * @param {boolean} options.enableCache - Enable Redis caching (default: true)
   * @param {string} options.corsOrigin - CORS origin setting (default: '*')
   * @param {number} options.cacheTTL - Cache TTL in seconds (default: 300)
   * @param {boolean} options.enableLogging - Enable request logging (default: true)
   * @param {string} options.agentCardPath - Path to agent.json file (default: '.well-known/agent.json')
   * @param {boolean} options.enableCompression - Enable gzip compression (default: true)
   * @param {boolean} options.enableCacheWarmup - Enable cache warmup on startup (default: true)
   * @param {Object} options.redis - Redis configuration options
   */
  constructor(agent, port = null, options = {}) {
    if (!agent) {
      throw new Error('Agent instance is required');
    }

    this.agent = agent;
    this.port = port || process.env.A2A_PORT || 8080;
    this.options = {
      enableCache: true,
      corsOrigin: '*',
      cacheTTL: 300, // 5 minutes in seconds
      enableLogging: true,
      agentCardPath: '.well-known/agent.json',
      enableCompression: true,
      enableCacheWarmup: true,
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_PASSWORD || null,
        db: process.env.REDIS_DB || 0,
        ...options.redis
      },
      ...options
    };

    // Initialize Redis cache and middleware
    this.redisCache = null;
    this.cacheMiddleware = null;
    this.server = null;
    this.isShuttingDown = false;
    
    // Performance metrics
    this.metrics = {
      requests: 0,
      errors: 0,
      startTime: Date.now()
    };

    this.app = express();
    this.initializeCache();
    this.setupMiddleware();
    this.setupRoutes();
    this.setupGracefulShutdown();
  }

  /**
   * Initialize Redis cache and middleware
   */
  async initializeCache() {
    if (this.options.enableCache) {
      try {
        this.redisCache = new RedisCache(this.options.redis);
        this.cacheMiddleware = new CacheMiddleware(this.redisCache);
        console.log('🚀 Redis cache initialized with connection pooling');
      } catch (error) {
        console.warn('⚠️ Failed to initialize Redis cache:', error.message);
        console.log('🔄 Server will continue without caching');
      }
    }
  }

  /**
   * Setup Express middleware
   */
  setupMiddleware() {
    // Compression middleware
    if (this.options.enableCompression) {
      this.app.use(compression({
        threshold: 1024, // Only compress responses above 1KB
        level: 6, // Compression level (1-9)
        memLevel: 8 // Memory usage level (1-9)
      }));
    }

    // JSON parsing with increased limit
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Performance and security headers
    this.app.use((req, res, next) => {
      // CORS headers
      res.header('Access-Control-Allow-Origin', this.options.corsOrigin);
      res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-A2A-Protocol');
      
      // A2A Protocol and performance headers
      res.header('X-A2A-Protocol', '1.0');
      res.header('X-Powered-By', 'BaseA2AServer/2.0');
      res.header('X-Content-Type-Options', 'nosniff');
      res.header('X-Frame-Options', 'DENY');
      res.header('X-XSS-Protection', '1; mode=block');
      
      // Handle preflight requests
      if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
      }
      
      next();
    });

    // Request metrics and logging
    this.app.use((req, res, next) => {
      const startTime = Date.now();
      this.metrics.requests++;

      // Enhanced logging
      if (this.options.enableLogging) {
        const timestamp = new Date().toISOString();
        const userAgent = req.get('User-Agent') || 'Unknown';
        console.log(`[${timestamp}] ${req.method} ${req.path} - ${req.ip} - ${userAgent}`);
      }

      // Track response time
      res.on('finish', () => {
        const duration = Date.now() - startTime;
        res.set('X-Response-Time', `${duration}ms`);
        
        if (duration > 1000) {
          console.warn(`⚠️ Slow response: ${req.method} ${req.path} took ${duration}ms`);
        }
      });

      next();
    });

    // Error handling middleware
    this.app.use((error, req, res, next) => {
      console.error('Server error:', error);
      this.metrics.errors++;
      
      res.status(500).json({ 
        error: 'Internal server error',
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] || 'unknown'
      });
    });
  }

  /**
   * Setup A2A Protocol routes
   */
  setupRoutes() {
    // A2A Protocol Core Endpoints with Caching
    
    // Discovery endpoint - returns agent capabilities (with cache)
    this.app.get('/discover', 
      this.cacheMiddleware ? this.cacheMiddleware.cacheDiscovery() : (req, res, next) => next(),
      async (req, res) => {
        try {
          const discovery = await this.agent.discover();
          res.json(discovery);
        } catch (error) {
          console.error('Discovery error:', error);
          this.metrics.errors++;
          res.status(500).json({ error: 'Discovery failed' });
        }
      }
    );

    // Communication endpoint - direct agent interaction (no cache for dynamic content)
    this.app.post('/communicate', async (req, res) => {
      try {
        const response = await this.agent.communicate(req.body);
        res.json(response);
      } catch (error) {
        console.error('Communication error:', error);
        this.metrics.errors++;
        res.status(500).json({ error: 'Communication failed' });
      }
    });

    // Delegation endpoint - task delegation (no cache for dynamic content)
    this.app.post('/delegate', async (req, res) => {
      try {
        const result = await this.agent.delegate(req.body);
        res.json(result);
      } catch (error) {
        console.error('Delegation error:', error);
        this.metrics.errors++;
        res.status(500).json({ error: 'Delegation failed' });
      }
    });

    // Health endpoint - agent status check (with cache)
    this.app.get('/health',
      this.cacheMiddleware ? this.cacheMiddleware.cacheHealth() : (req, res, next) => next(),
      async (req, res) => {
        try {
          const health = await this.agent.health();
          
          // Add cache and server health info
          if (this.redisCache) {
            const cacheHealth = await this.redisCache.health();
            health.cache = cacheHealth;
          }
          
          health.server = {
            uptime: Math.floor(process.uptime()),
            memory: process.memoryUsage(),
            pid: process.pid
          };
          
          res.json(health);
        } catch (error) {
          console.error('Health check error:', error);
          this.metrics.errors++;
          res.status(500).json({ 
            error: 'Health check failed',
            status: 'unhealthy',
            timestamp: new Date().toISOString()
          });
        }
      }
    );

    // Agent Card endpoint with Redis caching
    this.app.get('/agent.json',
      this.cacheMiddleware ? this.cacheMiddleware.cache({ ttl: this.options.cacheTTL, keyPrefix: 'agent-card' }) : (req, res, next) => next(),
      async (req, res) => {
        try {
          const agentCardPath = path.resolve(this.options.agentCardPath);
          const agentCard = await fs.readFile(agentCardPath, 'utf-8');
          const parsed = JSON.parse(agentCard);
          
          res.set('Cache-Control', `public, max-age=${this.options.cacheTTL}`);
          res.json(parsed);
        } catch (error) {
          console.error('Agent card error:', error);
          this.metrics.errors++;
          res.status(404).json({ 
            error: 'Agent card not found',
            path: this.options.agentCardPath
          });
        }
      }
    );

    // Cache Management Endpoints
    
    // Cache statistics endpoint
    this.app.get('/cache/stats', async (req, res) => {
      try {
        if (!this.cacheMiddleware || !this.redisCache) {
          return res.json({ error: 'Cache not enabled' });
        }

        const cacheStats = this.cacheMiddleware.getStats();
        const redisHealth = await this.redisCache.health();
        
        res.json({
          cache: cacheStats,
          redis: redisHealth,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error('Cache stats error:', error);
        res.status(500).json({ error: 'Failed to get cache stats' });
      }
    });

    // Cache invalidation endpoint
    this.app.post('/cache/invalidate', async (req, res) => {
      try {
        if (!this.cacheMiddleware) {
          return res.status(400).json({ error: 'Cache not enabled' });
        }

        const { pattern = 'all' } = req.body;
        const invalidated = await this.cacheMiddleware.invalidate(pattern);
        
        res.json({
          success: true,
          pattern,
          invalidated,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error('Cache invalidation error:', error);
        res.status(500).json({ error: 'Cache invalidation failed' });
      }
    });

    // Cache warmup endpoint
    this.app.post('/cache/warmup', async (req, res) => {
      try {
        if (!this.cacheMiddleware) {
          return res.status(400).json({ error: 'Cache not enabled' });
        }

        const success = await this.cacheMiddleware.warmupCache(this.agent);
        
        res.json({
          success,
          message: success ? 'Cache warmed up successfully' : 'Cache warmup failed',
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error('Cache warmup error:', error);
        res.status(500).json({ error: 'Cache warmup failed' });
      }
    });

    // Performance metrics endpoint
    this.app.get('/metrics', (req, res) => {
      const uptime = Math.floor((Date.now() - this.metrics.startTime) / 1000);
      const memoryUsage = process.memoryUsage();
      
      res.json({
        server: {
          uptime,
          requests: this.metrics.requests,
          errors: this.metrics.errors,
          errorRate: this.metrics.requests > 0 ? (this.metrics.errors / this.metrics.requests * 100).toFixed(2) + '%' : '0%',
          memory: {
            rss: Math.round(memoryUsage.rss / 1024 / 1024) + 'MB',
            heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024) + 'MB',
            heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024) + 'MB'
          }
        },
        cache: this.cacheMiddleware ? this.cacheMiddleware.getStats() : null,
        timestamp: new Date().toISOString()
      });
    });

    // Server info endpoint
    this.app.get('/info', (req, res) => {
      res.json({
        server: 'BaseA2AServer',
        version: '2.0.0',
        agent: this.agent.name || 'Unknown',
        port: this.port,
        protocol: 'A2A/1.0',
        features: {
          redis_cache: !!this.redisCache,
          compression: this.options.enableCompression,
          cache_warmup: this.options.enableCacheWarmup
        },
        endpoints: {
          core: ['/discover', '/communicate', '/delegate', '/health', '/agent.json'],
          cache: ['/cache/stats', '/cache/invalidate', '/cache/warmup'],
          monitoring: ['/metrics', '/info']
        },
        uptime: Math.floor(process.uptime()),
        timestamp: new Date().toISOString()
      });
    });

    // Root endpoint
    this.app.get('/', (req, res) => {
      res.json({
        message: `A2A Server for ${this.agent.name || 'Agent'}`,
        protocol: 'A2A/1.0',
        version: '2.0.0',
        features: {
          redis_cache: !!this.redisCache,
          compression: this.options.enableCompression,
          performance_monitoring: true
        },
        endpoints: {
          // Core A2A Protocol
          discover: '/discover',
          communicate: '/communicate', 
          delegate: '/delegate',
          health: '/health',
          agentCard: '/agent.json',
          
          // Cache Management
          cacheStats: '/cache/stats',
          cacheInvalidate: '/cache/invalidate',
          cacheWarmup: '/cache/warmup',
          
          // Monitoring
          metrics: '/metrics',
          info: '/info'
        },
        documentation: 'https://github.com/your-repo/a2a-protocol'
      });
    });
  }

  /**
   * Start the server
   * @param {Function} callback - Optional callback when server starts
   */
  start(callback) {
    this.app.listen(this.port, () => {
      const agentName = this.agent.name || 'Agent';
      console.log(`🤖 A2A Server for ${agentName} running on port ${this.port}`);
      console.log(`📋 A2A Protocol Endpoints:`);
      console.log(`   Discovery: http://localhost:${this.port}/discover`);
      console.log(`   Communicate: http://localhost:${this.port}/communicate`);
      console.log(`   Delegate: http://localhost:${this.port}/delegate`);
      console.log(`   Health: http://localhost:${this.port}/health`);
      console.log(`   Agent Card: http://localhost:${this.port}/agent.json`);
      console.log(`   Server Info: http://localhost:${this.port}/info`);
      
      if (callback) callback();
    });
  }

  /**
   * Stop the server gracefully
   */
  stop() {
    if (this.server) {
      this.server.close();
      console.log(`🛑 A2A Server for ${this.agent.name || 'Agent'} stopped`);
    }
  }

  /**
   * Clear agent card cache
   */
  clearCache() {
    this.agentCardCache = null;
    this.agentCardCacheTime = 0;
    console.log('Agent card cache cleared');
  }

  /**
   * Get server statistics
   */
  getStats() {
    return {
      agent: this.agent.name || 'Unknown',
      port: this.port,
      cacheEnabled: this.options.enableCache,
      cacheHit: this.agentCardCache !== null,
      cacheAge: this.agentCardCacheTime ? Date.now() - this.agentCardCacheTime : 0,
      uptime: process.uptime()
    };
  }
}

module.exports = BaseA2AServer;