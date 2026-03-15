/* eslint-disable @typescript-eslint/require-await */
import { Controller, Get } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Controller('health')
export class HealthController {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  @Get()
  async check() {
    const healthStatus = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'clica-sso-backend',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.env.npm_package_version || '1.0.0',
    };

    return healthStatus;
  }

  @Get('detailed')
  async detailedCheck() {
    const healthStatus = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'clica-sso-backend',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.env.npm_package_version || '1.0.0',
      checks: {
        database: 'unknown',
      },
    };

    // Verificar conexão com o banco
    try {
      await this.dataSource.query('SELECT 1');
      healthStatus.checks.database = 'ok';
    } catch {
      healthStatus.checks.database = 'error';
      healthStatus.status = 'degraded';
    }

    return healthStatus;
  }
}
