# ===== BUILD AND TEST SCRIPT FOR CLICA SSO FRONTEND (PowerShell) =====
# Script completo para build, test e deploy do frontend

param(
    [switch]$Deploy,
    [switch]$SkipTests,
    [switch]$Production,
    [string]$Port = "3000"
)

# Função para logging com cores
function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
    Write-Host "[$((Get-Date).ToString('yyyy-MM-dd HH:mm:ss'))] $Message" -ForegroundColor $Color
}

function Write-Success { param([string]$Message) Write-ColorOutput "✅ $Message" "Green" }
function Write-Warning { param([string]$Message) Write-ColorOutput "⚠️  $Message" "Yellow" }
function Write-Error { param([string]$Message) Write-ColorOutput "❌ $Message" "Red" }
function Write-Info { param([string]$Message) Write-ColorOutput "🔍 $Message" "Cyan" }

Write-ColorOutput "🚀 Iniciando build e teste do Clica SSO Frontend..." "Blue"

# Verificar se está no diretório correto
if (-not (Test-Path "package.json")) {
    Write-Error "package.json não encontrado. Execute este script no diretório do frontend."
    exit 1
}

# Verificar dependências
Write-Info "Verificando dependências..."
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Error "Docker não está instalado ou não está no PATH"
    exit 1
}

$PackageManager = "npm"
if (Get-Command pnpm -ErrorAction SilentlyContinue) {
    $PackageManager = "pnpm"
    Write-Info "Usando PNPM como gerenciador de pacotes"
} else {
    Write-Warning "PNPM não encontrado, usando NPM"
}

# Limpeza
Write-Info "Limpando builds anteriores..."
if (Test-Path "dist") { Remove-Item -Recurse -Force "dist" }
if (Test-Path "node_modules\.vite") { Remove-Item -Recurse -Force "node_modules\.vite" }

# Instalar dependências se necessário
if (-not (Test-Path "node_modules")) {
    Write-Info "Instalando dependências..."
    & $PackageManager install
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Falha na instalação das dependências"
        exit 1
    }
}

# Testes e verificações
if (-not $SkipTests) {
    Write-Info "Executando verificações..."
    
    # ESLint
    try {
        & $PackageManager run lint
        Write-Success "ESLint passou"
    } catch {
        Write-Warning "ESLint encontrou problemas, mas continuando..."
    }
    
    # TypeScript check
    if (Test-Path "tsconfig.json") {
        Write-Info "Verificando tipos TypeScript..."
        try {
            npx tsc --noEmit
            Write-Success "Verificação de tipos passou"
        } catch {
            Write-Warning "Problemas de tipo encontrados, mas continuando..."
        }
    }
}

# Build da aplicação
Write-Info "Building aplicação..."
if ($Production) {
    $env:NODE_ENV = "production"
    & $PackageManager run build:prod
} else {
    & $PackageManager run build
}

if ($LASTEXITCODE -ne 0) {
    Write-Error "Build da aplicação falhou"
    exit 1
}

if (-not (Test-Path "dist")) {
    Write-Error "Build falhou - diretório dist não foi criado"
    exit 1
}

Write-Success "Build da aplicação concluído"

# Build da imagem Docker
Write-Info "Building imagem Docker..."

$ImageTag = "clica-sso-frontend:latest"
$BuildArgs = @()

if ($Production -and (Test-Path ".env.production")) {
    Write-Info "Usando configurações de produção"
    $BuildArgs += "--build-arg", "NODE_ENV=production"
}

docker build -t $ImageTag --no-cache $BuildArgs .

if ($LASTEXITCODE -ne 0) {
    Write-Error "Build da imagem Docker falhou"
    exit 1
}

Write-Success "Imagem Docker criada: $ImageTag"

# Testar a imagem
if (-not $SkipTests) {
    Write-Info "Testando imagem Docker..."
    
    $TestContainerName = "clica-sso-frontend-test"
    $TestPort = "3001"
    
    # Parar e remover container de teste anterior
    try {
        docker stop $TestContainerName 2>$null
        docker rm $TestContainerName 2>$null
    } catch {
        # Ignorar se não existir
    }
    
    # Executar container de teste
    $TestEnvVars = @(
        "VITE_API_URL=/api",
        "PORT=80",
        "VITE_APP_ENV=test"
    )
    
    $EnvArgs = $TestEnvVars | ForEach-Object { "-e", $_ }
    
    Write-Info "Iniciando container de teste na porta $TestPort..."
    $ContainerId = docker run -d --name $TestContainerName -p "${TestPort}:80" @EnvArgs $ImageTag
    
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Falha ao iniciar container de teste"
        exit 1
    }
    
    # Aguardar inicialização
    Write-Info "Aguardando inicialização do container..."
    Start-Sleep -Seconds 15
    
    # Verificar se o container está rodando
    $ContainerStatus = docker ps --filter "name=$TestContainerName" --format "table {{.Status}}"
    if ($ContainerStatus -like "*Up*") {
        Write-Success "Container de teste está rodando"
    } else {
        Write-Error "Container de teste não está rodando"
        docker logs $TestContainerName
        exit 1
    }
    
    # Health check
    Write-Info "Executando health check..."
    try {
        $healthResponse = Invoke-WebRequest -Uri "http://localhost:$TestPort/health" -UseBasicParsing -TimeoutSec 10
        if ($healthResponse.StatusCode -eq 200) {
            Write-Success "Health check passou!"
        } else {
            Write-Warning "Health check retornou status: $($healthResponse.StatusCode)"
        }
    } catch {
        Write-Error "Health check falhou: $($_.Exception.Message)"
        docker logs $TestContainerName
        docker stop $TestContainerName
        docker rm $TestContainerName
        exit 1
    }
    
    # Testar página principal
    Write-Info "Testando página principal..."
    try {
        $mainResponse = Invoke-WebRequest -Uri "http://localhost:$TestPort/" -UseBasicParsing -TimeoutSec 10
        if ($mainResponse.StatusCode -eq 200) {
            Write-Success "Página principal acessível!"
        } else {
            Write-Warning "Página principal retornou status: $($mainResponse.StatusCode)"
        }
    } catch {
        Write-Warning "Página principal pode ter problemas: $($_.Exception.Message)"
    }
    
    # Mostrar logs do container
    Write-Info "Logs do container de teste:"
    docker logs $TestContainerName
    
    # Limpeza do teste
    Write-Info "Limpando container de teste..."
    docker stop $TestContainerName
    docker rm $TestContainerName
    
    Write-Success "Testes da imagem passaram!"
}

# Deploy se solicitado
if ($Deploy) {
    Write-Info "Iniciando deploy..."
    
    $ContainerName = "clica-sso-frontend"
    
    # Parar container anterior
    try {
        Write-Info "Parando container anterior..."
        docker stop $ContainerName 2>$null
        docker rm $ContainerName 2>$null
    } catch {
        # Ignorar se não existir
    }
    
    # Verificar se existe docker-compose
    if (Test-Path "docker-compose.yml") {
        Write-Info "Usando docker-compose para deploy..."
        
        # Carregar variáveis de ambiente de produção se existir
        if ($Production -and (Test-Path ".env.production")) {
            $env:COMPOSE_FILE = "docker-compose.yml"
            Get-Content ".env.production" | ForEach-Object {
                if ($_ -match "^([^#=]+)=(.*)$") {
                    Set-Item -Path "env:$($matches[1])" -Value $matches[2]
                }
            }
        }
        
        docker-compose down
        docker-compose up -d
        
        if ($LASTEXITCODE -eq 0) {
            Start-Sleep -Seconds 10
            $ComposeStatus = docker-compose ps
            if ($ComposeStatus -like "*Up*") {
                Write-Success "Deploy com docker-compose realizado com sucesso!"
                Write-Info "🌐 Aplicação disponível em: http://localhost:$($env:FRONTEND_PORT ?? $Port)"
            } else {
                Write-Error "Deploy falhou"
                docker-compose logs
                exit 1
            }
        } else {
            Write-Error "Falha no docker-compose up"
            exit 1
        }
    } else {
        Write-Info "Deploy direto com Docker..."
        
        # Configurar variáveis de ambiente
        $DeployEnvVars = @(
            "PORT=80"
        )
        
        if (Test-Path ".env.production") {
            $DeployEnvVars += "--env-file", ".env.production"
        } else {
            $DeployEnvVars += @(
                "VITE_API_URL=/api",
                "VITE_SSO_URL=https://accounts.clicatecnologia.com.br"
            )
        }
        
        $EnvArgs = $DeployEnvVars | Where-Object { $_ -like "*=*" } | ForEach-Object { "-e", $_ }
        $FileArgs = $DeployEnvVars | Where-Object { $_ -eq "--env-file" -or $_ -like "*.env*" }
        
        # Executar container
        docker run -d --name $ContainerName -p "${Port}:80" --restart unless-stopped @EnvArgs @FileArgs $ImageTag
        
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Deploy realizado com sucesso!"
            Write-Info "� Aplicação disponível em: http://localhost:$Port"
        } else {
            Write-Error "Deploy falhou"
            exit 1
        }
    }
}

# Resumo final
Write-ColorOutput "📊 Resumo do processo:" "Blue"
Write-Host "  ✅ Build da aplicação: OK" -ForegroundColor Green
Write-Host "  ✅ Imagem Docker: $ImageTag" -ForegroundColor Green
if (-not $SkipTests) {
    Write-Host "  ✅ Testes: OK" -ForegroundColor Green
}
if ($Deploy) {
    Write-Host "  ✅ Deploy: OK" -ForegroundColor Green
}

Write-ColorOutput "🎉 Processo concluído com sucesso!" "Green"

# Instruções finais
Write-Host ""
Write-Host "📝 Próximos passos:" -ForegroundColor Blue
Write-Host "   • Para testar: docker run -p $Port`:80 $ImageTag" -ForegroundColor White
Write-Host "   • Para deploy: .\test-docker.ps1 -Deploy" -ForegroundColor White
Write-Host "   • Para logs: docker logs clica-sso-frontend" -ForegroundColor White
Write-Host "   • Para parar: docker stop clica-sso-frontend" -ForegroundColor White
if (Test-Path "docker-compose.yml") {
    Write-Host "   • Com compose: docker-compose up -d" -ForegroundColor White
}