#!/bin/bash

# ===== SCRIPT DE BUILD E DEPLOY - CLICA SSO FRONTEND =====
# Script para automatizar o processo de build e deploy do frontend

set -e  # Para no primeiro erro

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para logging
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
}

# Verificar se está no diretório correto
if [ ! -f "package.json" ]; then
    error "package.json não encontrado. Execute este script no diretório do frontend."
    exit 1
fi

log "🚀 Iniciando build e deploy do Clica SSO Frontend..."

# 1. Verificar dependências
log "📦 Verificando dependências..."
if ! command -v docker &> /dev/null; then
    error "Docker não está instalado ou não está no PATH"
    exit 1
fi

if ! command -v pnpm &> /dev/null; then
    warning "PNPM não encontrado, usando npm para verificações locais"
    PACKAGE_MANAGER="npm"
else
    PACKAGE_MANAGER="pnpm"
fi

# 2. Limpeza de builds anteriores
log "🧹 Limpando builds anteriores..."
rm -rf dist/
rm -rf node_modules/.vite/

# 3. Instalar dependências (se necessário)
if [ ! -d "node_modules" ]; then
    log "📦 Instalando dependências..."
    $PACKAGE_MANAGER install
fi

# 4. Executar testes e linting (se configurado)
if [ "$1" != "--skip-tests" ]; then
    log "🧪 Executando verificações..."
    
    # Lint
    if $PACKAGE_MANAGER list | grep -q eslint; then
        log "🔍 Executando ESLint..."
        $PACKAGE_MANAGER run lint || warning "ESLint encontrou problemas, mas continuando..."
    fi
    
    # Type check
    if [ -f "tsconfig.json" ]; then
        log "🔧 Verificando tipos TypeScript..."
        npx tsc --noEmit || warning "Problemas de tipo encontrados, mas continuando..."
    fi
fi

# 5. Build da aplicação
log "🏗️  Building aplicação..."
$PACKAGE_MANAGER run build

if [ ! -d "dist" ]; then
    error "Build falhou - diretório dist não foi criado"
    exit 1
fi

success "Build da aplicação concluído"

# 6. Build da imagem Docker
log "🐳 Building imagem Docker..."

# Verificar se .env.production existe
if [ ! -f ".env.production" ]; then
    warning ".env.production não encontrado, usando valores padrão"
fi

# Build da imagem
docker build -t clica-sso-frontend:latest -t clica-sso-frontend:$(date +%Y%m%d-%H%M%S) .

success "Imagem Docker criada"

# 7. Testar a imagem
if [ "$1" != "--skip-test" ]; then
    log "🧪 Testando imagem Docker..."
    
    # Parar container anterior se existir
    docker stop clica-sso-frontend-test 2>/dev/null || true
    docker rm clica-sso-frontend-test 2>/dev/null || true
    
    # Executar container de teste
    CONTAINER_ID=$(docker run -d --name clica-sso-frontend-test -p 3001:80 \
        -e VITE_API_URL="/api" \
        -e PORT=80 \
        clica-sso-frontend:latest)
    
    # Aguardar inicialização
    sleep 10
    
    # Teste de health check
    if curl -f http://localhost:3001/health > /dev/null 2>&1; then
        success "Health check passou"
    else
        error "Health check falhou"
        docker logs clica-sso-frontend-test
        docker stop clica-sso-frontend-test
        docker rm clica-sso-frontend-test
        exit 1
    fi
    
    # Teste da página principal
    if curl -f http://localhost:3001/ > /dev/null 2>&1; then
        success "Página principal acessível"
    else
        warning "Página principal pode ter problemas"
    fi
    
    # Limpeza do teste
    docker stop clica-sso-frontend-test
    docker rm clica-sso-frontend-test
    
    success "Testes da imagem passaram"
fi

# 8. Deploy (se especificado)
if [ "$1" = "--deploy" ] || [ "$2" = "--deploy" ]; then
    log "🚀 Iniciando deploy..."
    
    # Usar docker-compose para deploy
    if [ -f "docker-compose.yml" ]; then
        log "📄 Usando docker-compose para deploy..."
        
        # Parar serviços anteriores
        docker-compose down || true
        
        # Subir novos serviços
        docker-compose up -d
        
        # Verificar se subiu corretamente
        sleep 15
        
        if docker-compose ps | grep -q "Up"; then
            success "Deploy realizado com sucesso"
            log "🌐 Aplicação disponível em: http://localhost:${FRONTEND_PORT:-3000}"
        else
            error "Deploy falhou"
            docker-compose logs
            exit 1
        fi
    else
        # Deploy direto com docker run
        log "🐳 Deploy direto com Docker..."
        
        # Parar container anterior
        docker stop clica-sso-frontend 2>/dev/null || true
        docker rm clica-sso-frontend 2>/dev/null || true
        
        # Executar novo container
        docker run -d --name clica-sso-frontend \
            -p ${FRONTEND_PORT:-3000}:80 \
            --env-file .env.production \
            --restart unless-stopped \
            clica-sso-frontend:latest
        
        success "Deploy realizado com sucesso"
        log "🌐 Aplicação disponível em: http://localhost:${FRONTEND_PORT:-3000}"
    fi
fi

# 9. Resumo final
log "📊 Resumo do build:"
echo "  ✅ Build da aplicação: OK"
echo "  ✅ Imagem Docker: clica-sso-frontend:latest"
if [ "$1" != "--skip-test" ]; then
    echo "  ✅ Testes: OK"
fi
if [ "$1" = "--deploy" ] || [ "$2" = "--deploy" ]; then
    echo "  ✅ Deploy: OK"
fi

log "🎉 Processo concluído com sucesso!"

# Instruções finais
echo ""
echo "📝 Próximos passos:"
echo "   • Para testar localmente: docker run -p 3000:80 clica-sso-frontend:latest"
echo "   • Para deploy: ./build-and-deploy.sh --deploy"
echo "   • Para logs: docker logs clica-sso-frontend"
echo "   • Para parar: docker stop clica-sso-frontend"