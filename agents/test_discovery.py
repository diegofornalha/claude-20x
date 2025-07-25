#!/usr/bin/env python3
"""
A2A Agent Discovery Test Suite
Tests the discovery mechanism for all agent cards
"""

import asyncio
import aiohttp
import json
from pathlib import Path

class A2ADiscoveryTester:
    """Test A2A agent discovery endpoints"""
    
    def __init__(self):
        self.agents_dir = Path("/Users/agents/Desktop/claude-20x/agents")
        
    async def test_all_discovery_endpoints(self):
        """Test discovery endpoints for all agents"""
        print("🔍 Testing A2A Agent Discovery Endpoints...")
        print("=" * 50)
        
        # Load agent cards
        agent_cards = {}
        for agent_dir in self.agents_dir.iterdir():
            if agent_dir.is_dir():
                agent_card_path = agent_dir / ".well-known" / "agent.json"
                if agent_card_path.exists():
                    with open(agent_card_path, 'r') as f:
                        agent_cards[agent_dir.name] = json.load(f)
        
        print(f"Found {len(agent_cards)} agent cards to test")
        
        # Test each agent's discovery endpoint
        for agent_name, agent_card in agent_cards.items():
            await self.test_agent_discovery(agent_name, agent_card)
    
    async def test_agent_discovery(self, agent_name: str, agent_card: dict):
        """Test individual agent discovery"""
        base_url = agent_card.get("endpoints", {}).get("base_url", "")
        discovery_path = agent_card.get("endpoints", {}).get("discovery", "/.well-known/agent.json")
        
        print(f"\n🤖 Testing {agent_name}:")
        print(f"   Base URL: {base_url}")
        print(f"   Discovery: {discovery_path}")
        
        if not base_url:
            print("   ❌ No base URL configured")
            return
        
        discovery_url = f"{base_url.rstrip('/')}{discovery_path}"
        
        try:
            timeout = aiohttp.ClientTimeout(total=3)
            async with aiohttp.ClientSession(timeout=timeout) as session:
                async with session.get(discovery_url) as response:
                    if response.status == 200:
                        discovery_data = await response.json()
                        print(f"   ✅ Discovery successful (HTTP {response.status})")
                        print(f"   📋 Agent: {discovery_data.get('name', 'Unknown')}")
                        print(f"   🔧 Version: {discovery_data.get('version', 'Unknown')}")
                        print(f"   🎯 Capabilities: {len(discovery_data.get('capabilities', {}))}")
                        print(f"   🛠️  Skills: {len(discovery_data.get('skills', []))}")
                        
                        # Validate discovery data matches local card
                        if discovery_data.get('id') == agent_card.get('id'):
                            print("   ✅ Discovery data matches local agent card")
                        else:
                            print("   ⚠️  Discovery data differs from local agent card")
                            
                    else:
                        print(f"   ❌ Discovery failed (HTTP {response.status})")
                        
        except aiohttp.ClientConnectorError:
            print(f"   🔌 Agent not running or connection refused")
        except asyncio.TimeoutError:
            print(f"   ⏱️  Discovery timeout")
        except Exception as e:
            print(f"   ❌ Discovery error: {str(e)}")

    async def test_capability_matrix(self):
        """Test capability compatibility between agents"""
        print(f"\n🔄 Testing Agent Capability Matrix...")
        
        # Load all agent capabilities
        agent_capabilities = {}
        for agent_dir in self.agents_dir.iterdir():
            if agent_dir.is_dir():
                agent_card_path = agent_dir / ".well-known" / "agent.json"
                if agent_card_path.exists():
                    with open(agent_card_path, 'r') as f:
                        agent_card = json.load(f)
                        capabilities = []
                        
                        # Extract capabilities
                        cap_obj = agent_card.get("capabilities", {})
                        for key, value in cap_obj.items():
                            if value is True:
                                capabilities.append(key)
                        
                        # Add skills as capabilities
                        skills = agent_card.get("skills", [])
                        for skill in skills:
                            if "tags" in skill:
                                capabilities.extend(skill["tags"])
                        
                        agent_capabilities[agent_dir.name] = list(set(capabilities))
        
        # Create compatibility matrix
        print(f"\n📊 Capability Compatibility Matrix:")
        print(f"{'Agent':<15} | {'Common Capabilities':<50} | {'Compatibility'}")
        print("-" * 80)
        
        agent_names = list(agent_capabilities.keys())
        for i, agent1 in enumerate(agent_names):
            for j, agent2 in enumerate(agent_names):
                if i < j:  # Avoid duplicates
                    caps1 = set(agent_capabilities[agent1])
                    caps2 = set(agent_capabilities[agent2])
                    
                    common = caps1.intersection(caps2)
                    total = caps1.union(caps2)
                    
                    if total:
                        compatibility = len(common) / len(total)
                        compat_icon = "🟢" if compatibility > 0.7 else "🟡" if compatibility > 0.4 else "🔴"
                        
                        print(f"{agent1:<15} | {', '.join(list(common)[:3]):<50} | {compat_icon} {compatibility:.2f}")
                        print(f"{'↔ ' + agent2:<15} | {'':<50} |")
                        print("-" * 80)

async def main():
    """Main test function"""
    tester = A2ADiscoveryTester()
    
    await tester.test_all_discovery_endpoints()
    await tester.test_capability_matrix()
    
    print(f"\n🎯 A2A Discovery Testing Complete!")
    print(f"\n💡 Next Steps:")
    print(f"   1. Start agents that failed discovery tests")
    print(f"   2. Verify endpoint implementations match agent cards")
    print(f"   3. Test actual communication between compatible agents")

if __name__ == "__main__":
    asyncio.run(main())