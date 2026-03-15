/* eslint-disable @typescript-eslint/no-unsafe-return */
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { Product } from './product.entity';
import { PlanStatus, PlanType } from 'src/shared/enum/plan.enum';

@Entity('plans')
export class Plan {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string; // Plano Básico, Plano Pro, Plano Enterprise

  @Column({ unique: true })
  slug: string; // basic, pro, enterprise

  @Column('text', { nullable: true })
  description: string;

  @ManyToOne(() => Product, (product) => product.plans)
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column('decimal', { precision: 10, scale: 2 })
  price: number;

  @Column('decimal', {
    precision: 10,
    scale: 2,
    nullable: true,
    name: 'original_price',
  })
  originalPrice: number; // Para mostrar desconto

  @Column({
    type: 'enum',
    enum: PlanType,
    default: PlanType.MONTHLY,
    name: 'billing_cycle',
  })
  billingCycle: PlanType;

  @Column({ default: 0, name: 'trial_days' })
  trialDays: number; // Dias de teste grátis

  @Column({
    type: 'enum',
    enum: PlanStatus,
    default: PlanStatus.ACTIVE,
  })
  status: PlanStatus;

  @Column({ type: 'json', nullable: true })
  features: string[]; // Funcionalidades específicas do plano

  @Column({ type: 'json', nullable: true })
  limits: {
    users?: number;
    messages?: number;
    storage?: number;
    apiCalls?: number;
    [key: string]: any;
  }; // Limites do plano

  @Column({ type: 'json', nullable: true })
  metadata: any; // Configurações específicas

  @Column({ default: false, name: 'is_popular' })
  isPopular: boolean; // Destacar como "mais popular"

  @Column({ default: 0, name: 'sort_order' })
  sortOrder: number; // Ordem de exibição

  @OneToMany('Contract', 'plan')
  contracts: any[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
