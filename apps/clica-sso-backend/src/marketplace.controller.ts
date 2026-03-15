import { Controller, Get, UseGuards } from '@nestjs/common';
import { ProductsService } from './products/products.service';
import { PlansService } from './products/plans.service';
import { ProductsSeedService } from './products/products-seed.service';
import { JwtAuthGuard } from './auth/jwt-auth.guard';

@Controller('marketplace')
export class MarketplaceController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly plansService: PlansService,
    private readonly productsSeedService: ProductsSeedService,
  ) {}

  @Get('catalog')
  async getCatalog() {
    // Retorna produtos com seus planos para o catálogo público
    return this.productsService.findProductsWithActivePlans();
  }

  @Get('products')
  async getProducts() {
    return this.productsService.findActiveProducts();
  }

  @Get('plans')
  async getPlans() {
    return this.plansService.findActivePlans();
  }

  @Get('plans/popular')
  async getPopularPlans() {
    return this.plansService.findPopularPlans();
  }

  @Get('seed-products')
  @UseGuards(JwtAuthGuard)
  async seedProducts() {
    await this.productsSeedService.seedProductsAndPlans();
    return { message: 'Products and plans seeded successfully!' };
  }
}
