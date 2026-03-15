import { Injectable } from '@nestjs/common';
import { ProductsService } from './products.service';
import { PlansService } from './plans.service';
import { ProductCategory } from './product.entity';
import { PlanType } from 'src/shared/enum/plan.enum';

@Injectable()
export class ProductsSeedService {
  constructor(
    private readonly productsService: ProductsService,
    private readonly plansService: PlansService,
  ) {}

  async seedProductsAndPlans() {
    console.log('🌱 Seeding products and plans...');

    try {
      // Verificar se já existem produtos
      const existingProducts = await this.productsService.findAll();
      if (existingProducts.length > 0) {
        console.log('✅ Products already exist, skipping seed...');
        return;
      }

      // Criar produtos
      const clicaZap = await this.productsService.create({
        slug: 'clicazap',
        name: 'ClickaZap',
        description: 'Automação completa para WhatsApp Business',
        longDescription:
          'Plataforma completa de automação para WhatsApp Business com chatbots, funis de vendas, integração com CRM e muito mais.',
        category: ProductCategory.COMMUNICATION,
        features: [
          'Chatbot Inteligente',
          'Funis de Vendas',
          'Integração CRM',
          'API WhatsApp',
          'Analytics Avançado',
        ],
        metadata: {
          integrations: ['hubspot', 'rd_station', 'pipedrive'],
          api_version: 'v1.0',
        },
      });

      const clicaAnalytics = await this.productsService.create({
        slug: 'clica-analytics',
        name: 'ClickaAnalytics',
        description: 'Business Intelligence para seu negócio',
        longDescription:
          'Dashboard completo com métricas, relatórios e insights para tomada de decisão baseada em dados.',
        category: ProductCategory.ANALYTICS,
        features: [
          'Dashboard Executivo',
          'Relatórios Customizados',
          'Métricas em Tempo Real',
          'Integração Multi-plataforma',
        ],
        metadata: {
          dashboard_types: ['executive', 'operational', 'financial'],
          export_formats: ['pdf', 'excel', 'csv'],
        },
      });

      const clicaCrm = await this.productsService.create({
        slug: 'clica-crm',
        name: 'ClickaCRM',
        description: 'CRM completo para gestão de vendas',
        longDescription:
          'Sistema completo de gestão de relacionamento com cliente, pipeline de vendas e automação comercial.',
        category: ProductCategory.MARKETING,
        features: [
          'Pipeline Visual',
          'Automação de Vendas',
          'Gestão de Leads',
          'Relatórios de Performance',
        ],
        metadata: {
          pipeline_stages: 5,
          lead_scoring: true,
          email_marketing: true,
        },
      });

      // Criar planos para ClickaZap
      await this.plansService.create({
        name: 'Básico',
        slug: 'clicazap-basic',
        description: 'Ideal para começar',
        productId: clicaZap.id,
        price: 97.0,
        billingCycle: PlanType.MONTHLY,
        trialDays: 7,
        features: [
          '1 Número WhatsApp',
          'Chatbot Básico',
          '1.000 Mensagens/mês',
          'Suporte por Email',
        ],
        limits: {
          phone_numbers: 1,
          messages_per_month: 1000,
          team_members: 2,
          chatbots: 1,
        },
        sortOrder: 1,
      });

      await this.plansService.create({
        name: 'Profissional',
        slug: 'clicazap-pro',
        description: 'Para empresas em crescimento',
        productId: clicaZap.id,
        price: 197.0,
        originalPrice: 247.0,
        billingCycle: PlanType.MONTHLY,
        trialDays: 14,
        features: [
          '3 Números WhatsApp',
          'Chatbot Avançado',
          '10.000 Mensagens/mês',
          'Integrações CRM',
          'Suporte Prioritário',
        ],
        limits: {
          phone_numbers: 3,
          messages_per_month: 10000,
          team_members: 10,
          chatbots: 5,
          integrations: true,
        },
        isPopular: true,
        sortOrder: 2,
      });

      await this.plansService.create({
        name: 'Enterprise',
        slug: 'clicazap-enterprise',
        description: 'Solução completa para grandes empresas',
        productId: clicaZap.id,
        price: 497.0,
        billingCycle: PlanType.MONTHLY,
        trialDays: 30,
        features: [
          'Números Ilimitados',
          'Chatbot Premium',
          'Mensagens Ilimitadas',
          'API Completa',
          'Suporte 24/7',
          'Manager Dedicado',
        ],
        limits: {
          phone_numbers: -1,
          messages_per_month: -1,
          team_members: -1,
          chatbots: -1,
          api_access: true,
          dedicated_manager: true,
        },
        sortOrder: 3,
      });

      // Criar planos para ClickaAnalytics
      await this.plansService.create({
        name: 'Starter',
        slug: 'analytics-starter',
        description: 'Analytics básico',
        productId: clicaAnalytics.id,
        price: 67.0,
        billingCycle: PlanType.MONTHLY,
        trialDays: 14,
        features: ['Dashboard Básico', '5 Relatórios', 'Histórico 3 meses'],
        limits: {
          dashboards: 1,
          reports: 5,
          data_retention_months: 3,
        },
        sortOrder: 1,
      });

      await this.plansService.create({
        name: 'Business',
        slug: 'analytics-business',
        description: 'Analytics avançado',
        productId: clicaAnalytics.id,
        price: 167.0,
        billingCycle: PlanType.MONTHLY,
        trialDays: 14,
        features: [
          'Dashboards Ilimitados',
          'Relatórios Customizados',
          'Histórico 12 meses',
          'Exportação Avançada',
        ],
        limits: {
          dashboards: -1,
          reports: -1,
          data_retention_months: 12,
          export_formats: ['pdf', 'excel'],
        },
        isPopular: true,
        sortOrder: 2,
      });

      // Criar planos para ClickaCRM
      await this.plansService.create({
        name: 'Essencial',
        slug: 'crm-essential',
        description: 'CRM para pequenas equipes',
        productId: clicaCrm.id,
        price: 47.0,
        billingCycle: PlanType.MONTHLY,
        trialDays: 7,
        features: [
          'Pipeline Básico',
          '1.000 Contatos',
          'Email Marketing Básico',
        ],
        limits: {
          contacts: 1000,
          users: 3,
          email_sends_per_month: 5000,
        },
        sortOrder: 1,
      });

      await this.plansService.create({
        name: 'Avançado',
        slug: 'crm-advanced',
        description: 'CRM completo',
        productId: clicaCrm.id,
        price: 147.0,
        billingCycle: PlanType.MONTHLY,
        trialDays: 14,
        features: [
          'Pipeline Avançado',
          '10.000 Contatos',
          'Automação Completa',
          'Relatórios Avançados',
        ],
        limits: {
          contacts: 10000,
          users: 15,
          email_sends_per_month: 50000,
          automations: true,
        },
        isPopular: true,
        sortOrder: 2,
      });

      console.log('✅ Products and plans seeded successfully!');
    } catch (error) {
      console.error('❌ Error seeding products and plans:', error);
    }
  }
}
