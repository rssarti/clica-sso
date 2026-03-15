# Exemplos de JSON para Postman - Módulo Contratos (AUTENTICADO)

**IMPORTANTE:** Todos os endpoints de contratos agora requerem autenticação JWT!

## Headers obrigatórios para TODOS os endpoints:
```
Content-Type: application/json
Authorization: Bearer {seu_jwt_token}
```

## Como obter o token:
1. Faça login primeiro em `/auth/login`
2. Copie o `access_token` da resposta
3. Use como `Bearer {token}` no header Authorization

---

## 1. Criar Contrato
**POST** `http://localhost:3000/contracts`

**Headers:**
```
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

```json
{
  "userId": 1,
  "name": "Contrato de Serviço Premium",
  "description": "Contrato para plano premium com funcionalidades avançadas",
  "value": 299.90,
  "startDate": "2025-08-11",
  "endDate": "2026-08-11",
  "status": "active",
  "serviceType": "SSO",
  "metadata": {
    "plan": "premium",
    "features": ["dashboard", "api_access", "priority_support"],
    "billing_cycle": "monthly",
    "auto_renew": true
  }
}
```

## 2. Criar Contrato Baseado em Pagamento
**POST** `http://localhost:3000/contracts/from-payment`

```json
{
  "paymentId": 1,
  "name": "Contrato Automático - Pagamento #1",
  "description": "Contrato gerado automaticamente após confirmação de pagamento",
  "startDate": "2025-08-11",
  "endDate": "2025-12-11",
  "serviceType": "CRM",
  "metadata": {
    "auto_generated": true,
    "payment_method": "credit_card",
    "plan_type": "basic",
    "contract_type": "subscription"
  }
}
```

## 3. Listar Todos os Contratos (Admin)
**GET** `http://localhost:3000/contracts`

**Headers:**
```
Authorization: Bearer {token}
```

## 3.1. Listar Meus Contratos (Usuário Autenticado)
**GET** `http://localhost:3000/contracts/my-contracts`

**Headers:**
```
Authorization: Bearer {token}
```

*Retorna apenas os contratos do usuário logado*

## 4. Buscar Contrato por ID
**GET** `http://localhost:3000/contracts/1`

*Sem body necessário*

## 5. Buscar Contratos por Usuário
**GET** `http://localhost:3000/contracts/user/1`

*Sem body necessário*

## 5.1. Buscar Contratos por Tipo de Serviço
**GET** `http://localhost:3000/contracts/service/SSO`

*Sem body necessário*

**Tipos de serviço disponíveis:**
- `SSO` - Sistema de Single Sign-On
- `CRM` - Customer Relationship Management
- `ERP` - Enterprise Resource Planning
- `E_COMMERCE` - Plataforma de E-commerce
- `DELIVERY` - Sistema de Delivery
- `FINANCIAL` - Sistema Financeiro
- `MARKETING` - Automação de Marketing
- `ANALYTICS` - Sistema de Analytics
- `CUSTOM` - Serviço Personalizado

## 6. Verificar se Contrato está Ativo
**GET** `http://localhost:3000/contracts/1/active`

*Sem body necessário*

**Resposta esperada:**
```json
{
  "id": 1,
  "isActive": true
}
```

## 7. Visualizar Metadata do Contrato
**GET** `http://localhost:3000/contracts/1/metadata`

*Sem body necessário*

**Resposta esperada:**
```json
{
  "id": 1,
  "metadata": {
    "plan": "premium",
    "features": ["dashboard", "api_access", "priority_support"],
    "billing_cycle": "monthly",
    "auto_renew": true
  }
}
```

## 8. Atualizar Status do Contrato
**PUT** `http://localhost:3000/contracts/1/status`

```json
{
  "status": "suspended"
}
```

*Valores possíveis: "active", "inactive", "suspended", "expired"*

## 9. Atualizar Metadata do Contrato
**PUT** `http://localhost:3000/contracts/1/metadata`

```json
{
  "metadata": {
    "plan": "enterprise",
    "features": ["dashboard", "api_access", "priority_support", "custom_integrations"],
    "billing_cycle": "yearly",
    "auto_renew": true,
    "discount": 20,
    "updated_at": "2025-08-11T22:00:00Z"
  }
}
```

## 10. Exemplo de Contrato Completo (Resposta)
```json
{
  "id": 1,
  "name": "Contrato de Serviço Premium",
  "description": "Contrato para plano premium com funcionalidades avançadas",
  "status": "active",
  "value": "299.90",
  "startDate": "2025-08-11",
  "endDate": "2026-08-11",
  "metadata": {
    "plan": "premium",
    "features": ["dashboard", "api_access", "priority_support"],
    "billing_cycle": "monthly",
    "auto_renew": true
  },
  "createdAt": "2025-08-11T22:00:33.000Z",
  "updatedAt": "2025-08-11T22:00:33.000Z",
  "user": {
    "id": 1,
    "email": "admin@clica.com",
    "name": "Administrador",
    "document": "00000000000",
    "phone": "(11) 99999-9999",
    "address": "Endereço Admin"
  }
}
```

## Headers necessários para todos os endpoints:
```
Content-Type: application/json
Authorization: Bearer {seu_jwt_token}
```

## ⚠️ IMPORTANTE: Autenticação Obrigatória
Todos os endpoints de contratos agora exigem autenticação JWT. 

### Como fazer login e obter token:
1. **Login:**
   ```bash
   curl -X POST http://localhost:3000/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email": "admin@clica.com", "password": "123456"}'
   ```

2. **Usar token nas requisições:**
   ```bash
   curl -X GET http://localhost:3000/contracts/my-contracts \
     -H "Authorization: Bearer SEU_TOKEN_AQUI"
   ```

## Sequência de teste recomendada:
1. Primeiro criar um usuário via `/users/register`
2. Fazer login via `/auth/login` para obter o token
3. Criar contratos usando os endpoints acima
4. Testar as funcionalidades de consulta e atualização

---

## Exemplos de Contratos por Tipo de Serviço

### Contrato SSO (Single Sign-On)
```json
{
  "userId": 1,
  "name": "Contrato SSO Empresarial",
  "description": "Autenticação única para 100 usuários",
  "value": 199.90,
  "startDate": "2025-08-11",
  "endDate": "2026-08-11",
  "serviceType": "SSO",
  "metadata": {
    "max_users": 100,
    "features": ["multi_tenancy", "saml", "oauth2"],
    "sla": "99.9%"
  }
}
```

### Contrato CRM
```json
{
  "userId": 2,
  "name": "Contrato CRM Professional",
  "description": "Sistema completo de gestão de clientes",
  "value": 299.90,
  "startDate": "2025-08-11",
  "endDate": "2026-08-11",
  "serviceType": "CRM",
  "metadata": {
    "max_contacts": 10000,
    "features": ["pipeline", "automation", "reports"],
    "integrations": ["email", "whatsapp", "analytics"]
  }
}
```

### Contrato E-Commerce
```json
{
  "userId": 3,
  "name": "Contrato E-commerce Premium",
  "description": "Plataforma completa de vendas online",
  "value": 499.90,
  "startDate": "2025-08-11",
  "endDate": "2026-08-11",
  "serviceType": "E_COMMERCE",
  "metadata": {
    "max_products": 5000,
    "features": ["inventory", "payments", "shipping"],
    "payment_gateways": ["stripe", "paypal", "pix"]
  }
}
```
