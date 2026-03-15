/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PrivacyService } from './privacy.service';
import { UpdatePrivacySettingsDto } from './dto/update-privacy-settings.dto';
import { CreateDataExportRequestDto } from './dto/create-data-export-request.dto';
import { CreateAccountDeletionRequestDto } from './dto/create-account-deletion-request.dto';

@Controller('privacy')
@UseGuards(JwtAuthGuard)
export class PrivacyController {
  constructor(private readonly privacyService: PrivacyService) {}

  @Get('settings')
  @UseGuards(JwtAuthGuard)
  async getPrivacySettings(@Request() req) {
    console.log('🔍 Fetching privacy settings for user:', req.user.id);
    return this.privacyService.getPrivacySettings(req.user.id);
  }

  @Patch('settings')
  async updatePrivacySettings(
    @Request() req,
    @Body() updateDto: UpdatePrivacySettingsDto,
  ) {
    return this.privacyService.updatePrivacySettings(req.user.id, updateDto);
  }

  @Get('history')
  async getPrivacyHistory(
    @Request() req,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.privacyService.getPrivacyHistory(
      req.user.id,
      page || 1,
      limit || 10,
    );
  }

  @Post('data-export')
  async createDataExportRequest(
    @Request() req,
    @Body() createDto: CreateDataExportRequestDto,
  ) {
    return this.privacyService.createDataExportRequest(req.user.id, createDto);
  }

  @Get('data-export')
  async getDataExportRequests(@Request() req) {
    return this.privacyService.getDataExportRequests(req.user.id);
  }

  @Post('account-deletion')
  async createAccountDeletionRequest(
    @Request() req,
    @Body() createDto: CreateAccountDeletionRequestDto,
  ) {
    return this.privacyService.createAccountDeletionRequest(
      req.user.id,
      createDto,
    );
  }

  @Get('account-deletion')
  async getAccountDeletionRequests(@Request() req) {
    return this.privacyService.getAccountDeletionRequests(req.user.id);
  }

  @Delete('account-deletion/:requestId')
  async cancelAccountDeletionRequest(
    @Request() req,
    @Param('requestId') requestId: string,
  ) {
    return this.privacyService.cancelAccountDeletionRequest(
      req.user.id,
      requestId,
    );
  }

  // Admin endpoints (would need additional role-based guards in production)
  @Post('admin/data-export/:requestId/process')
  async processDataExport(
    @Request() req,
    @Param('requestId') requestId: string,
  ) {
    return this.privacyService.processDataExport(requestId, req.user.id);
  }

  @Post('admin/data-export/:requestId/complete')
  async completeDataExport(
    @Request() req,
    @Param('requestId') requestId: string,
    @Body('downloadUrl') downloadUrl: string,
  ) {
    return this.privacyService.completeDataExport(
      requestId,
      downloadUrl,
      req.user.id,
    );
  }
}
