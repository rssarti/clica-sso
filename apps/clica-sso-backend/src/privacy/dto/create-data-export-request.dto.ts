import { IsOptional, IsString } from 'class-validator';

export class CreateDataExportRequestDto {
  @IsOptional()
  @IsString()
  requestReason?: string;
}
