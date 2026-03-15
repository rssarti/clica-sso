export interface PaymentMetadata {
  gateway: string;
  transactionId?: string;
  installments?: number;
  cardLastFour?: string;
  pixCode?: string;
  subscription_id?: string;
  plan_name?: string;
}

export interface Payment {
  id: string;
  userId?: string;
  subscriptionId?: string;
  contractId?: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded' | 'cancelled' | 'processing';
  paymentMethod: 'credit_card' | 'debit_card' | 'pix' | 'bank_slip' | 'bank_transfer';
  description: string;
  dueDate?: string;
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
  invoice?: Invoice;
  payer: {
    id: string;
    name: string;
    email: string;
  };
  provider: string;
  transactionId: string;
  failureReason?: string;
  metadata: PaymentMetadata;
}

export interface Subscription {
  id: string;
  userId: string;
  planId: string;
  planName: string;
  amount: number;
  currency: string;
  status: 'active' | 'cancelled' | 'paused' | 'expired' | 'pending';
  billingCycle: 'monthly' | 'yearly' | 'weekly' | 'daily';
  startDate: string;
  endDate?: string;
  nextBillingDate?: string;
  paymentMethod: string;
  provider: string;
  subscriptionId: string;
  features: string[];
  cancellationReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Invoice {
  id: string;
  paymentId?: string;
  userId?: string;
  number: string;
  series: string;
  issueDate: string;
  dueDate: string;
  paidAt?: string;
  status: 'draft' | 'issued' | 'paid' | 'cancelled' | 'overdue';
  amount: number;
  currency: string;
  taxes: {
    type: string;
    rate: number;
    amount: number;
  }[];
  totalAmount: number;
  description?: string;
  payer: {
    name: string;
    document: string;
    email: string;
    address: InvoiceAddress;
  };
  issuer: {
    name: string;
    document: string;
    email: string;
    address: InvoiceAddress;
    logo?: string;
  };
  items: InvoiceItem[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceAddress {
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  taxRate?: number;
  taxAmount?: number;
}

export interface PaymentFilter {
  status?: Payment['status'][];
  paymentMethod?: Payment['paymentMethod'][];
  dateFrom?: string;
  dateTo?: string;
  amountMin?: number;
  amountMax?: number;
}

export interface SubscriptionFilter {
  status?: Subscription['status'][];
  planId?: string[];
  productId?: string[];
}

export interface BillingStats {
  totalRevenue: number;
  monthlyRevenue: number;
  totalSubscriptions: number;
  activeSubscriptions: number;
  pendingPayments: number;
  overdueInvoices: number;
  revenueGrowth: number;
  subscriptionGrowth: number;
}
