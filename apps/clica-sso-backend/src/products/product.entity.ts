import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum ProductStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  COMING_SOON = 'coming_soon',
}

export enum ProductCategory {
  COMMUNICATION = 'communication',
  MARKETING = 'marketing',
  ANALYTICS = 'analytics',
  INTEGRATION = 'integration',
  CUSTOM = 'custom',
}

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  slug: string; // clicazap, clica-analytics, etc.

  @Column()
  name: string;

  @Column('text')
  description: string;

  @Column('text', { nullable: true, name: 'long_description' })
  longDescription: string;

  @Column({
    type: 'enum',
    enum: ProductCategory,
    default: ProductCategory.COMMUNICATION,
  })
  category: ProductCategory;

  @Column({
    type: 'enum',
    enum: ProductStatus,
    default: ProductStatus.ACTIVE,
  })
  status: ProductStatus;

  @Column({ nullable: true, name: 'logo_url' })
  logoUrl: string;

  @Column({ nullable: true, name: 'website_url' })
  websiteUrl: string;

  @Column({ type: 'json', nullable: true })
  features: string[]; // Lista de funcionalidades

  @Column({ type: 'json', nullable: true })
  metadata: any; // Configurações específicas do produto

  @OneToMany('Plan', 'product')
  plans: any[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
