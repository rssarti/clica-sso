import {
  IsNotEmpty,
  IsNumber,
  IsEnum,
  IsOptional,
  IsDateString,
} from 'class-validator';
import { PaymentMethod } from '../payment.entity';

export class CreatePaymentDto {
  @IsNotEmpty()
  @IsNumber()
  contractId: number;

  @IsNotEmpty()
  @IsNumber()
  amount: number;

  @IsEnum(PaymentMethod)
  method: PaymentMethod;

  @IsDateString()
  dueDate: string;

  @IsOptional()
  description?: string;

  @IsOptional()
  boletoUrl?: string;

  @IsOptional()
  boletoBarcode?: string;

  @IsOptional()
  pixQrCode?: string;

  @IsOptional()
  externalId?: string;

  @IsOptional()
  metadata?: any;
}
