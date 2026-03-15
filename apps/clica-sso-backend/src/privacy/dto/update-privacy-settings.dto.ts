import {
  IsBoolean,
  IsOptional,
  IsObject,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class CommunicationSettingsDto {
  @IsOptional()
  @IsBoolean()
  email?: boolean;

  @IsOptional()
  @IsBoolean()
  sms?: boolean;

  @IsOptional()
  @IsBoolean()
  push?: boolean;

  @IsOptional()
  @IsBoolean()
  marketing?: boolean;

  @IsOptional()
  @IsBoolean()
  securityAlerts?: boolean;
}

class DataSharingSettingsDto {
  @IsOptional()
  @IsBoolean()
  partners?: boolean;

  @IsOptional()
  @IsBoolean()
  analytics?: boolean;

  @IsOptional()
  @IsBoolean()
  productImprovement?: boolean;

  @IsOptional()
  @IsBoolean()
  personalization?: boolean;
}

class CookieSettingsDto {
  @IsOptional()
  @IsBoolean()
  necessary?: boolean;

  @IsOptional()
  @IsBoolean()
  analytics?: boolean;

  @IsOptional()
  @IsBoolean()
  marketing?: boolean;

  @IsOptional()
  @IsBoolean()
  functional?: boolean;
}

class VisibilitySettingsDto {
  @IsOptional()
  @IsBoolean()
  profilePublic?: boolean;

  @IsOptional()
  @IsBoolean()
  showEmail?: boolean;

  @IsOptional()
  @IsBoolean()
  showPhone?: boolean;

  @IsOptional()
  @IsBoolean()
  showAddress?: boolean;

  @IsOptional()
  @IsBoolean()
  activityVisible?: boolean;
}

export class UpdatePrivacySettingsDto {
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => CommunicationSettingsDto)
  communicationSettings?: CommunicationSettingsDto;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => DataSharingSettingsDto)
  dataSharingSettings?: DataSharingSettingsDto;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => CookieSettingsDto)
  cookieSettings?: CookieSettingsDto;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => VisibilitySettingsDto)
  visibilitySettings?: VisibilitySettingsDto;
}
