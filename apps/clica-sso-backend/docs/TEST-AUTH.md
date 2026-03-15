# Teste de Autenticação - Contracts

## 1. Fazer Login (obter token)
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@clica.com",
    "password": "123456"
  }'
```

**Resposta:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "admin@clica.com",
    "name": "Administrador"
  }
}
```

## 2. Usar token para acessar contratos
```bash
# Substituir {TOKEN} pelo access_token obtido no login

# Listar meus contratos
curl -X GET http://localhost:3000/contracts/my-contracts \
  -H "Authorization: Bearer {TOKEN}"

# Criar contrato
curl -X POST http://localhost:3000/contracts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {TOKEN}" \
  -d '{
    "userId": 1,
    "name": "Contrato Teste",
    "value": 100.00,
    "startDate": "2025-08-11",
    "endDate": "2026-08-11"
  }'

# Verificar se contrato está ativo
curl -X GET http://localhost:3000/contracts/1/active \
  -H "Authorization: Bearer {TOKEN}"
```

## 3. Exemplo sem token (deve dar erro 401)
```bash
curl -X GET http://localhost:3000/contracts
# Resposta esperada: 401 Unauthorized
```
