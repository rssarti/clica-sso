import { IsString, IsOptional } from 'class-validator';

export class CreateAccountDeletionRequestDto {
  @IsOptional()
  @IsString()
  reason?: string;
}
