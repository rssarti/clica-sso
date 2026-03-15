# Dockerfile para o backend NestJS
FROM node:22-alpine

# Diretório de trabalho
WORKDIR /app

# Copiar arquivos de dependências
COPY package.json pnpm-lock.yaml ./

# Instalar pnpm e dependências
RUN npm install -g pnpm
RUN pnpm install

# Copiar código fonte
COPY . .

# Compilar o projeto
RUN pnpm build

# Expor a porta
EXPOSE 3000

# Comando para iniciar a aplicação
CMD ["pnpm", "start:prod"]
