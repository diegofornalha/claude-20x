"""
SPARC Alpha v2.0.0 Integration for A2A Python SDK

This module provides advanced AI-powered enhancements for the A2A Python SDK,
including neural task management, hive mind coordination, and performance optimization.

Key Components:
- Neural Task Manager: AI-powered task prioritization and optimization
- HiveMind Coordination: Queen-led swarm intelligence for agent coordination  
- Adaptive Performance: Real-time optimization and predictive error prevention
- Collective Memory: Shared knowledge and continuous learning across agents

Usage:
    from a2a.sparc import (
        NeuralTaskManager,
        HiveMindQueenCoordinator, 
        AdaptivePerformanceOptimizer,
        CollectiveMemoryStore
    )
    
    # Create enhanced A2A server with SPARC capabilities
    neural_manager = NeuralTaskManager(ai_optimization=True)
    queen_coordinator = HiveMindQueenCoordinator(max_workers=16)
    
    server = SPARCA2AServer(
        neural_task_manager=neural_manager,
        queen_coordinator=queen_coordinator
    )
"""

from a2a.sparc.neural.task_manager import NeuralTaskManager
from a2a.sparc.neural.queue_optimizer import HiveMindEventQueue  
from a2a.sparc.neural.error_predictor import NeuralErrorPredictor

from a2a.sparc.hive_mind.queen_coordinator import HiveMindQueenCoordinator
from a2a.sparc.hive_mind.collective_memory import CollectiveMemoryStore
from a2a.sparc.hive_mind.consensus_engine import ConsensusDecisionEngine

from a2a.sparc.optimization.connection_manager import HiveMindConnectionManager
from a2a.sparc.optimization.performance_tracker import AdaptivePerformanceTracker
from a2a.sparc.optimization.adaptive_systems import AdaptiveOptimizationEngine

__version__ = "2.0.0-alpha"

__all__ = [
    # Neural Intelligence Components
    "NeuralTaskManager",
    "HiveMindEventQueue", 
    "NeuralErrorPredictor",
    
    # Hive Mind Coordination
    "HiveMindQueenCoordinator",
    "CollectiveMemoryStore", 
    "ConsensusDecisionEngine",
    
    # Performance Optimization
    "HiveMindConnectionManager",
    "AdaptivePerformanceTracker",
    "AdaptiveOptimizationEngine",
]