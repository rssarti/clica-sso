import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsEnum,
  IsOptional,
  IsArray,
  IsObject,
  IsBoolean,
  Min,
} from 'class-validator';
import { PlanStatus, PlanType } from 'src/shared/enum/plan.enum';

export class CreatePlanDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  slug: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @IsNotEmpty()
  productId: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price: number;

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
