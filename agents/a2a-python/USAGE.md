# A2A Python Server - Usage Guide

## 🚀 Quick Start (3 Steps)

### 1. Start the Server
```bash
./start_server.sh
```

### 2. Test the Server
```bash
python test_server.py
```

### 3. Use the Server
```bash
curl http://localhost:8888/health
```

## 📋 Available Files

| File | Purpose |
|------|---------|
| `server.py` | Main A2A server implementation |
| `start_server.sh` | Easy startup script |
| `test_server.py` | Comprehensive test client |
| `quick_test.py` | Fast validation test |
| `Dockerfile` | Container image definition |
| `docker-compose.yml` | Container orchestration |
| `README_SERVER.md` | Detailed documentation |
| `USAGE.md` | This usage guide |

## 🌐 Server Endpoints

### Health Check
```bash
curl http://localhost:8888/health
```

### Agent Discovery
```bash
curl http://localhost:8888/.well-known/agent.json
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
        "content": "Hello, A2A!"
      }
    },
    "id": "1"
  }'
```

## 🐳 Docker Usage

### Build and Run
```bash
docker build -t a2a-server .
docker run -p 8888:8888 a2a-server
```

### Using Docker Compose
```bash
docker-compose up -d
```

## 🔧 Advanced Configuration

### Custom Port
```bash
./start_server.sh --port 9000
```

### Debug Mode
```bash
./start_server.sh --debug
```

### Environment Variables
```bash
export A2A_PORT=8888
export A2A_HOST=0.0.0.0
export A2A_LOG_LEVEL=INFO
python server.py
```

## 🧪 Testing Options

### Quick Test (Fast)
```bash
python quick_test.py
```

### Full Test Suite
```bash
python test_server.py
```

### JSON Output
```bash
python test_server.py --json
```

## 🔗 Integration Examples

### Python Client
```python
import httpx
import asyncio

async def call_a2a_server():
    async with httpx.AsyncClient() as client:
        # Health check
        health = await client.get("http://localhost:8888/health")
        print(health.json())
        
        # Send task
        task = {
            "jsonrpc": "2.0",
            "method": "tasks/send",
            "params": {"task": {"type": "ping"}},
            "id": "1"
        }
        response = await client.post("http://localhost:8888/communicate", json=task)
        print(response.json())
```

### JavaScript Client
```javascript
// Health check
fetch('http://localhost:8888/health')
  .then(response => response.json())
  .then(data => console.log(data));

// Send task
fetch('http://localhost:8888/communicate', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({
    jsonrpc: '2.0',
    method: 'tasks/send',
    params: {task: {type: 'text_generation', content: 'Hello!'}},
    id: '1'
  })
}).then(response => response.json())
  .then(data => console.log(data));
```

## 🚨 Troubleshooting

### Common Issues

1. **Port 8888 in use**
   ```bash
   ./start_server.sh --port 9000
   ```

2. **Import errors**
   ```bash
   pip install -e .
   ```

3. **Permission denied**
   ```bash
   chmod +x start_server.sh
   ```

### Debug Commands
```bash
# Check if server is running
curl -f http://localhost:8888/health || echo "Server not running"

# Check process
ps aux | grep server.py

# Check logs
./start_server.sh --debug
```

## ⚡ Performance Tips

1. **Use uvicorn workers for production**:
   ```bash
   uvicorn server:app --workers 4 --host 0.0.0.0 --port 8888
   ```

2. **Enable HTTP/2**:
   ```bash
   uvicorn server:app --http h2
   ```

3. **Add reverse proxy** (nginx/traefik) for SSL termination

## 🔐 Security Notes

- The server runs on all interfaces (0.0.0.0) by default
- No authentication is implemented (add as needed)
- For production, use HTTPS with proper certificates
- Consider rate limiting for public deployments

## 📊 Monitoring

### Health Endpoint
- URL: `GET /health`
- Returns: Server status, version, timestamp
- Use for: Load balancer health checks, monitoring systems

### Metrics (Future)
- Task execution metrics
- Response time tracking
- Error rate monitoring
- Resource utilization

Ready to run! 🎉