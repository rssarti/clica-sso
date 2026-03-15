import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Contract } from './contract.entity';
import { UsersModule } from '../users/users.module';
import { ContractsController } from './contracts.controller';
import { ContractsService } from './contracts.service';
import { Plan } from 'src/products/plan.entity';
import { EventsModule } from '../events/events.module';
import { PaymentModule } from '../finance/payment.module';
import { SharedModule } from '../shared/shared.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Contract, Plan]),
    UsersModule,
    PaymentModule,
    EventsModule,
    SharedModule,
  ],
  controllers: [ContractsController],
  providers: [ContractsService],
  exports: [ContractsService],
})
export class ContractsModule {}
