export const DEFAULT_ACTIVE_FILTERS = {
  myPipeline: false,
  unassigned: false,
  open: false,
  won: false,
  lost: false,
  category: '',
  serviceType: '',
  salesperson: '',
  team: '',
  city: '',
  country: '',
  campaign: '',
  source: '',
  createdDateStart: '',
  createdDateEnd: '',
  expectedClosingStart: '',
  expectedClosingEnd: '',
  closedDateStart: '',
  closedDateEnd: '',
  hasTags: false,
  tag: ''
};

export const DEFAULT_AUTH_FORM = {
  name: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
  company: 'Acme Corp',
  role: 'Super Admin'
};

export const DEFAULT_REFERRAL_FORM = {
  referrerId: "",
  referrerName: "",
  referrerCompany: "",

  referredLeadName: "",
  referredCompany: "",
  referredEmail: "",
  referredPhone: "",

  rewardType: "Cash",
  rewardValue: "",

  currentStageId: "",
};

export const DEFAULT_COMPANY_BRANDING = {
  name: 'Global CRM Cloud',
  primaryColor: '#2563EB',
  secondaryColor: '#0F172A',
  logoText: 'CRM 360'
};

export const OFFLINE_LEADS = [
  { id: 'l_1', name: 'Dr. Elizabeth Blackwell', company: 'Blackwell Clinic Group', email: 'eblackwell@blackwellclinic.com', phone: '+1 (555) 0211', source: 'Website', serviceType: 'Service Based', category: 'Healthcare', status: 'New', assignedUser: 'Kyle Reese', createdDate: '2026-06-12', notes: 'Interested in cloud healthcare platform.' },
  { id: 'l_2', name: 'Henry Ford II', company: 'Ford Manufacturing Labs', email: 'hford@fordmfg.com', phone: '+1 (555) 0222', source: 'Referral', serviceType: 'Product Based', category: 'Manufacturing', status: 'Contacted', assignedUser: 'Sarah Connor', createdDate: '2026-06-16', notes: 'Referred by Michael Scott. Auto IoT automation.' }
];

export const OFFLINE_OPPORTUNITIES = [
  { id: 'o_1', customerName: 'Bruce Wayne', company: 'Wayne Enterprises', dealValue: 250000, expectedClosing: '2026-07-24', assignedSalesperson: 'Sarah Connor', priority: 'High', tags: ['SaaS', 'Security'], stageId: 'p_3', stage: 'Discussion', createdDate: '2026-05-24' },
  { id: 'o_2', customerName: 'Tony Stark', company: 'Stark Industries', dealValue: 850000, expectedClosing: '2026-07-09', assignedSalesperson: 'John Doe (SA)', priority: 'High', tags: ['Enterprise', 'AI'], stageId: 'p_5', stage: 'Negotiation', createdDate: '2026-05-10' },
  { id: 'o_3', customerName: 'Clark Kent', company: 'Daily Planet Publishing', dealValue: 45000, expectedClosing: '2026-05-10', assignedSalesperson: 'Kyle Reese', priority: 'Low', tags: ['CMS', 'Cloud'], stageId: 'p_6', stage: 'Won', createdDate: '2026-04-25' }
];

export const OFFLINE_PIPELINES = [
  { id: 'p_1', name: 'New', order: 1 },
  { id: 'p_2', name: 'Possible Response Received', order: 2 },
  { id: 'p_3', name: 'Discussion', order: 3 },
  { id: 'p_4', name: 'Proposal Preparation', order: 4 },
  { id: 'p_5', name: 'Negotiation', order: 5 },
  { id: 'p_6', name: 'Won', order: 6 },
  { id: 'p_7', name: 'Lost', order: 7 }
];

export const OFFLINE_REFERRAL_PIPELINES = [
  { id: 'rp_1', name: 'Referral Submitted', order: 1 },
  { id: 'rp_2', name: 'Qualified', order: 2 },
  { id: 'rp_3', name: 'Proposal', order: 3 },
  { id: 'rp_4', name: 'Won', order: 4 },
  { id: 'rp_5', name: 'Reward Approved', order: 5 }
];

export const SERVICE_TYPES = ['Service Based', 'Product Based'];

export const OFFLINE_CATEGORIES = ['Healthcare', 'Manufacturing', 'Education', 'Real Estate', 'E-Commerce', 'Finance', 'Logistics', 'Hospitality', 'IT Services'];

export const OFFLINE_EMAILS = [
  {
    id: 'e_1', sender: 'tony@starkindustries.com', recipient: 'superadmin@crm.com', subject: 'Stark CRM Proposal Draft',
    body: 'The proposal looks great John, but we need to ensure the Recharts analytics widget can ingest 50k events per second.',
    folder: 'Inbox', date: '2026-06-23T14:32:00Z', read: false, replied: false, bounced: false, threadId: 'th_stark_1',
    history: [{ sender: 'superadmin@crm.com', body: 'Hi Tony, attached is the draft proposal. Please let me know your thoughts.', date: '2026-06-22T09:15:00Z' }]
  }
];

export const OFFLINE_QUOTATIONS = [
  { id: 'q_1', quoteNumber: 'QT-2026-001', clientName: 'Clark Kent', company: 'Daily Planet Publishing', opportunityId: 'o_3', date: '2026-04-25', status: 'Draft', taxRate: 8, discount: 2500, items: [{ description: 'Enterprise License', qty: 50, price: 800, total: 40000 }], subtotal: 40000, taxAmount: 3200, grandTotal: 40700 }
];

export const OFFLINE_REFERRALS = [
  { id: 'ref_1', referrerName: 'Clark Kent', referrerCompany: 'Daily Planet Publishing', referredLeadName: 'Lois Lane', referredCompany: 'Metropolis Gazette', dealValue: 75000, stage: 'rp_3', dateSubmitted: '2026-06-10', rewardType: 'Credits', rewardValue: '₹1,500 CRM Credits', rewardApproved: false }
];

export const OFFLINE_USERS = [
  { id: 'u_1', name: 'John Doe (SA)', email: 'superadmin@crm.com', role: 'Super Admin', company: 'Global Corp Enterprise' },
  { id: 'u_2', name: 'Sarah Connor', email: 'admin@crm.com', role: 'Admin', company: 'Global Corp Enterprise' },
  { id: 'u_3', name: 'Kyle Reese', email: 'user@crm.com', role: 'User', company: 'Global Corp Enterprise' }
];
