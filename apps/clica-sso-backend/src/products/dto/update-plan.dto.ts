import {
  IsString,
  IsNumber,
  IsEnum,
  IsOptional,
  IsArray,
  IsObject,
  IsBoolean,
  Min,
} from 'class-validator';
import { PlanStatus, PlanType } from 'src/shared/enum/plan.enum';

export class UpdatePlanDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  slug?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsOptional()
  @Min(0)
  price?: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsOptional()
  @Min(0)
  originalPrice?: number;

  @IsEnum(PlanType)
  @IsOptional()
  billingCycle?: PlanType;

  @IsNumber()
  @IsOptional()
  @Min(0)
  trialDays?: number;

  @IsEnum(PlanStatus)
  @IsOptional()
  status?: PlanStatus;

  @IsArray()
  @IsOptional()
  features?: string[];

  @IsObject()
  @IsOptional()
  limits?: any;

  @IsObject()
  @IsOptional()
  metadata?: any;

  @IsBoolean()
  @IsOptional()
  isPopular?: boolean;

  @IsNumber()
  @IsOptional()
  @Min(0)
  sortOrder?: number;
}
