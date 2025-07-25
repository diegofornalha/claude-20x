# A2A Python Server

An executable A2A (Agent-to-Agent) protocol server implementation using the a2a-python library.

## Features

- **A2A Protocol Compliant**: Implements all required endpoints
- **JSON-RPC 2.0**: Standard communication protocol
- **FastAPI Backend**: High-performance async web framework
- **Health Monitoring**: Built-in health check endpoint
- **Agent Discovery**: Automatic agent card serving
- **Task Management**: In-memory task store with management
- **Production Ready**: Proper logging, error handling, and configuration

## Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check and server status |
| `/.well-known/agent.json` | GET | Agent card discovery |
| `/communicate` | POST | Main JSON-RPC 2.0 communication endpoint |

## Quick Start

### 1. Using the startup script (Recommended)

```bash
# Start server on default port 8888
./start_server.sh

# Start on custom port
./start_server.sh --port 9000

# Start with debug logging
./start_server.sh --debug

# Show help
./start_server.sh --help
```

### 2. Direct Python execution

```bash
# Install dependencies
pip install -e .
pip install uvicorn[standard]

# Start server
python server.py

# Custom port
python server.py --port 9000

# Debug mode
python server.py --debug
```

## Usage Examples

### Health Check

```bash
curl http://localhost:8888/health
```

Response:
```json
{
  "status": "healthy",
  "server": "A2A Python Server", 
  "version": "1.0.0",
  "timestamp": 1642678800.123
}
```

### Agent Card Discovery

```bash
curl http://localhost:8888/.well-known/agent.json
```

Response:
```json
{
  "name": "A2A Python Server",
  "description": "A2A Protocol implementation server in Python",
  "version": "1.0.0",
  "capabilities": {
    "textGeneration": true,
    "taskExecution": true,
    "streaming": true,
    "notifications": true
  },
  "endpoints": {
    "communicate": {
      "method": "POST",
      "path": "/communicate",
      "description": "Main JSON-RPC 2.0 communication endpoint"
    }
  }
}
```

### JSON-RPC Communication

```bash
curl -X POST http://localhost:8888/communicate \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tasks/send",
    "params": {
      "task": {
        "type": "text_generation",
        "content": "Hello, A2A server!"
      }
    },
    "id": "1"
  }'
```

## Configuration

### Environment Variables

- `A2A_PORT`: Server port (default: 8888)
- `A2A_HOST`: Server host (default: 0.0.0.0)
- `A2A_LOG_LEVEL`: Logging level (default: INFO)

### Command Line Options

- `--port PORT`: Server port
- `--debug`: Enable debug logging
- `--help`: Show help message

## Architecture

```
A2A Server
├── FastAPI Application (server.py)
├── A2A Protocol Implementation
│   ├── AgentCard (capabilities definition)
│   ├── RequestHandler (JSON-RPC processing)
│   ├── TaskManager (task lifecycle)
│   └── TaskStore (in-memory storage)
├── Endpoints
│   ├── /health (health check)
│   ├── /.well-known/agent.json (discovery)
│   └── /communicate (main protocol)
└── Utilities
    ├── Logging & Error Handling
    ├── Context Building
    └── Response Generation
```

## Development

### Running Tests

```bash
# Install test dependencies
pip install -e .[dev]

# Run tests
pytest

# Run with coverage
pytest --cov=src/a2a
```

### Docker Support

```dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY . .

RUN pip install -e .
RUN pip install uvicorn[standard]

EXPOSE 8888

CMD ["python", "server.py"]
```

## Integration

### As a Library

```python
from server import A2AServer

# Create server instance
server = A2AServer(port=8888)

# Start server
import asyncio
asyncio.run(server.start())
```

### With Custom Handler

Extend the `DefaultRequestHandler` to implement custom task processing:

```python
from a2a.server.request_handlers.default_request_handler import DefaultRequestHandler
from a2a.types import A2ARequest, A2AResponse

class CustomRequestHandler(DefaultRequestHandler):
    async def handle_request(self, request: A2ARequest, context=None) -> A2AResponse:
        # Custom processing logic
        return await super().handle_request(request, context)
```

## Troubleshooting

### Common Issues

1. **Port already in use**: Change port with `--port` option
2. **Import errors**: Ensure `pip install -e .` was run
3. **Permission errors**: Check file permissions for startup script

### Debug Mode

Enable debug logging to see detailed request/response information:

```bash
./start_server.sh --debug
```

## Registry Integration

This server is configured to run on port 8888 (registry port) by default, making it compatible with A2A agent registries and discovery systems.

## License

Apache-2.0 - See LICENSE file for details