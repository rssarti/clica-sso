import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BancoInterService } from './banco-inter.service';
import { EventsModule } from '../events/events.module';

@Module({
  imports: [ConfigModule, EventsModule],
  providers: [BancoInterService],
  exports: [BancoInterService],
})
export class FinanceModule {}
