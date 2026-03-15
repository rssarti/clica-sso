import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    credentials: false,
  },
  namespace: '/',
})
export class EventsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private logger: Logger = new Logger('EventsGateway');

  async afterInit(server: Server) {
    this.logger.log('WebSocket Gateway initialized');
    const redisUrl = process.env.REDIS_URL || '';
    if (redisUrl) {
      const pubClient = createClient({ url: redisUrl });
      const subClient = pubClient.duplicate();
      await pubClient.connect();
      await subClient.connect();
      server.adapter(createAdapter(pubClient, subClient));
      this.logger.log('Socket.IO Redis adapter configured');
    }
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
    const userId = client.handshake.query.userId as string;
    if (userId) {
      client.join(`user_${userId}`);
      this.logger.log(`Client ${client.id} joined room user_${userId}`);
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }
  @SubscribeMessage('message')
  handleMessage(
    @MessageBody() data: { message: string; room?: string },
    @ConnectedSocket() client: Socket,
  ): void {
    this.logger.log(`Mensagem recebida de ${client.id}: ${data.message}`);

    if (data.room) {
      // Envia para uma sala específica
      this.server.to(data.room).emit('message', {
        clientId: client.id,
        message: data.message,
        timestamp: new Date(),
      });
    } else {
      // Envia para todos os clientes
      this.server.emit('message', {
        clientId: client.id,
        message: data.message,
        timestamp: new Date(),
      });
    }
  }

  // Escuta mensagens do tipo 'join_room'
  @SubscribeMessage('join_room')
  handleJoinRoom(
    @MessageBody() data: { room: string },
    @ConnectedSocket() client: Socket,
  ): void {
    client.join(data.room);
    this.logger.log(`Cliente ${client.id} entrou na sala ${data.room}`);

    // Notifica outros clientes da sala
    client.to(data.room).emit('user_joined', {
      clientId: client.id,
      room: data.room,
      timestamp: new Date(),
    });
  }

  @SubscribeMessage('leave_room')
  handleLeaveRoom(
    @MessageBody() data: { room: string },
    @ConnectedSocket() client: Socket,
  ): void {
    client.leave(data.room);
    this.logger.log(`Cliente ${client.id} saiu da sala ${data.room}`);

    client.to(data.room).emit('user_left', {
      clientId: client.id,
      room: data.room,
      timestamp: new Date(),
    });
  }

  sendNotificationToUser(userId: number, notification: any) {
    this.server.to(`user_${userId}`).emit('notification', notification);
  }

  sendToUser(userId: number, event: string, data: any) {
    this.server.to(`user_${userId}`).emit(event, data);
  }

  broadcastMessage(event: string, data: any) {
    this.server.emit(event, data);
  }
}
