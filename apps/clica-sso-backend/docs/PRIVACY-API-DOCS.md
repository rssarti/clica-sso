# Privacy System API Documentation

Este documento descreve como usar os endpoints do sistema de privacidade para gerenciar configurações de privacidade, histórico de atividades, solicitações de exportação de dados e exclusão de conta.

## Autenticação

Todos os endpoints requerem autenticação JWT. Inclua o token no cabeçalho Authorization:

```
Authorization: Bearer <seu-jwt-token>
```

## Endpoints de Configurações de Privacidade

### 1. Obter Configurações de Privacidade

```http
GET /privacy/settings
```

**Descrição:** Retorna as configurações de privacidade atuais do usuário.

**Resposta de Sucesso (200):**
```json
{
  "id": "uuid",
  "userId": "user-uuid",
  "dataProcessing": {
    "analytics": true,
    "marketing": false,
    "personalization": true,
    "thirdPartySharing": false
  },
  "communications": {
    "emailMarketing": false,
    "smsMarketing": false,
    "pushNotifications": true,
    "newsletter": true,
    "productUpdates": true,
    "securityAlerts": true
  },
  "visibility": {
    "profilePublic": false,
    "showEmail": false,
    "showPhone": false,
    "showAddress": false,
    "activityVisible": false
  },
  "dataRetention": {
    "keepLoginHistory": true,
    "keepActivityLogs": true,
    "autoDeleteAfterInactivity": false,
    "inactivityPeriodDays": 365
  },
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### 2. Atualizar Configurações de Privacidade

```http
PATCH /privacy/settings
```

**Descrição:** Atualiza as configurações de privacidade do usuário.

**Corpo da Requisição:**
```json
{
  "communicationSettings": {
    "email": true,
    "sms": false,
    "push": true,
    "marketing": false
  },
  "dataSharingSettings": {
    "partners": false,
    "analytics": true,
    "productImprovement": true
  },
  "cookieSettings": {
    "necessary": true,
    "analytics": true,
    "marketing": false,
    "functional": true
  }
}
```

**Resposta de Sucesso (200):**
```json
{
  "id": "uuid",
  "userId": "user-uuid",
  "dataProcessing": {
    "analytics": true,
    "marketing": true,
    "personalization": true,
    "thirdPartySharing": false
  },
  "communications": {
    "emailMarketing": true,
    "smsMarketing": false,
    "pushNotifications": true,
    "newsletter": false,
    "productUpdates": true,
    "securityAlerts": true
  },
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

## Endpoints de Histórico de Privacidade

### 3. Obter Histórico de Atividades

```http
GET /privacy/history?page=1&limit=10
```

**Descrição:** Retorna o histórico de atividades relacionadas à privacidade do usuário.

**Parâmetros de Query:**
- `page` (opcional): Número da página (padrão: 1)
- `limit` (opcional): Itens por página (padrão: 10)

**Resposta de Sucesso (200):**
```json
{
  "data": [
    {
      "id": "uuid",
      "userId": "user-uuid",
      "action": "SETTINGS_CHANGED",
      "description": "Privacy settings updated",
      "metadata": {
        "updatedFields": ["communicationSettings", "dataSharingSettings"]
      },
      "ipAddress": "192.168.1.1",
      "userAgent": "Mozilla/5.0...",
      "timestamp": "2024-01-01T00:00:00.000Z"
    }
  ],
  "total": 50,
  "page": 1,
  "limit": 10
}
```

**Ações Disponíveis:**
- `SETTINGS_CHANGED`: Configurações de privacidade alteradas
- `DATA_EXPORTED`: Dados exportados
- `DELETION_REQUESTED`: Solicitação de exclusão criada
- `DELETION_CANCELLED`: Solicitação de exclusão cancelada
- `PRIVACY_UPDATED`: Perfil de privacidade atualizado
- `ACCOUNT_ACCESSED`: Conta acessada
- `PASSWORD_CHANGED`: Senha alterada
- `LOGIN_SUCCESSFUL`: Login bem-sucedido
- `LOGIN_FAILED`: Tentativa de login falhada
- `LOGOUT`: Logout realizado

## Endpoints de Exportação de Dados

### 4. Solicitar Exportação de Dados

```http
POST /privacy/data-export
```

**Descrição:** Cria uma solicitação para exportar todos os dados do usuário.

**Corpo da Requisição:**
```json
{
  "requestReason": "Solicitação pessoal conforme LGPD"
}
```

**Resposta de Sucesso (201):**
```json
{
  "id": "uuid",
  "userId": "user-uuid",
  "status": "pending",
  "dataTypes": ["profile", "activities", "preferences"],
  "downloadUrl": null,
  "filePath": null,
  "requestedAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

**Possíveis Erros:**
- `400 Bad Request`: "You already have a pending data export request"

### 5. Listar Solicitações de Exportação

```http
GET /privacy/data-export
```

**Descrição:** Retorna todas as solicitações de exportação de dados do usuário.

**Resposta de Sucesso (200):**
```json
[
  {
    "id": "uuid",
    "userId": "user-uuid",
    "status": "completed",
    "dataTypes": ["profile", "activities", "preferences"],
    "downloadUrl": "https://example.com/download/user-data.zip",
    "filePath": "/exports/user-data-123.zip",
    "requestedAt": "2024-01-01T00:00:00.000Z",
    "completedAt": "2024-01-02T00:00:00.000Z",
    "updatedAt": "2024-01-02T00:00:00.000Z"
  }
]
```

**Status Possíveis:**
- `pending`: Aguardando processamento
- `processing`: Em processamento
- `completed`: Concluído
- `failed`: Falhou
- `expired`: Expirado

## Endpoints de Exclusão de Conta

### 6. Solicitar Exclusão de Conta

```http
POST /privacy/account-deletion
```

**Descrição:** Cria uma solicitação para exclusão da conta do usuário.

**Corpo da Requisição:**
```json
{
  "reason": "Não desejo mais usar a plataforma"
}
```

**Resposta de Sucesso (201):**
```json
{
  "id": "uuid",
  "userId": "user-uuid",
  "status": "pending",
  "reason": "Não desejo mais usar a plataforma",
  "approvedAt": null,
  "approvedBy": null,
  "scheduledDeletionAt": null,
  "rejectionReason": null,
  "requestedAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

**Possíveis Erros:**
- `400 Bad Request`: "You already have a pending account deletion request"

### 7. Listar Solicitações de Exclusão

```http
GET /privacy/account-deletion
```

**Descrição:** Retorna todas as solicitações de exclusão de conta do usuário.

**Resposta de Sucesso (200):**
```json
[
  {
    "id": "uuid",
    "userId": "user-uuid",
    "status": "pending",
    "reason": "Não desejo mais usar a plataforma",
    "approvedAt": null,
    "approvedBy": null,
    "scheduledDeletionAt": null,
    "rejectionReason": null,
    "requestedAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
]
```

### 8. Cancelar Solicitação de Exclusão

```http
DELETE /privacy/account-deletion/:requestId
```

**Descrição:** Cancela uma solicitação de exclusão de conta pendente.

**Parâmetros de URL:**
- `requestId`: ID da solicitação de exclusão

**Resposta de Sucesso (200):**
```json
{
  "id": "uuid",
  "userId": "user-uuid",
  "status": "cancelled",
  "reason": "Não desejo mais usar a plataforma",
  "requestedAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T12:00:00.000Z"
}
```

**Possíveis Erros:**
- `404 Not Found`: "Account deletion request not found"
- `400 Bad Request`: "Can only cancel pending requests"

## Endpoints Administrativos

### 9. Processar Exportação de Dados (Admin)

```http
POST /privacy/admin/data-export/:requestId/process
```

**Descrição:** Inicia o processamento de uma solicitação de exportação (apenas para administradores).

### 10. Completar Exportação de Dados (Admin)

```http
POST /privacy/admin/data-export/:requestId/complete
```

**Corpo da Requisição:**
```json
{
  "downloadUrl": "https://example.com/download/user-data.zip"
}
```

**Descrição:** Marca uma exportação como concluída e fornece o URL de download (apenas para administradores).

## Códigos de Status HTTP

- `200 OK`: Requisição bem-sucedida
- `201 Created`: Recurso criado com sucesso
- `400 Bad Request`: Dados de entrada inválidos ou regra de negócio violada
- `401 Unauthorized`: Token JWT inválido ou ausente
- `404 Not Found`: Recurso não encontrado
- `500 Internal Server Error`: Erro interno do servidor

## Exemplos de Uso

### Exemplo 1: Atualizar Configurações de Comunicação

```bash
curl -X PATCH http://localhost:3000/privacy/settings \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{
    "communicationSettings": {
      "email": false,
      "marketing": false
    }
  }'
```

### Exemplo 2: Solicitar Exportação de Dados

```bash
curl -X POST http://localhost:3000/privacy/data-export \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{
    "requestReason": "Exercício do direito LGPD"
  }'
```

### Exemplo 3: Verificar Histórico de Atividades

```bash
curl -X GET "http://localhost:3000/privacy/history?page=1&limit=5" \
  -H "Authorization: Bearer your-jwt-token"
```

## Considerações de Privacidade e Segurança

1. **LGPD/GDPR Compliance**: Todos os endpoints seguem as práticas de conformidade com LGPD e GDPR.

2. **Auditoria**: Todas as ações são registradas no histórico de privacidade para auditoria.

3. **Retenção de Dados**: Os dados são mantidos conforme as configurações de retenção do usuário.

4. **Segurança**: Todas as requisições requerem autenticação JWT válida.

5. **Rate Limiting**: Considere implementar rate limiting para prevenir abuso dos endpoints.

## Monitoramento e Logs

O sistema registra automaticamente:
- Alterações nas configurações de privacidade
- Solicitações de exportação e exclusão
- Acessos e modificações de dados pessoais
- Tentativas de login e logout

Todos os logs incluem timestamp, IP e user agent para auditoria completa.
