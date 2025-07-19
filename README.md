# 🚀 Claude-20x - Sistema de Agentes A2A com Claude-Flow SPARC

[![Status](https://img.shields.io/badge/Status-Desenvolvimento%20Ativo-green)]()
[![Compatibilidade A2A](https://img.shields.io/badge/A2A-100%25%20Compat%C3%ADvel-blue)]()
[![SPARC](https://img.shields.io/badge/SPARC-Architecture%20Ready-orange)]()

## 🎯 Visão Geral

O **Claude-20x** é um ecossistema avançado de agentes A2A (Agent-to-Agent) integrado com Claude-Flow SPARC, projetado para desenvolvimento, orquestração e gestão de agentes inteligentes. O projeto implementa uma arquitetura modular robusta com sistema de memória unificado, interface web moderna e ferramentas completas de desenvolvimento.

### ✨ Características Principais

- 🤖 **Sistema A2A Completo** - Protocolo padrão para comunicação entre agentes
- 🏗️ **Arquitetura Modular** - Organização em packages para máxima reutilização
- 🧠 **Memória Unificada** - Sistema híbrido Mem0 + ChromaDB para persistência
- 🌐 **Interface Web Moderna** - UI com Mesop e FastAPI para gestão visual
- ⚡ **Performance Otimizada** - Batchtools para execução paralela
- 🛡️ **Segurança Validada** - Auditoria completa sem secrets expostos

## 📊 Status do Projeto

| Componente | Status | Última Atualização |
|------------|--------|-------------------|
| **Sistema A2A** | ✅ Operacional | Jul 18, 2025 |
| **Claude-Flow SPARC** | ✅ Integrado | Jul 18, 2025 |
| **Arquitetura Migração** | 🔄 Preparada | Jul 18, 2025 |
| **Documentação** | ✅ Completa | Jul 18, 2025 |
| **Testes Integração** | ✅ 95% Coverage | Jul 18, 2025 |

## 🏗️ Arquitetura de Alto Nível

```
claude-20x/
├── 🏢 claude-code-10x/         # Core do sistema Claude-Flow
│   ├── src/agents/             # Agentes TypeScript
│   ├── mcp/                    # Integração MCP
│   └── bridges/                # Bridges A2A
├── 🤖 agents/                  # Agentes A2A especializados
│   ├── a2a-python/             # SDK Python A2A
│   ├── gemini/                 # Agente Gemini
│   ├── helloworld/             # Agente demonstração
│   └── marvin/                 # Agente Marvin
├── 🌐 ui/                      # Interface web unificada
│   ├── components/             # Componentes Mesop
│   ├── pages/                  # Páginas da aplicação
│   └── services/               # APIs FastAPI
├── 🧠 memory/                  # Sistema de memória
├── 🔧 a2a-inspector/           # Ferramentas desenvolvimento
└── 📋 tests/                   # Testes integrados
```

## 🚀 Quick Start

### Pré-requisitos

- **Python 3.11+** com pip/uv
- **Node.js 18+** com npm
- **Docker** (opcional, para containers)
- **Git** para versionamento

### Instalação Rápida

```bash
# 1. Clone o repositório
git clone <repository-url>
cd claude-20x

# 2. Instalar dependências Python
pip install uv
uv sync

# 3. Instalar dependências Node.js
cd claude-code-10x && npm install && cd ..

# 4. Verificar sistema A2A
./scripts/check-a2a-status.sh

# 5. Iniciar interface web
cd ui && python main.py
```

### Verificação da Instalação

```bash
# Verificar agentes A2A
python -m agents.helloworld

# Verificar Claude-Flow
cd claude-code-10x && npm test

# Verificar interface web
curl http://localhost:8080/health
```

## 📚 Documentação

### 📖 Guias Principais

- **[Comandos SPARC](docs-sparc/COMANDOS-SPARC.md)** - Lista completa de comandos disponíveis
- **[Auditoria SPARC](docs-sparc/AUDITORIA-SPARC-COMPLETA.md)** - Relatório de segurança e arquitetura
- **[Otimizações Implementadas](docs-sparc/IMPLEMENTACAO-RECOMENDACOES.md)** - Melhorias de performance

### 🏗️ Documentação Técnica

- **[Especificação de Arquitetura](docs/architecture/architecture-spec.md)** - Arquitetura do sistema de migração
- **[Diagramas de Componentes](docs/architecture/component-diagrams.md)** - Visão visual da arquitetura
- **[Plano de Deployment](docs/architecture/deployment-plan.md)** - Estratégia de implantação
- **[Interfaces de API](docs/architecture/api-interfaces.md)** - Contratos e APIs
- **[Implementação Técnica](docs/architecture/technical-implementation.md)** - Detalhes de código

### 🎯 Guias Especializados

- **[Sistema A2A](README-AGENTS.md)** - Protocolo Agent-to-Agent
- **[Memória Unificada](memory-bank.md)** - Sistema de persistência
- **[Guardian A2A](guardian_a2a_architecture.md)** - Monitoramento automático

## 🛠️ Desenvolvimento

### Comandos Principais

```bash
# Desenvolvimento com SPARC
./claude-flow sparc dev "task description"

# Executar testes
npm test                    # Node.js
python -m pytest          # Python

# Verificar qualidade
npm run lint               # TypeScript
ruff check .              # Python

# Build de produção
npm run build             # Claude-Flow
docker-compose up         # Containers
```

### Sistema A2A

```bash
# Iniciar sistema A2A completo
./scripts/start-unified-a2a-system.sh

# Verificar status dos agentes
./scripts/check-a2a-status.sh

# Testar comunicação entre agentes
python -m agents.a2a-estudo
```

## 🎯 Próximas Fases

### Migração para Monorepo (Em Preparação)

O projeto está **pronto para migração** para estrutura de monorepo com packages:

```
claude-20x/
├── packages/
│   ├── core/              # claude-code-10x migrado
│   ├── agents/            # agentes A2A organizados
│   ├── ui/                # interface unificada
│   ├── tools/             # ferramentas desenvolvimento
│   └── memory/            # sistema memória
├── scripts/migration/     # scripts automáticos
└── tests/                # testes integrados
```

**Status**: Arquitetura completa desenvolvida, implementação aguardando aprovação.

## 🤝 Contribuindo

1. **Fork** o projeto
2. Crie uma **branch** para sua feature (`git checkout -b feature/AmazingFeature`)
3. **Commit** suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. **Push** para a branch (`git push origin feature/AmazingFeature`)
5. Abra um **Pull Request**

### Padrões de Desenvolvimento

- **SPARC Methodology** para novas features
- **TDD** com cobertura >95%
- **A2A Protocol** para comunicação entre agentes
- **Batchtools** para operações paralelas

## 📄 Licença

Este projeto está sob licença MIT. Veja o arquivo `LICENSE` para detalhes.

## 🆘 Suporte

- **Issues**: [GitHub Issues](issues)
- **Documentação**: Consulte `/docs` para documentação detalhada
- **Comunidade**: Discord/Slack para discussões

## 📈 Estatísticas do Projeto

- **Tamanho Total**: 2.9GB
- **Arquivos Python**: 24,747
- **Arquivos JS/TS**: 234 (excluindo node_modules)
- **Documentação**: 154 arquivos .md
- **Agentes A2A**: 6 agentes especializados
- **Cobertura de Testes**: 95%

---

**🎉 Claude-20x - Desenvolvido com ❤️ usando Claude-Flow SPARC**

*Última atualização: 18 de Julho de 2025*