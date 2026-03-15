# Script rápido para criar secrets do clica-sso-backend
# USE APENAS PARA TESTES - Para produção use Sealed Secrets!

Write-Host "🔐 Criando secrets para clica-sso-backend..." -ForegroundColor Cyan

# Pedir valores ao usuário
Write-Host "`n📝 Informe os valores dos secrets:" -ForegroundColor Yellow
Write-Host "(Pressione Enter para usar valores padrão de desenvolvimento)" -ForegroundColor Gray

$databaseUrl = Read-Host "DATABASE_URL (postgresql://...)"
if ([string]::IsNullOrWhiteSpace($databaseUrl)) {
    $databaseUrl = "postgresql://postgres:postgres@postgres:5432/clica_sso"
    Write-Host "  Usando valor padrão" -ForegroundColor Gray
}

$jwtSecret = Read-Host "JWT_SECRET (mínimo 32 caracteres)"
if ([string]::IsNullOrWhiteSpace($jwtSecret)) {
    # Gerar JWT secret aleatório
    $jwtSecret = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object {[char]$_})
    Write-Host "  Gerado automaticamente: $jwtSecret" -ForegroundColor Green
}

$redisUrl = Read-Host "REDIS_URL (redis://...)"
if ([string]::IsNullOrWhiteSpace($redisUrl)) {
    $redisUrl = "redis://redis:6379"
    Write-Host "  Usando valor padrão" -ForegroundColor Gray
}

$minioAccessKey = Read-Host "MINIO_ACCESS_KEY"
if ([string]::IsNullOrWhiteSpace($minioAccessKey)) {
    $minioAccessKey = "minioadmin"
    Write-Host "  Usando valor padrão" -ForegroundColor Gray
}

$minioSecretKey = Read-Host "MINIO_SECRET_KEY"
if ([string]::IsNullOrWhiteSpace($minioSecretKey)) {
    $minioSecretKey = "minioadmin"
    Write-Host "  Usando valor padrão" -ForegroundColor Gray
}

$interClientId = Read-Host "INTER_CLIENT_ID"
if ([string]::IsNullOrWhiteSpace($interClientId)) {
    $interClientId = "test-client-id"
    Write-Host "  Usando valor padrão" -ForegroundColor Gray
}

$interClientSecret = Read-Host "INTER_CLIENT_SECRET"
if ([string]::IsNullOrWhiteSpace($interClientSecret)) {
    $interClientSecret = "test-client-secret"
    Write-Host "  Usando valor padrão" -ForegroundColor Gray
}

Write-Host "`n🔍 Verificando se secret já existe..." -ForegroundColor Cyan
$existingSecret = kubectl get secret clica-sso-secrets -n default 2>$null

if ($LASTEXITCODE -eq 0) {
    Write-Host "⚠️  Secret 'clica-sso-secrets' já existe!" -ForegroundColor Yellow
    $overwrite = Read-Host "Deseja deletar e recriar? (s/N)"
    
    if ($overwrite -eq 's' -or $overwrite -eq 'S') {
        Write-Host "🗑️  Deletando secret existente..." -ForegroundColor Yellow
        kubectl delete secret clica-sso-secrets -n default
        
        if ($LASTEXITCODE -ne 0) {
            Write-Host "❌ Erro ao deletar secret!" -ForegroundColor Red
            exit 1
        }
    } else {
        Write-Host "❌ Operação cancelada." -ForegroundColor Red
        exit 0
    }
}

Write-Host "`n🚀 Criando secret..." -ForegroundColor Cyan
kubectl create secret generic clica-sso-secrets `
    --from-literal=database-url="$databaseUrl" `
    --from-literal=jwt-secret="$jwtSecret" `
    --from-literal=redis-url="$redisUrl" `
    --from-literal=minio-access-key="$minioAccessKey" `
    --from-literal=minio-secret-key="$minioSecretKey" `
    --from-literal=inter-client-id="$interClientId" `
    --from-literal=inter-client-secret="$interClientSecret" `
    -n default

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ Secret criado com sucesso!" -ForegroundColor Green
    
    Write-Host "`n📋 Verificando secret criado:" -ForegroundColor Cyan
    kubectl get secret clica-sso-secrets -n default
    
    Write-Host "`n⚠️  IMPORTANTE:" -ForegroundColor Yellow
    Write-Host "Este secret foi criado de forma simples e NÃO está criptografado no Git" -ForegroundColor Yellow
    Write-Host "Para produção, use Sealed Secrets!" -ForegroundColor Yellow
    
    Write-Host "`n🔄 Agora você pode fazer o deploy novamente:" -ForegroundColor Cyan
    Write-Host "kubectl rollout restart deployment clica-sso-backend" -ForegroundColor White
} else {
    Write-Host "`n❌ Erro ao criar secret!" -ForegroundColor Red
    exit 1
}
