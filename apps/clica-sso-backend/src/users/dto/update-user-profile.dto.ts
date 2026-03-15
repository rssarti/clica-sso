import {
  IsString,
  IsOptional,
  IsEmail,
  MinLength,
  IsObject,
} from 'class-validator';

export class UpdateUserProfileDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  @MinLength(6)
  password?: string;

  @IsString()
  @IsOptional()
  document?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsObject()
  @IsOptional()
  address_json?: any;

  @IsObject()
  @IsOptional()
  metadata?: any;
}
