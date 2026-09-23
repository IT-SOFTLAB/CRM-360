export interface Lead {
  id: string;
  name: string;
  contactName?: string;
  company: string;
  email: string;
  phone: string;
  source: string;
  serviceType: string;
  category: string;
  status: string;
  assignedUser: string;
  assignedUserId?: string;
  createdDate: string;
  createdAt?: string; 
  notes?: string;
  city?: string;
  country?: string;
  team?: string;
  campaign?: string;
  dealValue?: number;
  linkedinId?: string;
}
