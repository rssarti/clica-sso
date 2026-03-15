import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PrivacySettings } from './entities/privacy-settings.entity';
import {
  PrivacyHistory,
  PrivacyAction,
} from './entities/privacy-history.entity';
import {
  DataExportRequest,
  ExportStatus,
} from './entities/data-export-request.entity';
import {
  AccountDeletionRequest,
  DeletionStatus,
} from './entities/account-deletion-request.entity';
import { UpdatePrivacySettingsDto } from './dto/update-privacy-settings.dto';
import { CreateDataExportRequestDto } from './dto/create-data-export-request.dto';
import { CreateAccountDeletionRequestDto } from './dto/create-account-deletion-request.dto';
import { User } from '../users/user.entity';

@Injectable()
export class PrivacyService {
  constructor(
    @InjectRepository(PrivacySettings)
    private privacySettingsRepository: Repository<PrivacySettings>,
    @InjectRepository(PrivacyHistory)
    private privacyHistoryRepository: Repository<PrivacyHistory>,
    @InjectRepository(DataExportRequest)
    private dataExportRequestRepository: Repository<DataExportRequest>,
    @InjectRepository(AccountDeletionRequest)
    private accountDeletionRequestRepository: Repository<AccountDeletionRequest>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async getPrivacySettings(userId: number): Promise<PrivacySettings> {
    let settings = await this.privacySettingsRepository.findOne({
      where: { userId },
    });

    if (!settings) {
      // Create default settings based on the actual entity structure
      settings = this.privacySettingsRepository.create({
        userId,
        dataProcessing: {
          analytics: true,
          marketing: false,
          personalization: true,
          thirdPartySharing: false,
        },
        communications: {
          emailMarketing: false,
          smsMarketing: false,
          pushNotifications: true,
          newsletter: true,
          productUpdates: true,
          securityAlerts: true,
        },
        visibility: {
          profilePublic: false,
          showEmail: false,
          showPhone: false,
          showAddress: false,
          activityVisible: false,
        },
        dataRetention: {
          keepLoginHistory: true,
          keepActivityLogs: true,
          autoDeleteAfterInactivity: false,
          inactivityPeriodDays: 365,
        },
      });
      settings = await this.privacySettingsRepository.save(settings);
    }

    return settings;
  }

  async updatePrivacySettings(
    userId: number,
    updateDto: UpdatePrivacySettingsDto,
  ): Promise<PrivacySettings> {
    const existingSettings = await this.getPrivacySettings(userId);

    // Map the DTO to actual entity properties
    if (updateDto.communicationSettings) {
      existingSettings.communications = {
        ...existingSettings.communications,
        emailMarketing:
          updateDto.communicationSettings.email !== undefined
            ? updateDto.communicationSettings.email
            : existingSettings.communications.emailMarketing,
        smsMarketing:
          updateDto.communicationSettings.sms !== undefined
            ? updateDto.communicationSettings.sms
            : existingSettings.communications.smsMarketing,
        pushNotifications:
          updateDto.communicationSettings.push !== undefined
            ? updateDto.communicationSettings.push
            : existingSettings.communications.pushNotifications,
        newsletter:
          updateDto.communicationSettings.marketing !== undefined
            ? updateDto.communicationSettings.marketing
            : existingSettings.communications.newsletter,
        productUpdates: existingSettings.communications.productUpdates,
        securityAlerts:
          updateDto.communicationSettings.securityAlerts !== undefined
            ? updateDto.communicationSettings.securityAlerts
            : existingSettings.communications.securityAlerts,
      };
    }

    if (updateDto.dataSharingSettings) {
      existingSettings.dataProcessing = {
        ...existingSettings.dataProcessing,
        analytics:
          updateDto.dataSharingSettings.analytics !== undefined
            ? updateDto.dataSharingSettings.analytics
            : existingSettings.dataProcessing.analytics,
        marketing:
          updateDto.dataSharingSettings.productImprovement !== undefined
            ? updateDto.dataSharingSettings.productImprovement
            : existingSettings.dataProcessing.marketing,
        thirdPartySharing:
          updateDto.dataSharingSettings.partners !== undefined
            ? updateDto.dataSharingSettings.partners
            : existingSettings.dataProcessing.thirdPartySharing,
        personalization:
          updateDto.dataSharingSettings.personalization !== undefined
            ? updateDto.dataSharingSettings.personalization
            : existingSettings.dataProcessing.personalization,
      };
    }

    if (updateDto.visibilitySettings) {
      existingSettings.visibility = {
        ...existingSettings.visibility,
        profilePublic:
          updateDto.visibilitySettings.profilePublic !== undefined
            ? updateDto.visibilitySettings.profilePublic
            : existingSettings.visibility.profilePublic,
        showEmail:
          updateDto.visibilitySettings.showEmail !== undefined
            ? updateDto.visibilitySettings.showEmail
            : existingSettings.visibility.showEmail,
        showPhone:
          updateDto.visibilitySettings.showPhone !== undefined
            ? updateDto.visibilitySettings.showPhone
            : existingSettings.visibility.showPhone,
        showAddress:
          updateDto.visibilitySettings.showAddress !== undefined
            ? updateDto.visibilitySettings.showAddress
            : existingSettings.visibility.showAddress,
        activityVisible:
          updateDto.visibilitySettings.activityVisible !== undefined
            ? updateDto.visibilitySettings.activityVisible
            : existingSettings.visibility.activityVisible,
      };
    }

    const updatedSettings =
      await this.privacySettingsRepository.save(existingSettings);

    // Log the privacy settings update
    await this.logPrivacyAction(
      userId,
      PrivacyAction.SETTINGS_CHANGED,
      'Configurações de privacidade atualizadas',
      { updatedFields: Object.keys(updateDto) },
    );

    return updatedSettings;
  }

  async getPrivacyHistory(
    userId: number,
    page = 1,
    limit = 10,
  ): Promise<{
    data: PrivacyHistory[];
    total: number;
    page: number;
    limit: number;
  }> {
    const [data, total] = await this.privacyHistoryRepository.findAndCount({
      where: { userId },
      order: { timestamp: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { data, total, page, limit };
  }

  async logPrivacyAction(
    userId: number,
    action: PrivacyAction,
    description: string,
    metadata?: Record<string, any>,
  ): Promise<PrivacyHistory> {
    const historyEntry = this.privacyHistoryRepository.create({
      userId,
      action,
      description,
      metadata,
    });

    return this.privacyHistoryRepository.save(historyEntry);
  }

  async createDataExportRequest(
    userId: number,
    createDto: CreateDataExportRequestDto,
  ): Promise<DataExportRequest> {
    // Check if there's already a pending request
    const existingRequest = await this.dataExportRequestRepository.findOne({
      where: {
        userId,
        status: ExportStatus.PENDING,
      },
    });

    if (existingRequest) {
      throw new BadRequestException(
        'You already have a pending data export request',
      );
    }

    const request = this.dataExportRequestRepository.create({
      userId,
      dataTypes: ['profile', 'activities', 'preferences'], // Default data types
    });

    const savedRequest = await this.dataExportRequestRepository.save(request);

    // Log the data export request
    await this.logPrivacyAction(
      userId,
      PrivacyAction.DATA_EXPORTED,
      'Requisição de exportação de dados criada',
      { requestId: savedRequest.id, reason: createDto.requestReason },
    );

    return savedRequest;
  }

  async getDataExportRequests(userId: number): Promise<DataExportRequest[]> {
    return this.dataExportRequestRepository.find({
      where: { userId },
      order: { requestedAt: 'DESC' },
    });
  }

  async createAccountDeletionRequest(
    userId: number,
    createDto: CreateAccountDeletionRequestDto,
  ): Promise<AccountDeletionRequest> {
    // Check if there's already a pending request
    const existingRequest = await this.accountDeletionRequestRepository.findOne(
      {
        where: {
          userId,
          status: DeletionStatus.PENDING,
        },
      },
    );

    if (existingRequest) {
      throw new BadRequestException(
        'Você já tem uma solicitação de exclusão de conta pendente',
      );
    }

    const request = this.accountDeletionRequestRepository.create({
      userId,
      reason: createDto.reason,
    });

    const savedRequest =
      await this.accountDeletionRequestRepository.save(request);

    // Log the account deletion request
    await this.logPrivacyAction(
      userId,
      PrivacyAction.DELETION_REQUESTED,
      'Requisição de exclusão de conta criada',
      { requestId: savedRequest.id, reason: createDto.reason },
    );

    return savedRequest;
  }

  async getAccountDeletionRequests(
    userId: number,
  ): Promise<AccountDeletionRequest[]> {
    return this.accountDeletionRequestRepository.find({
      where: { userId },
      order: { requestedAt: 'DESC' },
    });
  }

  async cancelAccountDeletionRequest(
    userId: number,
    requestId: string,
  ): Promise<AccountDeletionRequest> {
    const request = await this.accountDeletionRequestRepository.findOne({
      where: { id: requestId, userId },
    });

    if (!request) {
      throw new NotFoundException(
        'Requisição de exclusão de conta não encontrada',
      );
    }

    if (request.status !== DeletionStatus.PENDING) {
      throw new BadRequestException(
        'Só é possível cancelar requisições pendentes',
      );
    }

    request.status = DeletionStatus.CANCELLED;
    const updatedRequest =
      await this.accountDeletionRequestRepository.save(request);

    // Log the cancellation
    await this.logPrivacyAction(
      userId,
      PrivacyAction.DELETION_CANCELLED,
      'Requisição de exclusão de conta cancelada',
      { requestId },
    );

    return updatedRequest;
  }

  // Method for admin use - process data export
  async processDataExport(
    requestId: string,
    adminId: string,
  ): Promise<DataExportRequest> {
    const request = await this.dataExportRequestRepository.findOne({
      where: { id: requestId },
      relations: ['user'],
    });

    if (!request) {
      throw new NotFoundException('Data export request not found');
    }

    request.status = ExportStatus.PROCESSING;

    const updatedRequest = await this.dataExportRequestRepository.save(request);

    // Log the processing start
    await this.logPrivacyAction(
      request.userId,
      PrivacyAction.DATA_EXPORTED,
      'Data export processing started',
      { requestId, processedBy: adminId },
    );

    return updatedRequest;
  }

  // Method for admin use - complete data export
  async completeDataExport(
    requestId: string,
    downloadUrl: string,
    adminId: string,
  ): Promise<DataExportRequest> {
    const request = await this.dataExportRequestRepository.findOne({
      where: { id: requestId },
    });

    if (!request) {
      throw new NotFoundException('Data export request not found');
    }

    request.status = ExportStatus.COMPLETED;
    request.downloadUrl = downloadUrl;

    const updatedRequest = await this.dataExportRequestRepository.save(request);

    // Log the completion
    await this.logPrivacyAction(
      request.userId,
      PrivacyAction.DATA_EXPORTED,
      'Data export completed',
      { requestId, downloadUrl, completedBy: adminId },
    );

    return updatedRequest;
  }
}
