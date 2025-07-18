# A2A Agent - Agent-to-Agent Communication Hub

O **A2A Agent** é um agente especializado em facilitar a comunicação e coordenação entre diferentes agentes no ecossistema A2A (Agent-to-Agent). Ele atua como um hub central que gerencia descoberta de serviços, roteamento de mensagens, e orquestração de tarefas multi-agente.

## 🎯 Principais Funcionalidades

### 🔍 **Agent Discovery & Registry**
- Descoberta automática de agentes ativos na rede
- Manutenção de registry centralizado de agentes
- Monitoramento de status e disponibilidade

### 📤 **Message Routing**
- Roteamento inteligente de mensagens entre agentes
- Fila de mensagens com rastreamento de status
- Suporte a diferentes protocolos de comunicação

### 🎯 **Multi-Agent Coordination**
- Coordenação de tarefas que requerem múltiplos agentes
- Orquestração de workflows complexos
- Gestão de dependências entre agentes

### 🏥 **Health Monitoring**
- Monitoramento contínuo da saúde dos agentes
- Detecção de falhas e recuperação automática
- Métricas de performance e disponibilidade

### 🛠️ **Capability Management**
- Mapeamento de capacidades de cada agente
- Descoberta de serviços baseada em capacidades
- Balanceamento de carga entre agentes similares

## 🚀 Como Usar

### Instalação
```bash
cd /Users/agents/Desktop/codex/agents/a2a
pip install -e .
```

### Execução Interativa
```bash
python -m a2a_agent --interactive
```

### Comandos Disponíveis

#### 🔍 Descoberta de Agentes
```
discovery          # Descobre agentes ativos na rede
registry           # Lista todos os agentes registrados
capabilities       # Lista capacidades de todos os agentes
```

#### 📤 Roteamento de Mensagens
```
route [mensagem] to [agente]                    # Roteia mensagem para agente específico
send status check to guardian                   # Exemplo: envia para Guardian
route hello world to helloworld               # Exemplo: envia para HelloWorld
```

#### 🎯 Coordenação Multi-Agente
```
coordinate [tarefa]                            # Inicia coordenação entre múltiplos agentes
coordinate health analysis                     # Exemplo: análise de saúde
coordinate data extraction and monitoring      # Exemplo: extração + monitoramento
```

#### 📊 Status e Monitoramento
```
health             # Verifica health de todos os agentes
status             # Relatório de status do A2A Agent
help               # Lista todos os comandos disponíveis
```

## 🏗️ Arquitetura

### Componentes Principais

1. **A2AAgent**: Classe principal que implementa toda a lógica de coordenação
2. **A2AAgentExecutor**: Executor que implementa a interface do sistema a2a-python
3. **Agent Registry**: Sistema de registro e descoberta de agentes
4. **Message Queue**: Fila de mensagens para roteamento
5. **Coordination Engine**: Motor de coordenação multi-agente

### Padrões de Coordenação Suportados

- **Sequential**: Execução sequencial de tarefas
- **Parallel**: Execução paralela independente
- **Conditional**: Execução baseada em condições
- **Pipeline**: Execução em pipeline com dependências

## 🔧 Configuração

O arquivo `a2a-config.json` contém todas as configurações do agente:

```json
{
  "a2a_configuration": {
    "agent_name": "a2a_agent",
    "agent_type": "coordinator",
    "capabilities": [
      "agent_discovery",
      "message_routing",
      "multi_agent_coordination",
      "health_monitoring"
    ],
    "registry": {
      "known_agents": {
        "guardian": {
          "url": "http://localhost:9999",
          "capabilities": ["sustainability", "monitoring", "health_check"]
        },
        "helloworld": {
          "url": "http://localhost:9998",
          "capabilities": ["hello", "basic_tasks"]
        },
        "marvin": {
          "url": "http://localhost:9997",
          "capabilities": ["extraction", "analysis", "marvin_tasks"]
        }
      }
    }
  }
}
```

## 🧪 Testes

### Executar Testes
```bash
# Testes com pytest
pytest test_a2a_agent.py -v

# Teste simples integrado
python test_a2a_agent.py
```

### Exemplos de Teste

```python
# Teste básico de funcionalidade
agent = A2AAgent()
result = await agent.process_a2a_request("discovery", "test_context")
assert result["success"] is True
```

## 📊 Métricas e Monitoramento

O A2A Agent fornece métricas abrangentes:

- **Agentes Descobertos**: Número de agentes ativos
- **Mensagens Roteadas**: Volume de mensagens processadas
- **Coordenações Ativas**: Tarefas multi-agente em andamento
- **Health Status**: Status de saúde de todos os agentes
- **Performance**: Tempo de resposta e throughput

## 🔗 Integração com Outros Agentes

### Guardian Agent
- Monitoramento de sustentabilidade
- Health checks especializados
- Controle de entropia

### HelloWorld Agent  
- Tarefas básicas de validação
- Testes de conectividade
- Operações simples

### Marvin Agent
- Extração e análise de dados
- Processamento de informações
- Tarefas especializadas

## 🛡️ Segurança

- **Rate Limiting**: Proteção contra spam de mensagens
- **Message Validation**: Validação de formato e conteúdo
- **Agent Verification**: Verificação de identidade (futuro)
- **Encryption**: Suporte para comunicação criptografada (futuro)

## 🚧 Roadmap

### Versão 1.1
- [ ] Interface web para monitoramento
- [ ] APIs RESTful para integração externa
- [ ] Suporte a WebSockets para comunicação real-time

### Versão 1.2
- [ ] Machine Learning para otimização de roteamento
- [ ] Auto-scaling de agentes baseado em demanda
- [ ] Suporte a agentes distribuídos geograficamente

### Versão 1.3
- [ ] Blockchain para auditoria de coordenações
- [ ] AI-powered task orchestration
- [ ] Cross-platform agent discovery

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -am 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 👥 Autores

- **Diego** - Desenvolvimento inicial e arquitetura

## 🙏 Agradecimentos

- Equipe do sistema a2a-python
- Comunidade de desenvolvedores de agentes IA
- Contribuidores do projeto claude-flow

---

**💡 Dica**: Para melhor experiência, use o A2A Agent junto com outros agentes do ecossistema para criar workflows poderosos de coordenação multi-agente!