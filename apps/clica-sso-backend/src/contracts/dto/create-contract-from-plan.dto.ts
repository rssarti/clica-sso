import {
  IsNotEmpty,
  IsNumber,
  IsDateString,
  IsOptional,
  IsObject,
  IsEnum,
} from 'class-validator';
import { ContractStatus } from '../contract.entity';

export class CreateContractFromPlanDto {
  @IsNumber()
  @IsNotEmpty()
  planId: number;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;

  @IsEnum(ContractStatus)
  @IsOptional()
  status?: ContractStatus;

  @IsObject()
  @IsOptional()
  metadata?: any;
}
