# 🚀 Deployment Kubernetes - Clica SSO Backend

Este diretório contém os manifestos Kubernetes para deploy do backend SSO na infraestrutura Clica.

## 📋 Pré-requisitos

- Cluster Kubernetes configurado
- `kubectl` instalado e configurado
- Cert-manager instalado no cluster
- NGINX Ingress Controller instalado
- Service Account `jenkins-deployer` configurado

## 🗂️ Estrutura de Arquivos

```
k8s/
├── cert-issuer.yaml         # ClusterIssuer para certificados SSL
├── configmap.yaml           # Configurações não sensíveis
├── deployment.yaml          # Deployment, Service e Ingress
├── hpa.yaml                 # HorizontalPodAutoscaler
└── secrets.yaml.example     # Template para secrets (NÃO commitar com valores reais!)
```

## 🔧 Configuração Inicial

### 1. Criar Secrets

**IMPORTANTE:** Nunca commite secrets reais no Git!

```bash
# Copiar template
cp k8s/secrets.yaml.example k8s/secrets.yaml

# Editar com valores reais
vim k8s/secrets.yaml

# Aplicar secrets
kubectl apply -f k8s/secrets.yaml

# IMPORTANTE: Adicionar ao .gitignore
echo "k8s/secrets.yaml" >> .gitignore
```

### 2. Gerar JWT Secret

```bash
# Gerar JWT secret seguro
openssl rand -base64 32

# Adicionar ao secrets.yaml
```

### 3. Configurar Database URL

```bash
# Formato PostgreSQL
DATABASE_URL="postgresql://usuario:senha@postgres-host:5432/clica_sso"

# Adicionar ao secrets.yaml
```

## 📦 Deploy Manual

### Ordem de Aplicação

```bash
# 1. Cert-manager ClusterIssuer (apenas uma vez no cluster)
kubectl apply -f k8s/cert-issuer.yaml

# 2. ConfigMap
kubectl apply -f k8s/configmap.yaml

# 3. Secrets
kubectl apply -f k8s/secrets.yaml

# 4. Deployment, Service e Ingress
kubectl apply -f k8s/deployment.yaml

# 5. HorizontalPodAutoscaler (opcional)
kubectl apply -f k8s/hpa.yaml
```

### Deploy Completo

```bash
# Aplicar tudo de uma vez
kubectl apply -f k8s/

# Verificar status
kubectl get pods -l app=clica-sso-backend
kubectl get svc clica-sso-backend-service
kubectl get ingress clica-sso-backend-ingress
```

## 🔍 Verificação

### Status dos Pods

```bash
# Listar pods
kubectl get pods -l app=clica-sso-backend

# Logs do pod
kubectl logs -l app=clica-sso-backend --tail=100 -f

# Descrever pod
kubectl describe pod -l app=clica-sso-backend
```

### Health Check

```bash
# Dentro do cluster
kubectl run curl-test --image=curlimages/curl:latest --rm -i --restart=Never -- \
  curl -f http://clica-sso-backend-service/health

# Externo (após DNS configurado)
curl https://api.clicatecnologia.com.br/health
```

### Certificado SSL

```bash
# Verificar certificado
kubectl describe certificate clica-sso-backend-tls

# Ver secret do certificado
kubectl get secret clica-sso-backend-tls -o yaml
```

## 🔄 Atualização

### Via Jenkins

O pipeline Jenkins automaticamente:
1. Faz build da aplicação
2. Cria imagem Docker com Kaniko
3. Faz push para Docker Hub
4. Atualiza deployment no Kubernetes
5. Aguarda rollout completar

### Manual

```bash
# Atualizar imagem
kubectl set image deployment/clica-sso-backend \
  clica-sso-backend=sispsolutions/clica-sso-backend:TAG

# Verificar rollout
kubectl rollout status deployment/clica-sso-backend

# Rollback se necessário
kubectl rollout undo deployment/clica-sso-backend
```

## 🎛️ Configurações

### Variáveis de Ambiente

Configuradas em:
- **ConfigMap** (`configmap.yaml`): Configurações públicas
- **Secrets** (`secrets.yaml`): Credenciais sensíveis

### Recursos

```yaml
requests:
  memory: "256Mi"
  cpu: "100m"
limits:
  memory: "512Mi"
  cpu: "500m"
```

### Autoscaling

- **Min Replicas**: 3
- **Max Replicas**: 10
- **CPU Target**: 70%
- **Memory Target**: 80%

## 🌐 Ingress

### Configuração

- **Host**: `api.clicatecnologia.com.br`
- **TLS**: Sim (Let's Encrypt)
- **CORS**: Habilitado para `https://accounts.clicatecnologia.com.br`

### Anotações Importantes

```yaml
nginx.ingress.kubernetes.io/proxy-body-size: "10m"
nginx.ingress.kubernetes.io/enable-cors: "true"
nginx.ingress.kubernetes.io/ssl-redirect: "true"
```

## 🔐 Segurança

### Security Context

```yaml
securityContext:
  runAsNonRoot: true
  runAsUser: 1001
  allowPrivilegeEscalation: false
  capabilities:
    drop:
    - ALL
```

### Network Policies (Opcional)

```bash
# Criar network policy para isolar pods
kubectl apply -f k8s/network-policy.yaml
```

## 📊 Monitoramento

### Métricas

```bash
# CPU e Memória dos pods
kubectl top pods -l app=clica-sso-backend

# Status do HPA
kubectl get hpa clica-sso-backend-hpa
```

### Logs

```bash
# Logs em tempo real
kubectl logs -l app=clica-sso-backend -f

# Logs de todos os containers
kubectl logs -l app=clica-sso-backend --all-containers=true

# Logs anteriores (após restart)
kubectl logs -l app=clica-sso-backend --previous
```

## 🐛 Troubleshooting

### Pod não inicia

```bash
# Verificar eventos
kubectl describe pod -l app=clica-sso-backend

# Verificar logs
kubectl logs -l app=clica-sso-backend

# Verificar secrets e configmaps
kubectl get secrets clica-sso-secrets
kubectl get configmap clica-sso-backend-config
```

### Certificado SSL não funciona

```bash
# Verificar cert-manager
kubectl get clusterissuer letsencrypt-prod
kubectl describe certificate clica-sso-backend-tls

# Ver logs do cert-manager
kubectl logs -n cert-manager -l app=cert-manager
```

### Ingress não roteia

```bash
# Verificar ingress
kubectl describe ingress clica-sso-backend-ingress

# Verificar nginx ingress controller
kubectl logs -n ingress-nginx -l app.kubernetes.io/name=ingress-nginx
```

### Database connection failed

```bash
# Testar conectividade com database
kubectl run psql-test --image=postgres:15-alpine --rm -i --restart=Never -- \
  psql "postgresql://user:pass@host:5432/db" -c "SELECT 1"

# Verificar secrets
kubectl get secret clica-sso-secrets -o jsonpath='{.data.database-url}' | base64 -d
```

## 🔄 Rollback

```bash
# Ver histórico de rollouts
kubectl rollout history deployment/clica-sso-backend

# Rollback para versão anterior
kubectl rollout undo deployment/clica-sso-backend

# Rollback para revisão específica
kubectl rollout undo deployment/clica-sso-backend --to-revision=2
```

## 🗑️ Limpeza

```bash
# Deletar apenas o deployment
kubectl delete deployment clica-sso-backend

# Deletar tudo
kubectl delete -f k8s/deployment.yaml
kubectl delete -f k8s/hpa.yaml
kubectl delete -f k8s/configmap.yaml
kubectl delete secret clica-sso-secrets

# ATENÇÃO: Isso NÃO deleta o ClusterIssuer (compartilhado)
```

## 📚 Referências

- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [NGINX Ingress Controller](https://kubernetes.github.io/ingress-nginx/)
- [Cert-manager Documentation](https://cert-manager.io/docs/)
- [Let's Encrypt](https://letsencrypt.org/)

## 📞 Suporte

Para problemas relacionados ao deploy:

1. Verificar logs do Jenkins
2. Verificar eventos do Kubernetes: `kubectl get events --sort-by='.lastTimestamp'`
3. Verificar status dos pods: `kubectl get pods -l app=clica-sso-backend`
4. Consultar documentação do projeto

---

**Última atualização**: Novembro 2025
