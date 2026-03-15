import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';
import { BillingCommandService } from './billing-command.service';
import { PaymentModule } from '../finance/payment.module';
import { InvoiceModule } from '../invoices/invoice.module';
import { ContractsModule } from '../contracts/contracts.module';
import { Contract } from '../contracts/contract.entity';
// import { RabbitMQModule } from '../shared/rabbitmq.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Contract]),
    PaymentModule,
    InvoiceModule,
    ContractsModule,
    // RabbitMQModule, // Temporariamente desabilitado até configurar RabbitMQ externo
  ],
  controllers: [BillingController],
  providers: [BillingService, BillingCommandService],
  exports: [BillingService, BillingCommandService],
})
export class BillingModule {}
