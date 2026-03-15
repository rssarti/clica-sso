# API de Privacidade - Documentação Completa

## Visão Geral

Esta API fornece um sistema completo de gerenciamento de privacidade em conformidade com a LGPD (Lei Geral de Proteção de Dados) e GDPR, incluindo configurações de privacidade, histórico de atividades, exportação de dados e solicitações de exclusão de conta.

## Endpoints Disponíveis

### 1. Configurações de Privacidade

#### GET `/privacy/settings` - Obter Configurações de Privacidade
Retorna as configurações de privacidade atuais do usuário.

**Autenticação:** Bearer Token necessário

**Resposta de Sucesso (200):**
```json
{
  "id": "uuid",
  "userId": "uuid",
  "dataSharingSettings": {
    "partners": true,
    "analytics": true,
    "productImprovement": false,
    "personalization": true
  },
  "communicationSettings": {
    "email": true,
    "sms": false,
    "push": true,
    "marketing": false,
    "securityAlerts": true
  },
  "visibilitySettings": {
    "profilePublic": false,
    "showEmail": false,
    "showPhone": false,
    "showAddress": false,
    "activityVisible": true
  },
  "cookieSettings": {
    "necessary": true,
    "analytics": true,
    "marketing": false,
    "personalization": true
  },
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T15:45:00Z"
}
```

#### PUT `/privacy/settings` - Atualizar Configurações de Privacidade
Atualiza as configurações de privacidade do usuário (parcial ou completa).

**Autenticação:** Bearer Token necessário

**Body da Requisição:**
```json
{
  "dataSharingSettings": {
    "partners": false,
    "analytics": true
  },
  "communicationSettings": {
    "email": false,
    "marketing": true
  },
  "visibilitySettings": {
    "profilePublic": true,
    "showEmail": true
  },
  "cookieSettings": {
    "marketing": false
  }
}
```

**Resposta de Sucesso (200):** Configurações atualizadas (mesmo formato do GET)

### 2. Histórico de Privacidade

#### GET `/privacy/history` - Obter Histórico de Atividades
Retorna o histórico paginado de atividades relacionadas à privacidade.

**Autenticação:** Bearer Token necessário

**Query Parameters:**
- `page` (opcional): Número da página (padrão: 1)
- `limit` (opcional): Itens por página (padrão: 10, máximo: 100)

**Exemplo:** `GET /privacy/history?page=1&limit=20`

**Resposta de Sucesso (200):**
```json
{
  "data": [
    {
      "id": "uuid",
      "userId": "uuid",
      "action": "SETTINGS_CHANGED",
      "description": "Configurações de comunicação atualizadas",
      "ipAddress": "192.168.1.1",
      "userAgent": "Mozilla/5.0...",
      "timestamp": "2024-01-15T15:45:00Z"
    }
  ],
  "total": 25,
  "page": 1,
  "limit": 20
}
```

**Tipos de Ação Disponíveis:**
- `SETTINGS_CHANGED` - Configurações alteradas
- `DATA_EXPORTED` - Dados exportados
- `DELETION_REQUESTED` - Exclusão solicitada
- `DELETION_CANCELLED` - Exclusão cancelada
- `PRIVACY_UPDATED` - Privacidade atualizada
- `ACCOUNT_ACCESSED` - Conta acessada
- `PASSWORD_CHANGED` - Senha alterada
- `LOGIN_SUCCESSFUL` - Login bem-sucedido
- `LOGIN_FAILED` - Falha no login
- `LOGOUT` - Logout realizado

### 3. Exportação de Dados

#### POST `/privacy/data-export` - Solicitar Exportação de Dados
Cria uma nova solicitação de exportação de dados.

**Autenticação:** Bearer Token necessário

**Body da Requisição:**
```json
{
  "requestReason": "Solicitação conforme LGPD - Art. 15"
}
```

**Resposta de Sucesso (201):**
```json
{
  "id": "uuid",
  "userId": "uuid",
  "status": "pending",
  "requestReason": "Solicitação conforme LGPD - Art. 15",
  "requestedAt": "2024-01-15T15:45:00Z",
  "completedAt": null,
  "downloadUrl": null,
  "expiresAt": null
}
```

#### GET `/privacy/data-export` - Listar Solicitações de Exportação
Retorna todas as solicitações de exportação do usuário.

**Autenticação:** Bearer Token necessário

**Resposta de Sucesso (200):**
```json
[
  {
    "id": "uuid",
    "userId": "uuid",
    "status": "completed",
    "requestReason": "Solicitação conforme LGPD",
    "requestedAt": "2024-01-15T15:45:00Z",
    "completedAt": "2024-01-15T16:00:00Z",
    "downloadUrl": "https://secure-link.com/export-uuid",
    "expiresAt": "2024-01-22T16:00:00Z"
  }
]
```

**Status Disponíveis:**
- `pending` - Aguardando processamento
- `processing` - Em processamento
- `completed` - Concluído e pronto para download
- `failed` - Falha no processamento

#### GET `/privacy/data-export/:id/download` - Download de Dados Exportados
Realiza o download dos dados exportados.

**Autenticação:** Bearer Token necessário

**Resposta de Sucesso (200):** Arquivo ZIP com os dados

### 4. Exclusão de Conta

#### POST `/privacy/account-deletion` - Solicitar Exclusão de Conta
Cria uma nova solicitação de exclusão de conta.

**Autenticação:** Bearer Token necessário

**Body da Requisição:**
```json
{
  "reason": "Não utilizo mais o serviço"
}
```

**Resposta de Sucesso (201):**
```json
{
  "id": "uuid",
  "userId": "uuid",
  "status": "pending",
  "reason": "Não utilizo mais o serviço",
  "requestedAt": "2024-01-15T15:45:00Z",
  "updatedAt": "2024-01-15T15:45:00Z",
  "processedAt": null,
  "rejectionReason": null
}
```

#### GET `/privacy/account-deletion` - Listar Solicitações de Exclusão
Retorna todas as solicitações de exclusão do usuário.

**Autenticação:** Bearer Token necessário

**Resposta de Sucesso (200):**
```json
[
  {
    "id": "uuid",
    "userId": "uuid",
    "status": "pending",
    "reason": "Não utilizo mais o serviço",
    "requestedAt": "2024-01-15T15:45:00Z",
    "updatedAt": "2024-01-15T15:45:00Z",
    "processedAt": null,
    "rejectionReason": null
  }
]
```

**Status Disponíveis:**
- `pending` - Aguardando análise
- `approved` - Aprovada (aguardando processamento)
- `rejected` - Rejeitada
- `cancelled` - Cancelada pelo usuário
- `completed` - Exclusão concluída

#### PUT `/privacy/account-deletion/:id/cancel` - Cancelar Solicitação de Exclusão
Cancela uma solicitação de exclusão pendente.

**Autenticação:** Bearer Token necessário

**Resposta de Sucesso (200):** Solicitação atualizada com status "cancelled"

## Códigos de Erro

### Erros Comuns

- `400 Bad Request` - Dados inválidos na requisição
- `401 Unauthorized` - Token de autenticação inválido ou ausente
- `403 Forbidden` - Acesso negado
- `404 Not Found` - Recurso não encontrado
- `422 Unprocessable Entity` - Dados da requisição inválidos
- `500 Internal Server Error` - Erro interno do servidor

### Exemplos de Erros

**400 - Validação:**
```json
{
  "statusCode": 400,
  "message": [
    "dataSharingSettings.partners must be a boolean"
  ],
  "error": "Bad Request"
}
```

**404 - Não encontrado:**
```json
{
  "statusCode": 404,
  "message": "Solicitação de exportação não encontrada",
  "error": "Not Found"
}
```

## Exemplos de Uso

### 1. Atualizar apenas configurações de comunicação
```bash
curl -X PUT https://api.exemplo.com/privacy/settings \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "communicationSettings": {
      "email": false,
      "marketing": false
    }
  }'
```

### 2. Solicitar exportação de dados
```bash
curl -X POST https://api.exemplo.com/privacy/data-export \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "requestReason": "Solicitação conforme LGPD - Art. 15"
  }'
```

### 3. Obter histórico das últimas 50 atividades
```bash
curl -X GET "https://api.exemplo.com/privacy/history?page=1&limit=50" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 4. Solicitar exclusão de conta
```bash
curl -X POST https://api.exemplo.com/privacy/account-deletion \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Não utilizo mais o serviço"
  }'
```

## Conformidade com LGPD/GDPR

Esta API está em conformidade com:

- **LGPD (Lei Geral de Proteção de Dados)** - Brasil
- **GDPR (General Data Protection Regulation)** - União Europeia

### Direitos Contemplados:

1. **Direito de Acesso** - GET `/privacy/settings` e `/privacy/history`
2. **Direito de Retificação** - PUT `/privacy/settings`
3. **Direito de Portabilidade** - POST e GET `/privacy/data-export`
4. **Direito ao Esquecimento** - POST `/privacy/account-deletion`
5. **Direito de Transparência** - GET `/privacy/history`

### Retenção de Dados:

- Configurações de privacidade: Mantidas enquanto a conta estiver ativa
- Histórico de atividades: Mantido por 2 anos após a última atividade
- Dados exportados: Links válidos por 7 dias
- Solicitações de exclusão: Processadas em até 30 dias

## Segurança

- Todas as requisições devem usar HTTPS
- Autenticação via Bearer Token (JWT)
- Rate limiting implementado
- Logs de auditoria para todas as operações
- Criptografia dos dados sensíveis
- Validação rigorosa de entrada
