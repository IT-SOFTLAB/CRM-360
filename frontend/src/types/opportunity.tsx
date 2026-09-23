export interface Opportunity {
  id: string;
  customerName: string;
  company: string;
  email?: string;
  phone?: string;
  dealValue: number;
  expectedClosing: string;
  assignedSalesperson: string;
  assignedSalespersonId?: string;
  priority?: string | number;
  tags?: string[];
  stageId: string;
  stage: string;
  createdDate: string;
  createdAt?: string;
  leadId?: string;
  closedDate?: string;
  city?: string;
  country?: string;
  team?: string;
  campaign?: string;
  source?: string;
  linkedinId?: string;
}
