# 🐰 RabbitMQ - Configuração e Acesso

## 📋 Informações do Deploy

### 🌐 Acessos

- **URL Management UI:** https://rabbit.clicatecnologia.com.br
- **AMQP URL (interno):** `amqp://admin:admin123@rabbitmq:5672`
- **Management Port (interno):** `rabbitmq:15672`

### 🔐 Credenciais

- **Usuário:** `admin`
- **Senha:** `admin123`

> ⚠️ **Importante:** Altere estas credenciais em produção!

---

## 📦 Recursos Criados

### Deployment
- **Nome:** `rabbitmq`
- **Imagem:** `rabbitmq:3.13-management-alpine`
- **Replicas:** 1
- **Recursos:**
  - Requests: 256Mi RAM, 100m CPU
  - Limits: 512Mi RAM, 500m CPU

### Portas
- **5672:** AMQP (protocolo RabbitMQ)
- **15672:** Management UI (interface web)

### Plugins Habilitados
- `rabbitmq_management` - Interface de gerenciamento
- `rabbitmq_prometheus` - Métricas para Prometheus

### Storage
- **PVC:** `rabbitmq-pvc`
- **Tamanho:** 5Gi
- **Storage Class:** `do-block-storage`
- **Mount Path:** `/var/lib/rabbitmq`

---

## 🚀 Como Usar

### 1. Acessar Management UI

```bash
# Aguardar certificado SSL ser emitido
kubectl get certificate rabbitmq-tls

# Quando READY=True, acessar:
https://rabbit.clicatecnologia.com.br
```

**Login:**
- Usuário: `admin`
- Senha: `admin123`

### 2. Conectar da Aplicação

No deployment do backend, a variável já está configurada:

```yaml
env:
- name: RABBITMQ_URL
  value: "amqp://admin:admin123@rabbitmq:5672"
```

### 3. Testar Conexão

```bash
# Dentro de um pod
kubectl exec -it deployment/clica-sso-backend -- sh

# Testar conectividade
nc -zv rabbitmq 5672
nc -zv rabbitmq 15672
```

---

## 🔍 Monitoramento

### Ver Logs

```powershell
# Logs do RabbitMQ
kubectl logs -f deployment/rabbitmq

# Status do pod
kubectl get pods -l app=rabbitmq

# Describe para detalhes
kubectl describe pod -l app=rabbitmq
```

### Health Checks

```powershell
# Verificar se RabbitMQ está saudável
kubectl exec deployment/rabbitmq -- rabbitmq-diagnostics -q ping

# Check de conectividade de portas
kubectl exec deployment/rabbitmq -- rabbitmq-diagnostics -q check_port_connectivity

# Status geral
kubectl exec deployment/rabbitmq -- rabbitmqctl status
```

---

## 📊 Management UI - Principais Funcionalidades

### Após login em https://rabbit.clicatecnologia.com.br:

1. **Overview** - Visão geral do cluster
2. **Connections** - Conexões ativas
3. **Channels** - Canais abertos
4. **Exchanges** - Trocadores de mensagens
5. **Queues** - Filas de mensagens
   - `billing.create_payment` - Criada automaticamente pelo backend
6. **Admin** - Gerenciar usuários e permissões

---

## 🔧 Configurações Avançadas

### Alterar Credenciais

```powershell
# Editar secret
kubectl edit secret rabbitmq-secrets

# Ou recriar:
kubectl delete secret rabbitmq-secrets

kubectl create secret generic rabbitmq-secrets `
  --from-literal=rabbitmq-username='novo-usuario' `
  --from-literal=rabbitmq-password='nova-senha-forte'

# Reiniciar pod para aplicar
kubectl rollout restart deployment/rabbitmq
```

### Escalar Replicas

```powershell
# Para alta disponibilidade (requer configuração de cluster)
kubectl scale deployment rabbitmq --replicas=3
```

### Ajustar Recursos

```yaml
# Editar deployment
kubectl edit deployment rabbitmq

# Modificar:
resources:
  requests:
    memory: "512Mi"
    cpu: "200m"
  limits:
    memory: "1Gi"
    cpu: "1000m"
```

---

## 🐛 Troubleshooting

### Pod não inicia

```powershell
# Ver eventos
kubectl describe pod -l app=rabbitmq

# Ver logs
kubectl logs -l app=rabbitmq --tail=100

# Verificar PVC
kubectl get pvc rabbitmq-pvc
```

### Erro de conexão

```powershell
# Testar DNS
kubectl run test --image=busybox --rm -it -- nslookup rabbitmq

# Testar conectividade
kubectl run test --image=busybox --rm -it -- nc -zv rabbitmq 5672
```

### Management UI não carrega

```powershell
# Verificar ingress
kubectl describe ingress rabbitmq-ingress

# Verificar certificado
kubectl describe certificate rabbitmq-tls

# Logs do NGINX Ingress
kubectl logs -n ingress-nginx -l app.kubernetes.io/name=ingress-nginx
```

### Plugins não habilitados

```powershell
# Ver plugins ativos
kubectl exec deployment/rabbitmq -- rabbitmq-plugins list

# Habilitar plugin manualmente
kubectl exec deployment/rabbitmq -- rabbitmq-plugins enable rabbitmq_management
```

---

## 📝 Exemplo de Código

### Publicar mensagem (Node.js)

```javascript
import amqp from 'amqplib';

async function publishMessage() {
  const connection = await amqp.connect('amqp://admin:admin123@rabbitmq:5672');
  const channel = await connection.createChannel();
  
  const queue = 'billing.create_payment';
  const message = { userId: 123, amount: 99.90 };
  
  await channel.assertQueue(queue, { durable: true });
  channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)), {
    persistent: true
  });
  
  console.log('Mensagem enviada!');
  
  await channel.close();
  await connection.close();
}
```

### Consumir mensagem (NestJS - já configurado no backend)

```typescript
// src/billing/billing.controller.ts
@MessagePattern('billing.create_payment')
async handleCreatePayment(data: any) {
  console.log('Recebido:', data);
  // Processar pagamento
}
```

---

## 🔒 Segurança

### Boas Práticas

1. **Alterar credenciais padrão** em produção
2. **Usar Sealed Secrets** para credenciais
3. **Limitar acesso ao Management UI** (Basic Auth adicional)
4. **Monitorar filas** para evitar acúmulo
5. **Configurar alertas** para falhas

### Criar usuário adicional

```powershell
# Acessar pod
kubectl exec -it deployment/rabbitmq -- sh

# Criar usuário
rabbitmqctl add_user myuser mypassword

# Dar permissões
rabbitmqctl set_user_tags myuser administrator
rabbitmqctl set_permissions -p / myuser ".*" ".*" ".*"
```

---

## 📚 Referências

- [RabbitMQ Documentation](https://www.rabbitmq.com/documentation.html)
- [Management Plugin](https://www.rabbitmq.com/management.html)
- [Kubernetes Deployment](https://www.rabbitmq.com/kubernetes/operator/operator-overview.html)

---

## ✅ Checklist de Deploy

- [x] ConfigMap criado com plugins
- [x] Secret criado com credenciais
- [x] Deployment configurado
- [x] PVC criado (5Gi)
- [x] Service expondo portas 5672 e 15672
- [x] Ingress configurado para rabbit.clicatecnologia.com.br
- [x] Certificado SSL em processo de emissão
- [x] Health checks configurados
- [ ] DNS apontando para IP do Ingress
- [ ] Certificado SSL emitido (aguardando)
- [ ] Credenciais alteradas para produção
- [ ] Backup configurado

---

## 🎯 Próximos Passos

1. **Aguardar certificado SSL** ser emitido (5-10 minutos)
2. **Acessar Management UI** em https://rabbit.clicatecnologia.com.br
3. **Alterar credenciais** padrão
4. **Testar envio/recebimento** de mensagens
5. **Configurar backup** do PVC
6. **Monitorar métricas** com Prometheus (se disponível)

---

**Deployment criado em:** 06/11/2025  
**Última atualização:** 06/11/2025
