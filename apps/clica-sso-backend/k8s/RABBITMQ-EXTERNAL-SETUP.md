# 🐰 Instalação do RabbitMQ no Servidor Jenkins

## 📋 Pré-requisitos

- Servidor onde o Jenkins está rodando
- Docker instalado
- Porta 5672 (AMQP) acessível do cluster Kubernetes
- Porta 15672 (Management UI) opcional para acesso web

---

## 🚀 Instalação com Docker

### 1. Criar diretório para dados persistentes

```bash
mkdir -p /opt/rabbitmq/data
mkdir -p /opt/rabbitmq/log
```

### 2. Executar RabbitMQ com Docker

```bash
docker run -d \
  --name rabbitmq \
  --hostname rabbitmq \
  --restart unless-stopped \
  -p 5672:5672 \
  -p 15672:15672 \
  -e RABBITMQ_DEFAULT_USER=admin \
  -e RABBITMQ_DEFAULT_PASS=admin123 \
  -v /opt/rabbitmq/data:/var/lib/rabbitmq \
  -v /opt/rabbitmq/log:/var/log/rabbitmq \
  rabbitmq:3.13-management-alpine
```

### 3. Verificar se está rodando

```bash
docker ps | grep rabbitmq
docker logs rabbitmq
```

### 4. Acessar Management UI

```
http://SEU_IP:15672
Usuário: admin
Senha: admin123
```

---

## 🔒 Configuração de Firewall

### UFW (Ubuntu/Debian)

```bash
# Permitir porta AMQP
sudo ufw allow 5672/tcp

# Permitir Management UI (opcional)
sudo ufw allow 15672/tcp

# Verificar regras
sudo ufw status
```

### Firewalld (CentOS/RHEL)

```bash
# Permitir porta AMQP
sudo firewall-cmd --permanent --add-port=5672/tcp

# Permitir Management UI (opcional)
sudo firewall-cmd --permanent --add-port=15672/tcp

# Recarregar
sudo firewall-cmd --reload
```

---

## 🔧 Configuração no Kubernetes

Após instalar o RabbitMQ no servidor Jenkins, atualize a variável de ambiente no deployment:

```yaml
env:
- name: RABBITMQ_URL
  value: "amqp://admin:admin123@IP_DO_SERVIDOR_JENKINS:5672"
```

**Exemplo:**
```yaml
- name: RABBITMQ_URL
  value: "amqp://admin:admin123@192.168.1.100:5672"
```

Aplicar no cluster:
```bash
kubectl apply -f k8s/deployment.yaml
```

---

## ✅ Testar Conexão

### Do servidor Jenkins

```bash
# Instalar telnet se necessário
sudo apt-get install telnet

# Testar conexão
telnet localhost 5672
```

### Do cluster Kubernetes

```bash
# Entrar em um pod do backend
kubectl exec -it deployment/clica-sso-backend -- sh

# Testar conectividade
nc -zv IP_DO_JENKINS 5672
```

---

## 📊 Monitoramento

### Ver logs

```bash
docker logs -f rabbitmq
```

### Verificar filas via CLI

```bash
docker exec rabbitmq rabbitmqctl list_queues
```

### Ver conexões ativas

```bash
docker exec rabbitmq rabbitmqctl list_connections
```

---

## 🔄 Comandos Úteis

### Parar RabbitMQ

```bash
docker stop rabbitmq
```

### Iniciar RabbitMQ

```bash
docker start rabbitmq
```

### Reiniciar RabbitMQ

```bash
docker restart rabbitmq
```

### Ver status

```bash
docker exec rabbitmq rabbitmqctl status
```

### Backup de dados

```bash
# Parar container
docker stop rabbitmq

# Fazer backup
tar -czf rabbitmq-backup-$(date +%Y%m%d).tar.gz /opt/rabbitmq/data

# Iniciar container
docker start rabbitmq
```

---

## 🔐 Segurança

### Alterar senha padrão

```bash
docker exec rabbitmq rabbitmqctl change_password admin NOVA_SENHA_FORTE
```

### Criar usuário adicional

```bash
docker exec rabbitmq rabbitmqctl add_user myuser mypassword
docker exec rabbitmq rabbitmqctl set_user_tags myuser administrator
docker exec rabbitmq rabbitmqctl set_permissions -p / myuser ".*" ".*" ".*"
```

### Remover usuário guest (recomendado)

```bash
docker exec rabbitmq rabbitmqctl delete_user guest
```

---

## 🌐 Nginx Reverse Proxy (Opcional)

Se quiser expor o Management UI com domínio:

```nginx
server {
    listen 80;
    server_name rabbit.clicatecnologia.com.br;
    
    location / {
        proxy_pass http://localhost:15672;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        
        # WebSocket support
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

---

## 📝 Checklist de Instalação

- [ ] Docker instalado no servidor Jenkins
- [ ] RabbitMQ container criado e rodando
- [ ] Porta 5672 acessível do cluster Kubernetes
- [ ] Management UI acessível em http://IP:15672
- [ ] Firewall configurado
- [ ] IP do servidor Jenkins identificado
- [ ] Deployment do backend atualizado com IP correto
- [ ] Deployment aplicado no cluster
- [ ] Teste de conectividade do pod para o RabbitMQ
- [ ] Senha padrão alterada (produção)

---

## 🎯 Próximos Passos

1. **Instalar RabbitMQ** no servidor Jenkins usando o comando docker acima
2. **Anotar o IP do servidor** Jenkins
3. **Atualizar deployment** com o IP correto:
   ```bash
   # Editar k8s/deployment.yaml
   # Trocar SEU_IP_JENKINS pelo IP real
   
   kubectl apply -f k8s/deployment.yaml
   ```
4. **Verificar logs** do backend para confirmar conexão

---

## 🆘 Troubleshooting

### Container não inicia

```bash
# Ver logs completos
docker logs rabbitmq

# Ver eventos do Docker
journalctl -u docker -f
```

### Porta já em uso

```bash
# Verificar o que está usando a porta
sudo netstat -tlnp | grep 5672
sudo lsof -i :5672
```

### Erro de permissão nos volumes

```bash
# Ajustar permissões
sudo chown -R 999:999 /opt/rabbitmq/data
sudo chown -R 999:999 /opt/rabbitmq/log
```

### Backend não conecta

```bash
# Verificar se RabbitMQ está ouvindo em todas as interfaces
docker exec rabbitmq netstat -tlnp | grep 5672

# Deve mostrar: 0.0.0.0:5672
```

---

**Instalação criada em:** 06/11/2025
