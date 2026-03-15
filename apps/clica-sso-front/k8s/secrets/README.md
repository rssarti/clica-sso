# Kubernetes Secrets - Frontend

Este diretório contém os secrets do frontend.

## ⚠️ IMPORTANTE: Usar Sealed Secrets em Produção

Os arquivos aqui são **exemplos em plain text** e **NÃO devem ser commitados** com valores reais.

### Aplicar secrets (desenvolvimento/staging):

```bash
kubectl apply -f frontend-secrets.yaml
```

### Para produção, use Sealed Secrets:

```bash
# 1. Instalar kubeseal (se ainda não tiver)
# Windows (via Chocolatey):
choco install kubeseal

# 2. Criar sealed secret
kubeseal --format=yaml < frontend-secrets.yaml > sealed-frontend-secrets.yaml

# 3. Aplicar o sealed secret (seguro para commit)
kubectl apply -f sealed-frontend-secrets.yaml
```

## Variáveis disponíveis:

- `VITE_API_URL`: URL da API backend
- `VITE_SSO_URL`: URL do frontend SSO
- `VITE_SOCKET_IO`: URL do Socket.IO
- `VITE_SOCKET_PATCH`: Path do Socket.IO
- `NODE_ENV`: Ambiente Node.js
- `VITE_APP_ENV`: Ambiente da aplicação
