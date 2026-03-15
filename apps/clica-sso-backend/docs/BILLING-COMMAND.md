# Sistema de Cobrança Automática

Este documento explica como usar o sistema de cobrança automática que foi implementado no projeto.

## Visão Geral

O sistema de cobrança é composto por:

1. **Comando de Cobrança** - Busca contratos que precisam ser cobrados
2. **RabbitMQ** - Fila de mensagens para processar cobranças
3. **Consumer** - Processa as mensagens e cria payments
4. **Integração com Finance** - Gera faturas e dispara emails

## Arquitetura

```
[Comando de Cobrança] → [PostgreSQL Query] → [RabbitMQ] → [Finance Module] → [Payment Creation]
```

### Fluxo de Execução

1. O comando busca contratos ativos sem cobrança no mês atual
2. Para cada contrato, envia uma mensagem para o RabbitMQ
3. O módulo finance consome as mensagens
4. Cria payments automaticamente
5. Pode disparar emails e gerar boletos

## Como Usar

### 1. Preparação do Ambiente

Certifique-se de que o RabbitMQ está rodando:

```bash
# Subir o stack completo com Docker
docker-compose up -d

# Verificar se o RabbitMQ está funcionando
# Acessar: http://localhost:15672 (admin/admin123)
```

### 2. Executar Cobrança de Todos os Contratos

```bash
# Desenvolvimento
pnpm billing all

# Produção
pnpm billing:prod all
```

### 3. Executar Cobrança de Contrato Específico

```bash
# Desenvolvimento
pnpm billing contract 123

# Produção
pnpm billing:prod contract 123
```

### 4. Ver Ajuda

```bash
pnpm billing
```

## Configuração

### Variáveis de Ambiente

```bash
# RabbitMQ
RABBITMQ_URL=amqp://admin:admin123@localhost:5672

# Database (já configurado)
DB_HOST=localhost
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=clica_sso
```

### Kubernetes (Futuro)

Para usar no Kubernetes, você pode criar um CronJob:

```yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: billing-cron
spec:
  schedule: "0 9 * * *"  # Todo dia às 9h
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: billing
            image: clica-sso-backend:latest
            command: ["pnpm", "billing:prod", "all"]
            env:
            - name: RABBITMQ_URL
              value: "amqp://admin:admin123@rabbitmq:5672"
          restartPolicy: OnFailure
```

## Filas do RabbitMQ

### Fila Principal
- **Nome**: `billing.create_payment`
- **Tipo**: Durável
- **Mensagem**: JSON com dados do contrato

### Estrutura da Mensagem

```typescript
interface BillingMessage {
  contractId: number;
  userId: number;
  amount: number;
  dueDate: string;        // YYYY-MM-DD
  serviceType: string;
  contractName: string;
}
```

## Query de Contratos

O sistema busca contratos baseado na seguinte lógica:

```sql
SELECT c.*
FROM contracts c
INNER JOIN users u ON c.user_id = u.id
LEFT JOIN payments p ON p.contract_id = c.id 
  AND EXTRACT(YEAR FROM p.due_date) = EXTRACT(YEAR FROM CURRENT_DATE)
  AND EXTRACT(MONTH FROM p.due_date) = EXTRACT(MONTH FROM CURRENT_DATE)
  AND p.status IN ('paid', 'pending')
WHERE c.status = 'active'
  AND (c.end_date IS NULL OR c.end_date >= CURRENT_DATE)
  AND p.id IS NULL
ORDER BY c.id
```

### Critérios:
- Contratos ativos
- Sem data de fim ou não expirados
- Sem pagamento no mês atual (paid ou pending)

## Data de Vencimento

Por padrão, a cobrança vence sempre no **dia 10** do mês:
- Se executado antes do dia 10: vencimento no dia 10 do mês atual
- Se executado após o dia 10: vencimento no dia 10 do próximo mês

## Logs e Monitoramento

O sistema gera logs estruturados:

```typescript
{
  event: 'payment_created_from_billing',
  paymentId: 123,
  contractId: 456,
  userId: 789,
  amount: 99.90,
  dueDate: '2025-09-10',
  serviceType: 'clicazap'
}
```

## Tratamento de Erros

- **Erro em contrato específico**: Não interrompe o processo dos demais
- **Erro de conexão**: Para todo o processo
- **Erro no RabbitMQ**: Tenta reconectar automaticamente

## Extensões Futuras

O sistema está preparado para:

1. **Múltiplos tipos de cobrança** (mensal, anual, etc.)
2. **Diferentes datas de vencimento** por contrato
3. **Retry automático** em caso de falha
4. **Dead letter queue** para mensagens problemáticas
5. **Integração com gateways de pagamento**
6. **Envio de emails automático**
7. **Geração de boletos**

## Monitoramento no RabbitMQ

Acesse a interface web do RabbitMQ em `http://localhost:15672`:

- **Usuário**: admin
- **Senha**: admin123

Você pode monitorar:
- Número de mensagens na fila
- Taxa de processamento
- Erros de consumo
- Histórico de mensagens

## Troubleshooting

### RabbitMQ não conecta
```bash
# Verificar se está rodando
docker ps | grep rabbitmq

# Ver logs
docker logs clica_sso_rabbitmq
```

### Comando não encontra contratos
```bash
# Verificar contratos ativos no banco
docker exec -it clica_sso_db psql -U postgres -d clica_sso -c "SELECT id, name, status FROM contracts WHERE status = 'active';"
```

### Fila não processa mensagens
- Verificar se o consumer está ativo
- Verificar logs do módulo finance
- Verificar se há mensagens em erro na fila
