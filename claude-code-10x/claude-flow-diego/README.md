# Claude Flow

Sistema autônomo de organização e automação para projetos de código.

## 🚀 Recursos

### 1. Organization Guardian Universal
Sistema de organização independente de projeto que mantém score de 100%.

```bash
npm run organize:universal
```

### 2. Análise de Agentes
Sistema de análise e otimização de agentes com monitoramento.

```bash
# Docker
docker compose --profile analytics up -d

# Local
npm run guardian
```

### 3. 🧠 Memória Persistente com Mem0
O Guardian agora possui memória persistente, permitindo:
- Aprender com decisões anteriores
- Lembrar estruturas bem-sucedidas
- Aplicar padrões em novos projetos

**Configuração:**
1. Configure `MEM0_API_KEY` em `../mcp-run-ts-tools/.env`
2. O Guardian usa user_id "guardian"

### 4. Docker Compose Unificado
Todos os serviços em um único arquivo com profiles:

```bash
# Executar perfil específico
docker compose --profile guardian up -d

# Executar todos os serviços
docker compose --profile full up -d
```

**Profiles disponíveis:**
- `guardian`: organization-guardian
- `analytics`: agent-log & analytics
- `monitor`: enhanced-monitor
- `analyze`: code-analyzer
- `dashboard`: metrics-dashboard
- `dev`: Todos os serviços de desenvolvimento
- `full`: Todos os serviços

## 📦 Instalação

```bash
npm install
```

## 🧪 Testes

```bash
# Testar memória
npx tsx src/test-guardian-memory.ts

# Testar organização
npm run organize:universal
```

## 🔧 Configuração

### Variáveis de Ambiente
Crie um arquivo `.env` com:

```env
# GitHub
GITHUB_TOKEN=seu_token

# Mem0 (opcional)
MEM0_API_KEY=sua_chave
```

## 📊 Métricas

O Guardian gera relatórios em `docs/ORGANIZATION-SCORE.md` com:
- Score de organização (0-100%)
- Estatísticas detalhadas
- Problemas encontrados
- Recomendações

## 🤖 Agentes Disponíveis

1. **Universal Organization Guardian**: Mantém projetos organizados
2. **Enhanced Monitor**: Monitora mudanças em tempo real
3. **Code Analyzer**: Analisa qualidade do código
4. **Metrics Dashboard**: Visualiza métricas do projeto

## 📝 Convenções de Organização

O Guardian mantém padrões de organização:
- **Estrutura**: Arquivos organizados em pastas apropriadas
- **Nomeação**: Convenções consistentes de nomenclatura
- **Documentação**: README e docs sempre atualizados
- **Duplicatas**: Eliminação automática de arquivos duplicados
- **A2A**: Compliance com protocolos Agent-to-Agent
- **Score**: Manutenção de 100% de organização

---

Desenvolvido com ❤️ para manter projetos sempre organizados.

## 🤖 Agent-to-Agent (A2A) Architecture

Este projeto utiliza o padrão Agent-to-Agent (A2A) para comunicação e coordenação entre agentes:

### Características A2A:
- **Multi-agente**: Suporte para múltiplos agentes especializados
- **Comunicação assíncrona**: Agentes se comunicam via protocolos padronizados
- **Task Management**: Sistema de gerenciamento de tarefas distribuído
- **MCP Integration**: Integração com Model Context Protocol

### Estrutura A2A:
- `agents/` - Definições de agentes especializados
- `a2a_servers/` - Servidores de comunicação A2A
- `mcp/` - Ferramentas e serviços MCP
- `.well-known/agent.json` - Configuração do agente principal

Para mais informações sobre A2A, consulte a documentação em `docs/`.
