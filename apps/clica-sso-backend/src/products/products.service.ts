/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product, ProductStatus } from './product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  async create(createProductDto: CreateProductDto): Promise<Product> {
    const product = this.productRepository.create(createProductDto);
    return this.productRepository.save(product);
  }

  async findAll(): Promise<Product[]> {
    return this.productRepository.find({
      where: { status: ProductStatus.ACTIVE },
      relations: ['plans'],
      order: { name: 'ASC' },
    });
  }

  async findBySlug(slug: string): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { slug },
      relations: ['plans'],
    });

    if (!product) {
      throw new NotFoundException(`Product with slug ${slug} not found`);
    }

    return product;
  }

  async findById(id: number): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { id },
      relations: ['plans'],
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return product;
  }

  async update(
    id: number,
    updateProductDto: UpdateProductDto,
  ): Promise<Product> {
    await this.productRepository.update(id, updateProductDto);
    return this.findById(id);
  }

  async remove(id: number): Promise<void> {
    const result = await this.productRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
  }

  async findActiveProducts(): Promise<Product[]> {
    return this.productRepository.find({
      where: { status: ProductStatus.ACTIVE },
      relations: ['plans'],
      order: { name: 'ASC' },
    });
  }

  async findProductsWithActivePlans(): Promise<Product[]> {
    return this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.plans', 'plan', 'plan.status = :planStatus', {
        planStatus: 'active',
      })
      .where('product.status = :productStatus', {
        productStatus: ProductStatus.ACTIVE,
      })
      .orderBy('product.name', 'ASC')
      .addOrderBy('plan.sortOrder', 'ASC')
      .getMany();
  }

  // ============================================
  // MÉTODOS PARA APLICAÇÕES CONECTADAS
  // ============================================

  async getMarketplaceProducts(): Promise<Product[]> {
    return this.productRepository.find({
      where: { status: ProductStatus.ACTIVE },
      relations: ['plans'],
      order: { name: 'ASC' },
    });
  }

  async findByCategory(category: string): Promise<Product[]> {
    return this.productRepository.find({
      where: {
        status: ProductStatus.ACTIVE,
        category: category as any,
      },
      relations: ['plans'],
      order: { name: 'ASC' },
    });
  }

  async getProductPlans(productId: number) {
    const product = await this.productRepository.findOne({
      where: { id: productId },
      relations: ['plans'],
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${productId} not found`);
    }

    return {
      product: {
        id: product.id,
        name: product.name,
        slug: product.slug,
        description: product.description,
        category: product.category,
        logoUrl: product.logoUrl,
        websiteUrl: product.websiteUrl,
        features: product.features,
      },
      plans: product.plans || [],
    };
  }
}
