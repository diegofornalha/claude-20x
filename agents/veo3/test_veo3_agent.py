"""
Test Suite for Veo3 Agent

Comprehensive test suite covering all aspects of the Veo3 video generation agent,
including unit tests, integration tests, and performance tests.
"""

import pytest
import asyncio
import json
import tempfile
import os
from pathlib import Path
from unittest.mock import Mock, patch, AsyncMock
from typing import Dict, Any

# Import the agent classes
from agent import Veo3Agent
from agent_executor import Veo3AgentExecutor


class TestVeo3Agent:
    """Test cases for the core Veo3Agent class."""
    
    @pytest.fixture
    def agent(self):
        """Create a Veo3Agent instance for testing."""
        return Veo3Agent()
    
    @pytest.fixture
    def mock_config(self):
        """Mock configuration for testing."""
        return {
            'project_id': 'test-project',
            'location_id': 'us-central1',
            'api_key': 'test-api-key'
        }
    
    def test_agent_initialization(self, agent):
        """Test agent initialization with default configuration."""
        assert agent.project_id == 'gen-lang-client-0313251790'
        assert agent.location_id == 'us-central1'
        assert agent.model_id == 'veo-3.0-generate-preview'
        assert 'standard' in agent.presets
    
    def test_agent_initialization_with_config(self, mock_config):
        """Test agent initialization with custom configuration."""
        with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
            json.dump(mock_config, f)
            config_path = f.name
        
        try:
            agent = Veo3Agent(config_path=config_path)
            assert agent.project_id == 'test-project'
            assert agent.location_id == 'us-central1'
        finally:
            os.unlink(config_path)
    
    def test_presets_available(self, agent):
        """Test that all expected presets are available."""
        expected_presets = ['quick', 'standard', 'premium', 'portrait', 'square']
        for preset in expected_presets:
            assert preset in agent.presets
            assert 'aspectRatio' in agent.presets[preset]
            assert 'sampleCount' in agent.presets[preset]
            assert 'durationSeconds' in agent.presets[preset]
    
    def test_get_generation_presets(self, agent):
        """Test getting generation presets."""
        presets = agent.get_generation_presets()
        assert 'presets' in presets
        assert 'default' in presets
        assert 'description' in presets
        assert presets['default'] == 'standard'
    
    @patch('agent.subprocess.run')
    def test_get_access_token_success(self, mock_subprocess, agent):
        """Test successful access token retrieval."""
        mock_subprocess.return_value.stdout = 'test-token\\n'
        mock_subprocess.return_value.returncode = 0
        
        token = agent._get_access_token()
        assert token == 'test-token'
        mock_subprocess.assert_called_once()
    
    @patch('agent.subprocess.run')
    def test_get_access_token_failure(self, mock_subprocess, agent):
        """Test access token retrieval failure."""
        mock_subprocess.side_effect = Exception("Command failed")
        
        with pytest.raises(Exception, match="Failed to authenticate"):
            agent._get_access_token()
    
    @pytest.mark.asyncio
    @patch('agent.aiohttp.ClientSession.post')
    @patch.object(Veo3Agent, '_get_access_token')
    async def test_generate_video_success(self, mock_token, mock_post, agent):
        """Test successful video generation."""
        # Mock the access token
        mock_token.return_value = 'test-token'
        
        # Mock the API response
        mock_response = Mock()
        mock_response.status = 200
        mock_response.json = AsyncMock(return_value={
            'name': 'operations/test-operation-123'
        })
        mock_post.return_value.__aenter__.return_value = mock_response
        
        result = await agent.generate_video("Test prompt")
        
        assert result['success'] is True
        assert 'operation_id' in result
        assert result['operation_id'] == 'operations/test-operation-123'
        assert result['prompt'] == "Test prompt"
    
    @pytest.mark.asyncio
    @patch('agent.aiohttp.ClientSession.post')
    @patch.object(Veo3Agent, '_get_access_token')
    async def test_generate_video_api_error(self, mock_token, mock_post, agent):
        """Test video generation with API error."""
        # Mock the access token
        mock_token.return_value = 'test-token'
        
        # Mock the API error response
        mock_response = Mock()
        mock_response.status = 400
        mock_response.text = AsyncMock(return_value='Bad Request')
        mock_post.return_value.__aenter__.return_value = mock_response
        
        result = await agent.generate_video("Test prompt")
        
        assert result['success'] is False
        assert 'error' in result
        assert '400' in result['error']
    
    @pytest.mark.asyncio
    @patch('agent.aiohttp.ClientSession.post')
    @patch.object(Veo3Agent, '_get_access_token')
    async def test_check_operation_status_running(self, mock_token, mock_post, agent):
        """Test checking status of running operation."""
        # Mock the access token
        mock_token.return_value = 'test-token'
        
        # Mock the API response for running operation
        mock_response = Mock()
        mock_response.status = 200
        mock_response.json = AsyncMock(return_value={
            'done': False,
            'metadata': {'status': 'running'}
        })
        mock_post.return_value.__aenter__.return_value = mock_response
        
        result = await agent.check_operation_status('test-operation')
        
        assert result['success'] is True
        assert result['done'] is False
        assert result['status'] == 'running'
    
    @pytest.mark.asyncio
    @patch('agent.aiohttp.ClientSession.post')
    @patch.object(Veo3Agent, '_get_access_token')
    async def test_check_operation_status_completed(self, mock_token, mock_post, agent):
        """Test checking status of completed operation."""
        # Mock the access token
        mock_token.return_value = 'test-token'
        
        # Mock the API response for completed operation
        mock_response = Mock()
        mock_response.status = 200
        mock_response.json = AsyncMock(return_value={
            'done': True,
            'response': {'predictions': []}
        })
        mock_post.return_value.__aenter__.return_value = mock_response
        
        result = await agent.check_operation_status('test-operation')
        
        assert result['success'] is True
        assert result['done'] is True
        assert result['status'] == 'completed'
        assert result['has_results'] is True
    
    @pytest.mark.asyncio
    async def test_generate_with_brazilian_comedian_prompt(self, agent):
        """Test Brazilian comedian prompt generation."""
        with patch.object(agent, 'generate_video') as mock_generate:
            mock_generate.return_value = {'success': True}
            
            result = await agent.generate_with_brazilian_comedian_prompt()
            
            mock_generate.assert_called_once()
            args = mock_generate.call_args[0]
            assert 'Brazilian comedian' in args[0]
            assert 'silver chain' in args[0]
            assert 'Tenha 10 vezes mais resultados' in args[0]
    
    @pytest.mark.asyncio
    async def test_process_veo3_request_generate(self, agent):
        """Test processing generate request."""
        with patch.object(agent, 'generate_video') as mock_generate:
            mock_generate.return_value = {'success': True}
            
            result = await agent.process_veo3_request('generate', {'prompt': 'test'})
            
            assert result['success'] is True
            mock_generate.assert_called_once_with('test', 'standard', None)
    
    @pytest.mark.asyncio
    async def test_process_veo3_request_invalid_action(self, agent):
        """Test processing invalid request action."""
        result = await agent.process_veo3_request('invalid_action', {})
        
        assert result['success'] is False
        assert 'Unknown action' in result['error']
        assert 'available_actions' in result


class TestVeo3AgentExecutor:
    """Test cases for the Veo3AgentExecutor class."""
    
    @pytest.fixture
    def executor(self):
        """Create a Veo3AgentExecutor instance for testing."""
        return Veo3AgentExecutor()
    
    def test_executor_initialization(self, executor):
        """Test executor initialization."""
        assert executor.agent_id == "veo3_agent"
        assert executor.version == "1.0.0"
        assert executor.status == "ready"
        assert isinstance(executor.agent, Veo3Agent)
    
    @pytest.mark.asyncio
    async def test_get_capabilities(self, executor):
        """Test getting executor capabilities."""
        capabilities = await executor.get_capabilities()
        
        assert capabilities['agent_id'] == "veo3_agent"
        assert capabilities['agent_type'] == "video_generation"
        assert 'video_generation' in capabilities['capabilities']
        assert 'generate' in capabilities['supported_actions']
    
    @pytest.mark.asyncio
    async def test_get_status(self, executor):
        """Test getting executor status."""
        status = await executor.get_status()
        
        assert status['agent_id'] == "veo3_agent"
        assert status['status'] == "ready"
        assert status['health'] == "healthy"
        assert 'uptime' in status
    
    @pytest.mark.asyncio
    async def test_execute_task_success(self, executor):
        """Test successful task execution."""
        with patch.object(executor.agent, 'process_veo3_request') as mock_process:
            mock_process.return_value = {'success': True, 'result': 'test'}
            
            task = {
                'action': 'generate',
                'params': {'prompt': 'test'},
                'task_id': 'test-task'
            }
            
            result = await executor.execute(task)
            
            assert result['success'] is True
            assert result['task_id'] == 'test-task'
            assert result['agent_id'] == "veo3_agent"
    
    @pytest.mark.asyncio
    async def test_execute_task_failure(self, executor):
        """Test task execution failure."""
        with patch.object(executor.agent, 'process_veo3_request') as mock_process:
            mock_process.side_effect = Exception("Test error")
            
            task = {
                'action': 'generate',
                'params': {'prompt': 'test'},
                'task_id': 'test-task'
            }
            
            result = await executor.execute(task)
            
            assert result['success'] is False
            assert 'error' in result
            assert executor.status == "error"
    
    @pytest.mark.asyncio
    async def test_handle_message_task(self, executor):
        """Test handling task message."""
        with patch.object(executor, 'execute') as mock_execute:
            mock_execute.return_value = {'success': True}
            
            message = {'type': 'task', 'action': 'generate'}
            result = await executor.handle_message(message)
            
            assert result['success'] is True
            mock_execute.assert_called_once_with(message)
    
    @pytest.mark.asyncio
    async def test_handle_message_capabilities(self, executor):
        """Test handling capabilities message."""
        message = {'type': 'capabilities'}
        result = await executor.handle_message(message)
        
        assert 'agent_id' in result
        assert 'capabilities' in result
    
    @pytest.mark.asyncio
    async def test_handle_message_ping(self, executor):
        """Test handling ping message."""
        message = {'type': 'ping'}
        result = await executor.handle_message(message)
        
        assert result['success'] is True
        assert result['message'] == 'pong'
    
    @pytest.mark.asyncio
    async def test_handle_message_unknown_type(self, executor):
        """Test handling unknown message type."""
        message = {'type': 'unknown'}
        result = await executor.handle_message(message)
        
        assert result['success'] is False
        assert 'Unknown message type' in result['error']
    
    def test_cleanup_operation(self, executor):
        """Test operation cleanup."""
        # Add an operation
        executor.active_operations['test-task'] = {'status': 'running'}
        
        # Cleanup the operation
        result = executor.cleanup_operation('test-task')
        
        assert result is True
        assert 'test-task' not in executor.active_operations
    
    def test_get_operation_info(self, executor):
        """Test getting operation info."""
        # Add an operation
        operation_info = {'status': 'running', 'operation_id': 'test-op'}
        executor.active_operations['test-task'] = operation_info
        
        # Get operation info
        result = executor.get_operation_info('test-task')
        
        assert result == operation_info
    
    def test_get_presets(self, executor):
        """Test getting presets from executor."""
        presets = executor.get_presets()
        
        assert 'presets' in presets
        assert 'default' in presets


class TestIntegration:
    """Integration tests for the complete Veo3 agent system."""
    
    @pytest.mark.asyncio
    @pytest.mark.integration
    async def test_full_workflow_simulation(self):
        """Test complete workflow from task to result."""
        executor = Veo3AgentExecutor()
        
        # Mock the agent's API calls
        with patch.object(executor.agent, '_get_access_token') as mock_token, \\
             patch('agent.aiohttp.ClientSession.post') as mock_post:
            
            # Setup mocks
            mock_token.return_value = 'test-token'
            
            # Mock generation response
            mock_gen_response = Mock()
            mock_gen_response.status = 200
            mock_gen_response.json = AsyncMock(return_value={
                'name': 'operations/test-operation-123'
            })
            
            # Mock status response
            mock_status_response = Mock()
            mock_status_response.status = 200
            mock_status_response.json = AsyncMock(return_value={
                'done': True,
                'response': {'predictions': [{'bytesBase64Encoded': 'dGVzdA=='}]}
            })
            
            mock_post.return_value.__aenter__.side_effect = [
                mock_gen_response,  # For generation
                mock_status_response,  # For status check
                mock_status_response   # For fetch
            ]
            
            # Step 1: Generate video
            gen_task = {
                'type': 'task',
                'action': 'generate',
                'params': {'prompt': 'Test video prompt'},
                'task_id': 'test-gen-001'
            }
            
            gen_result = await executor.handle_message(gen_task)
            assert gen_result['success'] is True
            
            operation_id = gen_result['result']['operation_id']
            
            # Step 2: Check status
            status_task = {
                'type': 'task',
                'action': 'status',
                'params': {'operation_id': operation_id},
                'task_id': 'test-status-001'
            }
            
            status_result = await executor.handle_message(status_task)
            assert status_result['success'] is True
            assert status_result['result']['done'] is True
            
            # Step 3: Fetch results
            with tempfile.TemporaryDirectory() as temp_dir:
                with patch('pathlib.Path.cwd', return_value=Path(temp_dir)):
                    fetch_task = {
                        'type': 'task',
                        'action': 'fetch',
                        'params': {'operation_id': operation_id},
                        'task_id': 'test-fetch-001'
                    }
                    
                    fetch_result = await executor.handle_message(fetch_task)
                    assert fetch_result['success'] is True
                    assert fetch_result['result']['video_count'] == 1


class TestPerformance:
    """Performance and load tests."""
    
    @pytest.mark.asyncio
    @pytest.mark.slow
    async def test_concurrent_operations(self):
        """Test handling multiple concurrent operations."""
        executor = Veo3AgentExecutor()
        
        # Mock the agent's process method
        async def mock_process(action, params):
            await asyncio.sleep(0.1)  # Simulate processing time
            return {'success': True, 'operation_id': f'op-{hash(params.get("prompt", ""))}'}
        
        with patch.object(executor.agent, 'process_veo3_request', side_effect=mock_process):
            tasks = []
            for i in range(10):
                task = {
                    'type': 'task',
                    'action': 'generate',
                    'params': {'prompt': f'Test prompt {i}'},
                    'task_id': f'test-task-{i}'
                }
                tasks.append(executor.handle_message(task))
            
            # Execute all tasks concurrently
            results = await asyncio.gather(*tasks)
            
            # Verify all tasks completed successfully
            for result in results:
                assert result['success'] is True
                assert 'operation_id' in result['result']


# Fixtures and utilities for testing
@pytest.fixture
def sample_video_data():
    """Sample base64 encoded video data for testing."""
    return "UklGRigAAABXRUJQVlA4IBwAAAAwAQCdASoBAAEAL/"  # Minimal WebP header


@pytest.fixture
def mock_gcloud_auth():
    """Mock gcloud authentication."""
    with patch('agent.subprocess.run') as mock_run:
        mock_run.return_value.stdout = 'test-access-token'
        mock_run.return_value.returncode = 0
        yield mock_run


# Test configuration
def pytest_configure(config):
    """Configure pytest with custom markers."""
    config.addinivalue_line(
        "markers", "integration: mark test as integration test"
    )
    config.addinivalue_line(
        "markers", "slow: mark test as slow running"
    )
    config.addinivalue_line(
        "markers", "api: mark test as requiring API access"
    )


if __name__ == "__main__":
    pytest.main([__file__, "-v"])