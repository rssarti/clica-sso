# Configurações Docker para Clica SSO

## Como usar

### 1. Construir e iniciar os containers
```bash
docker-compose up -d --build
```

### 2. Parar os containers
```bash
docker-compose down
```

### 3. Ver logs
```bash
docker-compose logs -f backend
```

## Serviços disponíveis

- **Backend NestJS**: http://localhost:3000
- **PostgreSQL**: localhost:5432
- **pgAdmin**: http://localhost:8080

## Usuários de exemplo criados automaticamente

Todos os usuários têm a senha: `123456`

1. **Administrador**
   - Email: admin@clica.com
   - Role: admin

2. **Usuário**
   - Email: user@clica.com
   - Role: user

3. **Cliente**
   - Email: cliente@clica.com
   - Role: client

## Endpoints disponíveis

- `POST /auth/login` - Login
- `POST /auth/validate` - Validar token
- `GET /auth/profile` - Perfil do usuário
- `POST /users/register` - Registrar novo usuário

## Exemplo de uso SSO

```bash
# Login
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@clica.com", "password": "123456"}'

# Validar token (usar o token retornado no login)
curl -X POST http://localhost:3000/auth/validate \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

## pgAdmin Access

- URL: http://localhost:8080
- Email: admin@clica.com
- Password: admin123

Para conectar ao banco no pgAdmin:
- Host: postgres
- Port: 5432
- Database: clica_sso
- Username: postgres
- Password: postgres123
