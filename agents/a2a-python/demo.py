#!/usr/bin/env python3
"""
A2A Python Server Demo

Quick demonstration of the A2A server capabilities.
"""

import asyncio
import sys
import os
import httpx
from contextlib import asynccontextmanager

# Add src to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

from server import A2AServer


async def demo_server():
    """Demonstrate A2A server functionality."""
    print("🚀 A2A Python Server Demo")
    print("=" * 40)
    
    # Create server
    server = A2AServer(port=8890)  # Use port 8890 for demo
    print(f"✅ Server created: {server.agent_card.name}")
    print(f"🌐 URL: {server.agent_card.url}")
    
    # Start server in background
    server_task = asyncio.create_task(server.start())
    await asyncio.sleep(2)  # Wait for server to start
    
    try:
        # Test client
        async with httpx.AsyncClient() as client:
            base_url = f"http://localhost:8890"
            
            print("\n🏥 Testing health endpoint...")
            health = await client.get(f"{base_url}/health")
            health_data = health.json()
            print(f"   Status: {health_data['status']}")
            
            print("\n🎯 Testing agent card...")
            card = await client.get(f"{base_url}/.well-known/agent.json")
            card_data = card.json()
            print(f"   Agent: {card_data['name']}")
            print(f"   Skills: {len(card_data['skills'])}")
            
            print("\n💬 Testing communication...")
            
            # Test ping
            ping_request = {
                "jsonrpc": "2.0",
                "method": "ping",
                "params": {},
                "id": "demo-ping"
            }
            
            ping_response = await client.post(
                f"{base_url}/communicate",
                json=ping_request
            )
            ping_data = ping_response.json()
            print(f"   Ping: {ping_data['result']['message']}")
            
            # Test task
            task_request = {
                "jsonrpc": "2.0",
                "method": "tasks/send",
                "params": {
                    "task": {
                        "type": "text_generation",
                        "content": "Generate a greeting message"
                    }
                },
                "id": "demo-task"
            }
            
            task_response = await client.post(
                f"{base_url}/communicate",
                json=task_request
            )
            task_data = task_response.json()
            print(f"   Task: {task_data['result']['status']}")
            print(f"   Task ID: {task_data['result']['task_id']}")
        
        print("\n✅ All tests passed!")
        print("\n🎉 A2A Python Server is fully operational!")
        print("\nTo start the server manually:")
        print("  ./start_server.sh")
        print("\nTo run comprehensive tests:")
        print("  python test_server.py")
        
    except Exception as e:
        print(f"❌ Demo failed: {e}")
    finally:
        # Stop server
        server_task.cancel()
        try:
            await server_task
        except asyncio.CancelledError:
            pass
        print("\n🧹 Demo completed")


if __name__ == "__main__":
    try:
        asyncio.run(demo_server())
    except KeyboardInterrupt:
        print("\n🛑 Demo interrupted")
    except Exception as e:
        print(f"💥 Demo error: {e}")
        sys.exit(1)