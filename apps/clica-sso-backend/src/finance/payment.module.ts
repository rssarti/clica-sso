import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { BillingConsumerService } from './billing-consumer.service';
import { BillingMessageController } from './billing-message.controller';
import { BancoInterService } from './banco-inter.service';
import { Payment } from './payment.entity';
import { Contract } from '../contracts/contract.entity';
import { ConfigModule } from '@nestjs/config';
import { EventsModule } from '../events/events.module';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([Payment, Contract]),
    EventsModule,
  ],
  controllers: [PaymentController, BillingMessageController],
  providers: [PaymentService, BillingConsumerService, BancoInterService],
  exports: [PaymentService, BillingConsumerService, BancoInterService],
})
export class PaymentModule {}
