/**
 * A2A Server for components
 * Implements Agent2Agent Protocol endpoints
 */

const express = require('express');
const ComponentsAgent = require('./agents/components_agent');

class A2AServer {
  constructor() {
    this.app = express();
    this.port = process.env.A2A_PORT || 8149;
    this.agent = new ComponentsAgent();
    
    this.setupMiddleware();
    this.setupRoutes();
  }

  setupMiddleware() {
    this.app.use(express.json());
    this.app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('X-A2A-Protocol', '1.0');
      next();
    });
  }

  setupRoutes() {
    // A2A Protocol Endpoints
    this.app.get('/discover', async (req, res) => {
      const discovery = await this.agent.discover();
      res.json(discovery);
    });

    this.app.post('/communicate', async (req, res) => {
      const response = await this.agent.communicate(req.body);
      res.json(response);
    });

    this.app.post('/delegate', async (req, res) => {
      const result = await this.agent.delegate(req.body);
      res.json(result);
    });

    this.app.get('/health', async (req, res) => {
      const health = await this.agent.health();
      res.json(health);
    });

    // Agent Card endpoint
    this.app.get('/agent.json', async (req, res) => {
      const fs = require('fs').promises;
      const path = require('path');
      
      try {
        const agentCard = await fs.readFile(
          path.join(__dirname, '.well-known', 'agent.json'), 
          'utf-8'
        );
        res.json(JSON.parse(agentCard));
      } catch (error) {
        res.status(404).json({ error: 'Agent card not found' });
      }
    });
  }

  start() {
    this.app.listen(this.port, () => {
      console.log(`🤖 A2A Server for ${this.agent.name} running on port ${this.port}`);
      console.log(`📋 Endpoints:`);
      console.log(`   Discovery: http://localhost:${this.port}/discover`);
      console.log(`   Health: http://localhost:${this.port}/health`);
    });
  }
}

// Start server if run directly
if (require.main === module) {
  const server = new A2AServer();
  server.start();
}

module.exports = A2AServer;