# 📦 Nixpacks Setup - Clica SSO Frontend

Este documento explica como usar **Nixpacks** para simplificar o build e deploy do frontend, eliminando a necessidade de um Dockerfile complexo.

## 🔍 O que é Nixpacks?

Nixpacks é uma ferramenta que:
- ✅ **Detecta automaticamente** o tipo de projeto
- ✅ **Cria imagens Docker** otimizadas sem Dockerfile
- ✅ **Simplifica o processo** de build e deploy
- ✅ **Usado pelo Railway** e outras plataformas

## ⚡ Quick Start

### 1. Instalar Nixpacks

**Via Cargo (Rust):**
```bash
cargo install nixpacks
```

**Via Scoop (Windows):**
```powershell
scoop install nixpacks
```

**Via Homebrew (macOS):**
```bash
brew install nixpacks
```

### 2. Build e Deploy

**Linux/Mac:**
```bash
# Dar permissão de execução
chmod +x nixpacks-build.sh

# Build simples
./nixpacks-build.sh

# Build e teste
./nixpacks-build.sh && docker run -p 3000:8080 clica-sso-frontend
```

**Windows PowerShell:**
```powershell
# Instalar Nixpacks automaticamente (se necessário)
.\nixpacks-build.ps1 -Install

# Build e teste
.\nixpacks-build.ps1 -Test

# Build simples
.\nixpacks-build.ps1
```

### 3. Deploy Manual

```bash
# Build da imagem
nixpacks build . --name clica-sso-frontend

# Executar container
docker run -d \
  --name clica-sso-frontend \
  -p 3000:8080 \
  -e VITE_API_URL="https://api.clicatecnologia.com.br" \
  -e VITE_SSO_URL="https://accounts.clicatecnologia.com.br" \
  clica-sso-frontend
```

## ⚙️ Configuração (nixpacks.toml)

O projeto inclui um arquivo `nixpacks.toml` com configurações otimizadas:

```toml
[variables]
NODE_ENV = "production"
VITE_API_URL = "https://api.clicatecnologia.com.br"
VITE_SSO_URL = "https://accounts.clicatecnologia.com.br"
VITE_SOCKET_IO = "https://accounts.clicatecnologia.com.br"
VITE_SOCKET_PATCH = "/socket.io/"

[phases.setup]
nixPkgs = ["nodejs_20", "pnpm"]

[phases.install]
cmd = "pnpm install --frozen-lockfile"

[phases.build]
cmd = "pnpm run build"

[start]
cmd = "npx serve -s dist -l 8080 --no-clipboard --single"
```

## 🔧 Funcionalidades

### Detecção Automática
Nixpacks detecta automaticamente:
- ✅ **Node.js/React** project
- ✅ **Package manager** (PNPM)
- ✅ **Build scripts** (`pnpm run build`)
- ✅ **Dependencies** do package.json

### Otimizações Incluídas
- ✅ **Multi-stage build** automático
- ✅ **Cache** de dependências
- ✅ **Compression** de assets
- ✅ **SPA support** com serve
- ✅ **Environment variables** em build time

### Servidor Web
Usa `serve` para:
- ✅ **SPA fallback** (--single)
- ✅ **Static files** otimizados
- ✅ **Compressão** automática
- ✅ **Headers** de cache

## 🆚 Comparação: Dockerfile vs Nixpacks

| Aspecto | Dockerfile | Nixpacks |
|---------|------------|----------|
| **Complexidade** | 150+ linhas | 15 linhas |
| **Manutenção** | Manual | Automática |
| **Otimização** | Manual | Automática |
| **Multi-stage** | Manual | Automático |
| **Cache** | Manual | Automático |
| **Security** | Manual | Automático |

### Dockerfile (Tradicional)
```dockerfile
# 150+ linhas
FROM node:20-alpine AS builder
WORKDIR /app
RUN npm install -g pnpm
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
# ... mais 140 linhas
```

### Nixpacks (Simplificado)
```toml
# 15 linhas
[phases.setup]
nixPkgs = ["nodejs_20", "pnpm"]

[phases.install]
cmd = "pnpm install --frozen-lockfile"

[phases.build]
cmd = "pnpm run build"

[start]
cmd = "npx serve -s dist -l 8080 --single"
```

## 🚀 Deploy em Produção

### Railway
```bash
# Deploy direto no Railway
railway login
railway new
git push
# Nixpacks detecta automaticamente!
```

### Vercel
```bash
# Build com nixpacks, deploy estático
nixpacks build . --name clica-sso-frontend
# Extrair arquivos estáticos da imagem
# Deploy no Vercel
```

### Docker Compose
```yaml
version: '3.8'
services:
  frontend:
    image: clica-sso-frontend
    ports:
      - "3000:8080"
    environment:
      - VITE_API_URL=https://api.clicatecnologia.com.br
    restart: unless-stopped
```

## 🔍 Debug e Troubleshooting

### Ver o que o Nixpacks detectou
```bash
nixpacks plan .
```

### Build com logs detalhados
```bash
nixpacks build . --name clica-sso-frontend --verbose
```

### Testar localmente
```bash
# Build
nixpacks build . --name test-app

# Run
docker run -p 3000:8080 test-app

# Logs
docker logs <container-id>
```

### Problemas Comuns

1. **Variáveis de ambiente não aplicadas**
   ```bash
   # Verificar se estão no nixpacks.toml
   nixpacks plan . | grep -A 10 "Environment Variables"
   ```

2. **Build falha**
   ```bash
   # Verificar dependências
   nixpacks build . --verbose
   ```

3. **SPA não funciona**
   ```bash
   # Certificar que --single está no comando serve
   # Verificar se try_files está configurado
   ```

## 📊 Performance

### Tamanho da Imagem
- **Dockerfile**: ~150MB
- **Nixpacks**: ~120MB (otimização automática)

### Tempo de Build
- **Dockerfile**: ~2-3 minutos
- **Nixpacks**: ~1-2 minutos (cache inteligente)

### Startup Time
- **Dockerfile**: ~5-10s (nginx)
- **Nixpacks**: ~2-5s (serve)

## 🔐 Segurança

Nixpacks inclui automaticamente:
- ✅ **Non-root user**
- ✅ **Minimal base image**
- ✅ **Security headers** (via serve)
- ✅ **No secrets** in image
- ✅ **Updated dependencies**

## 🤝 Migração do Dockerfile

Se você já tem um Dockerfile, pode migrar gradualmente:

1. **Manter Dockerfile** para builds complexos
2. **Usar Nixpacks** para desenvolvimento
3. **Comparar performance** e decidir
4. **Migrar completamente** quando confortável

## 📚 Recursos

- [Nixpacks Documentation](https://nixpacks.com/docs)
- [GitHub Repository](https://github.com/railwayapp/nixpacks)
- [Railway Platform](https://railway.app)
- [Configuration Examples](https://nixpacks.com/docs/configuration)

---

## 🎯 Comandos de Referência Rápida

```bash
# Build
nixpacks build . --name clica-sso-frontend

# Run
docker run -p 3000:8080 clica-sso-frontend

# Plan (ver configuração)
nixpacks plan .

# Com scripts
./nixpacks-build.sh              # Linux/Mac
.\nixpacks-build.ps1 -Test       # Windows
```

Nixpacks **simplifica drasticamente** o processo de build e deploy, mantendo todas as otimizações necessárias! 🚀