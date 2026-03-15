import { Module } from '@nestjs/common';
import { TestController } from './test.controller';
import { NotificationService } from '../shared/notification.service';
import { EventsModule } from '../events/events.module';

@Module({
  imports: [EventsModule],
  controllers: [TestController],
  providers: [NotificationService],
})
export class TestModule {}
