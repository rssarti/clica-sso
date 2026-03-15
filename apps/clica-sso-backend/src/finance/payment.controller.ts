/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
} from '@nestjs/common';
import { PaymentService } from './payment.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('payments')
@UseGuards(JwtAuthGuard)
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createPaymentDto: CreatePaymentDto,
    @Request() req: { user: any },
  ) {
    return this.paymentService.create(createPaymentDto, req.user.id);
  }

  @Get()
  async findAll() {
    return this.paymentService.findAll();
  }

  @Get('my-payments')
  async findMyPayments(@Request() req: { user: any }) {
    return this.paymentService.findByUserId(req.user.id);
  }

  @Get('pending')
  async findPendingPayments(@Request() req: { user: any }) {
    return this.paymentService.findPendingPayments(req.user.id);
  }

  @Get('overdue')
  async findOverduePayments(@Request() req: { user: any }) {
    return this.paymentService.findOverduePayments(req.user.id);
  }

  @Get(':id')
  async findById(@Param('id', ParseIntPipe) id: number) {
    return this.paymentService.findById(id);
  }

  @Get('contract/:contractId')
  async findByContractId(
    @Param('contractId', ParseIntPipe) contractId: number,
  ) {
    return this.paymentService.findByContractId(contractId);
  }

  @Get('contract/:contractId/last-paid')
  async getLastPaidPayment(
    @Param('contractId', ParseIntPipe) contractId: number,
  ) {
    return this.paymentService.getLastPaidPaymentByContract(contractId);
  }

  @Get('contract/:contractId/next-pending')
  async getNextPendingPayment(
    @Param('contractId', ParseIntPipe) contractId: number,
  ) {
    return this.paymentService.getNextPendingPaymentByContract(contractId);
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePaymentDto: UpdatePaymentDto,
  ) {
    return this.paymentService.update(id, updatePaymentDto);
  }

  @Put(':id/mark-as-paid')
  @HttpCode(HttpStatus.OK)
  async markAsPaid(@Param('id', ParseIntPipe) id: number) {
    return this.paymentService.markAsPaid(id);
  }

  @Post(':id/generate-boleto')
  @HttpCode(HttpStatus.OK)
  async generateBoleto(@Param('id', ParseIntPipe) id: number) {
    return this.paymentService.generateBoleto(id);
  }

  @Post(':id/generate-pix')
  @HttpCode(HttpStatus.OK)
  async generatePix(@Param('id', ParseIntPipe) id: number) {
    return this.paymentService.generatePix(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id', ParseIntPipe) id: number) {
    return this.paymentService.delete(id);
  }
}
