"""
Testes para o A2A Agent - Agent-to-Agent Communication Hub

Testa as principais funcionalidades do agente de coordenação.
"""

import asyncio
import pytest
from unittest.mock import AsyncMock, Mock, patch
from datetime import datetime

from agent import A2AAgent


class TestA2AAgent:
    """Testes para a classe A2AAgent."""
    
    @pytest.fixture
    def agent(self):
        """Fixture que cria uma instância do A2AAgent para os testes."""
        return A2AAgent()
    
    @pytest.mark.asyncio
    async def test_agent_initialization(self, agent):
        """Testa se o agente é inicializado corretamente."""
        assert agent.name == "A2A Agent"
        assert agent.version == "1.0.0"
        assert agent.status == "active"
        assert len(agent.agent_registry) == 3  # guardian, helloworld, marvin
        assert "guardian" in agent.agent_registry
        assert "helloworld" in agent.agent_registry
        assert "marvin" in agent.agent_registry
    
    @pytest.mark.asyncio
    async def test_discovery_command(self, agent):
        """Testa o comando de descoberta de agentes."""
        with patch('httpx.AsyncClient') as mock_client:
            # Mock de resposta HTTP bem-sucedida
            mock_response = Mock()
            mock_response.status_code = 200
            mock_client.return_value.__aenter__.return_value.get.return_value = mock_response
            
            result = await agent.process_a2a_request("discovery", "test_context")
            
            assert result["success"] is True
            assert "DESCOBERTA DE AGENTES A2A" in result["result"]
            assert result["is_task_complete"] is True
    
    @pytest.mark.asyncio
    async def test_registry_command(self, agent):
        """Testa o comando de listagem do registry."""
        result = await agent.process_a2a_request("registry", "test_context")
        
        assert result["success"] is True
        assert "REGISTRY DE AGENTES A2A" in result["result"]
        assert "GUARDIAN" in result["result"]
        assert "HELLOWORLD" in result["result"]
        assert "MARVIN" in result["result"]
    
    @pytest.mark.asyncio
    async def test_capabilities_command(self, agent):
        """Testa o comando de listagem de capacidades."""
        result = await agent.process_a2a_request("capabilities", "test_context")
        
        assert result["success"] is True
        assert "CAPACIDADES DOS AGENTES A2A" in result["result"]
        assert "sustainability" in result["result"]
        assert "extraction" in result["result"]
        assert "hello" in result["result"]
    
    @pytest.mark.asyncio
    async def test_status_command(self, agent):
        """Testa o comando de status do agente."""
        result = await agent.process_a2a_request("status", "test_context")
        
        assert result["success"] is True
        assert "A2A AGENT STATUS REPORT" in result["result"]
        assert agent.version in result["result"]
        assert "FACILITANDO COMUNICAÇÃO A2A" in result["result"]
    
    @pytest.mark.asyncio
    async def test_route_message_to_guardian(self, agent):
        """Testa o roteamento de mensagem para o Guardian."""
        query = "route status check to guardian"
        result = await agent.process_a2a_request(query, "test_context")
        
        assert result["success"] is True
        assert "MENSAGEM ROTEADA" in result["result"]
        assert "GUARDIAN" in result["result"]
        assert len(agent.message_queue) == 1
        assert agent.message_queue[0]["to"] == "guardian"
    
    @pytest.mark.asyncio
    async def test_route_message_invalid_agent(self, agent):
        """Testa roteamento para agente inexistente."""
        query = "route message to unknown_agent"
        result = await agent.process_a2a_request(query, "test_context")
        
        assert result["success"] is True
        assert "ERRO DE ROTEAMENTO" in result["result"]
    
    @pytest.mark.asyncio
    async def test_coordinate_multi_agent_task(self, agent):
        """Testa coordenação de tarefa multi-agente."""
        query = "coordinate health check analysis"
        result = await agent.process_a2a_request(query, "test_context")
        
        assert result["success"] is True
        assert "COORDENAÇÃO MULTI-AGENTE INICIADA" in result["result"]
        assert len(agent.coordination_history) == 1
        assert agent.coordination_history[0]["status"] == "initiated"
    
    @pytest.mark.asyncio
    async def test_health_check_with_mock(self, agent):
        """Testa health check com mock de respostas HTTP."""
        with patch('httpx.AsyncClient') as mock_client:
            # Mock de resposta HTTP bem-sucedida para alguns agentes
            mock_response_success = Mock()
            mock_response_success.status_code = 200
            
            mock_response_error = Mock()
            mock_response_error.status_code = 500
            
            # Guardian: sucesso, HelloWorld: erro, Marvin: exceção
            mock_client.return_value.__aenter__.return_value.get.side_effect = [
                mock_response_success,  # guardian
                mock_response_error,    # helloworld  
                Exception("Connection refused")  # marvin
            ]
            
            result = await agent.process_a2a_request("health", "test_context")
            
            assert result["success"] is True
            assert "HEALTH CHECK MULTI-AGENTE" in result["result"]
            assert "HEALTHY" in result["result"]
            assert "UNHEALTHY" in result["result"]
            assert "OFFLINE" in result["result"]
    
    @pytest.mark.asyncio
    async def test_help_command(self, agent):
        """Testa o comando de ajuda."""
        result = await agent.process_a2a_request("help", "test_context")
        
        assert result["success"] is True
        assert "A2A AGENT - COMANDOS DISPONÍVEIS" in result["result"]
        assert "discovery" in result["result"]
        assert "route" in result["result"]
        assert "coordinate" in result["result"]
    
    @pytest.mark.asyncio
    async def test_welcome_message(self, agent):
        """Testa a mensagem de boas-vindas."""
        result = await agent.process_a2a_request("hello", "test_context")
        
        assert result["success"] is True
        assert "BEM-VINDO AO A2A AGENT" in result["result"]
        assert "Agent Discovery" in result["result"]
        assert "Message Routing" in result["result"]
    
    @pytest.mark.asyncio
    async def test_error_handling(self, agent):
        """Testa o tratamento de erros."""
        # Força um erro substituindo um método
        original_method = agent._generate_status_report
        agent._generate_status_report = Mock(side_effect=Exception("Test error"))
        
        result = await agent.process_a2a_request("status", "test_context")
        
        # Restaura o método original
        agent._generate_status_report = original_method
        
        assert result["success"] is False
        assert "Erro no A2A Agent" in result["result"]
    
    def test_get_agent_role_in_task(self, agent):
        """Testa a função de definição de papéis de agentes."""
        role_guardian = agent._get_agent_role_in_task("guardian", "health check")
        role_marvin = agent._get_agent_role_in_task("marvin", "data analysis")
        role_unknown = agent._get_agent_role_in_task("unknown", "task")
        
        assert "sustentabilidade" in role_guardian.lower()
        assert "análise" in role_marvin.lower()
        assert role_unknown == "Suporte geral"


# Teste de integração simples
@pytest.mark.asyncio
async def test_full_workflow():
    """Teste de integração completo do workflow do A2A Agent."""
    agent = A2AAgent()
    
    # 1. Status inicial
    status_result = await agent.process_a2a_request("status", "workflow_test")
    assert status_result["success"] is True
    
    # 2. Descoberta de agentes
    discovery_result = await agent.process_a2a_request("discovery", "workflow_test")
    assert discovery_result["success"] is True
    
    # 3. Roteamento de mensagem
    route_result = await agent.process_a2a_request("route hello to helloworld", "workflow_test")
    assert route_result["success"] is True
    assert len(agent.message_queue) == 1
    
    # 4. Coordenação multi-agente
    coord_result = await agent.process_a2a_request("coordinate system analysis", "workflow_test")
    assert coord_result["success"] is True
    assert len(agent.coordination_history) == 1
    
    # 5. Verificação final de status
    final_status = await agent.process_a2a_request("status", "workflow_test")
    assert final_status["success"] is True
    assert "1" in final_status["result"]  # Deve mostrar 1 coordenação realizada


if __name__ == "__main__":
    # Executa um teste simples se o arquivo for executado diretamente
    async def run_simple_test():
        print("🧪 Executando teste simples do A2A Agent...")
        agent = A2AAgent()
        
        # Teste básico
        result = await agent.process_a2a_request("status", "simple_test")
        print("✅ Teste de status:", "✅ PASSOU" if result["success"] else "❌ FALHOU")
        
        # Teste de descoberta
        result = await agent.process_a2a_request("discovery", "simple_test")
        print("✅ Teste de discovery:", "✅ PASSOU" if result["success"] else "❌ FALHOU")
        
        print("🧪 Testes simples concluídos!")
    
    asyncio.run(run_simple_test())