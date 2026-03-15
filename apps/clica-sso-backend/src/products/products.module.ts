import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductsController } from './products.controller';
import { PlansController } from './plans.controller';
import { MarketplaceController } from './marketplace.controller';
import { ProductsService } from './products.service';
import { PlansService } from './plans.service';
import { ProductsSeedService } from './products-seed.service';
import { Product } from './product.entity';
import { Plan } from './plan.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Product, Plan])],
  controllers: [ProductsController, PlansController, MarketplaceController],
  providers: [ProductsService, PlansService, ProductsSeedService],
  exports: [ProductsService, PlansService, ProductsSeedService],
})
export class ProductsModule {}
