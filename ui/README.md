# A2A Python Example UI

Interface de usuário para o sistema Agent2Agent (A2A) com integração MCP e suporte a múltiplos agentes.

## Instalação

```bash
uv pip install -e .
```

## Execução

```bash
GOOGLE_API_KEY="sua-chave-api" uv run main.py
```

## Funcionalidades

- Interface web com Mesop
- Integração com sistema A2A
- Suporte a múltiplos agentes
- Descoberta automática de agentes
- Comunicação via MCP
- Interface de chat com emojis

## Estrutura

- `main.py` - Aplicação principal
- `pages/` - Páginas da interface
- `components/` - Componentes reutilizáveis
- `state/` - Gerenciamento de estado
- `service/` - Serviços backend
- `a2a_mcp/` - Integração MCP