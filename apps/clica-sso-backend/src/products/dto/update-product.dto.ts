import {
  IsString,
  IsEnum,
  IsOptional,
  IsArray,
  IsObject,
  IsUrl,
} from 'class-validator';
import { ProductCategory, ProductStatus } from '../product.entity';

export class UpdateProductDto {
  @IsString()
  @IsOptional()
  slug?: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  longDescription?: string;

  @IsEnum(ProductCategory)
  @IsOptional()
  category?: ProductCategory;

  @IsEnum(ProductStatus)
  @IsOptional()
  status?: ProductStatus;

  @IsUrl()
  @IsOptional()
  logoUrl?: string;

  @IsUrl()
  @IsOptional()
  websiteUrl?: string;

  @IsArray()
  @IsOptional()
  features?: string[];

  @IsObject()
  @IsOptional()
  metadata?: any;
}
