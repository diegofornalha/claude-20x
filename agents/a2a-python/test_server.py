#!/usr/bin/env python3
"""
A2A Python Server Test Client

Test script to validate the A2A server implementation.
"""

import asyncio
import json
import sys
from typing import Dict, Any

import httpx


class A2AServerTester:
    """Test client for A2A server endpoints."""
    
    def __init__(self, base_url: str = "http://localhost:8888"):
        self.base_url = base_url
        self.client = httpx.AsyncClient()
    
    async def test_health(self) -> Dict[str, Any]:
        """Test the health endpoint."""
        print("🏥 Testing health endpoint...")
        try:
            response = await self.client.get(f"{self.base_url}/health")
            response.raise_for_status()
            result = response.json()
            print(f"✅ Health check passed: {result['status']}")
            return result
        except Exception as e:
            print(f"❌ Health check failed: {e}")
            return {"error": str(e)}
    
    async def test_agent_card(self) -> Dict[str, Any]:
        """Test the agent card discovery endpoint."""
        print("🎯 Testing agent card endpoint...")
        try:
            response = await self.client.get(f"{self.base_url}/.well-known/agent.json")
            response.raise_for_status()
            result = response.json()
            print(f"✅ Agent card retrieved: {result['name']}")
            return result
        except Exception as e:
            print(f"❌ Agent card failed: {e}")
            return {"error": str(e)}
    
    async def test_communicate_ping(self) -> Dict[str, Any]:
        """Test basic JSON-RPC communication."""
        print("💬 Testing communicate endpoint (ping)...")
        try:
            payload = {
                "jsonrpc": "2.0",
                "method": "ping",
                "params": {},
                "id": "test-ping-1"
            }
            
            response = await self.client.post(
                f"{self.base_url}/communicate",
                json=payload,
                headers={"Content-Type": "application/json"}
            )
            response.raise_for_status()
            result = response.json()
            print(f"✅ Ping successful: {result.get('result', 'OK')}")
            return result
        except Exception as e:
            print(f"❌ Ping failed: {e}")
            return {"error": str(e)}
    
    async def test_communicate_task_send(self) -> Dict[str, Any]:
        """Test task sending via JSON-RPC."""
        print("📋 Testing task send...")
        try:
            payload = {
                "jsonrpc": "2.0",
                "method": "tasks/send",
                "params": {
                    "task": {
                        "type": "text_generation",
                        "content": "Hello, A2A server! Please respond with a greeting.",
                        "max_tokens": 100
                    }
                },
                "id": "test-task-1"
            }
            
            response = await self.client.post(
                f"{self.base_url}/communicate",
                json=payload,
                headers={"Content-Type": "application/json"}
            )
            response.raise_for_status()
            result = response.json()
            print(f"✅ Task sent successfully")
            
            # Extract task ID if available
            if "result" in result and "task_id" in result["result"]:
                task_id = result["result"]["task_id"]
                print(f"📝 Task ID: {task_id}")
            
            return result
        except Exception as e:
            print(f"❌ Task send failed: {e}")
            return {"error": str(e)}
    
    async def test_error_handling(self) -> Dict[str, Any]:
        """Test error handling with invalid request."""
        print("🚨 Testing error handling...")
        try:
            payload = {
                "jsonrpc": "2.0",
                "method": "invalid_method",
                "params": {"invalid": "data"},
                "id": "test-error-1"
            }
            
            response = await self.client.post(
                f"{self.base_url}/communicate",
                json=payload,
                headers={"Content-Type": "application/json"}
            )
            
            result = response.json()
            if "error" in result:
                print(f"✅ Error handling working: {result['error']['message']}")
            else:
                print(f"⚠️  Expected error but got: {result}")
            
            return result
        except Exception as e:
            print(f"❌ Error handling test failed: {e}")
            return {"error": str(e)}
    
    async def run_all_tests(self) -> Dict[str, Any]:
        """Run all tests and return results."""
        print(f"🧪 Starting A2A Server Tests")
        print(f"🌐 Base URL: {self.base_url}")
        print("=" * 50)
        
        results = {}
        
        # Test health endpoint
        results["health"] = await self.test_health()
        print()
        
        # Test agent card
        results["agent_card"] = await self.test_agent_card()
        print()
        
        # Test basic communication
        results["ping"] = await self.test_communicate_ping()
        print()
        
        # Test task sending
        results["task_send"] = await self.test_communicate_task_send()
        print()
        
        # Test error handling
        results["error_handling"] = await self.test_error_handling()
        print()
        
        # Summary
        print("=" * 50)
        passed = sum(1 for r in results.values() if "error" not in r)
        total = len(results)
        print(f"📊 Tests passed: {passed}/{total}")
        
        if passed == total:
            print("🎉 All tests passed! Server is working correctly.")
        else:
            print("⚠️  Some tests failed. Check the server logs.")
        
        return results
    
    async def close(self):
        """Close the HTTP client."""
        await self.client.aclose()


async def main():
    """Main test runner."""
    import argparse
    
    parser = argparse.ArgumentParser(description="A2A Server Test Client")
    parser.add_argument("--url", default="http://localhost:8888", help="Server base URL")
    parser.add_argument("--json", action="store_true", help="Output results as JSON")
    
    args = parser.parse_args()
    
    tester = A2AServerTester(args.url)
    
    try:
        results = await tester.run_all_tests()
        
        if args.json:
            print(json.dumps(results, indent=2))
        
    except KeyboardInterrupt:
        print("\n🛑 Tests interrupted by user")
    except Exception as e:
        print(f"💥 Test runner failed: {e}")
        sys.exit(1)
    finally:
        await tester.close()


if __name__ == "__main__":
    asyncio.run(main())