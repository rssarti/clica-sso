import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() createProductDto: CreateProductDto) {
    return this.productsService.create(createProductDto);
  }

  @Get()
  findAll() {
    return this.productsService.findActiveProducts();
  }

  @Get('with-plans')
  findProductsWithPlans() {
    return this.productsService.findProductsWithActivePlans();
  }

  @Get(':id')
  findById(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.findById(id);
  }

  @Get('slug/:slug')
  @UseGuards(JwtAuthGuard)
  findBySlug(@Param('slug') slug: string) {
    return this.productsService.findBySlug(slug);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    return this.productsService.update(id, updateProductDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.remove(id);
  }

  // ============================================
  // ENDPOINTS PARA APLICAÇÕES CONECTADAS
  // ============================================

  @Get('marketplace/available')
  @UseGuards(JwtAuthGuard)
  getAvailableProducts() {
    return this.productsService.getMarketplaceProducts();
  }

  @Get('categories/:category')
  @UseGuards(JwtAuthGuard)
  getProductsByCategory(@Param('category') category: string) {
    return this.productsService.findByCategory(category);
  }

  @Get(':id/plans')
  @UseGuards(JwtAuthGuard)
  getProductPlans(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.getProductPlans(id);
  }
}
