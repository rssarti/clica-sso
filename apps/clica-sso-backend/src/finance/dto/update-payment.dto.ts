import { IsEnum, IsOptional, IsDateString } from 'class-validator';
import { PaymentStatus } from '../payment.entity';

export class UpdatePaymentDto {
  @IsOptional()
  @IsEnum(PaymentStatus)
  status?: PaymentStatus;

  @IsOptional()
  @IsDateString()
  paidAt?: string;

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
