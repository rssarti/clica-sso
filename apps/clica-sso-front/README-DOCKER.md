# 🐳 Docker Setup - Clica SSO Frontend

Este documento contém todas as instruções para configurar, buildar e deployar o frontend do Clica SSO usando Docker.

## 📋 Pré-requisitos

- Docker 20.10+
- Docker Compose 2.0+
- Node.js 18+ (apenas para desenvolvimento local)
- PNPM ou NPM

## 🏗️ Arquitetura Docker

O projeto utiliza uma arquitetura multi-stage:

1. **Builder Stage**: Node.js Alpine para build da aplicação
2. **Production Stage**: Nginx Alpine para servir os arquivos estáticos

### Estrutura de Arquivos Docker

```
clica-sso-front/
├── Dockerfile                 # Dockerfile principal multi-stage
├── docker-compose.yml         # Orquestração com Docker Compose
├── docker-entrypoint.sh       # Script de entrada customizado
├── .dockerignore              # Arquivos ignorados no build
├── .env.production            # Variáveis de produção
├── build-and-deploy.sh        # Script de build/deploy (Linux/Mac)
└── test-docker.ps1           # Script de build/deploy (Windows)
```

## 🚀 Quick Start

### Opção 1: Docker Compose (Recomendado)

```bash
# Clone e acesse o diretório
cd clica-sso-front

# Build e execução em uma linha
docker-compose up --build -d

# Verificar status
docker-compose ps

# Acessar logs
docker-compose logs -f frontend
```

### Opção 2: Docker Diretamente

```bash
# Build da imagem
docker build -t clica-sso-frontend:latest .

# Executar container
docker run -d \
  --name clica-sso-frontend \
  -p 3000:80 \
  --env-file .env.production \
  --restart unless-stopped \
  clica-sso-frontend:latest
```

### Opção 3: Scripts Automatizados

**Linux/Mac:**
```bash
# Tornar executável
chmod +x build-and-deploy.sh

# Build simples
./build-and-deploy.sh

# Build e deploy
./build-and-deploy.sh --deploy

# Build de produção
./build-and-deploy.sh --deploy
```

**Windows PowerShell:**
```powershell
# Build simples
.\test-docker.ps1

# Build e deploy
.\test-docker.ps1 -Deploy

# Build de produção
.\test-docker.ps1 -Deploy -Production

# Pular testes
.\test-docker.ps1 -Deploy -SkipTests
```

## ⚙️ Configuração

### Variáveis de Ambiente

O projeto suporta as seguintes variáveis de ambiente:

#### Aplicação (VITE_*)
```bash
VITE_API_URL=/api                                    # URL da API backend
VITE_SSO_URL=https://accounts.clicatecnologia.com.br # URL base do SSO
VITE_SOCKET_IO=https://accounts.clicatecnologia.com.br # Socket.IO server
VITE_SOCKET_PATCH=/socket.io/                        # Socket.IO path
```

#### Container
```bash
PORT=80                          # Porta interna do container
FRONTEND_PORT=3000              # Porta externa mapeada
BACKEND_URL=http://backend:3000 # URL do backend para proxy
NODE_ENV=production             # Ambiente de execução
```

#### Nginx (Opcional)
```bash
NGINX_HTTP_PORT=80              # Porta HTTP do proxy
NGINX_HTTPS_PORT=443            # Porta HTTPS do proxy
```

### Arquivos de Configuração

1. **`.env`** - Desenvolvimento local
2. **`.env.production`** - Produção
3. **`.env.example`** - Template de exemplo

## 🔧 Recursos do Dockerfile

### Multi-stage Build
- **Stage 1 (builder)**: Build da aplicação React/Vite
- **Stage 2 (production)**: Nginx Alpine otimizado

### Funcionalidades
- ✅ **Health Check**: Endpoint `/health` automático
- ✅ **Security Headers**: Configurações de segurança no Nginx
- ✅ **SPA Support**: Configuração para Single Page Application
- ✅ **Static Caching**: Cache otimizado para assets estáticos
- ✅ **API Proxy**: Proxy para backend via `/api`
- ✅ **WebSocket**: Suporte a Socket.IO
- ✅ **Non-root User**: Execução com usuário não privilegiado
- ✅ **Logs**: Logging estruturado

### Configuração Nginx

```nginx
# Health check
location /health {
    return 200 "healthy\\n";
}

# SPA fallback
location / {
    try_files $uri $uri/ /index.html;
}

# API proxy
location /api {
    proxy_pass ${BACKEND_URL};
    # ... headers de proxy
}

# WebSocket
location /socket.io/ {
    proxy_pass ${BACKEND_URL};
    # ... configuração WebSocket
}
```

## 🧪 Testes

### Health Check
```bash
# Teste manual
curl http://localhost:3000/health

# Dentro do container
docker exec clica-sso-frontend wget -qO- http://localhost/health
```

### Logs
```bash
# Docker Compose
docker-compose logs -f frontend

# Docker direto
docker logs -f clica-sso-frontend

# Logs do Nginx
docker exec clica-sso-frontend tail -f /var/log/nginx/access.log
```

### Performance
```bash
# Tamanho da imagem
docker images clica-sso-frontend

# Uso de recursos
docker stats clica-sso-frontend

# Informações do container
docker inspect clica-sso-frontend
```

## 🚀 Deploy

### Desenvolvimento Local
```bash
# Usando docker-compose
docker-compose -f docker-compose.yml up -d

# Acessar em http://localhost:3000
```

### Staging/Produção
```bash
# 1. Build da imagem
docker build -t clica-sso-frontend:v1.0.0 .

# 2. Tag para registry (se usar)
docker tag clica-sso-frontend:v1.0.0 registry.example.com/clica-sso-frontend:v1.0.0

# 3. Push para registry
docker push registry.example.com/clica-sso-frontend:v1.0.0

# 4. Deploy no servidor
docker pull registry.example.com/clica-sso-frontend:v1.0.0
docker-compose up -d
```

### CI/CD

O projeto inclui configurações para:

#### GitHub Actions
```yaml
# .github/workflows/docker.yml
name: Docker Build and Deploy
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Build Docker image
        run: docker build -t clica-sso-frontend .
      - name: Test image
        run: ./build-and-deploy.sh --skip-deploy
```

## 🔍 Troubleshooting

### Problemas Comuns

1. **Container não inicia**
   ```bash
   # Verificar logs
   docker logs clica-sso-frontend
   
   # Verificar configuração nginx
   docker exec clica-sso-frontend nginx -t
   ```

2. **Porta já em uso**
   ```bash
   # Verificar o que está usando a porta
   netstat -tulpn | grep :3000
   
   # Usar porta diferente
   docker run -p 3001:80 clica-sso-frontend
   ```

3. **Build falha por memória**
   ```bash
   # Aumentar limite de memória do Docker
   # Ou usar build em cloud
   ```

4. **Assets não carregam**
   ```bash
   # Verificar se build foi gerado corretamente
   docker run -it clica-sso-frontend ls -la /usr/share/nginx/html
   ```

### Debug

```bash
# Entrar no container
docker exec -it clica-sso-frontend sh

# Verificar configuração nginx
docker exec clica-sso-frontend cat /etc/nginx/conf.d/default.conf

# Testar conectividade
docker exec clica-sso-frontend wget -qO- http://localhost/health
```

## 📊 Monitoramento

### Métricas

```bash
# Uso de recursos em tempo real
docker stats clica-sso-frontend

# Informações detalhadas
docker inspect clica-sso-frontend | jq '.[0].State'
```

### Health Checks

```bash
# Status do health check
docker inspect clica-sso-frontend | jq '.[0].State.Health'

# Histórico de health checks
docker inspect clica-sso-frontend | jq '.[0].State.Health.Log'
```

## 🔐 Segurança

### Práticas Implementadas

- ✅ Usuário não-root
- ✅ Security headers no Nginx
- ✅ Minimal Alpine base image
- ✅ Multi-stage build (reduz superfície de ataque)
- ✅ .dockerignore configurado
- ✅ Sem secrets hardcoded

### Verificação de Vulnerabilidades

```bash
# Scan da imagem
docker scout cves clica-sso-frontend:latest

# Ou com trivy
trivy image clica-sso-frontend:latest
```

## 📚 Referências

- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [Nginx Configuration](https://nginx.org/en/docs/)
- [React Deployment](https://create-react-app.dev/docs/deployment/)
- [Vite Production Build](https://vitejs.dev/guide/build.html)

---

## 📞 Suporte

Para problemas relacionados ao Docker:

1. Verificar logs: `docker logs clica-sso-frontend`
2. Verificar health check: `curl http://localhost:3000/health`
3. Verificar configuração: `docker inspect clica-sso-frontend`
4. Abrir issue no repositório com logs completos