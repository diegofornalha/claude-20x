#!/usr/bin/env python3
"""
Quick A2A Server Test

Simple script to quickly test if the A2A server is working.
"""

import sys
import os
import asyncio
import signal
import subprocess
import time
from contextlib import asynccontextmanager

# Add src to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

from server import A2AServer


class QuickTester:
    """Quick test runner for A2A server."""
    
    def __init__(self):
        self.server_process = None
        self.port = 8889  # Use different port for testing
    
    async def start_test_server(self):
        """Start server in background for testing."""
        print("🚀 Starting test server...")
        
        server = A2AServer(port=self.port)
        
        # Start server in background task
        server_task = asyncio.create_task(server.start())
        
        # Wait a moment for server to start
        await asyncio.sleep(2)
        
        return server_task
    
    async def test_endpoints(self):
        """Test all server endpoints quickly."""
        import httpx
        
        base_url = f"http://localhost:{self.port}"
        
        async with httpx.AsyncClient() as client:
            # Test health
            print("🏥 Testing health endpoint...")
            try:
                response = await client.get(f"{base_url}/health")
                if response.status_code == 200:
                    print("✅ Health endpoint working")
                else:
                    print(f"❌ Health endpoint failed: {response.status_code}")
                    return False
            except Exception as e:
                print(f"❌ Health endpoint error: {e}")
                return False
            
            # Test agent card
            print("🎯 Testing agent card endpoint...")
            try:
                response = await client.get(f"{base_url}/.well-known/agent.json")
                if response.status_code == 200:
                    data = response.json()
                    print(f"✅ Agent card working: {data.get('name')}")
                else:
                    print(f"❌ Agent card failed: {response.status_code}")
                    return False
            except Exception as e:
                print(f"❌ Agent card error: {e}")
                return False
            
            # Test communicate endpoint
            print("💬 Testing communicate endpoint...")
            try:
                payload = {
                    "jsonrpc": "2.0",
                    "method": "ping",
                    "params": {},
                    "id": "quick-test"
                }
                
                response = await client.post(
                    f"{base_url}/communicate",
                    json=payload
                )
                
                if response.status_code == 200:
                    print("✅ Communicate endpoint working")
                else:
                    print(f"❌ Communicate endpoint failed: {response.status_code}")
                    return False
            except Exception as e:
                print(f"❌ Communicate endpoint error: {e}")
                return False
        
        return True
    
    async def run_quick_test(self):
        """Run the complete quick test."""
        print("🧪 Running A2A Server Quick Test")
        print("=" * 40)
        
        server_task = None
        
        try:
            # Start server
            server_task = await self.start_test_server()
            
            # Run tests
            success = await self.test_endpoints()
            
            if success:
                print("\n🎉 All tests passed! Server is working correctly.")
                return True
            else:
                print("\n❌ Some tests failed. Check the implementation.")
                return False
                
        except Exception as e:
            print(f"💥 Test failed with error: {e}")
            return False
            
        finally:
            # Cleanup
            if server_task:
                server_task.cancel()
                try:
                    await server_task
                except asyncio.CancelledError:
                    pass
            print("🧹 Test cleanup completed")


async def main():
    """Main quick test runner."""
    tester = QuickTester()
    
    try:
        success = await tester.run_quick_test()
        sys.exit(0 if success else 1)
        
    except KeyboardInterrupt:
        print("\n🛑 Test interrupted by user")
        sys.exit(1)


if __name__ == "__main__":
    # Handle SIGINT gracefully
    def signal_handler(signum, frame):
        print("\n🛑 Stopping test...")
        sys.exit(0)
    
    signal.signal(signal.SIGINT, signal_handler)
    
    asyncio.run(main())