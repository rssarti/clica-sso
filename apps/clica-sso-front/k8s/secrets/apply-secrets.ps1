# Script para aplicar secrets do frontend
# Uso: .\apply-secrets.ps1 [environment]

param(
    [string]$Environment = "development"
)

Write-Host "🔐 Aplicando secrets do frontend..." -ForegroundColor Cyan
Write-Host "Environment: $Environment" -ForegroundColor Yellow

if ($Environment -eq "production") {
    if (Test-Path "sealed-frontend-secrets.yaml") {
        Write-Host "✅ Aplicando Sealed Secrets (produção)" -ForegroundColor Green
        kubectl apply -f sealed-frontend-secrets.yaml
    } else {
        Write-Host "❌ Arquivo sealed-frontend-secrets.yaml não encontrado!" -ForegroundColor Red
        Write-Host "Execute: kubeseal --format=yaml < frontend-secrets.yaml > sealed-frontend-secrets.yaml" -ForegroundColor Yellow
        exit 1
    }
} else {
    Write-Host "⚠️  Aplicando secrets em plain text (development/staging)" -ForegroundColor Yellow
    kubectl apply -f frontend-secrets.yaml
}

Write-Host "✅ Secrets aplicados com sucesso!" -ForegroundColor Green
