export interface QuotationItem {
  description: string;
  qty: number;
  price: number;
  total: number;
}

export interface Quotation {
  id: string;
  quoteNumber: string;
  clientName?: string;
  customerName?: string;
  company: string;
  opportunityId: string;
  date: string;
  status: string;
  taxRate: number;
  discount: number;
  items: QuotationItem[];
  subtotal: number;
  taxAmount: number;
  grandTotal: number;
}
