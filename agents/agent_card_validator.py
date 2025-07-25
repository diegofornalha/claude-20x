#!/usr/bin/env python3
"""
A2A Agent Card Validator and Neural Discovery Optimizer
Validates agent cards and optimizes service discovery using neural patterns
"""

import json
import asyncio
import aiohttp
import time
from pathlib import Path
from typing import Dict, List, Any, Tuple
from dataclasses import dataclass, asdict
from datetime import datetime, timedelta

@dataclass
class AgentPerformanceMetrics:
    """Performance metrics for agent discovery and validation"""
    agent_id: str
    discovery_time_ms: float
    validation_score: float
    capability_accuracy: float
    response_time_ms: float
    last_validated: datetime
    neural_optimization_score: float = 0.0

@dataclass 
class NeuralDiscoveryPattern:
    """Neural pattern for optimized agent discovery"""
    pattern_id: str
    agent_types: List[str]
    capability_weights: Dict[str, float]
    discovery_optimization: Dict[str, Any]
    success_rate: float = 0.0
    last_trained: datetime = None

class A2AAgentCardValidator:
    """
    Advanced validator for A2A Agent Cards with neural optimization
    """
    
    def __init__(self):
        self.agents_dir = Path("/Users/agents/Desktop/claude-20x/agents")
        self.validation_cache = {}
        self.neural_patterns = []
        self.performance_metrics = {}
        self.discovery_cache = {}
        
    async def discover_and_validate_all_agents(self) -> Dict[str, Any]:
        """Discover and validate all agent cards in parallel"""
        print("🔍 Starting A2A Agent Discovery and Validation...")
        
        # Discover all agent directories
        agent_dirs = [d for d in self.agents_dir.iterdir() if d.is_dir()]
        
        # Parallel validation
        validation_tasks = []
        for agent_dir in agent_dirs:
            task = self.validate_agent_card(agent_dir)
            validation_tasks.append(task)
            
        results = await asyncio.gather(*validation_tasks, return_exceptions=True)
        
        # Process results
        validation_report = {
            "timestamp": datetime.now().isoformat(),
            "total_agents": len(agent_dirs),
            "valid_agents": 0,
            "invalid_agents": 0,
            "agents": {},
            "neural_optimization": {
                "patterns_detected": len(self.neural_patterns),
                "discovery_cache_hits": len(self.discovery_cache),
                "performance_improvements": self._calculate_performance_improvements()
            }
        }
        
        for i, result in enumerate(results):
            agent_name = agent_dirs[i].name
            if isinstance(result, Exception):
                validation_report["agents"][agent_name] = {
                    "status": "error",
                    "error": str(result)
                }
                validation_report["invalid_agents"] += 1
            else:
                validation_report["agents"][agent_name] = result
                if result["is_valid"]:
                    validation_report["valid_agents"] += 1
                else:
                    validation_report["invalid_agents"] += 1
        
        return validation_report
    
    async def validate_agent_card(self, agent_dir: Path) -> Dict[str, Any]:
        """Validate individual agent card with neural optimization"""
        agent_name = agent_dir.name
        agent_card_path = agent_dir / ".well-known" / "agent.json"
        
        start_time = time.time()
        
        validation_result = {
            "agent_id": agent_name,
            "agent_card_path": str(agent_card_path),
            "is_valid": False,
            "validation_score": 0.0,
            "issues": [],
            "capabilities": [],
            "neural_optimization": {}
        }
        
        try:
            # Check if agent card exists
            if not agent_card_path.exists():
                validation_result["issues"].append("Agent card file not found")
                return validation_result
            
            # Load and validate JSON
            with open(agent_card_path, 'r') as f:
                agent_card = json.load(f)
            
            # Validate required fields
            validation_score = await self._validate_schema(agent_card, validation_result)
            
            # Extract capabilities
            capabilities = self._extract_capabilities(agent_card)
            validation_result["capabilities"] = capabilities
            
            # Neural optimization
            neural_score = await self._apply_neural_optimization(agent_name, agent_card, capabilities)
            validation_result["neural_optimization"] = {
                "optimization_score": neural_score,
                "patterns_applied": len([p for p in self.neural_patterns if agent_name in p.agent_types]),
                "discovery_cached": agent_name in self.discovery_cache
            }
            
            # Calculate final validation score
            validation_result["validation_score"] = validation_score + (neural_score * 0.1)
            validation_result["is_valid"] = validation_result["validation_score"] >= 0.8
            
            # Store performance metrics
            discovery_time = (time.time() - start_time) * 1000
            self.performance_metrics[agent_name] = AgentPerformanceMetrics(
                agent_id=agent_name,
                discovery_time_ms=discovery_time,
                validation_score=validation_result["validation_score"],
                capability_accuracy=len(capabilities) / 10,  # Normalized
                response_time_ms=discovery_time,
                last_validated=datetime.now(),
                neural_optimization_score=neural_score
            )
            
        except json.JSONDecodeError as e:
            validation_result["issues"].append(f"Invalid JSON: {str(e)}")
        except Exception as e:
            validation_result["issues"].append(f"Validation error: {str(e)}")
        
        return validation_result
    
    async def _validate_schema(self, agent_card: Dict[str, Any], result: Dict[str, Any]) -> float:
        """Validate agent card schema compliance"""
        score = 0.0
        required_fields = [
            "@context", "id", "name", "description", "version", "protocol_version",
            "capabilities", "endpoints", "skills", "interoperability", "security", "metadata"
        ]
        
        # Check required fields
        for field in required_fields:
            if field in agent_card:
                score += 0.08  # Each field worth 8% (12 fields = 96%)
            else:
                result["issues"].append(f"Missing required field: {field}")
        
        # Validate endpoints structure
        if "endpoints" in agent_card:
            endpoints = agent_card["endpoints"]
            if "discovery" in endpoints and endpoints["discovery"] == "/.well-known/agent.json":
                score += 0.02
            else:
                result["issues"].append("Discovery endpoint must be '/.well-known/agent.json'")
            
            if "base_url" in endpoints:
                score += 0.02
            else:
                result["issues"].append("Missing base_url in endpoints")
        
        return score
    
    def _extract_capabilities(self, agent_card: Dict[str, Any]) -> List[str]:
        """Extract all capabilities from agent card"""
        capabilities = []
        
        # From capabilities object
        if "capabilities" in agent_card:
            caps = agent_card["capabilities"]
            for key, value in caps.items():
                if value is True:
                    capabilities.append(key)
        
        # From skills
        if "skills" in agent_card:
            for skill in agent_card["skills"]:
                if "tags" in skill:
                    capabilities.extend(skill["tags"])
        
        return list(set(capabilities))  # Remove duplicates
    
    async def _apply_neural_optimization(self, agent_name: str, agent_card: Dict[str, Any], capabilities: List[str]) -> float:
        """Apply neural patterns for discovery optimization"""
        optimization_score = 0.0
        
        # Create neural pattern based on agent characteristics
        agent_type = self._determine_agent_type(agent_card, capabilities)
        
        # Check if we have existing patterns for this agent type
        existing_pattern = next((p for p in self.neural_patterns if agent_type in p.agent_types), None)
        
        if existing_pattern:
            # Apply existing pattern
            optimization_score = existing_pattern.success_rate
            # Update discovery cache
            self.discovery_cache[agent_name] = {
                "cached_at": datetime.now(),
                "pattern_id": existing_pattern.pattern_id,
                "optimization_applied": True
            }
        else:
            # Create new neural pattern
            new_pattern = NeuralDiscoveryPattern(
                pattern_id=f"pattern_{len(self.neural_patterns)}_{agent_type}",
                agent_types=[agent_type],
                capability_weights=self._calculate_capability_weights(capabilities),
                discovery_optimization={
                    "cache_ttl": 300,  # 5 minutes
                    "priority_score": len(capabilities) / 10,
                    "load_balancing": True
                },
                success_rate=0.5,  # Initial score
                last_trained=datetime.now()
            )
            self.neural_patterns.append(new_pattern)
            optimization_score = 0.5
        
        return optimization_score
    
    def _determine_agent_type(self, agent_card: Dict[str, Any], capabilities: List[str]) -> str:
        """Determine agent type based on capabilities and metadata"""
        if "coordinator" in agent_card.get("description", "").lower():
            return "coordinator"
        elif "extraction" in capabilities or "structured_data" in capabilities:
            return "extractor"
        elif "code" in capabilities or "generation" in capabilities:
            return "generator"
        elif "sdk" in agent_card.get("metadata", {}).get("project_type", ""):
            return "framework"
        else:
            return "general"
    
    def _calculate_capability_weights(self, capabilities: List[str]) -> Dict[str, float]:
        """Calculate neural weights for capabilities"""
        weights = {}
        total_caps = len(capabilities)
        
        for cap in capabilities:
            # Higher weights for more important capabilities
            if cap in ["discovery", "communication", "cooperation"]:
                weights[cap] = 1.0
            elif cap in ["real_time", "streaming", "authentication"]:
                weights[cap] = 0.8
            else:
                weights[cap] = 0.5
        
        return weights
    
    def _calculate_performance_improvements(self) -> Dict[str, float]:
        """Calculate performance improvements from neural optimization"""
        if not self.performance_metrics:
            return {"discovery_time": 0.0, "accuracy": 0.0, "cache_efficiency": 0.0}
        
        metrics = list(self.performance_metrics.values())
        avg_discovery_time = sum(m.discovery_time_ms for m in metrics) / len(metrics)
        avg_accuracy = sum(m.validation_score for m in metrics) / len(metrics)
        cache_hits = len(self.discovery_cache)
        
        return {
            "discovery_time_improvement": max(0, (200 - avg_discovery_time) / 200),  # Target 200ms
            "accuracy_improvement": avg_accuracy,
            "cache_efficiency": cache_hits / len(metrics) if metrics else 0
        }
    
    async def test_agent_connectivity(self, agent_name: str, base_url: str) -> Dict[str, Any]:
        """Test connectivity to agent endpoints"""
        connectivity_result = {
            "agent_name": agent_name,
            "base_url": base_url,
            "endpoints_tested": {},
            "overall_status": "unknown"
        }
        
        endpoints_to_test = [
            ("discovery", "/.well-known/agent.json"),
            ("health", "/health"),
            ("communicate", "/communicate")
        ]
        
        async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=5)) as session:
            for endpoint_name, endpoint_path in endpoints_to_test:
                try:
                    url = f"{base_url.rstrip('/')}{endpoint_path}"
                    start_time = time.time()
                    
                    async with session.get(url) as response:
                        response_time = (time.time() - start_time) * 1000
                        connectivity_result["endpoints_tested"][endpoint_name] = {
                            "status_code": response.status,
                            "response_time_ms": response_time,
                            "accessible": response.status < 400
                        }
                except Exception as e:
                    connectivity_result["endpoints_tested"][endpoint_name] = {
                        "error": str(e),
                        "accessible": False
                    }
        
        # Determine overall status
        accessible_endpoints = sum(1 for ep in connectivity_result["endpoints_tested"].values() 
                                 if ep.get("accessible", False))
        total_endpoints = len(endpoints_to_test)
        
        if accessible_endpoints == total_endpoints:
            connectivity_result["overall_status"] = "fully_accessible"
        elif accessible_endpoints > 0:
            connectivity_result["overall_status"] = "partially_accessible"
        else:
            connectivity_result["overall_status"] = "not_accessible"
        
        return connectivity_result
    
    def generate_compatibility_matrix(self, validation_report: Dict[str, Any]) -> Dict[str, Any]:
        """Generate compatibility matrix between all agents"""
        valid_agents = {name: data for name, data in validation_report["agents"].items() 
                       if data.get("is_valid", False)}
        
        compatibility_matrix = {
            "matrix": {},
            "compatibility_score": 0.0,
            "recommendations": []
        }
        
        agent_names = list(valid_agents.keys())
        
        for agent1 in agent_names:
            compatibility_matrix["matrix"][agent1] = {}
            agent1_caps = set(valid_agents[agent1].get("capabilities", []))
            
            for agent2 in agent_names:
                if agent1 == agent2:
                    compatibility_matrix["matrix"][agent1][agent2] = 1.0
                    continue
                
                agent2_caps = set(valid_agents[agent2].get("capabilities", []))
                
                # Calculate compatibility based on overlapping capabilities
                common_caps = agent1_caps.intersection(agent2_caps)
                total_caps = agent1_caps.union(agent2_caps)
                
                if total_caps:
                    compatibility_score = len(common_caps) / len(total_caps)
                else:
                    compatibility_score = 0.0
                
                compatibility_matrix["matrix"][agent1][agent2] = compatibility_score
        
        # Calculate overall compatibility
        all_scores = []
        for agent1_scores in compatibility_matrix["matrix"].values():
            all_scores.extend([score for score in agent1_scores.values() if score < 1.0])
        
        if all_scores:
            compatibility_matrix["compatibility_score"] = sum(all_scores) / len(all_scores)
        
        return compatibility_matrix

async def main():
    """Main function to run agent card validation"""
    validator = A2AAgentCardValidator()
    
    print("🚀 Starting A2A Agent Card Management System...")
    print("=" * 60)
    
    # Validate all agents
    validation_report = await validator.discover_and_validate_all_agents()
    
    print(f"\n📊 Validation Results:")
    print(f"   Total Agents: {validation_report['total_agents']}")
    print(f"   Valid Agents: {validation_report['valid_agents']}")
    print(f"   Invalid Agents: {validation_report['invalid_agents']}")
    print(f"   Neural Patterns: {validation_report['neural_optimization']['patterns_detected']}")
    
    # Display individual results
    print(f"\n🔍 Individual Agent Results:")
    for agent_name, result in validation_report["agents"].items():
        status = "✅" if result.get("is_valid", False) else "❌"
        score = result.get("validation_score", 0)
        print(f"   {status} {agent_name:<15} | Score: {score:.2f} | Capabilities: {len(result.get('capabilities', []))}")
        
        if result.get("issues"):
            for issue in result["issues"]:
                print(f"      ⚠️  {issue}")
    
    # Test connectivity for valid agents
    print(f"\n🌐 Testing Agent Connectivity...")
    connectivity_tasks = []
    for agent_name, result in validation_report["agents"].items():
        if result.get("is_valid", False):
            # Extract base URL from agent card
            agent_dir = validator.agents_dir / agent_name / ".well-known" / "agent.json"
            if agent_dir.exists():
                with open(agent_dir, 'r') as f:
                    agent_card = json.load(f)
                    base_url = agent_card.get("endpoints", {}).get("base_url", "")
                    if base_url:
                        task = validator.test_agent_connectivity(agent_name, base_url)
                        connectivity_tasks.append(task)
    
    if connectivity_tasks:
        connectivity_results = await asyncio.gather(*connectivity_tasks, return_exceptions=True)
        
        print(f"\n🔗 Connectivity Results:")
        for result in connectivity_results:
            if isinstance(result, Exception):
                print(f"   ❌ Error testing connectivity: {result}")
            else:
                agent_name = result["agent_name"]
                status_icon = {"fully_accessible": "✅", "partially_accessible": "⚠️", "not_accessible": "❌"}
                icon = status_icon.get(result["overall_status"], "❓")
                print(f"   {icon} {agent_name:<15} | Status: {result['overall_status']}")
    
    # Generate compatibility matrix
    compatibility = validator.generate_compatibility_matrix(validation_report)
    print(f"\n🔄 Agent Compatibility Matrix:")
    print(f"   Overall Compatibility Score: {compatibility['compatibility_score']:.2f}")
    
    # Save detailed report
    report_path = validator.agents_dir / "agent_validation_report.json"
    with open(report_path, 'w') as f:
        json.dump({
            "validation_report": validation_report,
            "compatibility_matrix": compatibility,
            "performance_metrics": {k: asdict(v) for k, v in validator.performance_metrics.items()},
            "neural_patterns": [asdict(p) for p in validator.neural_patterns]
        }, f, indent=2, default=str)
    
    print(f"\n💾 Detailed report saved to: {report_path}")
    print("🎯 A2A Agent Card Management completed successfully!")

if __name__ == "__main__":
    asyncio.run(main())