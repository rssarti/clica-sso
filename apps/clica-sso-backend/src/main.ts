import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';

async function bootstrap() {
  console.log('🚀 Iniciando aplicação...');

  try {
    const app = await NestFactory.create<NestExpressApplication>(AppModule);
    console.log('✅ NestFactory.create completou com sucesso!');

    app.set('trust proxy', 1);

    app.enableCors({
      origin: [
        'https://accounts.clicatecnologia.com.br',
        'http://localhost:5173',
      ],
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
      allowedHeaders: 'Content-Type, Authorization',
      credentials: true,
    });

    console.log('🔧 Configurando validação global...');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
      }),
    );

    // RabbitMQ microservice connection
    const rabbitmqUrl =
      process.env.RABBITMQ_URL || 'amqp://admin:admin123@localhost:5672';

    try {
      console.log('🐰 Conectando ao RabbitMQ microservice...');

      app.connectMicroservice<MicroserviceOptions>({
        transport: Transport.RMQ,
        options: {
          urls: [rabbitmqUrl],
          queue: 'billing.create_payment',
          queueOptions: {
            durable: true,
          },
        },
      });

      // Timeout para startAllMicroservices
      const microservicePromise = app.startAllMicroservices();
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error('RabbitMQ connection timeout')),
          10000, // 10 segundos
        ),
      );

      await Promise.race([microservicePromise, timeoutPromise]);
      console.log('✅ RabbitMQ microservice conectado e fila criada');
    } catch (error) {
      console.warn(
        '⚠️  RabbitMQ não disponível, continuando sem microservice:',
        error instanceof Error ? error.message : 'Unknown error',
      );
    }

    const port = process.env.PORT || 3000;
    console.log(`🌐 Iniciando servidor HTTP na porta ${port}...`);

    await app.listen(port, '0.0.0.0');
    console.log(`✅ Aplicação rodando em http://0.0.0.0:${port}`);
  } catch (error) {
    console.error('❌ Erro ao inicializar aplicação:', error);
    process.exit(1);
  }
}

void bootstrap();
