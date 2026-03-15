import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Product } from './product.entity';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';
import { Plan } from './plan.entity';
import { PlanStatus } from 'src/shared/enum/plan.enum';

@Injectable()
export class PlansService {
  constructor(
    @InjectRepository(Plan)
    private readonly planRepository: Repository<Plan>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  async create(createPlanDto: CreatePlanDto): Promise<Plan> {
    const { productId, ...planData } = createPlanDto;

    const product = await this.productRepository.findOneBy({ id: productId });
    if (!product) {
      throw new NotFoundException(`Product with ID ${productId} not found`);
    }

    const plan = this.planRepository.create({
      ...planData,
      product,
    });

    return this.planRepository.save(plan);
  }

  async findAll(): Promise<Plan[]> {
    return this.planRepository.find({
      relations: ['product'],
      order: { sortOrder: 'ASC' },
    });
  }

  async findById(id: number): Promise<Plan> {
    const plan = await this.planRepository.findOne({
      where: { id },
      relations: ['product'],
    });

    if (!plan) {
      throw new NotFoundException(`Plan with ID ${id} not found`);
    }

    return plan;
  }

  async findBySlug(slug: string): Promise<Plan> {
    const plan = await this.planRepository.findOne({
      where: { slug },
      relations: ['product'],
    });

    if (!plan) {
      throw new NotFoundException(`Plan with slug ${slug} not found`);
    }

    return plan;
  }

  async findByProduct(productId: number): Promise<Plan[]> {
    return this.planRepository.find({
      where: {
        product: { id: productId },
        status: PlanStatus.ACTIVE,
      },
      relations: ['product'],
      order: { sortOrder: 'ASC' },
    });
  }

  async findActivePlans(): Promise<Plan[]> {
    return this.planRepository.find({
      where: { status: PlanStatus.ACTIVE },
      relations: ['product'],
      order: { sortOrder: 'ASC' },
    });
  }

  async update(id: number, updatePlanDto: UpdatePlanDto): Promise<Plan> {
    await this.planRepository.update(id, updatePlanDto);
    return this.findById(id);
  }

  async remove(id: number): Promise<void> {
    const result = await this.planRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Plan with ID ${id} not found`);
    }
  }

  async findPopularPlans(): Promise<Plan[]> {
    return this.planRepository.find({
      where: {
        isPopular: true,
        status: PlanStatus.ACTIVE,
      },
      relations: ['product'],
      order: { sortOrder: 'ASC' },
    });
  }
}
