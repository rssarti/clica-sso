# ===== SCRIPT DE BUILD COM NIXPACKS (PowerShell) =====
# Script simplificado para usar Nixpacks ao invés de Dockerfile

param(
    [switch]$Install,
    [switch]$Test,
    [string]$Port = "3000"
)

function Write-ColorOutput {
    param([string]$Message, [string]$Color = "White")
    Write-Host "[$((Get-Date).ToString('yyyy-MM-dd HH:mm:ss'))] $Message" -ForegroundColor $Color
}

function Write-Success { param([string]$Message) Write-ColorOutput "✅ $Message" "Green" }
function Write-Error { param([string]$Message) Write-ColorOutput "❌ $Message" "Red" }
function Write-Info { param([string]$Message) Write-ColorOutput "🔍 $Message" "Cyan" }

Write-ColorOutput "🚀 Building com Nixpacks..." "Blue"

# Verificar se nixpacks está instalado
if (-not (Get-Command nixpacks -ErrorAction SilentlyContinue)) {
    if ($Install) {
        Write-Info "📦 Instalando Nixpacks..."
        
        # Verificar se tem Cargo (Rust)
        if (Get-Command cargo -ErrorAction SilentlyContinue) {
            cargo install nixpacks
        } 
        # Verificar se tem Scoop
        elseif (Get-Command scoop -ErrorAction SilentlyContinue) {
            scoop install nixpacks
        }
        # Tentar com Chocolatey
        elseif (Get-Command choco -ErrorAction SilentlyContinue) {
            choco install nixpacks
        }
        else {
            Write-Error "Instale nixpacks primeiro. Opções:"
            Write-Host "  • Via Cargo: cargo install nixpacks" -ForegroundColor Yellow
            Write-Host "  • Via Scoop: scoop install nixpacks" -ForegroundColor Yellow
            Write-Host "  • Baixar de: https://github.com/railwayapp/nixpacks/releases" -ForegroundColor Yellow
            exit 1
        }
    } else {
        Write-Error "Nixpacks não encontrado. Use -Install para instalar automaticamente"
        Write-Host "Ou instale manualmente: https://nixpacks.com/docs/install" -ForegroundColor Yellow
        exit 1
    }
}

# Verificar se está no diretório correto
if (-not (Test-Path "package.json")) {
    Write-Error "package.json não encontrado. Execute no diretório do projeto."
    exit 1
}

Write-Info "Building imagem com Nixpacks..."

# Build da imagem
try {
    nixpacks build . --name clica-sso-frontend
    
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Build concluído com Nixpacks!"
    } else {
        Write-Error "Build falhou"
        exit 1
    }
} catch {
    Write-Error "Erro durante build: $($_.Exception.Message)"
    exit 1
}

# Testar se solicitado
if ($Test) {
    Write-Info "🧪 Testando imagem..."
    
    $ContainerName = "clica-sso-frontend"
    
    # Parar container anterior
    try {
        docker stop $ContainerName 2>$null
        docker rm $ContainerName 2>$null
    } catch {
        # Ignorar se não existir
    }
    
    # Executar container
    $EnvVars = @(
        "VITE_API_URL=https://api.clicatecnologia.com.br",
        "VITE_SSO_URL=https://accounts.clicatecnologia.com.br",
        "VITE_SOCKET_IO=https://accounts.clicatecnologia.com.br",
        "VITE_SOCKET_PATCH=/socket.io/"
    )
    
    $EnvArgs = $EnvVars | ForEach-Object { "-e", $_ }
    
    docker run -d --name $ContainerName -p "${Port}:8080" @EnvArgs clica-sso-frontend
    
    if ($LASTEXITCODE -eq 0) {
        Write-Info "Aguardando inicialização..."
        Start-Sleep -Seconds 10
        
        # Testar conectividade
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:$Port/" -UseBasicParsing -TimeoutSec 10
            if ($response.StatusCode -eq 200) {
                Write-Success "Aplicação está rodando em http://localhost:$Port"
            } else {
                Write-Error "Aplicação não está respondendo corretamente"
            }
        } catch {
            Write-Error "Erro ao testar aplicação: $($_.Exception.Message)"
            Write-Info "Logs do container:"
            docker logs $ContainerName
        }
    } else {
        Write-Error "Falha ao executar container"
        exit 1
    }
}

Write-ColorOutput "🎉 Processo com Nixpacks concluído!" "Green"

Write-Host ""
Write-Host "📝 Comandos úteis:" -ForegroundColor Blue
Write-Host "  • Ver logs: docker logs clica-sso-frontend" -ForegroundColor White
Write-Host "  • Parar: docker stop clica-sso-frontend" -ForegroundColor White
Write-Host "  • Acessar: http://localhost:$Port" -ForegroundColor White
Write-Host "  • Build novamente: .\nixpacks-build.ps1 -Test" -ForegroundColor White