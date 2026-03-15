# ===== DOCKERFILE PARA CLICA SSO FRONTEND =====
# Dockerfile multi-stage para otimizar tamanho da imagem final
# Stage 1: Build da aplicação React/Vite
FROM node:20-alpine AS builder

# Definir diretório de trabalho
WORKDIR /app

# Instalar pnpm globalmente
RUN npm install -g pnpm

# Copiar arquivos de dependências
COPY package.json pnpm-lock.yaml ./

# Instalar dependências (cache layer)
RUN pnpm install --frozen-lockfile

# Copiar código fonte
COPY . .

# Build da aplicação para produção
# As variáveis de ambiente VITE_* serão definidas em runtime
RUN pnpm run build

# ===== Stage 2: Produção com Nginx =====
FROM nginx:alpine AS production

# Instalar dependências necessárias
RUN apk add --no-cache gettext

# Copiar configuração nginx principal customizada
COPY nginx-main.conf /etc/nginx/nginx.conf

# Copiar configuração do site
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiar arquivos buildados do stage anterior
COPY --from=builder /app/dist /usr/share/nginx/html

# Criar diretórios necessários e ajustar permissões
RUN mkdir -p /tmp /var/cache/nginx/client_temp /var/cache/nginx/proxy_temp \
             /var/cache/nginx/fastcgi_temp /var/cache/nginx/uwsgi_temp \
             /var/cache/nginx/scgi_temp /var/log/nginx && \
    chown -R nginx:nginx /usr/share/nginx/html && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    chown -R nginx:nginx /etc/nginx/conf.d && \
    chmod -R 755 /var/cache/nginx && \
    chmod 777 /tmp

# Variáveis de ambiente padrão
ENV VITE_API_URL=https://api.clicatecnologia.com.br
ENV VITE_SSO_URL=https://accounts.clicatecnologia.com.br
ENV VITE_SOCKET_IO=https://accounts.clicatecnologia.com.br
ENV VITE_SOCKET_PATCH=/socket.io/

# Labels para metadados
LABEL maintainer="Clica Tecnologia"
LABEL description="Frontend SSO - Sistema de Single Sign-On"
LABEL version="1.0.0"

# Expor porta
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1

# Usuário para execução
USER nginx

# Comando de entrada - inicia nginx em foreground
CMD ["nginx", "-g", "daemon off;"]