#!/bin/bash

# Script para configurar SSL/HTTPS no frontend
# Execute após o deploy: bash configure-ssl-frontend.sh

set -e

DOMAIN="accounts.clicatecnologia.com.br"
EMAIL="suporte@clicatecnologia.com.br"

echo "🔒 Configurando SSL para o frontend..."
echo "🌐 Domínio: $DOMAIN"

# Verificar se o nginx está rodando
echo "🔍 Verificando nginx..."
if ! systemctl is-active --quiet nginx; then
    echo "❌ Nginx não está rodando. Iniciando..."
    sudo systemctl start nginx
fi

# Instalar certbot se não existir
if ! command -v certbot &> /dev/null; then
    echo "📦 Instalando certbot..."
    sudo apt update
    sudo apt install -y certbot python3-certbot-nginx
fi

# Verificar se o domínio resolve para este servidor
echo "🔍 Verificando DNS..."
DOMAIN_IP=$(dig +short $DOMAIN)
SERVER_IP=$(curl -s ifconfig.me)

if [ "$DOMAIN_IP" != "$SERVER_IP" ]; then
    echo "⚠️  AVISO: DNS pode não estar apontando corretamente"
    echo "   Domínio resolve para: $DOMAIN_IP"
    echo "   Servidor IP: $SERVER_IP"
    echo "   Continuando mesmo assim..."
fi

# Obter certificado SSL
echo "🔒 Obtendo certificado SSL..."
sudo certbot --nginx \
    --non-interactive \
    --agree-tos \
    --email "$EMAIL" \
    --domains "$DOMAIN" \
    --redirect

# Verificar se o certificado foi instalado
if sudo certbot certificates | grep -q "$DOMAIN"; then
    echo "✅ Certificado SSL instalado com sucesso!"
    
    # Configurar renovação automática
    echo "🔄 Configurando renovação automática..."
    (sudo crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet") | sudo crontab -
    
    # Testar renovação
    echo "🧪 Testando renovação..."
    sudo certbot renew --dry-run
    
    echo "🎉 SSL configurado com sucesso!"
    echo "🌐 Site disponível em: https://$DOMAIN"
    
    # Mostrar status
    echo "📊 Status dos certificados:"
    sudo certbot certificates
    
else
    echo "❌ Falha ao instalar certificado SSL"
    echo "🔍 Verificando logs..."
    sudo journalctl -u nginx -n 20
    exit 1
fi

# Verificar configuração final
echo "🔍 Verificando configuração final..."
sudo nginx -t

echo "🔄 Recarregando nginx..."
sudo systemctl reload nginx

echo "✅ Configuração SSL completa!"
echo "🌐 Acesse: https://$DOMAIN"
echo "🔒 Certificado válido por 90 dias (renovação automática configurada)"
