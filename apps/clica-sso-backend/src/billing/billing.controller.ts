import {
  Controller,
  Get,
  Post,
  Param,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { BillingService } from './billing.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('billing')
@UseGuards(JwtAuthGuard)
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Get('contract/:contractId/next-payment')
  async getNextPayment(@Param('contractId', ParseIntPipe) contractId: number) {
    return this.billingService.getNextPaymentForContract(contractId);
  }

  @Get('contract/:contractId/summary')
  async getPaymentSummary(
    @Param('contractId', ParseIntPipe) contractId: number,
  ) {
    return this.billingService.getContractPaymentSummary(contractId);
  }

  @Post('contract/:contractId/generate-boleto')
  @HttpCode(HttpStatus.OK)
  async generateBoleto(@Param('contractId', ParseIntPipe) contractId: number) {
    return this.billingService.generateBoletoForNextPayment(contractId);
  }

  @Post('contract/:contractId/generate-pix')
  @HttpCode(HttpStatus.OK)
  async generatePix(@Param('contractId', ParseIntPipe) contractId: number) {
    return this.billingService.generatePixForNextPayment(contractId);
  }

  @Post('contract/:contractId/send-boleto-email')
  @HttpCode(HttpStatus.OK)
  async sendBoletoEmail(@Param('contractId', ParseIntPipe) contractId: number) {
    return this.billingService.sendBoletoByEmail(contractId);
  }

  @Post('process-automatic-billing')
  @HttpCode(HttpStatus.OK)
  async processAutomaticBilling() {
    return this.billingService.processAutomaticBilling();
  }
}
