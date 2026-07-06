export interface Opportunity {
  id: string;
  customerName: string;
  company: string;
  dealValue: number;
  expectedClosing: string;
  assignedSalesperson: string;
  priority: string;
  tags: string[];
  stageId: string;
  stage: string;
  createdDate: string;
  leadId?: string;
  closedDate?: string;
  city?: string;
  country?: string;
  team?: string;
  campaign?: string;
  source?: string;
}
