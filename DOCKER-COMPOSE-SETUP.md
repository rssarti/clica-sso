# Docker Compose Consolidado - Clica SSO

Este é o arquivo docker-compose que executa **apenas as dependências externas** do projeto Clica SSO.

**Frontend e Backend rodam localmente com `bun dev` via Turborepo, não no Docker.**

## 📋 Serviços Inclusos

| Serviço | Porta | Descrição | Acesso |
|---------|--------|-----------|--------|
| **PostgreSQL** | 5432 | Banco de dados | `postgres` |
| **RabbitMQ** | 5672 / 15672 | Fila de mensagens + UI | http://localhost:15672 |
| **pgAdmin** | 5050 | Gerenciador do banco | http://localhost:5050 |

## 🚀 Como Usar

### 1. **Copiar Variáveis de Ambiente**

```bash
cp .env.example .env
```

### 2. **Iniciar as Dependências**

```bash
docker-compose up -d
```

### 3. **Iniciar Frontend e Backend (em outro terminal)**

```bash
bun dev
```

Isso iniciará os apps via Turborepo conforme configurado em `turbo.json`.

### 4. **Parar as Dependências**

```bash
docker-compose down
```

### 5. **Ver Logs**

```bash
docker-compose logs -f     # Todas as dependências
docker-compose logs -f postgres   # Apenas PostgreSQL
docker-compose logs -f rabbitmq   # Apenas RabbitMQ
```

## 🔐 Credenciais Padrão

### PostgreSQL
- **User:** postgres
- **Senha:** postgres
- **Banco:** clica_sso
- **Host:** postgres (localhost:5432 do PC)

### RabbitMQ
- **User:** admin
- **Senha:** admin123
- **URL:** amqp://admin:admin123@localhost:5672

### pgAdmin
- **Email:** admin@clica.com
- **Senha:** admin123
- **Acesso:** http://localhost:5050

## 🔗 Acessos Úteis

- **Frontend:** http://localhost:3000 (via `bun dev`)
- **Backend API:** http://localhost:3001 (via `bun dev`)
- **RabbitMQ UI:** http://localhost:15672
- **pgAdmin:** http://localhost:5050
- **PostgreSQL:** localhost:5432

## ⚙️ Configuração de Ambiente

No seu arquivo `.env`, certifique-se de definir:

```env
# DATABASE
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=clica_sso

# RABBITMQ
RABBITMQ_URL=amqp://admin:admin123@localhost:5672
RABBITMQ_HOST=localhost
RABBITMQ_PORT=5672
RABBITMQ_USER=admin
RABBITMQ_PASSWORD=admin123
```

> ⚠️ **Importante:** Use `localhost` no arquivo `.env`, não `postgres` ou `rabbitmq`, pois você está rodando frontend/backend localmente!

## 🛠️ Solução de Problemas

### Porta já está em uso

```bash
# Mude a porta no docker-compose.yml ou .env
# Por exemplo, mudar RabbitMQ de 5672 para 5673:
# ports:
#   - "5673:5672"
# E atualize RABBITMQ_PORT no .env
```

### Banco não inicia

```bash
# Verifique se há dados corrompidos
docker-compose down -v
docker-compose up postgres
```

### Backend não conecta ao banco

```bash
# Verifique os logs
docker-compose logs postgres

# Certifique-se de que DB_HOST=localhost no seu .env
```

### Erro de conexão RabbitMQ

```bash
# Verifique os logs
docker-compose logs rabbitmq

# Teste a conexão
docker-compose exec rabbitmq rabbitmq-diagnostics ping
```

## 📊 Health Checks

Todos os serviços têm health checks configurados. Verifique o status:

```bash
docker-compose ps
```

## 🔄 Workflow de Desenvolvimento

```bash
# Terminal 1: Inicie as dependências
docker-compose up -d

# Verifique se tudo está rodando
docker-compose ps

# Terminal 2: Inicie frontend e backend
bun dev

# Seu código agora está rodando com hot-reload
```

## 💾 Arquivos Que Precisam Estar Presentes

Para que este docker-compose funcione:

- ✅ `docker-compose.yml` (raiz)
- ✅ `.env` (variáveis de ambiente)

## 📝 Volumes Persistentes

Os seguintes volumes são criados e persistem entre reinicializações:

- `postgres_data` - Dados do banco de dados
- `rabbitmq_data` - Dados da fila de mensagens
- `pgadmin_data` - Configurações do pgAdmin

Para limpar tudo (CUIDADO - perde dados):

```bash
docker-compose down -v
```

## 🎯 Próximos Passos

1. Verifique se PostgreSQL conecta via pgAdmin
2. Teste RabbitMQ acessando http://localhost:15672
3. Inicie o desenvolvimento com `bun dev`
4. Configure variáveis de ambiente corretamente em `.env`

---

**Arquivo:** `docker-compose.yml` na raiz do projeto

**Arquivos antigos (consolidados):**
- ❌ docker-compose.postgres.yml
- ❌ docker-compose.rabbitmq.yml
- ❌ apps/clica-sso-backend/docker-compose.yml
- ❌ apps/clica-sso-front/docker-compose.yml
