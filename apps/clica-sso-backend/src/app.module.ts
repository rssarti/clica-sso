import { Module, Logger, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { readFileSync } from 'fs';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ContractsModule } from './contracts/contracts.module';
import { PaymentModule } from './finance/payment.module';
import { InvoiceModule } from './invoices/invoice.module';
import { BillingModule } from './billing/billing.module';
import { ProductsModule } from './products/products.module';
import { PrivacyModule } from './privacy/privacy.module';
import { EventsModule } from './events/events.module';
import { TestModule } from './test/test.module';
import { SeedService } from './seed.service';
import { HealthController } from './health/health.controller';
import { JwtDebugMiddleware } from './auth/jwt-debug.middleware';

const logger = new Logger('DatabaseConfig');
logger.log('=== VALIDAÇÃO DAS VARIÁVEIS DE AMBIENTE DO BANCO ===');
logger.log(`DB_HOST: ${process.env.DB_HOST || 'undefined'}`);
logger.log(`DB_PORT: ${process.env.DB_PORT || 'undefined'}`);
logger.log(`DB_USERNAME: ${process.env.DB_USERNAME || 'undefined'}`);
logger.log(
  `DB_PASSWORD: ${process.env.DB_PASSWORD ? '***DEFINIDA***' : 'undefined'}`,
);
logger.log(`DB_NAME: ${process.env.DB_NAME || 'undefined'}`);
logger.log(
  `Porta final após parseInt: ${parseInt(process.env.DB_PORT || '5432')}`,
);
logger.log('=== FIM DA VALIDAÇÃO ===');
logger.log('🔄 Tentando conectar ao banco de dados...');

// Logger para após TypeORM
const dbLogger = new Logger('TypeOrmInit');
dbLogger.log('📦 Configuração do TypeORM inicializada');

// Logger adicional para debugging
dbLogger.log('🔗 Tentando conectar ao banco de dados...');
dbLogger.log(`🏠 DB_HOST: ${process.env.DB_HOST}`);
dbLogger.log(`🔌 DB_PORT: ${process.env.DB_PORT}`);
dbLogger.log(`👤 DB_USERNAME: ${process.env.DB_USERNAME}`);
dbLogger.log(`🗄️ DB_NAME: ${process.env.DB_NAME}`);
dbLogger.log(
  `🔒 SSL: ${process.env.DB_SSL === 'true' ? 'Habilitado' : 'Desabilitado'}`,
);
dbLogger.log(`🛡️ PGSSLMODE: ${process.env.PGSSLMODE}`);
dbLogger.log(
  `🔓 NODE_TLS_REJECT_UNAUTHORIZED: ${process.env.NODE_TLS_REJECT_UNAUTHORIZED}`,
);

// Logger para rastreamento de módulos
const moduleLogger = new Logger('ModuleLoading');
moduleLogger.log('📦 Iniciando carregamento dos módulos...');

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_NAME || 'clica_sso',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: true,
      logging: true,
      retryAttempts: 10,
      retryDelay: 3000,
      autoLoadEntities: true,
      ssl:
        process.env.DB_SSL === 'true'
          ? {
              ca: process.env.DB_CA_CERTIFICATE
                ? readFileSync(process.env.DB_CA_CERTIFICATE).toString()
                : undefined,
              rejectUnauthorized: true,
            }
          : false,
    }),
    AuthModule,
    UsersModule,
    ContractsModule,
    PaymentModule,
    InvoiceModule,
    BillingModule,
    ProductsModule,
    PrivacyModule,
    EventsModule,
    TestModule,
  ],
  controllers: [AppController, HealthController],
  providers: [AppService, SeedService],
})
export class AppModule implements NestModule {
  constructor() {
    const initLogger = new Logger('AppModule');
    initLogger.log('✅ AppModule inicializado com sucesso!');
    initLogger.log('📊 Todos os módulos carregados');
  }

  configure(consumer: MiddlewareConsumer) {
    consumer.apply(JwtDebugMiddleware).forRoutes('*');
  }
}
