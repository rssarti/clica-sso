/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Controller, Post, Body, UseGuards, Param } from '@nestjs/common';
import { NotificationService } from '../shared/notification.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GetUserId } from '../auth/get-user-id.decorator';

interface TestNotificationDto {
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
  userId?: number;
}

interface PaymentNotificationDto {
  id: string | number;
  amount: number;
}

@Controller('test')
@UseGuards(JwtAuthGuard)
export class TestController {
  constructor(private readonly notificationService: NotificationService) {}

  @Post('send-notification')
  @UseGuards(JwtAuthGuard)
  sendTestNotification(
    @Body() dto: TestNotificationDto,
    @GetUserId() currentUserId: number,
  ) {
    const targetUserId = dto.userId || currentUserId;

    try {
      this.notificationService.sendNotificationToUser(
        targetUserId,
        dto.message,
        dto.type,
      );

      return {
        success: true,
        message: 'Notificação enviada com sucesso',
        userId: targetUserId,
        notification: {
          message: dto.message,
          type: dto.type,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        message: 'Erro ao enviar notificação',
        error: error?.message || 'Erro desconhecido',
      };
    }
  }

  @Post('system-message')
  sendSystemMessage(@Body() dto: { message: string }) {
    try {
      this.notificationService.broadcastSystemMessage(dto.message);

      return {
        success: true,
        message: 'Mensagem do sistema enviada',
        systemMessage: dto.message,
      };
    } catch (error: any) {
      return {
        success: false,
        message: 'Erro ao enviar mensagem do sistema',
        error: error?.message || 'Erro desconhecido',
      };
    }
  }

  @Post('payment-notification/:userId')
  sendPaymentNotification(
    @Param('userId') userId: number,
    @Body() paymentData: PaymentNotificationDto,
  ) {
    try {
      this.notificationService.notifyPaymentReceived(userId, paymentData);

      return {
        success: true,
        message: 'Notificação de pagamento enviada',
        userId,
        payment: paymentData,
      };
    } catch (error: any) {
      return {
        success: false,
        message: 'Erro ao enviar notificação de pagamento',
        error: error?.message || 'Erro desconhecido',
      };
    }
  }

  @Post('join-room')
  joinRoom(@Body() dto: { room: string }, @GetUserId() userId: number) {
    try {
      // Aqui você pode implementar lógica para adicionar usuário a uma sala
      // Por exemplo, salvar no banco de dados ou cache que o usuário está na sala

      return {
        success: true,
        message: `Usuário ${userId} adicionado à sala ${dto.room}`,
        room: dto.room,
        userId,
      };
    } catch (error: any) {
      return {
        success: false,
        message: 'Erro ao juntar-se à sala',
        error: error?.message || 'Erro desconhecido',
      };
    }
  }
}
