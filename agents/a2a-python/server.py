#!/usr/bin/env python3
"""
A2A Python Server - Executable A2A Agent Implementation

This server implements the A2A (Agent-to-Agent) protocol endpoints:
- /health - Health check endpoint
- /.well-known/agent.json - Agent card discovery
- /communicate - Main JSON-RPC 2.0 communication endpoint

Built using the a2a-python library with FastAPI backend.
"""

import asyncio
import logging
import os
import sys
from typing import Any, Dict, Optional

import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse

# Add src to path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

from a2a.server.apps.jsonrpc.fastapi_app import A2AFastAPIApplication
from a2a.server.request_handlers.default_request_handler import DefaultRequestHandler
from a2a.types import AgentCard, A2ARequest
from a2a.server.tasks.inmemory_task_store import InMemoryTaskStore
from a2a.server.tasks.task_manager import TaskManager
from a2a.server.agent_execution.simple_request_context_builder import SimpleRequestContextBuilder

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class A2AServer:
    """A2A Server implementation with all required endpoints."""
    
    def __init__(self, port: int = 8888):
        self.port = port
        self.app = FastAPI(
            title="A2A Python Server",
            description="Agent-to-Agent Communication Server",
            version="1.0.0"
        )
        self.agent_card = self._create_agent_card()
        self.task_store = InMemoryTaskStore()
        # Create a simplified request handler without TaskManager for now
        self.task_manager = None
        self.request_handler = self._create_simple_handler()
        self.context_builder = SimpleRequestContextBuilder()
        
        # Initialize A2A FastAPI application
        self.a2a_app = A2AFastAPIApplication(
            agent_card=self.agent_card,
            http_handler=self.request_handler,
            context_builder=self.context_builder
        )
        
        self._setup_routes()
    
    def _create_agent_card(self) -> AgentCard:
        """Create the agent card describing this agent's capabilities."""
        from a2a.types import AgentSkill, AgentCapabilities
        
        return AgentCard(
            name="A2A Python Server",
            description="A2A Protocol implementation server in Python",
            version="1.0.0",
            url=f"http://localhost:{self.port}",
            defaultInputModes=["text"],
            defaultOutputModes=["text"],
            capabilities=AgentCapabilities(
                supportsHTTP=True,
                supportsWebSockets=False,
                supportsEventStreaming=True,
                supportsTaskQueuing=True
            ),
            skills=[
                AgentSkill(
                    id="text_processing",
                    name="text_processing",
                    description="Text processing and generation capabilities",
                    tags=["text", "nlp"],
                    inputModes=["text"],
                    outputModes=["text"]
                ),
                AgentSkill(
                    id="task_execution",
                    name="task_execution", 
                    description="General task execution capabilities",
                    tags=["tasks", "execution"],
                    inputModes=["text"],
                    outputModes=["text", "artifacts"]
                )
            ]
        )
    
    def _create_simple_handler(self):
        """Create a simple request handler for basic A2A communication."""
        class SimpleA2AHandler:
            async def handle_request(self, request, context=None):
                """Simple request handler that responds to basic A2A requests."""
                try:
                    # Extract method from request
                    if hasattr(request, 'method'):
                        method = request.method
                    elif isinstance(request, dict):
                        method = request.get('method', 'unknown')
                    else:
                        method = 'unknown'
                    
                    # Basic response based on method
                    if method == 'ping':
                        return {
                            "jsonrpc": "2.0",
                            "id": getattr(request, 'id', None) or request.get('id'),
                            "result": {"message": "pong", "server": "A2A Python Server"}
                        }
                    elif method.startswith('tasks/'):
                        return {
                            "jsonrpc": "2.0", 
                            "id": getattr(request, 'id', None) or request.get('id'),
                            "result": {
                                "task_id": f"task_{hash(str(request))}", 
                                "status": "received",
                                "message": f"Task received for method: {method}"
                            }
                        }
                    else:
                        return {
                            "jsonrpc": "2.0",
                            "id": getattr(request, 'id', None) or request.get('id'),
                            "result": {"message": f"Method {method} acknowledged", "server": "A2A Python Server"}
                        }
                        
                except Exception as e:
                    return {
                        "jsonrpc": "2.0",
                        "id": getattr(request, 'id', None) or (request.get('id') if isinstance(request, dict) else None),
                        "error": {
                            "code": -32000,
                            "message": f"Handler error: {str(e)}"
                        }
                    }
        
        return SimpleA2AHandler()
    
    def _setup_routes(self):
        """Setup all required A2A endpoints."""
        
        @self.app.get("/health")
        async def health_check():
            """Health check endpoint."""
            return JSONResponse({
                "status": "healthy",
                "server": "A2A Python Server",
                "version": "1.0.0",
                "timestamp": asyncio.get_event_loop().time()
            })
            
        @self.app.get("/.well-known/agent.json")
        async def get_agent_card():
            """Agent card discovery endpoint."""
            return JSONResponse(self.agent_card.model_dump())
            
        @self.app.post("/communicate")
        async def communicate(request: dict):
            """Main JSON-RPC 2.0 communication endpoint."""
            try:
                # Process through our simple handler (bypass strict A2ARequest validation)
                response = await self.request_handler.handle_request(
                    request,
                    context=self.context_builder.build_context() if self.context_builder else None
                )
                
                # Handle response format
                if hasattr(response, 'model_dump'):
                    return JSONResponse(response.model_dump())
                elif isinstance(response, dict):
                    return JSONResponse(response)
                else:
                    # Create basic JSON-RPC response
                    return JSONResponse({
                        "jsonrpc": "2.0",
                        "id": request.get("id"),
                        "result": str(response)
                    })
                
            except Exception as e:
                logger.error(f"Error processing request: {e}")
                # Return JSON-RPC 2.0 error response
                return JSONResponse({
                    "jsonrpc": "2.0",
                    "id": request.get("id"),
                    "error": {
                        "code": -32000,
                        "message": f"Server error: {str(e)}"
                    }
                }, status_code=500)
        
        # Mount A2A app for additional functionality
        # self.app.mount("/a2a", self.a2a_app.create_app())
    
    async def start(self):
        """Start the A2A server."""
        logger.info(f"Starting A2A Python Server on port {self.port}")
        logger.info(f"Health check: http://localhost:{self.port}/health")
        logger.info(f"Agent card: http://localhost:{self.port}/.well-known/agent.json")
        logger.info(f"Communicate: http://localhost:{self.port}/communicate")
        
        config = uvicorn.Config(
            self.app,
            host="0.0.0.0",
            port=self.port,
            log_level="info"
        )
        server = uvicorn.Server(config)
        await server.serve()


def main():
    """Main entry point."""
    import argparse
    
    parser = argparse.ArgumentParser(description="A2A Python Server")
    parser.add_argument("--port", type=int, default=8888, help="Server port (default: 8888)")
    parser.add_argument("--debug", action="store_true", help="Enable debug logging")
    
    args = parser.parse_args()
    
    if args.debug:
        logging.getLogger().setLevel(logging.DEBUG)
    
    server = A2AServer(port=args.port)
    
    try:
        asyncio.run(server.start())
    except KeyboardInterrupt:
        logger.info("Server stopped by user")
    except Exception as e:
        logger.error(f"Server error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()