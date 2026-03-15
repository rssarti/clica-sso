#!/bin/bash

# ===== SCRIPT DE BUILD COM NIXPACKS =====
# Script simplificado para usar Nixpacks ao invés de Dockerfile

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
}

# Verificar se nixpacks está instalado
if ! command -v nixpacks &> /dev/null; then
    log "📦 Nixpacks não encontrado. Instalando..."
    
    # Instalar nixpacks
    if command -v brew &> /dev/null; then
        brew install nixpacks
    elif command -v cargo &> /dev/null; then
        cargo install nixpacks
    else
        error "Instale nixpacks primeiro: https://nixpacks.com/docs/install"
        exit 1
    fi
fi

log "🚀 Building com Nixpacks..."

# Build da imagem com nixpacks
nixpacks build . --name clica-sso-frontend

if [ $? -eq 0 ]; then
    success "Build concluído com Nixpacks!"
    
    # Testar a imagem
    log "🧪 Testando imagem..."
    
    # Parar container anterior se existir
    docker stop clica-sso-frontend 2>/dev/null || true
    docker rm clica-sso-frontend 2>/dev/null || true
    
    # Executar container
    docker run -d --name clica-sso-frontend -p 3000:8080 \
        -e VITE_API_URL="https://api.clicatecnologia.com.br" \
        -e VITE_SSO_URL="https://accounts.clicatecnologia.com.br" \
        clica-sso-frontend
    
    # Aguardar inicialização
    sleep 10
    
    # Testar health check (se disponível)
    if curl -f http://localhost:3000/ > /dev/null 2>&1; then
        success "Aplicação está rodando em http://localhost:3000"
    else
        error "Aplicação não está respondendo"
        docker logs clica-sso-frontend
        exit 1
    fi
    
else
    error "Build falhou"
    exit 1
fi

log "🎉 Deploy com Nixpacks concluído!"
echo ""
echo "📝 Comandos úteis:"
echo "  • Ver logs: docker logs clica-sso-frontend"
echo "  • Parar: docker stop clica-sso-frontend"
echo "  • Acessar: http://localhost:3000"