# Clica SSO Backend - Sistema de Gestão de Contratos e Pagamentos

Sistema backend completo para gestão de usuários, contratos, pagamentos e faturamento, desenvolvido com NestJS, TypeScript e PostgreSQL.

## 🚀 Funcionalidades Principais

### 🔐 Autenticação e Autorização
- Sistema de login com JWT
- Proteção de rotas com Guards
- Gestão de usuários com diferentes perfis

### 📋 Gestão de Contratos
- Criação e gestão de contratos
- Diferentes tipos de serviços (ClickaZap, Custom)
- Status de contratos (ativo, inativo, suspenso, expirado)
- Relacionamento com últimos pagamentos liquidados

### 💰 Sistema de Pagamentos
- **Métodos**: Boleto, PIX, Cartão de Crédito/Débito, Transferência
- **Status**: Pendente, Pago, Em Atraso, Cancelado
- Geração automática de boletos e PIX
- Tracking do último pagamento liquidado por contrato
- Identificação automática do próximo pagamento pendente

### 📄 Sistema de Faturas
- Criação manual e automática de faturas
- Relacionamento com múltiplos pagamentos
- Atualização automática de status (vencidas)
- Gestão de itens e metadados

### 🔔 Sistema de Cobrança
- Envio automático de boletos por email
- Resumo financeiro por contrato
- Processamento automático de cobranças
- Métricas de pagamentos (pagos, pendentes, em atraso)

## 🏗️ Arquitetura do Projeto

### 📁 Estrutura de Pastas

```
src/
├── auth/                    # Autenticação e autorização
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   ├── auth.module.ts
│   ├── jwt-auth.guard.ts
│   ├── jwt.strategy.ts
│   └── dto/
│       └── login.dto.ts
├── users/                   # Gestão de usuários
│   ├── user.entity.ts
│   ├── users.controller.ts
│   ├── users.service.ts
│   ├── users.module.ts
│   └── dto/
│       └── create-user.dto.ts
├── contracts/               # Gestão de contratos
│   ├── contract.entity.ts
│   ├── contracts.controller.ts
│   ├── contracts.service.ts
│   ├── contracts.module.ts
│   └── dto/
│       ├── create-contract.dto.ts
│       └── create-contract-from-payment.dto.ts
├── finance/                 # Sistema de pagamentos
│   ├── payment.entity.ts
│   ├── payment.controller.ts
│   ├── payment.service.ts
│   ├── payment.module.ts
│   ├── finance-seed.service.ts
│   └── dto/
│       ├── create-payment.dto.ts
│       └── update-payment.dto.ts
├── invoices/                # Sistema de faturas
│   ├── invoice.entity.ts
│   ├── invoice.controller.ts
│   ├── invoice.service.ts
│   ├── invoice.module.ts
│   └── dto/
│       └── invoice.dto.ts
├── billing/                 # Sistema de cobrança
│   ├── billing.controller.ts
│   ├── billing.service.ts
│   └── billing.module.ts
├── profile/                 # Perfis de usuário
│   └── profile.entity.ts
├── app.module.ts           # Módulo principal
├── main.ts                 # Ponto de entrada
└── seed.service.ts         # Dados iniciais
```

### 🗄️ Modelo de Dados

#### User (Usuário)
```typescript
{
  id: number;
  email: string;
  password: string;
  name: string;
  document: string;
  phone: string;
  address: string;
  metadata: any;
  createdAt: Date;
  updatedAt: Date;
}
```

#### Contract (Contrato)
```typescript
{
  id: number;
  user: User;
  name: string;
  description: string;
  status: 'active' | 'inactive' | 'suspended' | 'expired';
  serviceType: 'clicazap' | 'custom';
  value: number;
  startDate: Date;
  endDate: Date;
  lastPaidPayment: Payment; // Último pagamento liquidado
  payments: Payment[];
  invoices: Invoice[];
  metadata: any;
  createdAt: Date;
  updatedAt: Date;
}
```

#### Payment (Pagamento)
```typescript
{
  id: number;
  user: User;
  contract: Contract;
  amount: number;
  method: 'boleto' | 'credit_card' | 'debit_card' | 'pix' | 'bank_transfer';
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  dueDate: Date;
  paidAt: Date;
  boletoUrl: string;
  boletoBarcode: string;
  pixQrCode: string;
  externalId: string;
  description: string;
  metadata: any;
  createdAt: Date;
  updatedAt: Date;
}
```

#### Invoice (Fatura)
```typescript
{
  id: number;
  user: User;
  contract: Contract;
  payments: Payment[];
  value: number;
  status: 'draft' | 'issued' | 'paid' | 'overdue' | 'cancelled';
  dueDate: Date;
  paidAt: Date;
  description: string;
  items: any[];
  metadata: any;
  issuedAt: Date;
  updatedAt: Date;
}
```

## 🔌 API Endpoints

### 🔐 Autenticação (`/auth`)
```
POST /auth/login          # Login do usuário
```

### 👥 Usuários (`/users`)
```
GET  /users               # Listar usuários
POST /users               # Criar usuário
GET  /users/:id           # Buscar usuário por ID
GET  /users/email/:email  # Buscar usuário por email
```

### 📋 Contratos (`/contracts`)
```
GET  /contracts                           # Listar todos os contratos
POST /contracts                           # Criar contrato
POST /contracts/from-payment              # Criar contrato a partir de pagamento
GET  /contracts/my-contracts              # Contratos do usuário logado
GET  /contracts/my-contracts-with-payments # Contratos com info de pagamentos
GET  /contracts/:id                       # Buscar contrato por ID
GET  /contracts/:id/with-payments         # Contrato com info de pagamentos
GET  /contracts/user/:userId              # Contratos por usuário
GET  /contracts/service/:serviceType      # Contratos por tipo de serviço
GET  /contracts/:id/active                # Verificar se contrato está ativo
GET  /contracts/:id/metadata              # Metadados do contrato
PUT  /contracts/:id/status                # Atualizar status
PUT  /contracts/:id/metadata              # Atualizar metadados
```

### 💰 Pagamentos (`/payments`)
```
GET  /payments                            # Listar todos os pagamentos
POST /payments                            # Criar pagamento
GET  /payments/my-payments                # Pagamentos do usuário logado
GET  /payments/pending                    # Pagamentos pendentes
GET  /payments/overdue                    # Pagamentos em atraso
GET  /payments/:id                        # Buscar pagamento por ID
GET  /payments/contract/:contractId       # Pagamentos por contrato
GET  /payments/contract/:contractId/last-paid    # Último pagamento pago
GET  /payments/contract/:contractId/next-pending # Próximo pagamento pendente
PUT  /payments/:id                        # Atualizar pagamento
PUT  /payments/:id/mark-as-paid           # Marcar como pago
POST /payments/:id/generate-boleto        # Gerar boleto
POST /payments/:id/generate-pix           # Gerar PIX
DELETE /payments/:id                      # Deletar pagamento
```

### 📄 Faturas (`/invoices`)
```
GET  /invoices                            # Listar todas as faturas
POST /invoices                            # Criar fatura
GET  /invoices/my-invoices                # Faturas do usuário logado
GET  /invoices/pending                    # Faturas pendentes
GET  /invoices/overdue                    # Faturas em atraso
GET  /invoices/:id                        # Buscar fatura por ID
GET  /invoices/contract/:contractId       # Faturas por contrato
POST /invoices/contract/:contractId/monthly # Criar fatura mensal automática
PUT  /invoices/:id                        # Atualizar fatura
PUT  /invoices/:id/mark-as-paid           # Marcar como paga
PUT  /invoices/:id/mark-as-overdue        # Marcar como em atraso
PUT  /invoices/:id/cancel                 # Cancelar fatura
POST /invoices/update-overdue             # Atualizar faturas em atraso
DELETE /invoices/:id                      # Deletar fatura
```

### 🔔 Cobrança (`/billing`)
```
GET  /billing/contract/:contractId/next-payment     # Próximo pagamento
GET  /billing/contract/:contractId/summary          # Resumo de pagamentos
POST /billing/contract/:contractId/generate-boleto  # Gerar boleto
POST /billing/contract/:contractId/generate-pix     # Gerar PIX
POST /billing/contract/:contractId/send-boleto-email # Enviar boleto por email
POST /billing/process-automatic-billing             # Processar cobrança automática
```

## 🚀 Instalação e Configuração

### Pré-requisitos
- Node.js 18+
- PostgreSQL 13+
- pnpm (recomendado)

### 1. Instalação das Dependências
```bash
pnpm install
```

### 2. Configuração do Banco de Dados
```bash
# Configure as variáveis de ambiente
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=clica_sso
JWT_SECRET=your-secret-key
```

### 3. Executar o Projeto

```bash
# Desenvolvimento
pnpm run start:dev

# Produção
pnpm run start:prod
```

### 4. Executar Migrações e Seeds
```bash
# As entidades são criadas automaticamente (synchronize: true)
# Os dados iniciais são inseridos via SeedService
```

## 📊 Exemplos de Uso

### 1. Criar um Pagamento
```json
POST /payments
Authorization: Bearer {jwt_token}
{
  "contractId": 1,
  "amount": 100.50,
  "method": "boleto",
  "dueDate": "2024-12-31",
  "description": "Pagamento mensal"
}
```

### 2. Gerar Boleto para Próximo Pagamento
```bash
POST /billing/contract/1/generate-boleto
Authorization: Bearer {jwt_token}
```

**Resposta:**
```json
{
  "id": 1,
  "amount": 100.50,
  "dueDate": "2024-12-31",
  "boletoUrl": "https://boleto.example.com/1",
  "boletoBarcode": "123456789",
  "status": "pending"
}
```

### 3. Obter Resumo de Pagamentos
```bash
GET /billing/contract/1/summary
Authorization: Bearer {jwt_token}
```

**Resposta:**
```json
{
  "contract": { ... },
  "summary": {
    "totalPayments": 12,
    "paidPayments": 8,
    "pendingPayments": 3,
    "overduePayments": 1,
    "totalPaid": 800.00,
    "totalPending": 300.00
  },
  "lastPaidPayment": { ... },
  "nextPendingPayment": { ... }
}
```

### 4. Enviar Boleto por Email
```bash
POST /billing/contract/1/send-boleto-email
Authorization: Bearer {jwt_token}
```

**Resposta:**
```json
{
  "message": "Boleto sent by email successfully",
  "payment": { ... },
  "emailSent": true
}
```

## 🔄 Fluxo de Cobrança

1. **Criação de Contrato** → Usuário cria contrato
2. **Geração de Pagamentos** → Sistema cria pagamentos automáticos
3. **Identificação do Próximo Pagamento** → Baseado na data de vencimento
4. **Geração de Boleto/PIX** → Sob demanda ou automático
5. **Envio por Email** → Boleto enviado para o usuário
6. **Confirmação de Pagamento** → Atualiza último pagamento no contrato
7. **Próximo Ciclo** → Sistema identifica próximo pagamento pendente

## 🛠️ Tecnologias Utilizadas

- **Framework**: NestJS
- **Linguagem**: TypeScript
- **Banco de Dados**: PostgreSQL
- **ORM**: TypeORM
- **Autenticação**: JWT
- **Validação**: class-validator
- **Documentação**: Swagger (pode ser adicionado)

## 📝 Logs e Monitoramento

O sistema inclui logs detalhados para:
- Operações de pagamento
- Geração de boletos
- Envio de emails
- Processamento de cobranças automáticas

## 🔒 Segurança

- Autenticação JWT obrigatória
- Validação de dados de entrada
- Proteção contra SQL Injection (TypeORM)
- Sanitização de inputs

## 🚀 Próximos Passos

- [ ] Integração com gateway de pagamento real (Mercado Pago, PagSeguro)
- [ ] Serviço de email real (SendGrid, AWS SES)
- [ ] Cron jobs para cobrança automática
- [ ] Webhooks para confirmação de pagamentos
- [ ] Dashboard administrativo
- [ ] Métricas e analytics
- [ ] Testes automatizados
- [ ] Documentação Swagger

## 📄 Documentação Adicional

- [FINANCE-SYSTEM.md](./FINANCE-SYSTEM.md) - Documentação detalhada do sistema financeiro
- [TEST-AUTH.md](./TEST-AUTH.md) - Guia de testes de autenticação
- [POSTMAN-CONTRACTS.md](./POSTMAN-CONTRACTS.md) - Collection do Postman

## 🔧 Scripts Disponíveis

```bash
# Desenvolvimento
pnpm run start
pnpm run start:dev

# Build
pnpm run build

# Testes
pnpm run test
pnpm run test:e2e
pnpm run test:cov

# Linting
pnpm run lint
pnpm run lint:fix
```

## 📞 Suporte

Para dúvidas ou suporte, entre em contato com a equipe de desenvolvimento.

---

**Sistema desenvolvido com ❤️ para a Clica**
