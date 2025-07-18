/**
 * A2A Test Framework - Comprehensive Testing Suite
 * Tests for optimized A2A system components
 */

const assert = require('assert');
const http = require('http');
const { performance } = require('perf_hooks');

class A2ATestFramework {
  constructor(config = {}) {
    this.config = {
      timeout: config.timeout || 10000,
      retries: config.retries || 3,
      parallel: config.parallel !== false,
      verbose: config.verbose || false,
      endpoints: config.endpoints || [],
      ...config
    };

    this.testResults = {
      passed: 0,
      failed: 0,
      skipped: 0,
      total: 0,
      suites: {},
      startTime: null,
      endTime: null
    };

    this.currentSuite = null;
  }

  // Test Suite Management
  describe(suiteName, testFunction) {
    this.currentSuite = suiteName;
    this.testResults.suites[suiteName] = {
      tests: [],
      passed: 0,
      failed: 0,
      startTime: performance.now()
    };

    if (this.config.verbose) {
      console.log(`\n🧪 Running test suite: ${suiteName}`);
    }

    testFunction();

    this.testResults.suites[suiteName].endTime = performance.now();
    this.testResults.suites[suiteName].duration = 
      this.testResults.suites[suiteName].endTime - this.testResults.suites[suiteName].startTime;
  }

  // Individual Test Runner
  async it(testName, testFunction) {
    this.testResults.total++;
    const startTime = performance.now();

    try {
      await this.runWithTimeout(testFunction, this.config.timeout);
      
      this.testResults.passed++;
      this.testResults.suites[this.currentSuite].passed++;
      this.testResults.suites[this.currentSuite].tests.push({
        name: testName,
        status: 'passed',
        duration: performance.now() - startTime
      });

      if (this.config.verbose) {
        console.log(`  ✅ ${testName} (${Math.round(performance.now() - startTime)}ms)`);
      }
    } catch (error) {
      this.testResults.failed++;
      this.testResults.suites[this.currentSuite].failed++;
      this.testResults.suites[this.currentSuite].tests.push({
        name: testName,
        status: 'failed',
        error: error.message,
        duration: performance.now() - startTime
      });

      console.error(`  ❌ ${testName}: ${error.message}`);
    }
  }

  // Timeout wrapper
  runWithTimeout(fn, timeout) {
    return Promise.race([
      fn(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error(`Test timeout: ${timeout}ms`)), timeout)
      )
    ]);
  }

  // HTTP Request Helper
  async httpRequest(options) {
    return new Promise((resolve, reject) => {
      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const json = data ? JSON.parse(data) : {};
            resolve({ status: res.statusCode, headers: res.headers, data: json });
          } catch (e) {
            resolve({ status: res.statusCode, headers: res.headers, data });
          }
        });
      });

      req.on('error', reject);
      req.setTimeout(this.config.timeout, () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });

      if (options.body) {
        req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
      }
      req.end();
    });
  }

  // A2A Protocol Tests
  async testA2AEndpoint(baseUrl, endpoint, expectedFields = []) {
    const response = await this.httpRequest({
      hostname: 'localhost',
      port: new URL(baseUrl).port,
      path: endpoint,
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    assert.strictEqual(response.status, 200, `Expected 200, got ${response.status}`);
    assert(response.data, 'Response should have data');
    
    expectedFields.forEach(field => {
      assert(response.data.hasOwnProperty(field), `Response should have field: ${field}`);
    });

    return response;
  }

  // Performance Test
  async performanceTest(testName, testFunction, iterations = 100) {
    const times = [];
    
    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      await testFunction();
      times.push(performance.now() - start);
    }

    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    const min = Math.min(...times);
    const max = Math.max(...times);

    return { avg, min, max, iterations, testName };
  }

  // Load Test
  async loadTest(testName, testFunction, concurrency = 10, duration = 30000) {
    const results = {
      requests: 0,
      errors: 0,
      avgResponseTime: 0,
      maxResponseTime: 0,
      startTime: Date.now()
    };

    const workers = [];
    const endTime = Date.now() + duration;

    for (let i = 0; i < concurrency; i++) {
      workers.push(this.loadTestWorker(testFunction, endTime, results));
    }

    await Promise.all(workers);
    
    results.duration = Date.now() - results.startTime;
    results.requestsPerSecond = results.requests / (results.duration / 1000);
    
    return results;
  }

  async loadTestWorker(testFunction, endTime, results) {
    while (Date.now() < endTime) {
      const start = performance.now();
      try {
        await testFunction();
        const responseTime = performance.now() - start;
        results.avgResponseTime = (results.avgResponseTime * results.requests + responseTime) / (results.requests + 1);
        results.maxResponseTime = Math.max(results.maxResponseTime, responseTime);
        results.requests++;
      } catch (error) {
        results.errors++;
      }
    }
  }

  // Cache Test Utilities
  async testCachePerformance(baseUrl) {
    // First request (cache miss)
    const miss = await this.performanceTest(
      'Cache Miss',
      () => this.httpRequest({
        hostname: 'localhost',
        port: new URL(baseUrl).port,
        path: '/discover',
        method: 'GET'
      }),
      10
    );

    // Second request (cache hit)
    const hit = await this.performanceTest(
      'Cache Hit',
      () => this.httpRequest({
        hostname: 'localhost',
        port: new URL(baseUrl).port,
        path: '/discover',
        method: 'GET'
      }),
      10
    );

    return { miss, hit, improvement: miss.avg / hit.avg };
  }

  // Generate Test Report
  generateReport() {
    const duration = this.testResults.endTime - this.testResults.startTime;
    
    console.log('\n📊 A2A Test Framework Results');
    console.log('=' .repeat(50));
    console.log(`Total Tests: ${this.testResults.total}`);
    console.log(`✅ Passed: ${this.testResults.passed}`);
    console.log(`❌ Failed: ${this.testResults.failed}`);
    console.log(`⏱️  Duration: ${Math.round(duration)}ms`);
    console.log(`📈 Success Rate: ${Math.round((this.testResults.passed / this.testResults.total) * 100)}%`);

    console.log('\n📋 Test Suites:');
    Object.entries(this.testResults.suites).forEach(([name, suite]) => {
      console.log(`  ${name}: ${suite.passed}/${suite.tests.length} passed (${Math.round(suite.duration)}ms)`);
    });

    return this.testResults;
  }

  // Main Test Runner
  async run() {
    this.testResults.startTime = performance.now();

    // Base A2A Server Tests
    this.describe('BaseA2AServer Core Tests', () => {
      this.it('Should respond to health endpoint', async () => {
        for (const endpoint of this.config.endpoints) {
          const response = await this.testA2AEndpoint(endpoint, '/health', ['server_status', 'timestamp']);
          assert(response.data.server_status, 'Health check should return status');
        }
      });

      this.it('Should respond to discovery endpoint', async () => {
        for (const endpoint of this.config.endpoints) {
          const response = await this.testA2AEndpoint(endpoint, '/discover', ['timestamp']);
          assert(response.headers['x-a2a-protocol'], 'Should have A2A protocol header');
        }
      });

      this.it('Should respond to status endpoint', async () => {
        for (const endpoint of this.config.endpoints) {
          const response = await this.testA2AEndpoint(endpoint, '/status', ['agent_name', 'protocol_version']);
        }
      });
    });

    // Cache Performance Tests
    this.describe('Cache Performance Tests', () => {
      this.it('Should improve performance with caching', async () => {
        for (const endpoint of this.config.endpoints) {
          const cacheResults = await this.testCachePerformance(endpoint);
          assert(cacheResults.improvement > 1.5, 'Cache should improve performance by at least 50%');
        }
      });

      this.it('Should have cache statistics endpoint', async () => {
        for (const endpoint of this.config.endpoints) {
          const response = await this.testA2AEndpoint(endpoint, '/cache/stats', ['cache_stats']);
        }
      });
    });

    // A2A Protocol Compliance Tests
    this.describe('A2A Protocol Compliance', () => {
      this.it('Should have required A2A headers', async () => {
        for (const endpoint of this.config.endpoints) {
          const response = await this.httpRequest({
            hostname: 'localhost',
            port: new URL(endpoint).port,
            path: '/discover',
            method: 'GET'
          });
          
          assert(response.headers['x-a2a-protocol'], 'Missing X-A2A-Protocol header');
          assert.strictEqual(response.headers['x-a2a-protocol'], '1.0', 'Wrong protocol version');
        }
      });

      this.it('Should support CORS', async () => {
        for (const endpoint of this.config.endpoints) {
          const response = await this.httpRequest({
            hostname: 'localhost',
            port: new URL(endpoint).port,
            path: '/discover',
            method: 'OPTIONS'
          });
          
          assert(response.headers['access-control-allow-origin'], 'Missing CORS headers');
        }
      });
    });

    // Load Tests
    this.describe('Load Tests', () => {
      this.it('Should handle concurrent discovery requests', async () => {
        for (const endpoint of this.config.endpoints) {
          const loadResults = await this.loadTest(
            'Discovery Load Test',
            () => this.httpRequest({
              hostname: 'localhost',
              port: new URL(endpoint).port,
              path: '/discover',
              method: 'GET'
            }),
            20, // 20 concurrent requests
            10000 // for 10 seconds
          );

          assert(loadResults.requestsPerSecond > 50, 'Should handle at least 50 req/sec');
          assert(loadResults.errors / loadResults.requests < 0.01, 'Error rate should be < 1%');
        }
      });
    });

    this.testResults.endTime = performance.now();
    return this.generateReport();
  }
}

module.exports = A2ATestFramework;