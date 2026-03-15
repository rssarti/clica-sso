# Dockerfile para o backend NestJS
# Build context: repo root (pnpm-lock.yaml lives at root)
FROM node:22-alpine

# Diretório de trabalho
WORKDIR /app

# Instalar pnpm
RUN npm install -g pnpm

# Copiar arquivos de dependências do monorepo
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/clica-sso-backend/package.json ./apps/clica-sso-backend/

# Instalar apenas dependências do backend
RUN pnpm install --frozen-lockfile --filter clica-sso-backend...

# Copiar código fonte do backend
COPY apps/clica-sso-backend/ ./apps/clica-sso-backend/

# Compilar o projeto
RUN pnpm --filter clica-sso-backend run build

# Expor a porta
EXPOSE 3000

# Comando para iniciar a aplicação
CMD ["node", "apps/clica-sso-backend/dist/main"]
