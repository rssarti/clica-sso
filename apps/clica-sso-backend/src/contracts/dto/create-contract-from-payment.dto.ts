import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsDateString,
  IsOptional,
  IsObject,
  IsEnum,
} from 'class-validator';
import { ServiceType } from '../contract.entity';

export class CreateContractFromPaymentDto {
  @IsNumber()
  @IsNotEmpty()
  paymentId: number;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsDateString()
  @IsNotEmpty()
  startDate: string;

  @IsDateString()
  @IsNotEmpty()
  endDate: string;

  @IsEnum(ServiceType)
  @IsNotEmpty()
  serviceType: ServiceType;

  @IsObject()
  @IsOptional()
  metadata?: any;
}
