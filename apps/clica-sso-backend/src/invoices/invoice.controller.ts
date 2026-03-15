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
import { InvoiceService } from './invoice.service';
import { CreateInvoiceDto, UpdateInvoiceDto } from './dto/invoice.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('invoices')
@UseGuards(JwtAuthGuard)
export class InvoiceController {
  constructor(private readonly invoiceService: InvoiceService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createInvoiceDto: CreateInvoiceDto,
    @Request() req: { user: any },
  ) {
    return this.invoiceService.create(createInvoiceDto, req.user.id);
  }

  @Get()
  async findAll() {
    return this.invoiceService.findAll();
  }

  @Get('my-invoices')
  async findMyInvoices(@Request() req: { user: any }) {
    return this.invoiceService.findByUserId(req.user.id);
  }

  @Get('pending')
  async findPendingInvoices(@Request() req: { user: any }) {
    return this.invoiceService.findPendingInvoices(req.user.id);
  }

  @Get('overdue')
  async findOverdueInvoices(@Request() req: { user: any }) {
    return this.invoiceService.findOverdueInvoices(req.user.id);
  }

  @Get(':id')
  async findById(@Param('id', ParseIntPipe) id: number) {
    return this.invoiceService.findById(id);
  }

  @Get('contract/:contractId')
  async findByContractId(
    @Param('contractId', ParseIntPipe) contractId: number,
  ) {
    return this.invoiceService.findByContractId(contractId);
  }

  @Post('contract/:contractId/monthly')
  @HttpCode(HttpStatus.CREATED)
  async createMonthlyInvoice(
    @Param('contractId', ParseIntPipe) contractId: number,
  ) {
    return this.invoiceService.createMonthlyInvoiceForContract(contractId);
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateInvoiceDto: UpdateInvoiceDto,
  ) {
    return this.invoiceService.update(id, updateInvoiceDto);
  }

  @Put(':id/mark-as-paid')
  @HttpCode(HttpStatus.OK)
  async markAsPaid(@Param('id', ParseIntPipe) id: number) {
    return this.invoiceService.markAsPaid(id);
  }

  @Put(':id/mark-as-overdue')
  @HttpCode(HttpStatus.OK)
  async markAsOverdue(@Param('id', ParseIntPipe) id: number) {
    return this.invoiceService.markAsOverdue(id);
  }

  @Put(':id/cancel')
  @HttpCode(HttpStatus.OK)
  async cancel(@Param('id', ParseIntPipe) id: number) {
    return this.invoiceService.cancel(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id', ParseIntPipe) id: number) {
    return this.invoiceService.delete(id);
  }

  @Post('update-overdue')
  @HttpCode(HttpStatus.OK)
  async updateOverdueInvoices() {
    await this.invoiceService.updateOverdueInvoices();
    return { message: 'Overdue invoices updated successfully' };
  }
}
