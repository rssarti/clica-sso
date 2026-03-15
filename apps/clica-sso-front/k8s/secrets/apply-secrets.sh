#!/bin/bash

# Script para aplicar secrets do frontend
# Uso: ./apply-secrets.sh [environment]

ENVIRONMENT=${1:-development}

echo "🔐 Aplicando secrets do frontend..."
echo "Environment: $ENVIRONMENT"

if [ "$ENVIRONMENT" == "production" ]; then
    if [ -f "sealed-frontend-secrets.yaml" ]; then
        echo "✅ Aplicando Sealed Secrets (produção)"
        kubectl apply -f sealed-frontend-secrets.yaml
    else
        echo "❌ Arquivo sealed-frontend-secrets.yaml não encontrado!"
        echo "Execute: kubeseal --format=yaml < frontend-secrets.yaml > sealed-frontend-secrets.yaml"
        exit 1
    fi
else
    echo "⚠️  Aplicando secrets em plain text (development/staging)"
    kubectl apply -f frontend-secrets.yaml
fi

echo "✅ Secrets aplicados com sucesso!"
