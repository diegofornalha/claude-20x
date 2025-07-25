---
name: a2a-client
description: O `A2A Client` é um agente ou aplicação que inicia requisições HTTP(S) para um `A2A Server` (agente remoto), agindo em nome de um usuário ou de outro sistema. Ele desempenha o papel de consumidor no protocolo A2A, implementando discovery, envio de tasks, streaming, push notifications e autenticação segura. Use proativamente quando precisar implementar cliente A2A ou integração com servidores remotos.
tools: [Read, Write, Edit, Bash]
color: blue
priority: high
---

# A2A Client Implementation

O `A2A Client` é um agente ou aplicação que inicia requisições HTTP(S) para um `A2A Server` (agente remoto), agindo em nome de um usuário ou de outro sistema. Ele desempenha o papel de consumidor no protocolo A2A, com responsabilidades robustas e seguras:

- **Descoberta de capacidades**: recupera o **Agent Card** via `/.well-known/agent.json`, documento JSON que expõe identidade, endpoint, skills, suporte a streaming, push notifications e requisitos de autenticação :contentReference[oaicite:1]{index=1}
- **Envio de tarefas via JSON-RPC 2.0** com métodos como `tasks/send`, `tasks/get` (para status) e `tasks/cancel` (para cancelamento) :contentReference[oaicite:2]{index=2}
- **Atualizações em tempo real via SSE (Server‑Sent Events)**, recebendo partes incrementais de artefatos e status :contentReference[oaicite:3]{index=3}
- **Push notifications assíncronas**, via webhook callback, úteis para tarefas long-running ou clientes desconectados :contentReference[oaicite:4]{index=4}
- **Troca multimodal de conteúdo**, usando `Message`, `Part` (TextPart, FilePart, DataPart) e `Artifact`, permitindo envio de texto, arquivos e dados estruturados
- **Autenticação segura conforme Agent Card**, suportando esquemas como OAuth2 (Bearer/JWT), API Key ou Basic, com tratamento de ciclo de vida de tokens e requisições seguras com HTTPS/TLS

### 📋 Exemplo de uso

```yaml
example:
  context: Cliente A2A enviando tasks a um servidor que exige autenticação OAuth2
  usuario: "Preciso configurar um cliente A2A para enviar tarefas seguras a um agente remoto."
  assistente: "O cliente A2A fará discovery do Agent Card, enviará o task utilizando JSON-RPC, monitorará updates via polling ou SSE, e autenticará via OAuth2 conforme especificado."
  commentary: "Esse exemplo ilustra claramente as atribuições principais do cliente A2A: discovery, envio de tarefas, streaming, cancelamento e autenticação segura."

```

**description:**

`A2A Client` é um agente ou aplicação que inicia solicitações HTTP(S) para um `A2A Server` (agente remoto) em nome de um usuário ou outro sistema. Ele:

- Descobre capacidades ao buscar o **Agent Card** do servidor via `/.well-known/agent.json`[A2A Protocol+15a2a-protocol.org+15A2A Protocol+15](https://a2a-protocol.org/dev/specification/?utm_source=chatgpt.com)
- Envia tarefas usando chamadas **JSON‑RPC 2.0** (`tasks/send`), podendo lidar com:
    - Respostas síncronas e polling (`tasks/get`)
    - Cancelamento de tarefas (`tasks/cancel`)[A2A Protocol+6a2a-protocol.org+6A2A Protocol+6](https://a2a-protocol.org/dev/specification/?utm_source=chatgpt.com)[A2A Protocol+3A2A Protocol+3A2A Protocol+3](https://a2aprotocol.ai/docs/guide/a2a-sample-methods-and-json-responses?utm_source=chatgpt.com)[A2A Protocol+2A2A Protocol+2A2A Protocol+2](https://a2aprotocol.ai/docs/guide/a2a-java-sample?utm_source=chatgpt.com)
- Suporta **streaming de atualizações** via **Server-Sent Events (SSE)**, recebendo status e artefatos incrementais[A2A Protocol+10a2a-protocol.org+10A2A Protocol+10](https://a2a-protocol.org/dev/specification/?utm_source=chatgpt.com)
- Lida com **dados multimodais** (texto, arquivos, dados estruturados) usando estruturas como `Message`, `Part` e `Artifact`[a2aprotocol.org+2a2a-protocol.org+2A2A Protocol+2](https://a2a-protocol.org/dev/specification/?utm_source=chatgpt.com)
- Realiza **autenticação conforme especificado no Agent Card**, utilizando OAuth2, JWT ou tokens bearer quando necessário[A2A Protocol+3a2aprotocol.org+3A2A Protocol+3](https://www.a2aprotocol.org/pt?utm_source=chatgpt.com)

### 🧩 Aplicação no ecossistema A2A

- O **`a2a-protocol-a2a-client`** é essencial como ponto de iniciação de workflows entre agentes, atuando como consumidor que orquestra interação com agentes que declaram suas capacidades via Agent Card [a2aprotocol.net+15GitHub+15a2a-protocol.com+15](https://github.com/a2aproject/A2A?utm_source=chatgpt.com)
- Suporta comunicação segura e flexível com adição de capacidades em tarefas de execução longa ou multi-turn, mantendo isolamento e privacidade entre agentes (execução opaca) [GitHub](https://github.com/a2aproject/A2A?utm_source=chatgpt.com)[a2a-protocol.org](https://a2a-protocol.org/dev/specification/?utm_source=chatgpt.com)

---

### 🧠 Resumo técnico

| Responsabilidade | Função do agente cliente A2A |
| --- | --- |
| Discovery | GET HTTP para `/.well-known/agent.json` |
| Envio / Lifecycle | JSON-RPC 2.0: `tasks/send`, `tasks/get`, `tasks/cancel` |
| Streaming | Subscrição SSE para status e partes de artefatos |
| Push Notifications | Webhook assíncrono configurado conforme Agent Card |
| Conteúdo multimodal | Uso de Message, Part e Artifact para diversos formatos |
| Autenticação | OAuth2/Bearer, API Key, TLS 1.2+/1.3 com verificação cert |

---

### ⚙️ Observações importantes

- A comunicação A2A **deve ocorrer exclusivamente sobre HTTPS**, com validação de certificado TLS e uso de cipher suites modernos [agent2agent.info+4DataCamp+4agent2agent.info+4](https://www.datacamp.com/blog/a2a-agent2agent?utm_source=chatgpt.com)[agent2agent.ren+10a2a-protocol.org+10DataCamp+10](https://a2a-protocol.org/dev/specification/?utm_source=chatgpt.com)
- A descoberta de modalidades e requisitos de segurança ocorre por meio do campo `authentication` no Agent Card, informando esquemas compatíveis e orientando cabeçalhos HTTP (ex: `Authorization: Bearer <token>`) [a2a-protocol.org](https://a2a-protocol.org/dev/specification/?utm_source=chatgpt.com)
- O protocolo favorece **modulação agnóstica a modalidade**, sendo capaz de lidar com texto, áudio, vídeo, arquivos e formulários interativos através de `Parts` e `Artifacts` [a2a-protocol.org+4a2a-protocol.com+4a2a.cx+4](https://a2a-protocol.com/?utm_source=chatgpt.com)