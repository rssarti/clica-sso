import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { RabbitMQService } from './rabbitmq.service';

@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: 'BILLING_SERVICE',
        useFactory: () => ({
          transport: Transport.RMQ,
          options: {
            urls: [
              process.env.RABBITMQ_URL ||
                'amqp://clica_sso:clic@124578++@10.132.0.10:5672',
            ],
            queue: 'billing.create_payment',
            queueOptions: {
              durable: true,
            },
          },
        }),
      },
    ]),
  ],
  providers: [RabbitMQService],
  exports: [RabbitMQService, ClientsModule],
})
export class RabbitMQModule {}
