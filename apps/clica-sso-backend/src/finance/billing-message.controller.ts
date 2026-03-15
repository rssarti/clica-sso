import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { BillingConsumerService } from './billing-consumer.service';
import { BillingMessage } from '../shared/rabbitmq.service';

@Controller()
export class BillingMessageController {
  private readonly logger = new Logger(BillingMessageController.name);

  constructor(
    private readonly billingConsumerService: BillingConsumerService,
  ) {}

  @MessagePattern('billing.create_payment')
  async handleBillingMessage(@Payload() message: BillingMessage) {
    this.logger.log('Received billing message', {
      contractId: message.contractId,
    });

    try {
      await this.billingConsumerService.processBillingMessage(message);
      return { success: true };
    } catch (error) {
      this.logger.error('Error processing billing message:', error);
      throw error;
    }
  }

  // Exemplo de como processar mensagens em batch
  @MessagePattern('billing.create_payments_batch')
  async handleBillingMessagesBatch(@Payload() messages: BillingMessage[]) {
    this.logger.log(`Received ${messages.length} billing messages`);

    try {
      await this.billingConsumerService.processBillingMessages(messages);
      return { success: true, processed: messages.length };
    } catch (error) {
      this.logger.error('Error processing billing messages batch:', error);
      throw error;
    }
  }
}
