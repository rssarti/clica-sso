# 🔐 Correção Permanente das Credenciais S3

## 📋 Problema Identificado

Durante a investigação, descobrimos que:

1. ✅ **ConfigMap** (`k8s/configmap.yaml`) estava correto:
   - `S3_ENDPOINT`: `https://sfo3.digitaloceanspaces.com`
   - `S3_BUCKET`: `clica`
   - `S3_REGION`: `us-east-1`
   - `S3_PUBLIC_URL`: `https://clica.sfo3.cdn.digitaloceanspaces.com`

2. ❌ **Secret** (`guindakila-secrets`) estava com **placeholders** ao invés de credenciais reais:
   - `S3_ACCESS_KEY`: "seu-access-key" (placeholder)
   - `S3_SECRET_KEY`: "seu-secret-key" (placeholder)
   - `S3_ENDPOINT`: "http://IP_MINIO:9000" (MinIO local, não produção)
   - `S3_BUCKET`: "guindakila" (bucket de dev, não produção)

3. 🔄 **Jenkins Pipeline** recria o secret a cada deploy usando a credential `guindakila-env-file`

## ✅ Correção Aplicada (Temporária)

Executamos manualmente:

```bash
kubectl create secret generic guindakila-secrets \
  --namespace=guindakila \
  --from-literal=S3_ACCESS_KEY='DO00EBKYNKJK6PUNCU4A' \
  --from-literal=S3_SECRET_KEY='TU8ScFkmMk6Qjr9M/5h/4rpXb/SG4EL7Qs2GVvysdp0' \
  --dry-run=client -o yaml | kubectl apply -f -

kubectl rollout restart deployment/guindakila-backend -n guindakila
```

**Status**: ✅ S3 está funcionando agora!

## 🚨 Para Garantir que Não Quebre no Próximo Deploy

### Opção 1: Atualizar Credential do Jenkins (RECOMENDADO)

1. Acesse Jenkins: http://seu-jenkins.com
2. Navegue: **Jenkins > Manage Jenkins > Credentials**
3. Encontre a credential: `guindakila-env-file`
4. Clique em **Update**
5. Copie o conteúdo de `k8s/.env.jenkins-example`
6. Cole no campo "Content" da credential
7. Salve

### Opção 2: Modificar Jenkinsfile (Alternativa)

Se não quiser alterar a credential do Jenkins, pode comentar o stage que recria o secret:

**Arquivo**: `Jenkinsfile` (linhas 198-223)

```groovy
// Comentar este stage para não recriar o secret a cada deploy
/*
stage('Update Kubernetes Secrets') {
    when {
        not {
            expression { params.ACTION ==~ /.*Only/ }
        }
    }
    steps {
        echo 'Updating Kubernetes secrets from .env file...'
        // ... resto do código
    }
}
*/
```

⚠️ **Desvantagem**: Se precisar atualizar outras secrets (JWT, DATABASE_URL), terá que fazer manualmente.

### Opção 3: Manter Secret Existente no Jenkins (Melhor Prática)

Modificar o Jenkinsfile para **não recriar** o secret se ele já existe:

**Arquivo**: `Jenkinsfile` (linha 216-220)

**DE:**

```bash
kubectl create secret generic guindakila-secrets \
    --from-env-file=${ENV_FILE} \
    --namespace=${NAMESPACE} \
    --dry-run=client -o yaml | kubectl apply -f -
```

**PARA:**

```bash
# Só cria o secret se ele não existir
if ! kubectl get secret guindakila-secrets -n ${NAMESPACE} &> /dev/null; then
    echo "Secret não existe, criando..."
    kubectl create secret generic guindakila-secrets \
        --from-env-file=${ENV_FILE} \
        --namespace=${NAMESPACE}
else
    echo "Secret já existe, mantendo valores atuais"
fi
```

## 🔍 Como Verificar se Está Funcionando

### Verificar credenciais no secret:

```bash
kubectl get secret guindakila-secrets -n guindakila -o jsonpath='{.data.S3_ACCESS_KEY}' | base64 -d
# Deve retornar: DO00EBKYNKJK6PUNCU4A
```

### Verificar dentro do pod:

```bash
kubectl exec deployment/guindakila-backend -n guindakila -- env | grep S3_
```

### Testar S3 diretamente:

```bash
kubectl exec deployment/guindakila-backend -n guindakila -- node -e \
  "const s3 = require('@aws-sdk/client-s3'); \
   const client = new s3.S3Client({ \
     endpoint: process.env.S3_ENDPOINT, \
     region: process.env.S3_REGION, \
     credentials: { \
       accessKeyId: process.env.S3_ACCESS_KEY, \
       secretAccessKey: process.env.S3_SECRET_KEY \
     }, \
     forcePathStyle: true \
   }); \
   client.send(new s3.HeadBucketCommand({ Bucket: process.env.S3_BUCKET })) \
     .then(() => console.log('✅ S3 FUNCIONANDO!')) \
     .catch(e => console.error('❌ Erro S3:', e.message));"
```

## 📝 Arquivos de Referência

- `k8s/.env.jenkins-example` - Template do ENV_FILE para Jenkins
- `k8s/update-secrets.sh` - Script para atualizar secrets manualmente
- `k8s/secrets.yaml` - Template de secrets (não usar diretamente em produção)
- `k8s/configmap.yaml` - Configurações públicas do S3

## 🔐 Credenciais Corretas (Produção)

**DigitalOcean Spaces:**

- Endpoint: `https://sfo3.digitaloceanspaces.com`
- Região: `us-east-1` (padrão S3)
- Bucket: `clica`
- CDN: `https://clica.sfo3.cdn.digitaloceanspaces.com`
- Access Key: `DO00EBKYNKJK6PUNCU4A`
- Secret Key: `TU8ScFkmMk6Qjr9M/5h/4rpXb/SG4EL7Qs2GVvysdp0`

**MinIO Local (Desenvolvimento):**

- Endpoint: `http://localhost:9000`
- Bucket: `guindakila`
- Access Key: `minioadmin`
- Secret Key: `minioadmin123`

## ⚡ Próximos Passos

1. ✅ **Atualizar credential do Jenkins** com `k8s/.env.jenkins-example`
2. ✅ **Testar um novo deploy** para confirmar que as credenciais são mantidas
3. ✅ **Documentar no README** que as credenciais devem estar no Jenkins
4. ✅ **Rotacionar credenciais** (opcional) se houver suspeita de comprometimento

## 🎯 Resumo

**Antes:**

- Secret tinha placeholders do template
- A cada deploy, Jenkins recriava o secret com valores errados
- S3 falhava com credenciais inválidas

**Depois:**

- Secret atualizado com credenciais reais
- Pods reiniciados e funcionando
- S3 testado e validado ✅

**Para Manter:**

- Atualizar `guindakila-env-file` no Jenkins
- OU modificar Jenkinsfile para não recriar secret existente
