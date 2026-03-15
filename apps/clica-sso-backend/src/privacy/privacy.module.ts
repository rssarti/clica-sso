import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PrivacyController } from './privacy.controller';
import { PrivacyService } from './privacy.service';
import { PrivacySettings } from './entities/privacy-settings.entity';
import { PrivacyHistory } from './entities/privacy-history.entity';
import { DataExportRequest } from './entities/data-export-request.entity';
import { AccountDeletionRequest } from './entities/account-deletion-request.entity';
import { User } from '../users/user.entity';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forFeature([
      PrivacySettings,
      PrivacyHistory,
      DataExportRequest,
      AccountDeletionRequest,
      User,
    ]),
  ],
  controllers: [PrivacyController],
  providers: [PrivacyService],
  exports: [PrivacyService],
})
export class PrivacyModule {}
