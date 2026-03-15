import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SeedService } from './seed.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const seedService = app.get(SeedService);

  console.log('Iniciando seed do banco de dados...');
  await seedService.seedUsers();
  console.log('Seed concluído!');

  await app.close();
}

bootstrap().catch(console.error);
