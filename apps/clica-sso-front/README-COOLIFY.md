# 🚀 Deploy no Coolify com Nixpacks

Este guia mostra como fazer deploy do frontend Clica SSO no Coolify usando Nixpacks.

## 📋 Pré-requisitos

- Coolify instalado e configurado
- Repositório Git (GitHub, GitLab, etc.)
- Domínio configurado (opcional)

## ⚙️ Configuração no Coolify

### 1. Criar Nova Aplicação

1. Acesse seu Coolify
2. Clique em **"+ New Resource"**
3. Selecione **"Application"**
4. Escolha **"Public Repository"** ou conecte seu repositório

### 2. Configurações Básicas

```yaml
# Configurações no Coolify
Repository URL: https://github.com/seu-usuario/clica-sso-front
Branch: main
Build Pack: nixpacks
Port: 8080
```

### 3. Variáveis de Ambiente

Configure as seguintes variáveis no Coolify:

```bash
# URLs da aplicação (OBRIGATÓRIO - ajuste conforme seu domínio)
VITE_API_URL=https://api.seudominio.com.br
VITE_SSO_URL=https://accounts.seudominio.com.br
VITE_SOCKET_IO=https://accounts.seudominio.com.br
VITE_SOCKET_PATCH=/socket.io/

# Configurações de build
NODE_ENV=production
PORT=8080
```

### 4. Domínio Personalizado

1. Vá para a aba **"Domains"**
2. Adicione seu domínio: `accounts.seudominio.com.br`
3. Configure SSL automático

## 🔧 Arquivos de Configuração

O projeto já inclui os seguintes arquivos configurados:

### `nixpacks.toml`
```toml
[variables]
NODE_ENV = "production"

[phases.setup]
nixPkgs = ["nodejs_20", "pnpm"]

[phases.install]
cmd = "pnpm install --frozen-lockfile"

[phases.build]
cmd = "pnpm run build"

[start]
cmd = "pnpm start"
```

### `package.json` (script start)
```json
{
  "scripts": {
    "start": "serve -s dist -l $PORT --no-clipboard --single"
  }
}
```

## 🚀 Deploy

### Deploy Automático
1. Faça push para o repositório
2. O Coolify automaticamente detectará as mudanças
3. O build será executado usando Nixpacks
4. A aplicação será deployada automaticamente

### Deploy Manual
1. No Coolify, vá para sua aplicação
2. Clique em **"Deploy"**
3. Aguarde o build completar

## 🔍 Verificação

### Health Check
```bash
curl https://seudominio.com.br/health
# Deve retornar: healthy
```

### Página Principal
```bash
curl https://seudominio.com.br/
# Deve retornar HTML da aplicação React
```

## 📊 Monitoramento

### Logs
- Acesse a aba **"Logs"** no Coolify
- Monitore os logs de build e runtime

### Métricas
- CPU e memória disponíveis na aba **"Resources"**
- Uptime na dashboard principal

## 🐛 Troubleshooting

### Problema: 404 Not Found

**Causa**: Configuração incorreta de SPA routing

**Solução**: Verifique se o comando start usa `--single`:
```json
"start": "serve -s dist -l $PORT --no-clipboard --single"
```

### Problema: Variáveis de ambiente não carregam

**Causa**: Variáveis VITE_* não definidas no build

**Solução**: 
1. Configure as variáveis no Coolify
2. Redeploy a aplicação
3. As variáveis devem começar com `VITE_`

### Problema: Build falha

**Causa**: Dependências ou configuração incorreta

**Solução**:
1. Verifique os logs no Coolify
2. Confirme que `pnpm-lock.yaml` está no repositório
3. Verifique se `nixpacks.toml` está correto

### Problema: Aplicação não inicia

**Causa**: Porta incorreta ou comando de start

**Solução**:
1. Confirme que `PORT=8080` está configurado
2. Verifique se a dependência `serve` está instalada
3. Teste localmente: `pnpm run build && pnpm start`

## 🔄 Atualizações

### Atualizar Variáveis
1. Vá para **"Environment Variables"** no Coolify
2. Modifique as variáveis necessárias
3. Clique em **"Deploy"** para aplicar

### Rollback
1. Vá para **"Deployments"**
2. Selecione um deployment anterior
3. Clique em **"Redeploy"**

## 📚 URLs Importantes

- **Frontend**: https://accounts.seudominio.com.br
- **Health Check**: https://accounts.seudominio.com.br/health
- **API**: https://api.seudominio.com.br (backend)

## 🔐 Configurações de Segurança

### Headers de Segurança
O `serve` já inclui headers básicos de segurança.

Para headers customizados, use:
```json
"start": "serve -s dist -l $PORT --no-clipboard --single --config serve.json"
```

E crie `serve.json`:
```json
{
  "headers": [
    {
      "source": "**/*",
      "headers": [
        {
          "key": "X-Frame-Options",
          "value": "SAMEORIGIN"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        }
      ]
    }
  ]
}
```

## 📞 Suporte

- Verifique logs no Coolify
- Teste localmente primeiro
- Confirme variáveis de ambiente
- Verifique conectividade com backend