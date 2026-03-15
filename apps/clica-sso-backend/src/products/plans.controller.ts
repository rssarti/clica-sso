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
import { PlansService } from './plans.service';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('plans')
export class PlansController {
  constructor(private readonly plansService: PlansService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() createPlanDto: CreatePlanDto) {
    return this.plansService.create(createPlanDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll() {
    return this.plansService.findActivePlans();
  }

  @Get('popular')
  @UseGuards(JwtAuthGuard)
  findPopular() {
    return this.plansService.findPopularPlans();
  }

  @Get('product/:productId')
  @UseGuards(JwtAuthGuard)
  findByProduct(@Param('productId', ParseIntPipe) productId: number) {
    return this.plansService.findByProduct(productId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findById(@Param('id', ParseIntPipe) id: number) {
    return this.plansService.findById(id);
  }

  @Get('slug/:slug')
  @UseGuards(JwtAuthGuard)
  findBySlug(@Param('slug') slug: string) {
    return this.plansService.findBySlug(slug);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePlanDto: UpdatePlanDto,
  ) {
    return this.plansService.update(id, updatePlanDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.plansService.remove(id);
  }
}
