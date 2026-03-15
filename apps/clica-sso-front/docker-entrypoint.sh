#!/bin/sh

# Script de entrada simplificado para frontend standalone

echo "🚀 Iniciando Clica SSO Frontend..."
echo "🔌 Port: 80"
echo "🌍 Environment: ${VITE_APP_ENV:-production}"

# Verificar se os arquivos do frontend existem
echo "📁 Checking frontend files..."
ls -la /usr/share/nginx/html/

# Verifica se a configuração do nginx é válida
echo "🔍 Testing nginx configuration..."
nginx -t

if [ $? -eq 0 ]; then
    echo "✅ Nginx configuration is valid"
else
    echo "❌ Nginx configuration is invalid"
    echo "📋 Current config:"
    cat /etc/nginx/conf.d/default.conf
    exit 1
fi

# Inicia o nginx
echo "🎯 Starting nginx..."
exec nginx -g "daemon off;"