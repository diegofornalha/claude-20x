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

# Test communication via UI endpoint
print("\n📬 Testing communication through UI...")
# First, create a conversation
conv_data = {
    "jsonrpc": "2.0",
    "method": "conversation/create",
    "params": {},
    "id": "test-123"
}

response = httpx.post(
    "http://localhost:12000/conversation/create",
    json=conv_data,
    headers={"Content-Type": "application/json"}
)

if response.status_code == 200:
    conv_result = response.json()
    conversation_id = conv_result.get("result", {}).get("conversation_id")
    print(f"✅ Conversation created: {conversation_id}")
    
    # Now send a message
    msg_data = {
        "jsonrpc": "2.0",
        "method": "message/send",
        "params": {
            "conversation_id": conversation_id,
            "message": "Hello from test script!",
            "target_agent": "Hello World Agent"
        },
        "id": "test-456"
    }
    
    response = httpx.post(
        "http://localhost:12000/message/send",
        json=msg_data,
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