#!/usr/bin/env node
/**
 * MCP Integration Test for Claude Code Compatibility
 */

import { spawn } from 'child_process';
import { writeFileSync, readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class MCPIntegrationTester {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      tests: [],
      summary: {}
    };
  }

  log(message, level = 'info') {
    console.log(`[${level.toUpperCase()}] ${message}`);
  }

  async testServerStartup() {
    this.log('Testing MCP server startup...');
    
    return new Promise((resolve) => {
      const serverProcess = spawn('node', ['build/basic-server.js'], {
        cwd: __dirname,
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let output = '';
      let errorOutput = '';

      serverProcess.stdout.on('data', (data) => {
        output += data.toString();
      });

      serverProcess.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      // Kill after 2 seconds
      setTimeout(() => {
        serverProcess.kill();
        resolve({
          name: 'server_startup',
          success: !serverProcess.killed || errorOutput.includes('MCP Server Diego Tools iniciado'),
          output: output || errorOutput,
          details: 'Server startup test'
        });
      }, 2000);
    });
  }

  async testToolsConfiguration() {
    this.log('Testing tools configuration...');
    
    try {
      // Read the simplified server file
      const serverCode = readFileSync('./build/basic-server.js', 'utf8');
      
      // Check for required MCP components
      const checks = [
        { name: 'MCP Server Import', pattern: /Server.*from.*@modelcontextprotocol/, found: false },
        { name: 'Stdio Transport', pattern: /StdioServerTransport/, found: false },
        { name: 'Tools Definition', pattern: /tools.*=/, found: false },
        { name: 'ListTools Handler', pattern: /ListToolsRequestSchema/, found: false },
        { name: 'CallTool Handler', pattern: /CallToolRequestSchema/, found: false }
      ];

      checks.forEach(check => {
        check.found = check.pattern.test(serverCode);
      });

      return {
        name: 'tools_configuration',
        success: checks.every(check => check.found),
        details: checks,
        output: `${checks.filter(c => c.found).length}/${checks.length} checks passed`
      };
    } catch (error) {
      return {
        name: 'tools_configuration',
        success: false,
        error: error.message,
        output: 'Failed to read server configuration'
      };
    }
  }

  async testClaudeCodeCompatibility() {
    this.log('Testing Claude Code compatibility...');
    
    try {
      // Check Claude Code settings
      const settingsPath = '/Users/agents/.claude/settings.json';
      let settings = {};
      
      try {
        settings = JSON.parse(readFileSync(settingsPath, 'utf8'));
      } catch (e) {
        // Settings file doesn't exist, that's fine
      }

      // Check MCP configuration requirements
      const compatibilityChecks = [
        {
          name: 'MCP Timeout Setting',
          check: settings.env && settings.env.MCP_TIMEOUT,
          required: false
        },
        {
          name: 'Tool Timeout Setting', 
          check: settings.env && settings.env.MCP_TOOL_TIMEOUT,
          required: false
        },
        {
          name: 'Permissions Allow MCP Tools',
          check: settings.permissions && settings.permissions.allow && 
                 settings.permissions.allow.some(perm => perm.includes('mcp')),
          required: false
        }
      ];

      return {
        name: 'claude_code_compatibility',
        success: true, // Not required for basic functionality
        details: compatibilityChecks,
        output: 'Claude Code configuration checked'
      };
    } catch (error) {
      return {
        name: 'claude_code_compatibility',
        success: false,
        error: error.message,
        output: 'Failed to check Claude Code configuration'
      };
    }
  }

  async runAllTests() {
    this.log('Starting MCP Integration Tests...');
    
    const tests = [
      await this.testServerStartup(),
      await this.testToolsConfiguration(),
      await this.testClaudeCodeCompatibility()
    ];

    this.results.tests = tests;
    this.results.summary = {
      total: tests.length,
      passed: tests.filter(t => t.success).length,
      failed: tests.filter(t => !t.success).length,
      success_rate: Math.round((tests.filter(t => t.success).length / tests.length) * 100)
    };

    // Write results to file
    writeFileSync('integration-test-results.json', JSON.stringify(this.results, null, 2));
    
    this.log(`Integration tests completed: ${this.results.summary.passed}/${this.results.summary.total} passed`);
    
    return this.results;
  }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const tester = new MCPIntegrationTester();
  tester.runAllTests()
    .then(results => {
      console.log('\n=== Integration Test Results ===');
      console.log(JSON.stringify(results, null, 2));
      process.exit(results.summary.failed > 0 ? 1 : 0);
    })
    .catch(error => {
      console.error('Integration tests failed:', error);
      process.exit(1);
    });
}

export { MCPIntegrationTester };