# A2A Agent Interface - Offline First

Migração do projeto UI original para uma arquitetura offline-first moderna.

## 🏗️ Arquitetura

### Frontend (React + TypeScript)
- **Framework**: React 18 + TypeScript
- **Build**: Vite
- **Estado**: Zustand
- **Estilo**: Tailwind CSS
- **PWA**: Service Worker + Manifest

### Backend (Node.js + TypeScript)  
- **Framework**: Fastify
- **Database**: PGlite (PostgreSQL local)
- **Validação**: Zod
- **APIs**: REST simples

## 🚀 Como Executar

### Desenvolvimento

```bash
# Frontend
cd frontend
npm install
npm run dev  # http://localhost:3000

# Backend
cd backend
npm install
npm run dev  # http://localhost:8000
```

### Produção

```bash
# Frontend
cd frontend
npm run build
npm run preview

# Backend  
cd backend
npm run build
npm start
```

## 📁 Estrutura do Projeto

```
app_todos_bd_tasks/
├── frontend/                 # React + TypeScript
│   ├── src/
│   │   ├── components/      # Componentes React
│   │   ├── pages/           # Páginas da aplicação
│   │   ├── store/           # Estado global (Zustand)
│   │   ├── services/        # APIs e serviços
│   │   └── types/           # Tipos TypeScript
│   ├── public/              # Arquivos estáticos
│   └── package.json
├── backend/                  # Node.js + Fastify
│   ├── src/
│   │   ├── database.ts      # PGlite setup
│   │   ├── server.ts        # Fastify server
│   │   └── types.ts         # Tipos compartilhados
│   └── package.json
└── README.md
```

## 🔄 Migração Realizada

### ✅ Componentes Convertidos
- [x] ChatBubble (Mesop → React)
- [x] ConversationList (Mesop → React)
- [x] HomePage (Mesop → React)
- [x] AppStore (Estado global com Zustand)

### ✅ Backend Simplificado
- [x] APIs REST com Fastify
- [x] Persistência local com PGlite
- [x] Validação com Zod
- [x] CORS configurado

### ✅ Setup de Build
- [x] Vite + TypeScript
- [x] Tailwind CSS
- [x] PWA configurado
- [x] Service Worker

## 🎯 Funcionalidades Offline-First

### Frontend
- **PWA**: Instalável e funciona offline
- **Cache Local**: Service Worker para cache de assets
- **Estado Persistido**: Zustand com localStorage
- **Fallback Offline**: APIs falham graciosamente

### Backend  
- **Database Local**: PGlite não precisa de servidor
- **APIs Simples**: RESTful sem dependências externas
- **Backup**: Dados ficam em arquivo local

## 🔧 Próximos Passos

### Páginas Pendentes
- [ ] Conversation Page
- [ ] Agents Page  
- [ ] Events Page
- [ ] Settings Page
- [ ] Tasks Page

### Funcionalidades Avançadas
- [ ] Sync online/offline
- [ ] Simulação de agentes
- [ ] Import/Export de dados
- [ ] Temas customizáveis

## 📊 Comparação: Antes vs Depois

| Aspecto | Antes (UI) | Depois (Offline-First) |
|---------|------------|------------------------|
| **Frontend** | Mesop (Python) | React + TypeScript |
| **Backend** | FastAPI + Google ADK | Fastify + PGlite |
| **Database** | Em memória | PostgreSQL local |
| **Dependências** | Google APIs, A2A, MCP | Nenhuma externa |
| **Modo Offline** | ❌ Não funciona | ✅ Totalmente funcional |
| **Performance** | Depende da rede | ⚡ Ultra rápido |
| **Complexidade** | Alta (distribuído) | Baixa (monolítico) |

## 🛠️ Tecnologias Utilizadas

### Frontend
- React 18
- TypeScript 5
- Vite 4
- Zustand 4
- Tailwind CSS 3
- React Router 6
- React Markdown 9

### Backend
- Node.js 20
- Fastify 4  
- PGlite 0.1
- TypeScript 5
- Zod 3
- UUID 9

### DevTools
- ESLint
- Prettier
- Vitest
- TSX (dev server)

## 📝 Comandos Úteis

```bash
# Instalar tudo
npm run setup

# Desenvolvimento paralelo
npm run dev:all

# Build completo
npm run build:all

# Testes
npm run test

# Lint
npm run lint

# Reset database
npm run db:reset
```

Esta migração transforma um sistema distribuído complexo em uma aplicação offline-first simples e eficiente, mantendo a funcionalidade essencial de interface de agentes.