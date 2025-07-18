"""
Veo3AgentExecutor - Agent-to-Agent Communication Interface

Compatible executor for the Veo3 Agent that implements the a2a-python interface
for seamless integration with other agents in the ecosystem.
"""

import asyncio
import json
import logging
from typing import Dict, Any, Optional
from pathlib import Path

from agent import Veo3Agent

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class Veo3AgentExecutor:
    """
    Agent executor for Veo3 that provides a2a-python compatible interface.
    
    This class acts as a bridge between the a2a communication system and the
    Veo3Agent, enabling other agents to request video generation services.
    """
    
    def __init__(self, config_path: Optional[str] = None):
        """
        Initialize the Veo3 agent executor.
        
        Args:
            config_path: Optional path to configuration file
        """
        self.agent = Veo3Agent(config_path)
        self.agent_id = "veo3_agent"
        self.version = "1.0.0"
        self.status = "ready"
        
        # Track active operations
        self.active_operations = {}
        
        logger.info("Veo3AgentExecutor initialized successfully")
    
    async def execute(self, task: Dict[str, Any]) -> Dict[str, Any]:
        """
        Execute a task using the Veo3 agent.
        
        Args:
            task: Task dictionary containing action and parameters
            
        Returns:
            Dict containing execution results
        """
        try:
            action = task.get('action', '')
            params = task.get('params', {})
            task_id = task.get('task_id', 'unknown')
            
            logger.info(f"Executing task {task_id}: {action}")
            
            # Update status
            self.status = "processing"
            
            # Process the request using the agent
            result = await self.agent.process_veo3_request(action, params)
            
            # Track operation if it's a generation request
            if action == 'generate' and result.get('success'):
                operation_id = result.get('operation_id')
                if operation_id:
                    self.active_operations[task_id] = {
                        'operation_id': operation_id,
                        'status': 'running',
                        'created_at': asyncio.get_event_loop().time()
                    }
            
            # Update status
            self.status = "ready"
            
            # Return standardized response
            return {
                'success': result.get('success', False),
                'task_id': task_id,
                'agent_id': self.agent_id,
                'result': result,
                'timestamp': asyncio.get_event_loop().time()
            }
            
        except Exception as e:
            logger.error(f"Error executing task: {e}")
            self.status = "error"
            
            return {
                'success': False,
                'task_id': task.get('task_id', 'unknown'),
                'agent_id': self.agent_id,
                'error': str(e),
                'timestamp': asyncio.get_event_loop().time()
            }
    
    async def get_capabilities(self) -> Dict[str, Any]:
        """
        Get agent capabilities for discovery and coordination.
        
        Returns:
            Dict containing agent capabilities
        """
        return {
            'agent_id': self.agent_id,
            'agent_type': 'video_generation',
            'version': self.version,
            'status': self.status,
            'capabilities': [
                'video_generation',
                'text_to_video',
                'prompt_based_generation',
                'long_running_operations',
                'operation_monitoring',
                'result_retrieval',
                'preset_configurations',
                'brazilian_comedian_presets'
            ],
            'supported_actions': [
                'generate',
                'status',
                'fetch',
                'presets',
                'comedian'
            ],
            'supported_formats': [
                '16:9',
                '9:16',
                '1:1'
            ],
            'max_duration': 12,
            'description': 'Google Veo 3 video generation agent with comprehensive generation capabilities',
            'active_operations': len(self.active_operations)
        }
    
    async def get_status(self) -> Dict[str, Any]:
        """
        Get current agent status and health information.
        
        Returns:
            Dict containing agent status
        """
        # Check health of active operations
        current_time = asyncio.get_event_loop().time()
        stale_operations = []
        
        for task_id, op_info in self.active_operations.items():
            if current_time - op_info['created_at'] > 3600:  # 1 hour
                stale_operations.append(task_id)
        
        # Clean up stale operations
        for task_id in stale_operations:
            del self.active_operations[task_id]
        
        return {
            'agent_id': self.agent_id,
            'status': self.status,
            'version': self.version,
            'uptime': current_time,
            'active_operations': len(self.active_operations),
            'health': 'healthy' if self.status != 'error' else 'unhealthy',
            'last_updated': current_time
        }
    
    async def handle_message(self, message: Dict[str, Any]) -> Dict[str, Any]:
        """
        Handle incoming messages from other agents.
        
        Args:
            message: Message dictionary from another agent
            
        Returns:
            Dict containing response
        """
        try:
            message_type = message.get('type', 'task')
            
            if message_type == 'task':
                return await self.execute(message)
            
            elif message_type == 'capabilities':
                return await self.get_capabilities()
            
            elif message_type == 'status':
                return await self.get_status()
            
            elif message_type == 'ping':
                return {
                    'success': True,
                    'agent_id': self.agent_id,
                    'message': 'pong',
                    'timestamp': asyncio.get_event_loop().time()
                }
            
            else:
                return {
                    'success': False,
                    'error': f'Unknown message type: {message_type}',
                    'supported_types': ['task', 'capabilities', 'status', 'ping']
                }
                
        except Exception as e:
            logger.error(f"Error handling message: {e}")
            return {
                'success': False,
                'error': str(e),
                'timestamp': asyncio.get_event_loop().time()
            }
    
    async def cleanup_operation(self, task_id: str) -> bool:
        """
        Cleanup a completed or failed operation.
        
        Args:
            task_id: Task ID to cleanup
            
        Returns:
            bool: True if cleanup successful
        """
        try:
            if task_id in self.active_operations:
                del self.active_operations[task_id]
                logger.info(f"Cleaned up operation: {task_id}")
                return True
            return False
        except Exception as e:
            logger.error(f"Error cleaning up operation {task_id}: {e}")
            return False
    
    async def get_operation_info(self, task_id: str) -> Optional[Dict[str, Any]]:
        """
        Get information about an active operation.
        
        Args:
            task_id: Task ID to query
            
        Returns:
            Optional[Dict]: Operation info if found
        """
        return self.active_operations.get(task_id)
    
    def get_presets(self) -> Dict[str, Any]:
        """
        Get available generation presets.
        
        Returns:
            Dict containing preset information
        """
        return self.agent.get_generation_presets()


# Factory function for a2a-python compatibility
def create_agent_executor(config_path: Optional[str] = None) -> Veo3AgentExecutor:
    """
    Factory function to create a Veo3AgentExecutor instance.
    
    Args:
        config_path: Optional path to configuration file
        
    Returns:
        Veo3AgentExecutor: Configured executor instance
    """
    return Veo3AgentExecutor(config_path)


# Async initialization for a2a-python
async def initialize_agent(config: Optional[Dict[str, Any]] = None) -> Veo3AgentExecutor:
    """
    Async initialization function for a2a-python integration.
    
    Args:
        config: Optional configuration dictionary
        
    Returns:
        Veo3AgentExecutor: Initialized executor
    """
    config_path = None
    if config and 'config_path' in config:
        config_path = config['config_path']
    
    executor = Veo3AgentExecutor(config_path)
    
    # Perform any async initialization here
    logger.info("Veo3 agent initialized for a2a integration")
    
    return executor


# Main execution for standalone testing
async def main():
    """Main function for testing the agent executor."""
    executor = Veo3AgentExecutor()
    
    # Test capabilities
    capabilities = await executor.get_capabilities()
    print("Agent Capabilities:")
    print(json.dumps(capabilities, indent=2))
    
    # Test status
    status = await executor.get_status()
    print("\nAgent Status:")
    print(json.dumps(status, indent=2))
    
    # Test ping
    ping_message = {'type': 'ping'}
    ping_response = await executor.handle_message(ping_message)
    print("\nPing Response:")
    print(json.dumps(ping_response, indent=2))


if __name__ == "__main__":
    asyncio.run(main())