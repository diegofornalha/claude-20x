#!/usr/bin/env node
/**
 * A2A Test Runner - Automated Testing for A2A System
 * Usage: node run-a2a-tests.js [options]
 */

const A2ATestFramework = require('./A2ATestFramework.cjs');
const { spawn } = require('child_process');
const fs = require('fs').promises;

class A2ATestRunner {
  constructor() {
    this.config = {
      testEndpoints: [
        'http://localhost:8130', // agent_cards
        'http://localhost:8131', // components  
        'http://localhost:8132', // utils
      ],
      servers: [],
      verbose: process.argv.includes('--verbose'),
      coverage: process.argv.includes('--coverage'),
      loadTest: process.argv.includes('--load'),
      ciMode: process.env.CI === 'true'
    };
  }

  async startTestServers() {
    console.log('🚀 Starting A2A test servers...');
    
    const serverConfigs = [
      { name: 'agent_cards', port: 8130, path: './ui/agent_cards/a2a-server.js' },
      { name: 'components', port: 8131, path: './ui/components/a2a-server.js' },
      { name: 'utils', port: 8132, path: './ui/utils/a2a-server.js' }
    ];

    for (const config of serverConfigs) {
      try {
        // Check if server file exists
        await fs.access(config.path);
        
        const server = spawn('node', [config.path], {
          env: { ...process.env, A2A_PORT: config.port },
          stdio: this.config.verbose ? 'inherit' : 'pipe'
        });

        server.on('error', (error) => {
          console.warn(`⚠️  Failed to start ${config.name}: ${error.message}`);
        });

        this.config.servers.push({ process: server, ...config });
        
        // Wait for server to start
        await this.waitForServer(`http://localhost:${config.port}`, 5000);
        console.log(`✅ ${config.name} server started on port ${config.port}`);
        
      } catch (error) {
        console.warn(`⚠️  Skipping ${config.name}: ${error.message}`);
        // Remove from test endpoints if server can't start
        this.config.testEndpoints = this.config.testEndpoints.filter(
          endpoint => !endpoint.includes(config.port.toString())
        );
      }
    }

    if (this.config.testEndpoints.length === 0) {
      throw new Error('No A2A servers available for testing');
    }

    console.log(`📡 ${this.config.testEndpoints.length} test endpoints ready`);
  }

  async waitForServer(url, timeout = 5000) {
    const start = Date.now();
    
    while (Date.now() - start < timeout) {
      try {
        const response = await fetch(`${url}/health`);
        if (response.ok) return;
      } catch (error) {
        // Server not ready yet
      }
      
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    throw new Error(`Server at ${url} did not start within ${timeout}ms`);
  }

  async stopTestServers() {
    console.log('🛑 Stopping test servers...');
    
    for (const server of this.config.servers) {
      if (server.process) {
        server.process.kill('SIGTERM');
      }
    }

    // Wait for graceful shutdown
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  async runBaseTests() {
    console.log('\n🧪 Running A2A Base Tests...');
    
    const testFramework = new A2ATestFramework({
      endpoints: this.config.testEndpoints,
      verbose: this.config.verbose,
      timeout: 10000
    });

    return await testFramework.run();
  }

  async runPerformanceTests() {
    console.log('\n⚡ Running Performance Tests...');
    
    const results = {
      cachePerformance: {},
      loadTest: {}
    };

    for (const endpoint of this.config.testEndpoints) {
      // Cache performance test
      const testFramework = new A2ATestFramework({ endpoints: [endpoint] });
      const cacheResults = await testFramework.testCachePerformance(endpoint);
      results.cachePerformance[endpoint] = cacheResults;

      console.log(`📊 Cache improvement for ${endpoint}: ${Math.round(cacheResults.improvement * 100)}%`);

      // Load test (if enabled)
      if (this.config.loadTest) {
        const loadResults = await testFramework.loadTest(
          'Endpoint Load Test',
          () => testFramework.httpRequest({
            hostname: 'localhost',
            port: new URL(endpoint).port,
            path: '/discover',
            method: 'GET'
          }),
          50, // 50 concurrent users
          30000 // for 30 seconds
        );

        results.loadTest[endpoint] = loadResults;
        console.log(`🚀 Load test for ${endpoint}: ${Math.round(loadResults.requestsPerSecond)} req/sec`);
      }
    }

    return results;
  }

  async runIntegrationTests() {
    console.log('\n🔗 Running Integration Tests...');
    
    const results = {
      agentDiscovery: {},
      crossAgentCommunication: {}
    };

    // Test agent discovery
    for (const endpoint of this.config.testEndpoints) {
      try {
        const response = await fetch(`${endpoint}/agents`);
        if (response.ok) {
          const data = await response.json();
          results.agentDiscovery[endpoint] = {
            status: 'success',
            agentCount: data.agents ? data.agents.length : 0
          };
        }
      } catch (error) {
        results.agentDiscovery[endpoint] = {
          status: 'failed',
          error: error.message
        };
      }
    }

    return results;
  }

  async generateReport(baseResults, perfResults, integrationResults) {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalTests: baseResults.total,
        passed: baseResults.passed,
        failed: baseResults.failed,
        successRate: Math.round((baseResults.passed / baseResults.total) * 100),
        duration: Math.round(baseResults.endTime - baseResults.startTime)
      },
      endpoints: this.config.testEndpoints,
      performance: perfResults,
      integration: integrationResults,
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        ci: this.config.ciMode
      }
    };

    // Save report to file
    const reportPath = `./tests/reports/a2a-test-report-${Date.now()}.json`;
    await fs.mkdir('./tests/reports', { recursive: true });
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));

    console.log(`\n📄 Test report saved: ${reportPath}`);
    return report;
  }

  async run() {
    let baseResults, perfResults, integrationResults;

    try {
      await this.startTestServers();

      // Run test suites
      baseResults = await this.runBaseTests();
      perfResults = await this.runPerformanceTests();
      integrationResults = await this.runIntegrationTests();

      // Generate comprehensive report
      const report = await this.generateReport(baseResults, perfResults, integrationResults);

      // Print summary
      console.log('\n🎯 A2A Test Suite Summary');
      console.log('=' .repeat(40));
      console.log(`Tests: ${report.summary.totalTests}`);
      console.log(`✅ Passed: ${report.summary.passed}`);
      console.log(`❌ Failed: ${report.summary.failed}`);
      console.log(`📈 Success Rate: ${report.summary.successRate}%`);
      console.log(`⏱️  Duration: ${report.summary.duration}ms`);

      // Exit with appropriate code
      const exitCode = report.summary.failed > 0 ? 1 : 0;
      process.exit(exitCode);

    } catch (error) {
      console.error(`❌ Test suite failed: ${error.message}`);
      process.exit(1);
      
    } finally {
      await this.stopTestServers();
    }
  }
}

// CLI Usage
if (require.main === module) {
  const runner = new A2ATestRunner();
  
  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\n🛑 Received SIGINT, shutting down...');
    await runner.stopTestServers();
    process.exit(0);
  });

  runner.run().catch(error => {
    console.error('💥 Unhandled error:', error);
    process.exit(1);
  });
}

module.exports = A2ATestRunner;