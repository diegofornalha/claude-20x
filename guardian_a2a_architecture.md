# Guardian Agent A2A-Native Architecture Specification

## Executive Summary

Esta especificação arquitetural apresenta o projeto completo do **Guardian Agent A2A-Native**, um agent de monitoramento e controle de sustentabilidade totalmente harmonizado com o A2A Protocol. A solução maximiza o reuso dos componentes existentes enquanto adiciona capabilities nativas do A2A Protocol para universal interoperability e dynamic collaboration.

## Current State Analysis

### Componentes Existentes ✅
- **CarbonBudgetManager**: Totalmente implementado com alocação, redistribuição e monitoramento
- **JevonsMitigator**: Parcialmente implementado (até linha 85)
- **SustainabilityTypes**: Estruturas de dados completas e bem definidas
- **Agent Cards**: Estrutura A2A básica presente
- **BaseAgent**: Classe base para agents

### Componentes Faltando ❌
- **EntropyController**: Mencionado no __init__ mas não implementado
- **DemandShaper**: Mencionado no __init__ mas não implementado  
- **Guardian Agent A2A Integration**: Sem Agent Card específico
- **A2A Messaging Coordinator**: Sem integração com protocolo A2A

## Guardian Agent A2A-Native Architecture

### 1. Core Components

#### 1.1 GuardianAgent (Main Class)
```python
class GuardianAgent(BaseAgent):
    """A2A-native sustainability monitoring and control agent."""
    
    def __init__(self, config: GuardianConfig):
        super().__init__(
            agent_name="Guardian Sustainability Agent",
            description="A2A-native sustainability monitoring and control agent",
            content_types=["application/json", "text/plain"]
        )
        
        # Core sustainability components
        self.carbon_budget_manager = CarbonBudgetManager(config.total_carbon_budget)
        self.jevons_mitigator = JevonsMitigator(config.jevons_detection_threshold)
        self.entropy_controller = EntropyController()
        self.demand_shaper = DemandShaper()
        
        # A2A Protocol integration
        self.a2a_coordinator = A2AMessagingCoordinator(self)
        self.mcp_server = GuardianMCPServer(self)
        self.event_observer = SustainabilityEventObserver(self)
        
        # Agent Card for A2A discovery
        self.agent_card = self._create_agent_card()
    
    async def start(self) -> None:
        """Start Guardian Agent with A2A registration."""
        await self.mcp_server.start()
        await self.a2a_coordinator.register()
        await self.event_observer.start_observing()
```

#### 1.2 EntropyController (New Component)
```python
class EntropyController:
    """Controls system entropy to maintain efficiency without rebound effects."""
    
    def __init__(self, entropy_threshold: float = 0.75):
        self.entropy_threshold = entropy_threshold
        self.entropy_history: deque = deque(maxlen=50)
        self.network_state: Dict[str, Any] = {}
        self.control_strategies: List[str] = ["load_balancing", "resource_throttling", "agent_cycling"]
    
    async def calculate_system_entropy(self, agent_network: Dict) -> float:
        """Calculate Shannon entropy of agent network based on resource distribution."""
        # Implementation: Calculate entropy based on:
        # - Resource distribution across agents
        # - Task completion variance  
        # - Communication overhead
        
    async def detect_entropy_increase(self, threshold: float = None) -> Tuple[bool, float]:
        """Detect if system entropy is increasing beyond acceptable levels."""
        # Monitor entropy trends over time
        # Return (is_increasing, current_entropy)
        
    async def apply_entropy_controls(self, control_type: str) -> Dict[str, Any]:
        """Apply entropy reduction controls."""
        # Strategies: load_balancing, resource_throttling, agent_cycling
        # Return control results and effectiveness metrics
        
    async def get_entropy_metrics(self) -> Dict[str, float]:
        """Get comprehensive entropy metrics."""
        # Return current entropy, trend, prediction, recommended actions
```

#### 1.3 DemandShaper (New Component)
```python
class DemandShaper:
    """Shapes demand to prevent efficiency rebound effects through economic controls."""
    
    def __init__(self, base_pricing_multiplier: float = 1.0):
        self.base_pricing_multiplier = base_pricing_multiplier
        self.agent_demand_patterns: Dict[str, DemandPattern] = {}
        self.pricing_curves: Dict[str, PricingCurve] = {}
        self.usage_caps: Dict[str, float] = {}
    
    async def analyze_demand_patterns(self, agent_id: str) -> DemandPattern:
        """Analyze historical demand patterns for elasticity calculation."""
        
    async def apply_progressive_pricing(self, agent_id: str, efficiency_gain: float) -> Dict[str, Any]:
        """Apply progressive pricing based on efficiency gains."""
        
    async def implement_usage_caps(self, agent_id: str, cap_percentage: float) -> bool:
        """Implement soft usage caps to prevent demand spikes."""
        
    async def get_shaping_recommendations(self, agent_id: str) -> List[Dict[str, Any]]:
        """Generate demand shaping recommendations."""
```

### 2. A2A Protocol Integration

#### 2.1 Guardian Agent Card
```json
{
    "name": "Guardian Sustainability Agent",
    "description": "A2A-native sustainability monitoring and control agent",
    "url": "http://localhost:10102/",
    "version": "1.0.0",
    "capabilities": {
        "streaming": "True",
        "pushNotifications": "True",
        "stateTransitionHistory": "True",
        "sustainability_monitoring": "True",
        "carbon_budget_management": "True",
        "jevons_prevention": "True"
    },
    "authentication": {
        "schemes": ["public"]
    },
    "defaultInputModes": ["application/json", "text/plain"],
    "defaultOutputModes": ["application/json", "text/plain"],
    "skills": [
        {
            "id": "carbon_monitoring",
            "name": "Carbon Budget Monitor",
            "description": "Monitors and manages carbon budget across agent network",
            "tags": ["sustainability", "carbon", "monitoring"]
        },
        {
            "id": "jevons_prevention",
            "name": "Jevons Paradox Prevention",
            "description": "Detects and mitigates Jevons paradox effects",
            "tags": ["sustainability", "efficiency", "jevons"]
        },
        {
            "id": "entropy_control",
            "name": "System Entropy Control", 
            "description": "Controls system entropy to maintain efficiency",
            "tags": ["sustainability", "entropy", "control"]
        }
    ]
}
```

#### 2.2 A2AMessagingCoordinator
```python
class A2AMessagingCoordinator:
    """Coordinates A2A Protocol messaging for Guardian Agent."""
    
    def __init__(self, guardian_agent: GuardianAgent):
        self.guardian = guardian_agent
        self.bridge_url = "http://localhost:8000"  # A2A Bridge Server
        self.registered_agents: Dict[str, Dict] = {}
        self.message_handlers: Dict[str, Callable] = {}
        
    async def register(self) -> bool:
        """Register Guardian with A2A Bridge Server."""
        registration_data = {
            "agent_card": self.guardian.agent_card,
            "capabilities": ["sustainability_monitoring", "carbon_budget_management"],
            "mcp_tools": ["carbon_budget_check", "jevons_risk_assessment", "sustainability_metrics"]
        }
        
    async def discover_agents(self) -> List[Dict[str, Any]]:
        """Discover other agents in the network via A2A Bridge."""
        
    async def send_sustainability_advisory(self, agent_id: str, advisory: Dict[str, Any]) -> bool:
        """Send sustainability advisory to another agent."""
        # Use A2A Protocol messaging to send advisory
        # Respect agent opacity - only send recommendations, not commands
        
    async def broadcast_sustainability_alert(self, alert: SustainabilityStatusUpdateEvent) -> None:
        """Broadcast sustainability alerts to network."""
```

### 3. MCP Tools Interface

#### 3.1 GuardianMCPServer
```python
class GuardianMCPServer:
    """MCP Server exposing Guardian sustainability tools."""
    
    def __init__(self, guardian_agent: GuardianAgent, port: int = 10102):
        self.guardian = guardian_agent
        self.port = port
        self.tools = self._register_tools()
    
    def _register_tools(self) -> Dict[str, Callable]:
        """Register MCP tools for external agents."""
        return {
            "carbon_budget_check": self._carbon_budget_check,
            "jevons_risk_assessment": self._jevons_risk_assessment,
            "sustainability_metrics": self._sustainability_metrics,
            "demand_shaping_advisory": self._demand_shaping_advisory,
            "entropy_control_status": self._entropy_control_status,
            "network_sustainability_status": self._network_sustainability_status
        }
```

#### 3.2 MCP Tools Specification

| Tool | Input | Output | Description |
|------|--------|---------|-------------|
| `carbon_budget_check` | `agent_id: str, requested_carbon: float` | `{"available": bool, "remaining_budget": float, "message": str}` | Check carbon budget availability |
| `jevons_risk_assessment` | `agent_id: str, efficiency_gain: float, usage_change: float` | `JevonsRiskAssessment` | Assess Jevons paradox risk |
| `sustainability_metrics` | `agent_id: str` | `SustainabilityMetrics` | Get comprehensive sustainability metrics |
| `demand_shaping_advisory` | `agent_id: str` | `{"recommendations": List[str], "pricing_multiplier": float}` | Get demand shaping recommendations |
| `entropy_control_status` | None | `{"system_entropy": float, "controls_active": bool}` | Get entropy control status |
| `network_sustainability_status` | None | Network-wide sustainability status | Get network sustainability overview |

### 4. Observer Pattern Implementation

#### 4.1 SustainabilityEventObserver
```python
class SustainabilityEventObserver:
    """Observes TaskStatusUpdateEvent and generates SustainabilityStatusUpdateEvent."""
    
    def __init__(self, guardian_agent: GuardianAgent):
        self.guardian = guardian_agent
        self.event_subscriptions: Set[str] = set()
        self.processing_queue: asyncio.Queue = asyncio.Queue()
        
    async def start_observing(self) -> None:
        """Start observing events from agent network."""
        # Subscribe to TaskStatusUpdateEvent via A2A Protocol
        
    async def process_task_event(self, event: TaskStatusUpdateEvent) -> Optional[SustainabilityStatusUpdateEvent]:
        """Process task event and generate sustainability event if needed."""
        # Calculate carbon impact, assess Jevons risk, check budget status
        # Generate SustainabilityStatusUpdateEvent if thresholds exceeded
        
    async def handle_task_completion(self, event: TaskStatusUpdateEvent) -> None:
        """Handle task completion events for sustainability assessment."""
        sustainability_metrics = await self._calculate_task_sustainability(event)
        
        if self._requires_intervention(sustainability_metrics):
            sustainability_event = SustainabilityStatusUpdateEvent(
                **event.dict(),
                sustainability_metrics=sustainability_metrics,
                carbon_budget_exceeded=sustainability_metrics.budget_status.remaining_budget < 0,
                jevons_mitigation_applied=sustainability_metrics.jevons_assessment.mitigation_required
            )
            
            await self.guardian.a2a_coordinator.broadcast_sustainability_alert(sustainability_event)
```

### 5. Universal Interoperability

#### 5.1 JSON-RPC 2.0 Compatibility
```python
class GuardianJSONRPCInterface:
    """JSON-RPC 2.0 interface for universal agent communication."""
    
    async def handle_rpc_request(self, request: Dict[str, Any]) -> Dict[str, Any]:
        """Handle JSON-RPC 2.0 requests from any agent."""
        method = request.get("method")
        params = request.get("params", {})
        request_id = request.get("id")
        
        if method in self.guardian.mcp_server.tools:
            result = await self.guardian.mcp_server.tools[method](**params)
            return {
                "jsonrpc": "2.0",
                "result": result,
                "id": request_id
            }
```

#### 5.2 Dynamic Collaboration
```python
async def integrate_new_agent(self, agent_card: Dict[str, Any]) -> bool:
    """Automatically integrate newly discovered agents."""
    agent_id = agent_card.get("name")
    
    # Register agent with carbon budget manager
    await self.guardian.carbon_budget_manager.register_agent(agent_id)
    
    # Subscribe to agent's task events
    await self.guardian.event_observer.subscribe_to_agent(agent_id)
    
    # Offer sustainability tools via agent's preferred interface
    await self.guardian.a2a_coordinator.offer_tools(agent_id, agent_card)
    
    return True
```

### 6. Integration with Existing Agents

#### 6.1 Orchestrator Agent Integration
- Guardian observes orchestrator `TaskStatusUpdateEvent`
- Provides sustainability metrics via MCP tools
- Sends carbon budget alerts when tasks exceed limits
- Maintains orchestrator autonomy (opacity preserved)

#### 6.2 Planner Agent Integration  
- Guardian provides carbon cost estimates for planned tasks
- Offers alternative low-carbon task sequences
- Monitors planning efficiency vs execution carbon usage
- Feeds back sustainability constraints to planning process

### 7. Configuration

#### 7.1 Guardian Configuration
```yaml
# guardian_config.yaml
guardian:
  total_carbon_budget: 1000.0  # kg CO2 eq
  budget_allocation_strategy: "efficiency_based"
  jevons_detection_threshold: 0.7
  entropy_control_enabled: true
  sustainability_reporting_interval: 300  # seconds
  
a2a_integration:
  bridge_server_url: "http://localhost:8000"
  mcp_server_port: 10102
  auto_discovery: true
  opacity_mode: "strict"  # strict, permissive
  
monitoring:
  alert_thresholds:
    carbon_budget_critical: 0.95
    jevons_risk_high: 0.8
    entropy_spike: 0.85
  notification_channels: ["events", "mcp_tools"]
```

## Implementation Roadmap

### Phase 1: Core Components (Week 1-2)
1. Complete JevonsMitigator implementation (missing methods after line 85)
2. Implement EntropyController with basic entropy calculation
3. Implement DemandShaper with progressive pricing
4. Unit tests for all components

### Phase 2: A2A Integration (Week 3-4)
5. Implement GuardianAgent main class
6. Create GuardianMCPServer with tool exposure
7. Implement A2AMessagingCoordinator  
8. Create Guardian Agent Card JSON
9. Integration tests with A2A Bridge

### Phase 3: Event Observer (Week 5)
10. Implement SustainabilityEventObserver
11. Test Observer pattern with TaskStatusUpdateEvent
12. Implement SustainabilityStatusUpdateEvent broadcasting
13. End-to-end testing

### Phase 4: Network Integration (Week 6)
14. Test with existing agents (orchestrator, planner)
15. Performance optimization
16. Documentation and deployment guide

## Key Value Propositions

### 1. A2A Native Integration
- Full integration with A2A Protocol from ground up
- Native support for agent discovery and collaboration
- Event-driven architecture preserves agent independence

### 2. Universal Compatibility
- JSON-RPC 2.0 ensures any agent can communicate
- MCP Tools provide standardized sustainability interface
- Backward compatibility with existing agents

### 3. Opacity Preservation
- Monitoring without interfering with agent autonomy
- Observer pattern enables network-wide monitoring without central control
- Recommendations only - agents retain decision authority

### 4. Comprehensive Sustainability Controls
- Carbon budget management with dynamic allocation
- Jevons paradox detection and mitigation
- System entropy control for efficiency maintenance
- Progressive pricing and demand shaping

### 5. Dynamic Collaboration
- Automatic discovery and integration of new agents
- Adaptive integration based on agent capabilities
- Network-wide sustainability coordination

## Performance Metrics

```python
class GuardianMetrics:
    """Performance and effectiveness metrics for Guardian Agent."""
    
    async def calculate_sustainability_impact(self) -> Dict[str, float]:
        """Calculate overall sustainability impact metrics."""
        return {
            "total_carbon_savings": self.carbon_savings,
            "prevention_rate": self.jevons_prevention_count / max(self.total_assessments, 1),
            "average_efficiency_gain": sum(self.agent_efficiency_improvements.values()) / len(self.agent_efficiency_improvements),
            "network_entropy_reduction": await self._calculate_entropy_reduction()
        }
```

## Conclusion

A arquitetura Guardian Agent A2A-Native apresentada oferece uma solução completa e robusta para monitoramento e controle de sustentabilidade em redes de agents. A harmonização com o A2A Protocol garante universal interoperability, dynamic collaboration e preservação da autonomia dos agents, enquanto os controles de sustentabilidade abrangentes (carbon, Jevons, entropy, demand) fornecem uma base sólida para operações sustentáveis em larga escala.

A implementação seguindo o roadmap de 6 semanas permitirá a criação do primeiro agent verdadeiramente A2A-native para sustainability monitoring, estabelecendo um novo padrão para agents sustentáveis na rede.