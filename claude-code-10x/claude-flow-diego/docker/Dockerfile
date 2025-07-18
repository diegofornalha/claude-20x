# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./

# Instalar todas as dependências (incluindo dev)
RUN npm ci

# Copiar código fonte
COPY . .

# Build da aplicação (se tiver script de build)
# RUN npm run build

# Runtime stage
FROM node:20-alpine

# Instalar dependências do sistema
RUN apk add --no-cache \
    git \
    openssh-client \
    bash

# Criar usuário não-root
RUN addgroup -g 1001 agent && \
    adduser -D -u 1001 -G agent agent

WORKDIR /app

# Copiar apenas o necessário do build stage
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/src ./src
COPY --from=builder /app/tsconfig.json ./

# Instalar tsx para runtime TypeScript
RUN npm install tsx typescript @types/node

# Criar diretório de trabalho
RUN mkdir -p /workspace && chown -R 1001:1001 /workspace

# Configurar Git
RUN git config --global --add safe.directory /workspace && \
    git config --global user.name "Auto Commit Agent" && \
    git config --global user.email "agent@auto-commit.local" && \
    git config --global init.defaultBranch main

# Script de entrada
COPY scripts/docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Mudar para usuário não-root
USER agent

# Volume para o workspace
VOLUME ["/workspace"]

# Usar script de entrada
ENTRYPOINT ["/docker-entrypoint.sh"]

# Comando padrão
CMD ["npm", "run", "auto-commit-docker"]