# RabbitMQ Local para Desenvolvimento

Este arquivo configura o RabbitMQ para rodar localmente via Docker, enquanto o backend roda no cluster Kubernetes.

## 🚀 Como usar

### 1. Iniciar RabbitMQ

```bash
docker-compose -f docker-compose.rabbitmq.yml up -d
```

### 2. Verificar status

```bash
docker-compose -f docker-compose.rabbitmq.yml ps
```

### 3. Acessar Management UI

Abra no navegador: http://localhost:15672

- **Usuário**: `admin`
- **Senha**: `admin123`

### 4. Parar RabbitMQ

```bash
docker-compose -f docker-compose.rabbitmq.yml down
```

### 5. Parar e limpar volumes

```bash
docker-compose -f docker-compose.rabbitmq.yml down -v
```

## 📊 Portas

- **5672**: Porta AMQP (conexão da aplicação)
- **15672**: Management UI (interface web)

## 🔗 Conexão

A aplicação no cluster está configurada para **NÃO** conectar ao RabbitMQ automaticamente.

Para habilitar a conexão:
1. Descomente o código no `src/main.ts`
2. Configure `RABBITMQ_URL` no deployment: `amqp://admin:admin123@SEU_IP_LOCAL:5672`

## 📝 Notas

- O RabbitMQ ficará disponível em `localhost:5672`
- Os dados são persistidos no volume `rabbitmq_data`
- Healthcheck configurado para verificar se o serviço está saudável
