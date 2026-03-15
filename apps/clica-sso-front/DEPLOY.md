# Clica SSO Frontend - Deploy Pipeline

## 📋 Visão Geral

Este documento descreve o pipeline de CI/CD para o frontend do sistema SSO da Clica, configurado para deploy automático no Kubernetes da Digital Ocean.

## 🏗️ Arquitetura

- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Container**: Docker com Nginx Alpine
- **Registry**: Docker Hub (`rssarti/clica-sso-front`)
- **Orquestração**: Kubernetes (Digital Ocean)
- **CI/CD**: Jenkins Pipeline
- **Domínio**: https://accounts.clicatecnologia.com.br

## 🚀 Pipeline Stages

### 1. **Checkout** 📦
- Clona o repositório do GitHub usando credenciais configuradas
- Branch: `main`

### 2. **Install Dependencies** 📚
- Instala PNPM globalmente
- Instala dependências do projeto (`pnpm install`)

### 3. **Build Application** 🏗️
- Configura variáveis de ambiente para produção
- Executa build otimizado (`pnpm run build`)
- Gera arquivos estáticos na pasta `dist/`

### 4. **Run Tests** 🧪
- Executa linter (`pnpm run lint`)
- Verifica qualidade do código

### 5. **Build Docker Image** 🐳
- Constrói imagem Docker multi-stage
- Tags: `rssarti/clica-sso-front:BUILD_NUMBER` e `:latest`

### 6. **Push Docker Image** 📤
- Envia imagem para Docker Hub
- Usa credenciais `dockerhub` do Jenkins

### 7. **Deploy to Production** 🚢
- Aplica ConfigMap no Kubernetes
- Atualiza deployment com nova imagem
- Aguarda rollout completo

### 8. **Health Check** 🏥
- Verifica se pods estão prontos
- Testa endpoint `/health`
- Valida funcionamento da aplicação

## ⚙️ Configurações

### Variáveis de Ambiente
```bash
VITE_API_URL=https://api.clicatecnologia.com.br
VITE_SSO_URL=https://accounts.clicatecnologia.com.br
VITE_SOCKET_IO=https://accounts.clicatecnologia.com.br
VITE_SOCKET_PATCH=/socket.io/
```

### Credenciais Jenkins
- `github`: Acesso ao repositório GitHub
- `dockerhub`: Push para Docker Hub
- `k8s`: Acesso ao cluster Kubernetes

### Recursos Kubernetes
- **Namespace**: `production`
- **Replicas**: 3 pods
- **Resources**: 64Mi-128Mi RAM, 50m-100m CPU
- **Health Checks**: Liveness e Readiness probes

## 📁 Estrutura de Arquivos

```
clica-sso-front/
├── Jenkinsfile              # Pipeline principal
├── Dockerfile               # Imagem Docker multi-stage
├── docker-entrypoint.sh     # Script de inicialização
├── k8s/
│   ├── deployment.yaml      # Deployment, Service e Ingress
│   └── configmap.yaml       # Configurações da aplicação
└── src/                     # Código fonte React
```

## 🔒 Segurança

- Container roda como usuário não-root (UID 1001)
- Security headers configurados no Nginx
- HTTPS obrigatório via Ingress
- Certificados SSL automáticos (cert-manager)

## 🚦 Monitoramento

### Health Checks
- **Liveness Probe**: `GET /health` (30s intervalo)
- **Readiness Probe**: `GET /health` (5s intervalo)
- **Startup Time**: 30s timeout

### Logs
- Logs do Nginx: `/var/log/nginx/`
- Logs do aplicação via `kubectl logs`

## 🔄 Deploy Manual

Se necessário fazer deploy manual:

```bash
# 1. Build e push da imagem
docker build -t rssarti/clica-sso-front:manual .
docker push rssarti/clica-sso-front:manual

# 2. Atualizar no Kubernetes
kubectl set image deployment/clica-sso-front \
  clica-sso-front=rssarti/clica-sso-front:manual \
  --namespace=production

# 3. Verificar status
kubectl rollout status deployment/clica-sso-front --namespace=production
```

## 🐛 Troubleshooting

### Pipeline Falhando
1. Verificar logs do Jenkins
2. Validar credenciais (GitHub, Docker Hub, K8s)
3. Verificar conectividade com cluster

### Aplicação não Respondendo
1. Verificar logs dos pods: `kubectl logs -l app=clica-sso-front -n production`
2. Verificar eventos: `kubectl get events -n production`
3. Verificar recursos: `kubectl describe deployment clica-sso-front -n production`

### Problemas de DNS/Ingress
1. Verificar certificados SSL
2. Verificar configuração do Ingress Controller
3. Verificar registros DNS para `accounts.clicatecnologia.com.br`

## 📞 Contato

- **Desenvolvedor**: Rafael Sarti
- **Repository**: https://github.com/rssarti/clica-sso-front
- **Docker Hub**: https://hub.docker.com/r/rssarti/clica-sso-front