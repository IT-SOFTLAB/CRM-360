export interface Customer {
  id: string;
  customerName: string;
  email: string;
  company: string;
  phone: string;
  assignedSalesperson?: string;
  dealValue: number;
  opportunityId?: string;
}
