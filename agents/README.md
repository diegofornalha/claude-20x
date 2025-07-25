# A2A Agent Registry

## 🤖 Available Agents

This directory contains all A2A-compliant agents with their respective agent cards for automatic discovery and interoperability.

### 🎯 Agent Overview

| Agent | Type | Port | Status | Capabilities |
|-------|------|------|--------|------------|
| **a2a-estudo** | Coordinator | 8887 | ✅ Active | Discovery, Routing, Orchestration |
| **helloworld** | Demo | 9999 | ✅ Active | Greeting, Demo, Basic Tasks |
| **marvin** | Extractor | 10030 | ✅ Active | Contact Extraction, Structured Data |
| **gemini** | AI Assistant | 8886 | 🔧 Configured | Code Generation, Analysis |
| **a2a-python** | SDK | 8080 | 📚 Framework | A2A Protocol Implementation |

### 🔍 Agent Discovery

All agents implement the A2A Protocol discovery mechanism via:
```
GET /.well-known/agent.json
```

### 🚀 Quick Start

#### 1. Validate All Agent Cards
```bash
cd /Users/agents/Desktop/claude-20x/agents
python agent_card_validator.py
```

#### 2. Start Individual Agents

**A2A Coordinator (a2a-estudo):**
```bash
cd a2a-estudo
# Start coordinator agent (implementation needed)
```

**HelloWorld Agent:**
```bash
cd helloworld
python app.py
# Access: http://localhost:9999
```

**Marvin Extractor:**
```bash
cd marvin
python server.py
# Access: http://localhost:10030
```

**Gemini Assistant:**
```bash
cd gemini
# Configure GEMINI_API_KEY environment variable
python agent.py
# Access: http://localhost:8886
```

### 📋 Agent Card Structure

Each agent follows the A2A Protocol specification:

```json
{
  "@context": "https://a2aprotocol.ai/context/agent.json",
  "id": "unique_agent_id",
  "name": "Agent Name",
  "description": "Agent description",
  "version": "1.0.0",
  "protocol_version": "1.0",
  "capabilities": {
    "discovery": true,
    "communication": true,
    "cooperation": true,
    "real_time": true
  },
  "endpoints": {
    "base_url": "http://localhost:PORT",
    "discovery": "/.well-known/agent.json",
    "communicate": "/communicate",
    "delegate": "/delegate",
    "health": "/health"
  },
  "skills": [...],
  "interoperability": {...},
  "security": {...},
  "metadata": {...}
}
```

### 🧠 Neural Discovery Optimization

The system includes neural patterns for optimized agent discovery:

- **Capability Weighting**: Prioritizes important capabilities for faster discovery
- **Discovery Caching**: Caches agent information for improved performance  
- **Pattern Recognition**: Learns from agent interactions to optimize routing
- **Performance Metrics**: Tracks discovery time, validation scores, and accuracy

### 🔄 Coordination Patterns

The A2A system supports multiple coordination patterns:

- **Sequential**: Tasks executed in order
- **Parallel**: Simultaneous task execution
- **Conditional**: Logic-based task routing
- **Pipeline**: Dependent task chains

### 🛠️ Agent Development

#### Creating a New Agent

1. **Create Agent Directory**:
```bash
mkdir new-agent
cd new-agent
```

2. **Create Agent Card**:
```bash
mkdir .well-known
# Create .well-known/agent.json following the A2A specification
```

3. **Implement Agent Logic**:
```python
# Implement your agent following A2A patterns
# Ensure endpoints match those declared in agent.json
```

4. **Validate Agent Card**:
```bash
cd /Users/agents/Desktop/claude-20x/agents
python agent_card_validator.py
```

### 📊 Monitoring & Health

#### Agent Health Monitoring

All agents provide health endpoints:
```bash
curl http://localhost:PORT/health
```

#### System Status
```bash
# Check all agent status
python agent_card_validator.py

# Detailed validation report available at:
# agent_validation_report.json
```

### 🔗 Integration Examples

#### Agent-to-Agent Communication

```python
import asyncio
import aiohttp

async def communicate_with_agent(agent_url, message):
    async with aiohttp.ClientSession() as session:
        async with session.post(f"{agent_url}/communicate", 
                              json={"message": message}) as response:
            return await response.json()

# Example: Send message to HelloWorld agent
result = await communicate_with_agent("http://localhost:9999", "Hello!")
```

#### Multi-Agent Coordination

```python
# Via A2A Coordinator
async def coordinate_multi_agent_task(task_description):
    coordinator_url = "http://localhost:8887"
    async with aiohttp.ClientSession() as session:
        async with session.post(f"{coordinator_url}/coordinate",
                              json={"task": task_description}) as response:
            return await response.json()

# Example: Coordinate data extraction and analysis
result = await coordinate_multi_agent_task("Extract contacts from document and analyze patterns")
```

### 🛡️ Security Considerations

- **Authentication**: Agents support various auth methods (none, api_key, oauth2)
- **Rate Limiting**: All agents implement rate limiting for protection
- **CORS**: Configurable cross-origin resource sharing
- **Input Validation**: All inputs validated against schemas

### 📈 Performance Metrics

The system tracks:
- **Discovery Time**: Average time to discover agents
- **Validation Score**: Agent card compliance rating
- **Response Time**: Average response time per agent
- **Availability**: Agent uptime and health status
- **Neural Optimization**: AI-driven performance improvements

### 🔧 Troubleshooting

#### Common Issues

1. **Agent Not Discoverable**:
   - Check if `.well-known/agent.json` exists
   - Validate JSON syntax
   - Ensure agent is running on declared port

2. **Validation Failures**:
   - Run `python agent_card_validator.py` for detailed errors
   - Check required fields in agent card
   - Verify endpoint URLs match implementation

3. **Connectivity Issues**:
   - Confirm agent is listening on correct port
   - Check firewall settings
   - Validate endpoint implementations

#### Debug Commands

```bash
# Validate specific agent
python -c "
import asyncio
from agent_card_validator import A2AAgentCardValidator
validator = A2AAgentCardValidator()
result = asyncio.run(validator.validate_agent_card(Path('helloworld')))
print(result)
"

# Test agent connectivity
curl -v http://localhost:9999/.well-known/agent.json
curl -v http://localhost:9999/health
```

### 📚 Documentation

- **A2A Protocol**: https://a2aproject.github.io/A2A/
- **Python SDK**: https://github.com/a2aproject/a2a-python
- **Agent Samples**: https://github.com/a2aproject/a2a-samples

### 🤝 Contributing

1. Follow A2A Protocol specifications
2. Validate agent cards before submission
3. Include comprehensive tests
4. Document all capabilities and endpoints
5. Ensure neural optimization compatibility

---

**🚀 The A2A Agent Registry enables seamless agent discovery and coordination with neural-optimized performance!**