/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable, Logger } from '@nestjs/common';

export interface WebhookEvent {
  type:
    | 'contract.created'
    | 'contract.updated'
    | 'contract.cancelled'
    | 'payment.completed'
    | 'payment.failed';
  contractId: number;
  userId: number;
  productSlug?: string;
  data: any;
  timestamp: string;
}

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);

  async sendWebhook(event: WebhookEvent, webhookUrl: string): Promise<void> {
    try {
      // Implementação simplificada - você pode usar fetch ou axios
      this.logger.log(`Would send webhook to ${webhookUrl}`, event);

      // TODO: Implementar chamada HTTP real
      // const response = await fetch(webhookUrl, {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'User-Agent': 'Clica-SSO-Webhook/1.0',
      //   },
      //   body: JSON.stringify({
      //     ...event,
      //     signature: this.generateSignature(event),
      //   }),
      // });
    } catch (error) {
      this.logger.error(`Failed to send webhook to ${webhookUrl}:`, error);
    }
  }

  async notifyContractCreated(
    contractId: number,
    userId: number,
    productSlug: string,
    data: any,
  ): Promise<void> {
    const event: WebhookEvent = {
      type: 'contract.created',
      contractId,
      userId,
      productSlug,
      data,
      timestamp: new Date().toISOString(),
    };

    await this.sendWebhookToRelevantApps(event, productSlug);
  }

  async notifyContractUpdated(
    contractId: number,
    userId: number,
    productSlug: string,
    data: any,
  ): Promise<void> {
    const event: WebhookEvent = {
      type: 'contract.updated',
      contractId,
      userId,
      productSlug,
      data,
      timestamp: new Date().toISOString(),
    };

    await this.sendWebhookToRelevantApps(event, productSlug);
  }

  async notifyContractCancelled(
    contractId: number,
    userId: number,
    productSlug: string,
    data: any,
  ): Promise<void> {
    const event: WebhookEvent = {
      type: 'contract.cancelled',
      contractId,
      userId,
      productSlug,
      data,
      timestamp: new Date().toISOString(),
    };

    await this.sendWebhookToRelevantApps(event, productSlug);
  }

  private async sendWebhookToRelevantApps(
    event: WebhookEvent,
    productSlug: string,
  ): Promise<void> {
    // Mapeamento de produtos para URLs de webhook das aplicações
    const webhookUrls: Record<string, string> = {
      clicazap:
        process.env.CLICAZAP_WEBHOOK_URL ||
        'https://clicazap.com/api/webhooks/contracts',
      clicarango:
        process.env.CLICARANGO_WEBHOOK_URL ||
        'https://clicarango.com/api/webhooks/contracts',
      'clica-analytics':
        process.env.CLICA_ANALYTICS_WEBHOOK_URL ||
        'https://analytics.clica.com/api/webhooks/contracts',
    };

    const webhookUrl = webhookUrls[productSlug];
    if (webhookUrl) {
      await this.sendWebhook(event, webhookUrl);
    } else {
      this.logger.warn(`No webhook URL configured for product: ${productSlug}`);
    }
  }

  private generateSignature(event: WebhookEvent): string {
    // Implementar assinatura HMAC para segurança
    const secret = process.env.WEBHOOK_SECRET || 'default-secret';
    const crypto = require('crypto');
    const payload = JSON.stringify(event);
    return crypto.createHmac('sha256', secret).update(payload).digest('hex');
  }
}
