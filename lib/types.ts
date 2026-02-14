export type InvoiceStatus = "UNPAID" | "PAID" | "OVERDUE";

export interface Invoice {
  id: string;
  invoiceNumber: string;
  amount: string;
  currency: string;
  status: string;
  description: string;
  dueDate: Date;
  paymentAddress: string | null;
  paymentTxHash: string | null;
  paidAt: Date | null;
  clientName: string;
  clientEmail: string;
  clientWallet: string | null;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateInvoiceInput {
  amount: number;
  currency: string;
  description: string;
  dueDate: string;
  clientName: string;
  clientEmail: string;
  clientWallet?: string;
}

export interface InvoiceListParams {
  page?: number;
  status?: InvoiceStatus;
}

export interface PaginatedInvoices {
  invoices: Invoice[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
