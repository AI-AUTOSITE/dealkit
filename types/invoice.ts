// types/invoice.ts

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue';

export interface Invoice {
  id: string;
  dealId?: string;
  brandId?: string;
  brandName: string;
  amount: number;
  status: InvoiceStatus;
  dueDate?: string;
  paidDate?: string;
  paidAmount: number;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceCreateInput {
  dealId?: string;
  brandId?: string;
  brandName: string;
  amount: number;
  status?: InvoiceStatus;
  dueDate?: string;
  description?: string;
}