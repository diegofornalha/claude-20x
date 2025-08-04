#!/usr/bin/env python3
"""Test communication with HelloWorld agent"""

import httpx
import json

# Test the agent card endpoint
print("📋 Fetching agent card...")
response = httpx.get("http://localhost:9999/.well-known/agent.json")
if response.status_code == 200:
    print("✅ Agent card retrieved successfully")
    agent_card = response.json()
    print(f"   Agent Name: {agent_card['name']}")
    print(f"   Version: {agent_card['version']}")
else:
    print(f"❌ Failed to get agent card: {response.status_code}")

# Test task submission
print("\n📬 Testing task submission...")
task_data = {
    "context_id": "test-context-123",
    "skill_id": "hello_world",
    "input": {
        "parts": [
            {
                "text": {
                    "text": "Hello from test script!"
                }
            }
        ]
    }
}

response = httpx.post(
    "http://localhost:9999/task/submit",
    json=task_data,
    headers={"Content-Type": "application/json"}
)

if response.status_code == 200:
    print("✅ Task submitted successfully")
    result = response.json()
    print(f"   Task ID: {result.get('task_id', 'N/A')}")
    print(f"   Status: {result.get('status', 'N/A')}")
    if 'output' in result:
        print(f"   Response: {result['output']['parts'][0]['text']['text']}")
else:
    print(f"❌ Failed to submit task: {response.status_code}")
    print(f"   Response: {response.text}")

print("\n✨ Test completed!")