import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): any {
    console.log('🩺 Health check via / acessado');
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'clica-sso-backend',
    };
  }

  @Get('ping')
  ping(): string {
    console.log('🏓 Ping endpoint acessado');
    return 'pong';
  }
}
