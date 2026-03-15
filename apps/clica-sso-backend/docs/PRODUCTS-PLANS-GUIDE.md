# 🚀 Guia de Implementação: Sistema de Produtos e Planos

## 📋 Resumo das Melhorias Implementadas

### 1. **Nova Estrutura de Entidades**
- ✅ `Product` - Representa produtos como ClickaZap, ClickaAnalytics, etc.
- ✅ `Plan` - Representa planos de cada produto (Básico, Pro, Enterprise)
- ✅ Relacionamento `Contract` → `Plan` → `Product`

### 2. **Módulos Criados**
- ✅ `ProductsModule` com controladores e serviços
- ✅ API endpoints para gerenciar produtos e planos
- ✅ DTOs de validação para todas as operações

## 🗄️ Estrutura de Banco de Dados

### Migração SQL (Executar no PostgreSQL)

```sql
-- Criar tabela de produtos
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  slug VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  long_description TEXT,
  category VARCHAR(50) DEFAULT 'communication',
  status VARCHAR(50) DEFAULT 'active',
  logo_url VARCHAR(255),
  website_url VARCHAR(255),
  features JSONB,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Criar tabela de planos
CREATE TABLE plans (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  product_id INTEGER NOT NULL REFERENCES products(id),
  price DECIMAL(10,2) NOT NULL,
  original_price DECIMAL(10,2),
  billing_cycle VARCHAR(50) DEFAULT 'monthly',
  trial_days INTEGER DEFAULT 0,
  status VARCHAR(50) DEFAULT 'active',
  features JSONB,
  limits JSONB,
  metadata JSONB,
  is_popular BOOLEAN DEFAULT FALSE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Adicionar coluna plan_id na tabela contracts
ALTER TABLE contracts ADD COLUMN plan_id INTEGER REFERENCES plans(id);

-- Criar índices para performance
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_plans_product_id ON plans(product_id);
CREATE INDEX idx_plans_status ON plans(status);
CREATE INDEX idx_contracts_plan_id ON contracts(plan_id);
```

## 🌱 Dados de Exemplo (Seed)

```sql
-- Inserir produtos
INSERT INTO products (slug, name, description, long_description, category, features, metadata) VALUES
('clicazap', 'ClickaZap', 'Automação completa para WhatsApp Business', 'Plataforma completa de automação para WhatsApp Business com chatbots, funis de vendas, integração com CRM e muito mais.', 'communication', '["Chatbot Inteligente", "Funis de Vendas", "Integração CRM", "API WhatsApp", "Analytics Avançado"]', '{"integrations": ["hubspot", "rd_station", "pipedrive"], "api_version": "v1.0"}'),

('clica-analytics', 'ClickaAnalytics', 'Business Intelligence para seu negócio', 'Dashboard completo com métricas, relatórios e insights para tomada de decisão baseada em dados.', 'analytics', '["Dashboard Executivo", "Relatórios Customizados", "Métricas em Tempo Real", "Integração Multi-plataforma"]', '{"dashboard_types": ["executive", "operational", "financial"], "export_formats": ["pdf", "excel", "csv"]}'),

('clica-crm', 'ClickaCRM', 'CRM completo para gestão de vendas', 'Sistema completo de gestão de relacionamento com cliente, pipeline de vendas e automação comercial.', 'marketing', '["Pipeline Visual", "Automação de Vendas", "Gestão de Leads", "Relatórios de Performance"]', '{"pipeline_stages": 5, "lead_scoring": true, "email_marketing": true}');

-- Inserir planos para ClickaZap
INSERT INTO plans (name, slug, description, product_id, price, original_price, billing_cycle, trial_days, features, limits, is_popular, sort_order) VALUES
('Básico', 'clicazap-basic', 'Ideal para começar', 1, 97.00, NULL, 'monthly', 7, '["1 Número WhatsApp", "Chatbot Básico", "1.000 Mensagens/mês", "Suporte por Email"]', '{"phone_numbers": 1, "messages_per_month": 1000, "team_members": 2, "chatbots": 1}', false, 1),

('Profissional', 'clicazap-pro', 'Para empresas em crescimento', 1, 197.00, 247.00, 'monthly', 14, '["3 Números WhatsApp", "Chatbot Avançado", "10.000 Mensagens/mês", "Integrações CRM", "Suporte Prioritário"]', '{"phone_numbers": 3, "messages_per_month": 10000, "team_members": 10, "chatbots": 5, "integrations": true}', true, 2),

('Enterprise', 'clicazap-enterprise', 'Solução completa para grandes empresas', 1, 497.00, NULL, 'monthly', 30, '["Números Ilimitados", "Chatbot Premium", "Mensagens Ilimitadas", "API Completa", "Suporte 24/7", "Manager Dedicado"]', '{"phone_numbers": -1, "messages_per_month": -1, "team_members": -1, "chatbots": -1, "api_access": true, "dedicated_manager": true}', false, 3);

-- Inserir planos para ClickaAnalytics
INSERT INTO plans (name, slug, description, product_id, price, billing_cycle, trial_days, features, limits, is_popular, sort_order) VALUES
('Starter', 'analytics-starter', 'Analytics básico', 2, 67.00, 'monthly', 14, '["Dashboard Básico", "5 Relatórios", "Histórico 3 meses"]', '{"dashboards": 1, "reports": 5, "data_retention_months": 3}', false, 1),

('Business', 'analytics-business', 'Analytics avançado', 2, 167.00, 'monthly', 14, '["Dashboards Ilimitados", "Relatórios Customizados", "Histórico 12 meses", "Exportação Avançada"]', '{"dashboards": -1, "reports": -1, "data_retention_months": 12, "export_formats": ["pdf", "excel"]}', true, 2);

-- Inserir planos para ClickaCRM
INSERT INTO plans (name, slug, description, product_id, price, billing_cycle, trial_days, features, limits, is_popular, sort_order) VALUES
('Essencial', 'crm-essential', 'CRM para pequenas equipes', 3, 47.00, 'monthly', 7, '["Pipeline Básico", "1.000 Contatos", "Email Marketing Básico"]', '{"contacts": 1000, "users": 3, "email_sends_per_month": 5000}', false, 1),

('Avançado', 'crm-advanced', 'CRM completo', 3, 147.00, 'monthly', 14, '["Pipeline Avançado", "10.000 Contatos", "Automação Completa", "Relatórios Avançados"]', '{"contacts": 10000, "users": 15, "email_sends_per_month": 50000, "automations": true}', true, 2);
```

## 🔗 Endpoints da API

### Produtos
```
GET /products                    # Listar produtos ativos
GET /products/with-plans         # Produtos com planos ativos
GET /products/:id                # Produto específico
GET /products/slug/:slug         # Produto por slug
POST /products                   # Criar produto (autenticado)
PUT /products/:id                # Atualizar produto (autenticado)
DELETE /products/:id             # Deletar produto (autenticado)
```

### Planos
```
GET /plans                       # Listar planos ativos
GET /plans/popular               # Planos populares
GET /plans/product/:productId    # Planos de um produto
GET /plans/:id                   # Plano específico
GET /plans/slug/:slug            # Plano por slug
POST /plans                      # Criar plano (autenticado)
PUT /plans/:id                   # Atualizar plano (autenticado)
DELETE /plans/:id                # Deletar plano (autenticado)
```

## 🎯 Fluxo de Contratação Sugerido

### 1. **Frontend - Catálogo de Produtos**
```typescript
// Buscar produtos com planos
const products = await fetch('/api/products/with-plans');

// Estrutura de exibição:
products.map(product => ({
  ...product,
  plans: product.plans.map(plan => ({
    ...plan,
    monthlyPrice: plan.price,
    hasDiscount: plan.originalPrice > plan.price,
    features: plan.features,
    isPopular: plan.isPopular
  }))
}));
```

### 2. **Seleção e Contratação**
```typescript
// Criar contrato com plano
const contract = await fetch('/api/contracts', {
  method: 'POST',
  body: JSON.stringify({
    userId: user.id,
    planId: selectedPlan.id,
    name: `${selectedPlan.name} - ${selectedProduct.name}`,
    description: selectedPlan.description,
    serviceType: 'clicazap', // ou baseado no produto
    value: selectedPlan.price,
    startDate: new Date(),
    endDate: calculateEndDate(selectedPlan.billingCycle)
  })
});
```

### 3. **Atualização do Serviço de Contratos**
Você precisa atualizar o `ContractsService` para lidar com plans:

```typescript
// Em contracts.service.ts
async create(createContractDto: CreateContractDto): Promise<Contract> {
  const user = await this.usersService.findById(createContractDto.userId);
  
  let plan = null;
  if (createContractDto.planId) {
    plan = await this.plansService.findById(createContractDto.planId);
  }

  const contract = this.contractRepository.create({
    ...createContractDto,
    user,
    plan,
    startDate: new Date(createContractDto.startDate),
    endDate: createContractDto.endDate ? new Date(createContractDto.endDate) : undefined,
  });

  return this.contractRepository.save(contract);
}
```

## 🔄 Próximos Passos

### 1. **Integrar no App Module**
```typescript
// Em app.module.ts
import { ProductsModule } from './products/products.module';

@Module({
  imports: [
    // ... outros modules
    ProductsModule,
  ],
})
```

### 2. **Atualizar Seed Service**
Adicionar criação de produtos e planos no seed inicial.

### 3. **Frontend Implementation**
- Criar página de catálogo de produtos
- Implementar seletor de planos
- Integrar com checkout/pagamento

### 4. **Funcionalidades Avançadas**
- Sistema de cupons de desconto
- Planos com período de teste
- Upgrade/downgrade de planos
- Métricas de conversão

## 🎨 Benefícios da Nova Estrutura

✅ **Flexibilidade**: Fácil criação de novos produtos e planos
✅ **Escalabilidade**: Suporte a múltiplos produtos
✅ **Manutenibilidade**: Código organizado e reutilizável
✅ **UX**: Experiência de compra clara e intuitiva
✅ **Analytics**: Métricas detalhadas por produto/plano
✅ **Pricing**: Flexibilidade para estratégias de preço

Esta estrutura permite que você tenha um sistema robusto de produtos e planos, facilitando a expansão do negócio e oferecendo uma experiência clara para os usuários na hora da contratação!
