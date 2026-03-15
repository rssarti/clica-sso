import { Injectable, Logger, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';

export interface BillingMessage {
  contractId: number;
  userId: number;
  userName: string;
  userEmail: string;
  userDocument?: string;
  userPhone?: string;
  userAddress?: {
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    cep: string;
  };
  amount: number;
  dueDate: string;
  serviceType: string;
  contractName: string;
}

@Injectable()
export class RabbitMQService {
  private readonly logger = new Logger(RabbitMQService.name);

  constructor(@Inject('BILLING_SERVICE') private client: ClientProxy) {}

  async publishToBillingQueue(message: BillingMessage): Promise<void> {
    try {
      // Emitir mensagem e aguardar confirmação
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Message timeout'));
        }, 5000);

        this.client.emit('billing.create_payment', message);

        // Aguardar um pequeno delay para garantir que a mensagem foi enviada
        setTimeout(() => {
          clearTimeout(timeout);
          resolve();
        }, 100);
      });

      this.logger.log(`Message sent to billing queue:`, {
        contractId: message.contractId,
        userId: message.userId,
        amount: message.amount,
      });
    } catch (error) {
      this.logger.error('Failed to send message to billing queue:', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    await this.client.close();
    this.logger.log('RabbitMQ client closed');
  }
}
