import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsDateString,
  IsEnum,
  IsOptional,
  IsObject,
} from 'class-validator';
import { ContractStatus, ServiceType } from '../contract.entity';

export class CreateContractDto {
  @IsNumber()
  @IsNotEmpty()
  userId: number;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(ContractStatus)
  @IsOptional()
  status?: ContractStatus;

  @IsEnum(ServiceType)
  @IsNotEmpty()
  serviceType: ServiceType;

  @IsNumber()
  @IsOptional()
  planId?: number;

  @IsNumber()
  @IsNotEmpty()
  value: number;

  @IsDateString()
  @IsNotEmpty()
  startDate: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;

  @IsObject()
  @IsOptional()
  metadata?: any;
}
