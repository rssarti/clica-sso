# API de Perfil do Usuário

## Endpoints Implementados

### 1. **GET /users/profile**
Obter dados do perfil do usuário logado.

**Autenticação:** Bearer Token (JWT) obrigatório

**Resposta:**
```json
{
  "id": 1,
  "email": "usuario@example.com",
  "name": "Nome do Usuário",
  "document": "12345678900",
  "phone": "(11) 99999-9999",
  "address": "Endereço do usuário",
  "metadata": {
    "role": "user"
  },
  "createdAt": "2025-08-12T10:00:00.000Z",
  "updatedAt": "2025-08-12T10:00:00.000Z"
}
```

### 2. **PUT /users/profile**
Atualizar dados do perfil do usuário logado.

**Autenticação:** Bearer Token (JWT) obrigatório

**Body (todos os campos são opcionais):**
```json
{
  "name": "Novo Nome",
  "email": "novoemail@example.com",
  "password": "novasenha123",
  "document": "98765432100",
  "phone": "(11) 88888-8888",
  "address": "Novo endereço",
  "metadata": {
    "role": "admin",
    "preferences": {
      "theme": "dark"
    }
  }
}
```

**Resposta:**
```json
{
  "id": 1,
  "email": "novoemail@example.com",
  "name": "Novo Nome",
  "document": "98765432100",
  "phone": "(11) 88888-8888",
  "address": "Novo endereço",
  "metadata": {
    "role": "admin",
    "preferences": {
      "theme": "dark"
    }
  },
  "createdAt": "2025-08-12T10:00:00.000Z",
  "updatedAt": "2025-08-12T15:30:00.000Z"
}
```

## Validações

### Campos obrigatórios:
- Nenhum campo é obrigatório na atualização

### Validações específicas:
- **email**: Deve ser um email válido
- **password**: Mínimo de 6 caracteres
- **name**: Deve ser uma string
- **document**: Deve ser uma string
- **phone**: Deve ser uma string
- **address**: Deve ser uma string
- **metadata**: Deve ser um objeto JSON

## Segurança

1. **Autenticação obrigatória**: Todas as rotas exigem token JWT válido
2. **Autorização**: Usuário só pode ver/alterar seus próprios dados
3. **Hash de senha**: Senhas são automaticamente criptografadas com bcrypt
4. **Email único**: Sistema verifica se o novo email já está em uso
5. **Senha não retornada**: A senha nunca é retornada nas respostas da API

## Exemplos de Uso

### JavaScript/TypeScript (Frontend)

```javascript
// Obter perfil
const getProfile = async () => {
  const response = await fetch('/users/profile', {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
      'Content-Type': 'application/json'
    }
  });
  return response.json();
};

// Atualizar perfil
const updateProfile = async (data) => {
  const response = await fetch('/users/profile', {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });
  return response.json();
};
```

### cURL

```bash
# Obter perfil
curl -X GET "http://localhost:3000/users/profile" \
  -H "Authorization: Bearer SEU_TOKEN_JWT"

# Atualizar perfil
curl -X PUT "http://localhost:3000/users/profile" \
  -H "Authorization: Bearer SEU_TOKEN_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Novo Nome",
    "phone": "(11) 88888-8888"
  }'
```

## Códigos de Status

- **200**: Sucesso
- **400**: Dados inválidos (validação falhou)
- **401**: Token JWT inválido ou ausente
- **404**: Usuário não encontrado
- **409**: Email já está sendo usado por outro usuário
- **500**: Erro interno do servidor
