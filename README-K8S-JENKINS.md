# Kubernetes & Jenkins Setup - Clica SSO

Este documento descreve como usar a infraestrutura de Kubernetes e Jenkins para fazer deploy automático do Clica SSO.

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Arquitetura](#arquitetura)
3. [Estrutura de Arquivos](#estrutura-de-arquivos)
4. [Setup Jenkins](#setup-jenkins)
5. [Setup Kubernetes](#setup-kubernetes)
6. [Deploy](#deploy)
7. [Troubleshooting](#troubleshooting)

---

## 🎯 Visão Geral

Esta estrutura permite fazer **deploy automático** do Clica SSO em um cluster K3s usando Jenkins com os seguintes componentes:

- **Frontend**: React/Vue em `accounts.clicatecnologia.com.br`
- **Backend**: NestJS em `api.clicatecnologia.com.br`
- **WebSocket**: Socket.IO em `ws.clicatecnologia.com.br`
- **Ingress**: Traefik com SSL automático via Let's Encrypt
- **Registry**: DockerHub

---

## 🏗️ Arquitetura

```
┌─────────────────┐
│   Git (push)    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│     Jenkins     │  ◄─── Credenciais:
├─────────────────┤       • dockerhub-credentials
│ • Build Apps    │       • dockerhub-username
│ • Build Images  │       • clica-sso-k3s-token
│ • Push Registry │       • clica-sso-env-file
│ • Deploy K8s    │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────┐
│      Docker Registry        │
│    (docker.io/username)     │
└────────┬────────────────────┘
         │
         ▼
┌────────────────────────────────────────┐
│          K3s Cluster                   │
├────────────────────────────────────────┤
│                                        │
│  Namespace: clica-sso                  │
│  ├─ Backend Deployment (2 replicas)    │
│  ├─ Frontend Deployment (2 replicas)   │
│  ├─ WebSocket Deployment (2 replicas)  │
│  ├─ ConfigMap (vars públicas)          │
│  ├─ Secrets (env vars sensíveis)       │
│  └─ Ingress (Traefik)                  │
│     ├─ api.clicatecnologia.com.br      │
│     ├─ accounts.clicatecnologia.com.br │
│     └─ ws.clicatecnologia.com.br       │
│                                        │
└────────────────────────────────────────┘
```

---

## 📁 Estrutura de Arquivos

```
clica-sso/
├── Jenkinsfile                      # Pipeline (build, push, deploy)
├── .env.jenkins.example             # Template de env vars para Jenkins
├── k8s/
│   ├── namespace.yaml               # Namespace clica-sso
│   ├── configmap.yaml               # Variáveis públicas
│   ├── secrets.yaml                 # Template de secrets
│   ├── service-account.yaml         # ServiceAccount + RBAC
│   ├── backend-deployment.yaml      # Backend Deployment + Service
│   ├── frontend-deployment.yaml     # Frontend Deployment + Service
│   ├── websocket-deployment.yaml    # WebSocket Deployment + Service
│   ├── ingress.yaml                 # Traefik Ingress Rules
│   └── letsencrypt-issuer.yaml      # Let's Encrypt SSL Issuer
├── apps/
│   ├── clica-sso-backend/
│   │   └── Dockerfile               # Backend build (pnpm)
│   └── clica-sso-front/
│       └── Dockerfile               # Frontend build (pnpm + nginx)
└── README-K8S-JENKINS.md            # Este arquivo
```

---

## 🔧 Setup Jenkins

### 1. Preparar Credenciais no Jenkins

Acesse: `Jenkins > Manage Jenkins > Manage Credentials > System > Global credentials`

#### 1.1 Secret File: `clica-sso-env-file`

```
Tipo: Secret file
ID: clica-sso-env-file
Description: Clica SSO Environment File
File: (upload arquivo .env com todos os secrets)
```

**Arquivo `.env` deve conter:**

```env
DATABASE_URL=postgresql://user:pass@host:5432/clica_sso
DB_USER=postgres
DB_PASSWORD=postgres_password
JWT_SECRET=sua-chave-jwt-super-segura
RABBITMQ_URL=amqp://admin:admin123@rabbitmq-host:5672/
RABBITMQ_USER=admin
RABBITMQ_PASSWORD=admin123
S3_ACCESS_KEY=...
S3_SECRET_KEY=...
VITE_API_URL=https://api.clicatecnologia.com.br
VITE_SOCKET_IO=wss://ws.clicatecnologia.com.br
```

#### 1.2 Username with Password: `dockerhub-credentials`

```
Tipo: Username with password
Username: seu-usuario-dockerhub
Password: seu-token-dockerhub (não senha!)
ID: dockerhub-credentials
```

**Obter token no DockerHub:**
1. Acesse https://hub.docker.com/settings/security
2. Clique "New Access Token"
3. Copie o token

#### 1.3 Secret Text: `dockerhub-username`

```
Tipo: Secret text
Secret: seu-usuario-dockerhub
ID: dockerhub-username
```

#### 1.4 Secret Text: `clica-sso-k3s-token`

```
Tipo: Secret text
Secret: (token do K3s)
ID: clica-sso-k3s-token
```

**Obter token no K3s:**

```bash
kubectl create token jenkins-deployer -n clica-sso
```

### 2. Criar Job no Jenkins

1. **Novo Job > Pipeline**
2. **Pipeline section:**
   - Definition: `Pipeline script from SCM`
   - SCM: `Git`
   - Repository URL: `https://github.com/seu-usuario/clica-sso.git`
   - Credentials: (selecione suas credenciais Git)
   - Branch: `*/main`
   - Script Path: `Jenkinsfile`

3. **Build Triggers (opcional):**
   - `GitHub hook trigger for GITScm polling` (se usar GitHub)
   - Ou `Poll SCM` com schedule `H/15 * * * *` (a cada 15 min)

4. **Save e Test**

---

## 🚀 Setup Kubernetes

### 1. Pré-requisitos

- K3s instalado e rodando
- `kubectl` configurado
- Traefik Ingress Controller (padrão no K3s)
- cert-manager instalado

#### Instalar cert-manager (se não tiver):

```bash
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml
```

### 2. Aplicar Configurações Iniciais

```bash
# Aplicar namespace
kubectl apply -f k8s/namespace.yaml

# Aplicar service account e RBAC
kubectl apply -f k8s/service-account.yaml

# Aplicar Let's Encrypt issuer
kubectl apply -f k8s/letsencrypt-issuer.yaml

# Verificar se está tudo criado
kubectl get ns clica-sso
kubectl get sa -n clica-sso
```

### 3. Configurar Credenciais de Banco de Dados e Secrets

O Jenkinsfile cria automaticamente a secret a partir do `.env-file`, mas você pode criar manualmente:

```bash
kubectl create secret generic clica-sso-secrets \
  --from-literal=DATABASE_URL="postgresql://..." \
  --from-literal=JWT_SECRET="..." \
  --from-literal=RABBITMQ_URL="..." \
  -n clica-sso
```

### 4. Verificar Configurações

```bash
# Ver namespace
kubectl get ns clica-sso

# Ver service account
kubectl get sa -n clica-sso

# Ver RBAC role binding
kubectl get rolebinding -n clica-sso
kubectl get clusterrolebinding | grep jenkins-deployer
```

---

## 🚢 Deploy

### Opção 1: Via Jenkins (Recomendado)

1. Acesse seu job no Jenkins
2. Clique "Build with Parameters"
3. Selecione a ação:
   - **Deploy (Normal)** - Build, push, deploy
   - **Deploy + Seed Database** - Build, deploy + seed
   - **Seed Database Only** - Apenas seed
   - **Migration Only** - Apenas migrations

4. Clique "Build"

### Opção 2: Manual com kubectl

```bash
# Criar secrets
kubectl create secret generic clica-sso-secrets \
  --from-env-file=.env \
  -n clica-sso \
  --dry-run=client -o yaml | kubectl apply -f -

# Aplicar configs
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/service-account.yaml

# Deploy
kubectl apply -f k8s/backend-deployment.yaml
kubectl apply -f k8s/frontend-deployment.yaml
kubectl apply -f k8s/websocket-deployment.yaml

# Ingress e SSL
kubectl apply -f k8s/ingress.yaml
kubectl apply -f k8s/letsencrypt-issuer.yaml

# Verificar rollout
kubectl rollout status deployment/clica-sso-backend -n clica-sso
kubectl rollout status deployment/clica-sso-frontend -n clica-sso
kubectl rollout status deployment/clica-sso-websocket -n clica-sso
```

---

## 🔍 Verificação

### Verificar Deployments

```bash
# Ver status
kubectl get deployment -n clica-sso
kubectl get pods -n clica-sso
kubectl get svc -n clica-sso

# Ver logs
kubectl logs -f deployment/clica-sso-backend -n clica-sso
kubectl logs -f deployment/clica-sso-frontend -n clica-sso
```

### Verificar Ingress

```bash
# Ver ingress rules
kubectl get ingress -n clica-sso

# Ver certificado SSL
kubectl describe certificate -n clica-sso
kubectl get secret clica-sso-tls-cert -n clica-sso -o yaml

# Testar conectividade
curl -k https://api.clicatecnologia.com.br/health
curl -k https://accounts.clicatecnologia.com.br/
```

### Verificar Secrets

```bash
# Ver secret keys (apenas os nomes, não os valores)
kubectl get secret clica-sso-secrets -n clica-sso -o jsonpath='{.data}' | jq 'keys'

# Ver um valor específico (CUIDADO - valor descodificado em base64!)
kubectl get secret clica-sso-secrets -n clica-sso -o jsonpath='{.data.JWT_SECRET}' | base64 -d
```

---

## 🐛 Troubleshooting

### Pod não está iniciando

```bash
# Ver logs do pod
kubectl logs <pod-name> -n clica-sso

# Ver descrição detalhada
kubectl describe pod <pod-name> -n clica-sso

# Ver eventos do namespace
kubectl get events -n clica-sso --sort-by='.lastTimestamp'
```

### Certificado SSL não está sendo gerado

```bash
# Ver status de cert-manager
kubectl logs -f -n cert-manager deployment/cert-manager

# Ver status do certificado
kubectl describe certificate clica-sso-tls-cert -n clica-sso

# Ver challenge (quando estiver em processo)
kubectl get challenge -n clica-sso
```

### Problema de conexão ao banco

```bash
# Verificar se a secret está correta
kubectl get secret clica-sso-secrets -n clica-sso -o yaml

# Verificar se o DATABASE_URL está correto
kubectl get secret clica-sso-secrets -n clica-sso -o jsonpath='{.data.DATABASE_URL}' | base64 -d

# Testar conectividade (dentro do pod)
kubectl exec -it <backend-pod> -n clica-sso -- bash
# Dentro do pod:
echo $DATABASE_URL
```

### Image pull error

```bash
# Verificar se existe credential para DockerHub privado
kubectl get secret -n clica-sso

# Se usar imagens privadas, criar image pull secret
kubectl create secret docker-registry dockerhub-secret \
  --docker-server=docker.io \
  --docker-username=seu-usuario \
  --docker-password=seu-token \
  -n clica-sso

# Adicionar ao deployment (no spec.imagePullSecrets)
```

### Reiniciar Deploy

```bash
# Forçar reiniciar pods
kubectl rollout restart deployment/clica-sso-backend -n clica-sso
kubectl rollout restart deployment/clica-sso-frontend -n clica-sso
kubectl rollout restart deployment/clica-sso-websocket -n clica-sso

# Aguardar rollout
kubectl rollout status deployment/clica-sso-backend -n clica-sso
```

### Limpar e recomeçar

```bash
# Remover todo o namespace (CUIDADO!)
kubectl delete namespace clica-sso

# Recriar
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/service-account.yaml
# ... etc
```

---

## 📊 Monitoramento

### Health Checks

Todos os deployments possuem `livenessProbe` e `readinessProbe`:

```bash
# Ver health check status
kubectl get deployment clica-sso-backend -n clica-sso -o yaml | grep -A 20 "livenessProbe"

# Testar manualmente
kubectl exec <backend-pod> -n clica-sso -- curl http://localhost:3000/health
```

### Escalabilidade

As configurações padrão utilizam 2 replicas para cada serviço:

```bash
# Escalar manualmente
kubectl scale deployment/clica-sso-backend --replicas=3 -n clica-sso

# Usar HPA (Horizontal Pod Autoscaler)
kubectl autoscale deployment/clica-sso-backend \
  --min=2 --max=5 --cpu-percent=80 -n clica-sso
```

---

## 🔐 Segurança

### Best Practices Implementadas

- ✅ **Secrets separados de ConfigMap** - Dados sensíveis em Secrets
- ✅ **RBAC configurado** - Service account com permissões limitadas
- ✅ **SSL/TLS automático** - Let's Encrypt com cert-manager
- ✅ **Resource limits** - CPU e Memory limits configurados
- ✅ **Health checks** - Liveness e readiness probes
- ✅ **Credenciais em Jenkins** - Não em Git
- ✅ **Image versioning** - Commit hash para rastrabilidade

### Recommendations Adicionais

- 🔒 Use IP whitelisting para Jenkins
- 🔒 Configure network policies no K3s
- 🔒 Faça backup regular do cluster
- 🔒 Implemente logging centralizado
- 🔒 Use private image registry (não DockerHub público)

---

## 📝 Próximos Passos

1. **Configurar Jenkins** com todas as credenciais
2. **Testar pipeline** com "Deploy (Normal)"
3. **Monitorar logs** e certificados SSL
4. **Configurar alertas** (opcional)
5. **Documentar procedimentos** de troubleshooting

---

## 📞 Suporte

Para questões sobre:

- **Kubernetes**: Ver docs oficiais https://kubernetes.io
- **K3s**: Ver https://docs.k3s.io
- **Jenkins**: Ver https://www.jenkins.io/doc
- **Traefik**: Ver https://doc.traefik.io
- **cert-manager**: Ver https://cert-manager.io

---

**Última atualização**: March 15, 2026
