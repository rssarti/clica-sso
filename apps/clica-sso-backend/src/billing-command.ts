import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { BillingCommandService } from './billing/billing-command.service';

async function runBillingCommand() {
  console.log('🚀 Starting Billing Command...');

  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    const billingService = app.get(BillingCommandService);

    const command = process.argv[2];
    const contractId = process.argv[3];

    switch (command) {
      case 'all':
        console.log('📋 Processing all contracts for monthly billing...');
        await billingService.processMonthlyBilling();
        console.log('✅ Monthly billing process completed!');
        break;

      case 'contract':
        if (!contractId || isNaN(Number(contractId))) {
          console.error(
            '❌ Error: Contract ID is required and must be a number',
          );
          console.log('Usage: pnpm billing contract <contract_id>');
          process.exit(1);
        }
        console.log(`📋 Processing billing for contract ${contractId}...`);
        await billingService.processSpecificContract(Number(contractId));
        console.log(`✅ Billing processed for contract ${contractId}!`);
        break;

      default:
        console.log(`
📋 Billing Command Usage:

  pnpm billing all              - Process all active contracts
  pnpm billing contract <id>    - Process specific contract by ID

Examples:
  pnpm billing all
  pnpm billing contract 123

Environment Variables:
  RABBITMQ_URL    - RabbitMQ connection URL (default: amqp://localhost:5672)
  DB_HOST         - Database host
  DB_USERNAME     - Database username
  DB_PASSWORD     - Database password
  DB_NAME         - Database name
        `);
        process.exit(0);
    }

    // Aguardar um pouco para garantir que todas as mensagens foram enviadas
    await new Promise((resolve) => setTimeout(resolve, 1000));
  } catch (error) {
    console.error('❌ Billing command failed:', error);
    process.exit(1);
  } finally {
    // Fechar a aplicação adequadamente
    await app.close();
  }
}

// Executar o comando se este arquivo for executado diretamente
if (require.main === module) {
  runBillingCommand().catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
}

export { runBillingCommand };
