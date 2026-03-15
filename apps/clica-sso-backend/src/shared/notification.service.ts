import { Injectable } from '@nestjs/common';
import { EventsGateway } from '../events/events.gateway';

interface PaymentData {
  id: string | number;
  amount: number;
}

interface BoletoData {
  id: string | number;
  amount: number;
  dueDate: Date;
}

@Injectable()
export class NotificationService {
  constructor(private readonly eventsGateway: EventsGateway) {}

  // Enviar notificação para um usuário específico
  sendNotificationToUser(
    userId: number,
    message: string,
    type: 'info' | 'success' | 'warning' | 'error' = 'info',
  ) {
    const notification = {
      id: Date.now(),
      message,
      type,
      timestamp: new Date(),
      read: false,
    };

    this.eventsGateway.sendNotificationToUser(userId, notification);
  }

  // Broadcast para todos os usuários
  broadcastSystemMessage(message: string) {
    this.eventsGateway.broadcastMessage('system_message', {
      message,
      timestamp: new Date(),
      type: 'system',
    });
  }

  // Notificar sobre novo pagamento
  notifyPaymentReceived(userId: number, paymentData: PaymentData) {
    this.eventsGateway.sendNotificationToUser(userId, {
      type: 'payment_received',
      message: `Pagamento de R$ ${paymentData.amount} foi processado com sucesso!`,
      paymentId: paymentData.id,
      timestamp: new Date(),
    });
  }

  // Notificar sobre boleto vencido
  notifyOverdueBoleto(userId: number, boletoData: BoletoData) {
    this.eventsGateway.sendNotificationToUser(userId, {
      type: 'overdue_boleto',
      message: `Seu boleto no valor de R$ ${boletoData.amount} está vencido.`,
      boletoId: boletoData.id,
      dueDate: boletoData.dueDate,
      timestamp: new Date(),
    });
  }
}
