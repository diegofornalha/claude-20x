# 🛠️ DiegoTools MCP Server
claude mcp add DiegoTools /Users/agents/Desktop/codex/claude-code-10x/mcp-run-ts-tools/run.sh -s user


### Claude Code CLI
```bash
cd /mcp-run-ts-tools
npm install && npm run build
claude mcp add DiegoTools "node $(pwd)/build/index.js"
```

### Com todas as variáveis de ambiente
```bash
claude mcp add DiegoTools /mcp-run-ts-tools/run.sh -s user
```

## 📋 Ferramentas Disponíveis

### 🌐 Puppeteer (5 ferramentas)
- `puppeteer_navigate` - Navega para URLs
- `puppeteer_screenshot` - Captura screenshots
- `puppeteer_click` - Clica em elementos
- `puppeteer_type` - Digita texto
- `puppeteer_get_content` - Extrai HTML


### 🤖 Claude Execute (1 ferramenta)
- Executa Claude Code com capacidades completas
- Operações de arquivo avançadas
- Workflows multi-etapas

## 🔧 Configuração

## 💻 Desenvolvimento

### Requisitos
- Node.js 18+
- TypeScript 5.3.3+
- npm ou yarn

### Setup
```bash
# Instalar dependências
npm install

# Compilar TypeScript
npm run build

# Modo desenvolvimento
npm run dev
```

### Testes
```bash
# Executar testes
npm test

# Testes com coverage
npm run test:coverage

# Modo watch
npm run test:watch
```

## 📚 Exemplos de Uso

### Automação Web
```javascript
// Capturar screenshot
await puppeteer_navigate({ url: "https://example.com" });
await puppeteer_screenshot({ path: "example.png" });
```

### GitHub Integration
```javascript
// Criar issue
await github_create_issue({
  owner: "phiz",
  repo: "diego-tools",
  title: "Bug Report",
  body: "Descrição do problema..."
});
```

### Docker Management
```javascript
// Criar container
await docker_create_container({
  image: "nginx:latest",
  name: "web-server",
  ports: { "80": "8080" }
});
```

### Claude Execute
```javascript
// Análise complexa de código
await claude_execute({
  prompt: "Analise e refatore o arquivo app.js",
  workFolder: "/projeto"
});
```

## 🏗️ Arquitetura

### Stack Tecnológica
- **TypeScript** com strict mode
- **@modelcontextprotocol/sdk** para MCP
- **Puppeteer** para automação web
- **Octokit** para GitHub API
- **Zod** para validação
- **Jest** para testes
