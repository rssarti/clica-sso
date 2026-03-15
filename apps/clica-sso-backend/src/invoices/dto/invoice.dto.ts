import {
  IsNotEmpty,
  IsNumber,
  IsEnum,
  IsOptional,
  IsDateString,
  IsArray,
} from 'class-validator';
import { InvoiceStatus } from '../invoice.entity';

export class CreateInvoiceDto {
  @IsNotEmpty()
  @IsNumber()
  contractId: number;

  @IsNotEmpty()
  @IsNumber()
  value: number;

  @IsDateString()
  dueDate: string;

  @IsOptional()
  description?: string;

  @IsOptional()
  @IsArray()
  items?: any[];

  @IsOptional()
  metadata?: any;
}

export class UpdateInvoiceDto {
  @IsOptional()
  @IsEnum(InvoiceStatus)
  status?: InvoiceStatus;

  @IsOptional()
  @IsDateString()
  paidAt?: string;

  @IsOptional()
  description?: string;

  @IsOptional()
  @IsArray()
  items?: any[];

  @IsOptional()
  metadata?: any;
}
