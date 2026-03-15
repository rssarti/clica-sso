#!/bin/bash

# 🔐 Script para configurar chaves SSH para GitHub Actions

echo "🔐 Configurando chaves SSH para GitHub Actions..."

# Verificar se ssh-keygen está disponível
if ! command -v ssh-keygen &> /dev/null; then
    echo "❌ ssh-keygen não encontrado. Instale o OpenSSH."
    exit 1
fi

# Criar diretório .ssh se não existir
mkdir -p ~/.ssh

# Nome dos arquivos de chave
KEY_NAME="github-actions-clica-sso"
PRIVATE_KEY="$HOME/.ssh/$KEY_NAME"
PUBLIC_KEY="$HOME/.ssh/$KEY_NAME.pub"

# Verificar se já existe
if [ -f "$PRIVATE_KEY" ]; then
    echo "⚠️  Chave SSH já existe: $PRIVATE_KEY"
    echo "🤔 Deseja sobrescrever? (y/N)"
    read -r response
    if [[ ! "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        echo "❌ Operação cancelada"
        exit 0
    fi
fi

# Gerar par de chaves SSH
echo "🔑 Gerando par de chaves SSH..."
ssh-keygen -t rsa -b 4096 -C "github-actions@clica-sso" -f "$PRIVATE_KEY" -N ""

if [ $? -eq 0 ]; then
    echo "✅ Chaves SSH geradas com sucesso!"
    echo ""
    echo "📁 Arquivos criados:"
    echo "   - Chave privada: $PRIVATE_KEY"
    echo "   - Chave pública: $PUBLIC_KEY"
    echo ""
    
    echo "📋 Próximos passos:"
    echo ""
    echo "1. 🔗 Adicionar chave pública ao droplet:"
    echo "   ssh-copy-id -i $PUBLIC_KEY clica-sso@SEU_DROPLET_IP"
    echo ""
    echo "2. 🔐 Configurar secrets no GitHub:"
    echo "   - DROPLET_HOST: IP_DO_SEU_DROPLET"
    echo "   - DROPLET_USER: clica-sso"
    echo "   - DROPLET_SSH_PRIVATE_KEY: (copie o conteúdo abaixo)"
    echo ""
    echo "📄 Conteúdo da chave privada para o GitHub Secret:"
    echo "----------------------------------------"
    cat "$PRIVATE_KEY"
    echo "----------------------------------------"
    echo ""
    
    echo "3. 🧪 Testar conexão SSH:"
    echo "   ssh -i $PRIVATE_KEY clica-sso@SEU_DROPLET_IP"
    echo ""
    
    echo "🚨 IMPORTANTE:"
    echo "   - Guarde essas chaves em local seguro"
    echo "   - Não compartilhe a chave privada"
    echo "   - Configure os secrets no GitHub imediatamente"
    
else
    echo "❌ Erro ao gerar chaves SSH"
    exit 1
fi
