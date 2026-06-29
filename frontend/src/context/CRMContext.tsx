"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

const API_BASE = 'http://localhost:5000/api';

export interface CRMContextType {
  mounted: boolean;
  user: any;
  setUser: React.Dispatch<React.SetStateAction<any>>;
  authMode: 'login' | 'register';
  setAuthMode: React.Dispatch<React.SetStateAction<'login' | 'register'>>;
  authForm: any;
  setAuthForm: React.Dispatch<React.SetStateAction<any>>;
  leads: any[];
  setLeads: React.Dispatch<React.SetStateAction<any[]>>;
  opportunities: any[];
  setOpportunities: React.Dispatch<React.SetStateAction<any[]>>;
  pipelines: any[];
  setPipelines: React.Dispatch<React.SetStateAction<any[]>>;
  referralPipelines: any[];
  setReferralPipelines: React.Dispatch<React.SetStateAction<any[]>>;
  activities: any[];
  setActivities: React.Dispatch<React.SetStateAction<any[]>>;
  emails: any[];
  setEmails: React.Dispatch<React.SetStateAction<any[]>>;
  quotations: any[];
  setQuotations: React.Dispatch<React.SetStateAction<any[]>>;
  referrals: any[];
  setReferrals: React.Dispatch<React.SetStateAction<any[]>>;
  referralForm: any;
  setReferralForm: React.Dispatch<React.SetStateAction<any>>;
  categories: string[];
  setCategories: React.Dispatch<React.SetStateAction<string[]>>;
  serviceTypes: string[];
  auditLogs: any[];
  setAuditLogs: React.Dispatch<React.SetStateAction<any[]>>;
  companyBranding: any;
  setCompanyBranding: React.Dispatch<React.SetStateAction<any>>;
  theme: string;
  setTheme: React.Dispatch<React.SetStateAction<string>>;
  toasts: any[];
  setToasts: React.Dispatch<React.SetStateAction<any[]>>;
  searchQuery: string;
  setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
  activeFilters: any;
  setActiveFilters: React.Dispatch<React.SetStateAction<any>>;
  customFilters: string[];
  setCustomFilters: React.Dispatch<React.SetStateAction<string[]>>;
  customFilterName: string;
  setCustomFilterName: React.Dispatch<React.SetStateAction<string>>;
  showFilterDrawer: boolean;
  setShowFilterDrawer: React.Dispatch<React.SetStateAction<boolean>>;
  showLeadCreateModal: boolean;
  setShowLeadCreateModal: React.Dispatch<React.SetStateAction<boolean>>;
  showStageModal: boolean;
  setShowStageModal: React.Dispatch<React.SetStateAction<boolean>>;
  showActivityModal: boolean;
  setShowActivityModal: React.Dispatch<React.SetStateAction<boolean>>;
  showQuoteModal: boolean;
  setShowQuoteModal: React.Dispatch<React.SetStateAction<boolean>>;
  showReferralModal: boolean;
  setShowReferralModal: React.Dispatch<React.SetStateAction<boolean>>;
  settingsUsers: any[];
  setSettingsUsers: React.Dispatch<React.SetStateAction<any[]>>;

  // Actions
  apiCall: (path: string, method?: string, body?: any) => Promise<any>;
  loadCRMData: () => Promise<void>;
  addToast: (type: 'success' | 'error' | 'info', message: string) => void;
  handleAuthSubmit: (e: React.FormEvent) => Promise<void>;
  handleLogout: () => void;
  selectQuickAccount: (email: string) => void;
  handleCreateLeadFromView: (leadForm: any) => Promise<void>;
  handleUpdateLeadFromView: (leadId: string, leadData: any) => Promise<void>;
  handleDeleteLeadFromView: (leadId: string) => Promise<void>;
  handleConvertLeadFromView: (
  leadId: string,
  dealValue: string
) => Promise<void>;
  handleMoveOpportunity: (oppId: string, stageId: string) => Promise<void>;
  handleAddStage: (stageName: string) => Promise<void>;
  handleStageReorder: (stageId: string, direction: 'left' | 'right') => Promise<void>;
  handleStageDelete: (stageId: string) => Promise<void>;
  handleActivityCreate: (activityForm: any) => Promise<void>;
  toggleActivityDone: (activityId: string, currentStatus: boolean) => Promise<void>;
  handleSendEmail: (replyText: string, emailObject: any) => Promise<void>;
  handleQuotationCreate: (quoteForm: any) => Promise<void>;
  updateQuoteStatus: (quoteId: string, status: string) => Promise<void>;
  handleReferralCreate: (referralForm: any) => Promise<void>;
  handleApproveReward: (refId: string) => Promise<void>;
  handleAddCategory: (catName: string) => Promise<void>;
  handleDeleteCategory: (catName: string) => Promise<void>;
  handleBrandingSave: (e: React.FormEvent) => Promise<void>;
  handleDeleteUser: (id: string) => Promise<void>;
  applyFilters: (data: any[], type: 'leads' | 'opportunities' | 'emails') => any[];
  handleSaveCustomFilter: () => void;
  clearAllFilters: () => void;
  toggleTheme: () => void;
}

const CRMContext = createContext<CRMContextType | undefined>(undefined);

export const CRMProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState('light');
  const [searchQuery, setSearchQuery] = useState('');
  const [toasts, setToasts] = useState<any[]>([]);

 
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);
  const [activeFilters, setActiveFilters] = useState<any>({
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
    closedDateEnd: ''
  });
  const [customFilters, setCustomFilters] = useState<string[]>([]);
  const [customFilterName, setCustomFilterName] = useState('');

  // Authentication State
  const [user, setUser] = useState<any>(null);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authForm, setAuthForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    company: 'Acme Corp',
    role: 'Super Admin'
  });

  // CRM Data States
  const [leads, setLeads] = useState<any[]>([]);
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [pipelines, setPipelines] = useState<any[]>([]);
  const [referralPipelines, setReferralPipelines] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [emails, setEmails] = useState<any[]>([]);
  const [quotations, setQuotations] = useState<any[]>([]);
  const [referrals, setReferrals] = useState<any[]>([]);
  const [referralForm, setReferralForm] = useState<any>({
    referrerName: '', referrerCompany: '', referredLeadName: '', referredCompany: '',
    dealValue: '10000', rewardType: 'Credits', rewardValue: '₹1,000 Credits'
  });
  const [categories, setCategories] = useState<string[]>([]);
  const [serviceTypes] = useState<string[]>(['Service Based', 'Product Based']);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [companyBranding, setCompanyBranding] = useState({
    name: 'Global CRM Cloud',
    primaryColor: '#2563EB',
    secondaryColor: '#0F172A',
    logoText: 'CRM 360'
  });

  // UI Detail States (Modals, drawers, and creation forms)
  const [showLeadCreateModal, setShowLeadCreateModal] = useState(false);
  const [showStageModal, setShowStageModal] = useState(false);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [showReferralModal, setShowReferralModal] = useState(false);

  // Settings states
  const [settingsUsers, setSettingsUsers] = useState<any[]>([]);

  // Notifications
  const addToast = (type: 'success' | 'error' | 'info', message: string) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  // Helper: Fetch from Express API with fallback
  const apiCall = async (path: string, method = 'GET', body: any = null) => {
    try {
      const headers: any = { 'Content-Type': 'application/json' };
      const config: any = { method, headers };
      if (body) config.body = JSON.stringify(body);
      const res = await fetch(`${API_BASE}${path}`, config);
      if (!res.ok) throw new Error(`API error ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn(`Express API offline (${path} - ${method}). Operating in local state fallback mode.`);
      return null;
    }
  };

  const loadCRMData = async () => {
    const apiLeads = await apiCall('/leads');
    const apiOpps = await apiCall('/opportunities');
    const apiPipelines = await apiCall('/pipelines');
    const apiActivities = await apiCall('/activities');
    const apiEmails = await apiCall('/emails');
    const apiQuotes = await apiCall('/quotations');
    const apiReferrals = await apiCall('/referrals');
    const apiCategories = await apiCall('/categories');
    const apiUsers = await apiCall('/users');
    const apiRefPipelines = await apiCall('/referral-pipelines');
    const apiBranding = await apiCall('/settings/branding');
    const apiLogs = await apiCall('/settings/logs');

    if (apiLeads) setLeads(apiLeads);
    if (apiOpps) setOpportunities(apiOpps);
    if (apiPipelines) setPipelines(apiPipelines);
    if (apiRefPipelines) setReferralPipelines(apiRefPipelines);
    if (apiActivities) setActivities(apiActivities);
    if (apiEmails) setEmails(apiEmails);
    if (apiQuotes) setQuotations(apiQuotes);
    if (apiReferrals) setReferrals(apiReferrals);
    if (apiCategories) setCategories(apiCategories);
    if (apiUsers) setSettingsUsers(apiUsers);
    if (apiBranding) setCompanyBranding(apiBranding);
    if (apiLogs) setAuditLogs(apiLogs);

    // Seed offline state if backend is completely empty or down
    if (!apiLeads && leads.length === 0) {
      setLeads([
        { id: 'l_1', name: 'Dr. Elizabeth Blackwell', company: 'Blackwell Clinic Group', email: 'eblackwell@blackwellclinic.com', phone: '+1 (555) 0211', source: 'Website', serviceType: 'Service Based', category: 'Healthcare', status: 'New', assignedUser: 'Kyle Reese', createdDate: '2026-06-12', notes: 'Interested in cloud healthcare platform.' },
        { id: 'l_2', name: 'Henry Ford II', company: 'Ford Manufacturing Labs', email: 'hford@fordmfg.com', phone: '+1 (555) 0222', source: 'Referral', serviceType: 'Product Based', category: 'Manufacturing', status: 'Contacted', assignedUser: 'Sarah Connor', createdDate: '2026-06-16', notes: 'Referred by Michael Scott. Auto IoT automation.' }
      ]);
      setOpportunities([
        { id: 'o_1', customerName: 'Bruce Wayne', company: 'Wayne Enterprises', dealValue: 250000, expectedClosing: '2026-07-24', assignedSalesperson: 'Sarah Connor', priority: 'High', tags: ['SaaS', 'Security'], stageId: 'p_3', createdDate: '2026-05-24' },
        { id: 'o_2', customerName: 'Tony Stark', company: 'Stark Industries', dealValue: 850000, expectedClosing: '2026-07-09', assignedSalesperson: 'John Doe (SA)', priority: 'High', tags: ['Enterprise', 'AI'], stageId: 'p_5', createdDate: '2026-05-10' },
        { id: 'o_3', customerName: 'Clark Kent', company: 'Daily Planet Publishing', dealValue: 45000, expectedClosing: '2026-05-10', assignedSalesperson: 'Kyle Reese', priority: 'Low', tags: ['CMS', 'Cloud'], stageId: 'p_6', createdDate: '2026-04-25' }
      ]);
      setPipelines([
        { id: 'p_1', name: 'New', order: 1 },
        { id: 'p_2', name: 'Possible Response Received', order: 2 },
        { id: 'p_3', name: 'Discussion', order: 3 },
        { id: 'p_4', name: 'Proposal Preparation', order: 4 },
        { id: 'p_5', name: 'Negotiation', order: 5 },
        { id: 'p_6', name: 'Won', order: 6 },
        { id: 'p_7', name: 'Lost', order: 7 }
      ]);
      setReferralPipelines([
        { id: 'rp_1', name: 'Referral Submitted', order: 1 },
        { id: 'rp_2', name: 'Qualified', order: 2 },
        { id: 'rp_3', name: 'Proposal', order: 3 },
        { id: 'rp_4', name: 'Won', order: 4 },
        { id: 'rp_5', name: 'Reward Approved', order: 5 }
      ]);
      setCategories(['Healthcare', 'Manufacturing', 'Education', 'Real Estate', 'E-Commerce', 'Finance', 'Logistics', 'Hospitality', 'IT Services']);
      // setActivities([
      //   { id: 'a_1', title: 'Stark proposal alignment', type: 'Meeting', date: '2026-06-25', time: '14:00', duration: '60', description: 'Align deal parameters.', salesperson: 'John Doe (SA)', done: false, opportunityId: 'o_2' },
      //   { id: 'a_2', title: 'Call Bruce Wayne', type: 'Call', date: '2026-06-26', time: '10:00', duration: '15', description: 'Schedule security demo.', salesperson: 'Sarah Connor', done: false, opportunityId: 'o_1' }
      // ]);
      setEmails([
        {
          id: 'e_1', sender: 'tony@starkindustries.com', recipient: 'superadmin@crm.com', subject: 'Stark CRM Proposal Draft',
          body: 'The proposal looks great John, but we need to ensure the Recharts analytics widget can ingest 50k events per second.',
          folder: 'Inbox', date: '2026-06-23T14:32:00Z', read: false, replied: false, bounced: false, threadId: 'th_stark_1',
          history: [{ sender: 'superadmin@crm.com', body: 'Hi Tony, attached is the draft proposal. Please let me know your thoughts.', date: '2026-06-22T09:15:00Z' }]
        }
      ]);
      setQuotations([
        { id: 'q_1', quoteNumber: 'QT-2026-001', clientName: 'Clark Kent', company: 'Daily Planet Publishing', opportunityId: 'o_3', date: '2026-04-25', status: 'Approved', taxRate: 8, discount: 2500, items: [{ description: 'Enterprise License', qty: 50, price: 800, total: 40000 }], subtotal: 40000, taxAmount: 3200, grandTotal: 40700 }
      ]);
      setReferrals([
        { id: 'ref_1', referrerName: 'Clark Kent', referrerCompany: 'Daily Planet Publishing', referredLeadName: 'Lois Lane', referredCompany: 'Metropolis Gazette', dealValue: 75000, stage: 'rp_3', dateSubmitted: '2026-06-10', rewardType: 'Credits', rewardValue: '₹1,500 CRM Credits', rewardApproved: false }
      ]);
      setAuditLogs([
        { id: 'log_offline_init', timestamp: new Date().toISOString(), user: 'System', role: 'System', action: 'INIT_OFFLINE', module: 'Database', details: 'Express offline. Seeded local mock state.' }
      ]);
    }
  };

  // Auth check and Theme initialization
  useEffect(() => {
    setMounted(true);
    const savedUser = localStorage.getItem('crm_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    const savedTheme = localStorage.getItem('crm_theme') || 'light';
    setTheme(savedTheme);
    if (savedTheme === 'dark') {
      document.body.classList.add('dark-theme');
      document.documentElement.classList.add('dark');
    } else {
      document.body.classList.remove('dark-theme');
      document.documentElement.classList.remove('dark');
    }
    loadCRMData();
  }, []);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (authMode === 'login') {
      const res = await apiCall('/auth/login', 'POST', { email: authForm.email, password: authForm.password });
      if (res && res.user) {
        setUser(res.user);
        localStorage.setItem('crm_user', JSON.stringify(res.user));
        addToast('success', `Welcome back, ${res.user.name}!`);
        loadCRMData();
      } else {
        const offlineUsers = [
          { id: 'u_1', name: 'John Doe (SA)', email: 'superadmin@crm.com', role: 'Super Admin', company: 'Global Corp Enterprise' },
          { id: 'u_2', name: 'Sarah Connor', email: 'admin@crm.com', role: 'Admin', company: 'Global Corp Enterprise' },
          { id: 'u_3', name: 'Kyle Reese', email: 'user@crm.com', role: 'User', company: 'Global Corp Enterprise' }
        ];
        const match = offlineUsers.find(u => u.email === authForm.email);
        if (match) {
          setUser(match);
          localStorage.setItem('crm_user', JSON.stringify(match));
          addToast('success', `Logged in offline as ${match.name} (${match.role})`);
          loadCRMData();
        } else {
          addToast('error', 'Invalid email or password');
        }
      }
    } else {
      if (authForm.password !== authForm.confirmPassword) {
        addToast('error', 'Passwords do not match');
        return;
      }
      const res = await apiCall('/auth/register', 'POST', {
        name: authForm.name, email: authForm.email, phone: authForm.phone,
        password: authForm.password, company: authForm.company, role: authForm.role
      });
      if (res && res.user) {
        setUser(res.user);
        localStorage.setItem('crm_user', JSON.stringify(res.user));
        addToast('success', `Account created successfully! Welcome, ${res.user.name}`);
        loadCRMData();
      } else {
        const mockNewUser = {
          id: 'u_' + Date.now(), name: authForm.name, email: authForm.email,
          role: authForm.role, company: authForm.company
        };
        setUser(mockNewUser);
        localStorage.setItem('crm_user', JSON.stringify(mockNewUser));
        addToast('success', `Registered offline as ${mockNewUser.name}`);
        loadCRMData();
      }
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('crm_user');
    addToast('info', 'Logged out successfully');
  };

  const selectQuickAccount = (email: string) => {
    setAuthForm(prev => ({ ...prev, email, password: 'password' }));
  };

  const handleCreateLeadFromView = async (leadForm: any) => {
    const res = await apiCall('/leads', 'POST', leadForm);
    if (res) {
      setLeads(prev => [...prev, res]);
      addToast('success', `Lead for ${res.name} created!`);
    } else {
      const mockLead = {
        id: 'l_' + Date.now(), createdDate: new Date().toISOString().split('T')[0], status: 'New', ...leadForm
      };
      setLeads(prev => [...prev, mockLead]);
      addToast('success', `Lead for ${mockLead.name} created (Offline Mode)`);
    }
    setShowLeadCreateModal(false);
    loadCRMData();
  };

  const handleUpdateLeadFromView = async (leadId: string, leadData: any) => {
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, ...leadData } : l));
    await apiCall(`/leads/${leadId}`, 'PUT', leadData);
  };

  const handleDeleteLeadFromView = async (leadId: string) => {
    const res = await apiCall(`/leads/${leadId}`, 'DELETE');
    if (res) {
      addToast('success', 'Lead deleted');
      loadCRMData();
    } else {
      setLeads(prev => prev.filter(l => l.id !== leadId));
      addToast('success', 'Lead deleted (Offline)');
    }
  };

  const handleConvertLeadFromView = async (leadId: string, dealValue: string) => {
    const leadObj = leads.find(l => l.id === leadId);

const salesperson = leadObj?.assignedUser || user?.name || 'Unassigned';

const res = await apiCall(
  `/leads/${leadId}/convert`,
  'POST',
  {
    dealValue,
    salesperson
  }
);
    if (res) {
      addToast('success', 'Converted lead to Opportunity!');
      loadCRMData();
    } else {
      const leadObj = leads.find(l => l.id === leadId);
      if (leadObj) {
        const sortedPipes = [...pipelines].sort((a, b) => a.order - b.order);
        const newStage = pipelines.find(p => p.name.toLowerCase() === 'new') || sortedPipes[0];
        const stageId = newStage ? newStage.id : 'p_1';

        const mockOpp = {
          id: 'o_' + Date.now(),
          leadId: leadId,
          customerName: leadObj.contactName || leadObj.name || 'Unknown',
          company: leadObj.company,
          dealValue: Number(dealValue) || 10000,
          expectedClosing: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          assignedSalesperson: salesperson,
          priority: 'Medium',
          tags: [leadObj.source, leadObj.category],
          stageId: stageId,
          createdDate: new Date().toISOString().split('T')[0]
        };
        setOpportunities(prev => [...prev, mockOpp]);
        setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: newStage ? newStage.name : 'New' } : l));
        addToast('success', 'Converted lead to Opportunity (Offline Mode)');
      }
    }
  };

  const handleAddStage = async (stageName: string) => {
    if (user?.role !== 'Super Admin') return addToast('error', 'Only Super Admin can edit pipelines');
    const res = await apiCall('/pipelines', 'POST', { name: stageName });
    if (res) {
      setPipelines(prev => [...prev, res].sort((a, b) => a.order - b.order));
      addToast('success', `Created stage: ${stageName}`);
    } else {
      const mockStage = { id: 'p_' + Date.now(), name: stageName, order: pipelines.length + 1 };
      setPipelines(prev => [...prev, mockStage]);
      addToast('success', `Created stage: ${stageName} (Offline)`);
    }
    loadCRMData();
  };

  const handleStageReorder = async (stageId: string, direction: 'left' | 'right') => {
    if (user?.role !== 'Super Admin') return addToast('error', 'Only Super Admin can manage pipelines');
    const stageIdx = pipelines.findIndex(p => p.id === stageId);
    if (stageIdx === -1) return;
    const targetIdx = direction === 'left' ? stageIdx - 1 : stageIdx + 1;
    if (targetIdx < 0 || targetIdx >= pipelines.length) return;

    const updated = [...pipelines];
    const temp = updated[stageIdx].order;
    updated[stageIdx].order = updated[targetIdx].order;
    updated[targetIdx].order = temp;

    const res = await apiCall('/pipelines/reorder', 'POST', {
      stages: updated.map(p => ({ id: p.id, order: p.order }))
    });
    if (res) {
      setPipelines(res);
    } else {
      setPipelines(updated.sort((a, b) => a.order - b.order));
      addToast('success', 'Reordered stages (Offline)');
    }
  };

  const handleStageDelete = async (stageId: string) => {
    if (user?.role !== 'Super Admin') return addToast('error', 'Only Super Admin can manage pipelines');
    const res = await apiCall(`/pipelines/${stageId}`, 'DELETE');
    if (res) {
      addToast('success', 'Stage deleted successfully');
      loadCRMData();
    } else {
      const stage = pipelines.find(p => p.id === stageId);
      if (stage) {
        setPipelines(prev => prev.filter(p => p.id !== stageId));
        const fallback = pipelines[0]?.id || '';
        setOpportunities(prev => prev.map(o => o.stageId === stageId ? { ...o, stageId: fallback } : o));
        addToast('success', `Deleted stage ${stage.name} (Offline)`);
      }
    }
  };

  const handleMoveOpportunity = async (oppId: string, stageId: string) => {
    const opp = opportunities.find(o => o.id === oppId);
    if (!opp) return;

    const updatedOpps = opportunities.map(o => o.id === oppId ? { ...o, stageId } : o);
    setOpportunities(updatedOpps);

    const res = await apiCall(`/opportunities/${oppId}`, 'PUT', { stageId });
    if (res) {
      addToast('success', `Opportunity moved to stage`);
      loadCRMData();
    } else {
      // Find pipeline stage name and sync lead status offline
      const stage = pipelines.find(p => p.id === stageId);
      if (stage) {
        const stageName = stage.name;
        setLeads(prev => prev.map(l => {
          const isMatch = opp.leadId ? (l.id === opp.leadId) : ((l.name === opp.customerName || l.contactName === opp.customerName) && l.company === opp.company);
          if (isMatch) {
            return { ...l, status: stageName };
          }
          return l;
        }));
      }

      if (stageId === 'p_6') {
        const already = referrals.some(r => r.referrerName === opp.customerName);
        if (!already) {
          const newRef = {
            id: 'ref_' + Date.now(), referrerName: opp.customerName, referrerCompany: opp.company,
            referredLeadName: 'Pending referral', referredCompany: 'Pending Company Corp', dealValue: 0,
            stage: 'rp_1', dateSubmitted: new Date().toISOString().split('T')[0], rewardType: 'Credits',
            rewardValue: '₹1,000 Credits', rewardApproved: false
          };
          setReferrals(prev => [...prev, newRef]);
          addToast('success', `${opp.customerName} enrolled in Referral Program!`);
        }
      }
      addToast('success', 'Opportunity moved (Offline Mode)');
    }
  };

  const handleActivityCreate = async (activityForm: any) => {
  try {
    await apiCall("/activities", "POST", activityForm);

    await loadCRMData();

    addToast("success", "Activity scheduled!");

    setShowActivityModal(false);

  } catch (err) {

    addToast("error", "Unable to schedule activity.");

  }
};

  const toggleActivityDone = async (
  activityId: string,
  currentStatus: boolean
) => {

  try {

    await apiCall(`/activities/${activityId}`, "PUT", {
      done: !currentStatus
    });

    await loadCRMData();

    addToast("success", "Activity updated");

  } catch {

    addToast("error", "Unable to update activity");

  }

};

  const handleSendEmail = async (replyText: string, emailObject: any) => {
    const payload = {
      sender: user?.email || 'superadmin@crm.com',
      recipient: emailObject.sender,
      subject: `Re: ${emailObject.subject}`,
      body: replyText,
      folder: 'Sent',
      threadId: emailObject.threadId,
      history: [
        { sender: emailObject.sender, body: emailObject.body, date: emailObject.date },
        ...emailObject.history
      ]
    };

    const res = await apiCall('/emails', 'POST', payload);
    if (res) {
      addToast('success', 'Reply sent via Outlook!');
      loadCRMData();
    } else {
      const mockEmail = {
        id: 'e_' + Date.now(), date: new Date().toISOString(), read: true, replied: true, bounced: false, ...payload
      };
      setEmails(prev => [mockEmail, ...prev]);
      addToast('success', 'Reply sent (Offline Simulated)');
    }
  };

  const handleQuotationCreate = async (quoteForm: any) => {
    const subtotal = quoteForm.items.reduce((sum: number, item: any) => sum + (Number(item.qty) * Number(item.price)), 0);
    const taxAmount = Math.round(subtotal * (Number(quoteForm.taxRate) / 100));
    const grandTotal = subtotal + taxAmount - Number(quoteForm.discount);

    const payload = {
      clientName: quoteForm.clientName,
      company: quoteForm.company,
      opportunityId: quoteForm.opportunityId,
      taxRate: Number(quoteForm.taxRate),
      discount: Number(quoteForm.discount),
      items: quoteForm.items
    };

    const res = await apiCall('/quotations', 'POST', payload);
    if (res) {
      setQuotations(prev => [...prev, res]);
      addToast('success', 'Quotation draft created');
    } else {
      const mockQuote = {
        id: 'q_' + Date.now(),
        quoteNumber: `QT-2026-0${quotations.length + 1}`,
        date: new Date().toISOString().split('T')[0],
        status: 'Draft',
        subtotal,
        taxAmount,
        grandTotal,
        ...payload
      };
      setQuotations(prev => [...prev, mockQuote]);
      addToast('success', 'Quotation draft created (Offline)');
    }
    setShowQuoteModal(false);
  };

  const updateQuoteStatus = async (quoteId: string, status: string) => {
    const res = await apiCall(`/quotations/${quoteId}`, 'PUT', { status });
    if (res) {
      addToast('success', `Quotation status updated to ${status}`);
      loadCRMData();
    } else {
      setQuotations(prev => prev.map(q => q.id === quoteId ? { ...q, status } : q));
      addToast('success', `Quotation status updated (Offline)`);
    }
  };

  const handleReferralCreate = async (referralForm: any) => {
    const res = await apiCall('/referrals', 'POST', referralForm);
    if (res) {
      setReferrals(prev => [...prev, res]);
      addToast('success', 'Referral submitted!');
    } else {
      const mockRef = {
        id: 'ref_' + Date.now(), dateSubmitted: new Date().toISOString().split('T')[0], stage: 'rp_1', rewardApproved: false, ...referralForm
      };
      setReferrals(prev => [...prev, mockRef]);
      addToast('success', 'Referral submitted (Offline)');
    }
    setShowReferralModal(false);
  };

  const handleApproveReward = async (refId: string) => {
    if (user?.role !== 'Super Admin') return addToast('error', 'Only Super Admin can approve referral rewards');
    const res = await apiCall(`/referrals/${refId}`, 'PUT', { rewardApproved: true, stage: 'rp_5' });
    if (res) {
      addToast('success', 'Referral Reward Approved!');
      loadCRMData();
    } else {
      setReferrals(prev => prev.map(r => r.id === refId ? { ...r, rewardApproved: true, stage: 'rp_5' } : r));
      addToast('success', 'Referral Reward Approved (Offline)');
    }
  };

  const handleAddCategory = async (catName: string) => {
    const res = await apiCall('/categories', 'POST', { category: catName });
    if (res) {
      setCategories(res);
      addToast('success', `Category "${catName}" added`);
    } else {
      if (!categories.includes(catName)) {
        setCategories(prev => [...prev, catName]);
        addToast('success', `Category "${catName}" added (Offline)`);
      }
    }
  };

  const handleDeleteCategory = async (catName: string) => {
    const res = await apiCall(`/categories/${catName}`, 'DELETE');
    if (res) {
      setCategories(res);
      addToast('success', `Category "${catName}" deleted`);
    } else {
      setCategories(prev => prev.filter(c => c !== catName));
      addToast('success', `Category "${catName}" deleted (Offline)`);
    }
  };

  const handleBrandingSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (user?.role !== 'Super Admin') return addToast('error', 'Only Super Admin can modify branding');
    const res = await apiCall('/settings/branding', 'PUT', companyBranding);
    if (res) {
      addToast('success', 'Company branding updated!');
    } else {
      addToast('success', 'Company branding updated locally');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (user?.role !== 'Super Admin') return addToast('error', 'Only Super Admin can delete users');
    if (userId === user?.id) return addToast('error', 'Cannot delete your own active session!');
    const res = await apiCall(`/users/${userId}`, 'DELETE');
    if (res) {
      setSettingsUsers(prev => prev.filter(u => u.id !== userId));
      addToast('success', 'User account deactivated and deleted');
    } else {
      setSettingsUsers(prev => prev.filter(u => u.id !== userId));
      addToast('success', 'User deleted (Offline)');
    }
  };

  const applyFilters = (data: any[], type: 'leads' | 'opportunities' | 'emails') => {
    let filtered = [...data];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(item => {
        if (type === 'leads') {
          return item.contactName.toLowerCase().includes(q) || item.company.toLowerCase().includes(q) || item.email.toLowerCase().includes(q);
        } else if (type === 'opportunities') {
          return item.customerName.toLowerCase().includes(q) || item.company.toLowerCase().includes(q) || item.priority.toLowerCase().includes(q);
        } else if (type === 'emails') {
          return item.subject.toLowerCase().includes(q) || item.sender.toLowerCase().includes(q) || item.body.toLowerCase().includes(q);
        }
        return false;
      });
    }

    if (activeFilters.myPipeline && user) {
      if (type === 'leads') {
        filtered = filtered.filter(l => l.assignedUser === user?.name);
      } else if (type === 'opportunities') {
        filtered = filtered.filter(o => o.assignedSalesperson === user?.name);
      }
    }
    if (activeFilters.unassigned) {
      if (type === 'leads') {
        filtered = filtered.filter(l => !l.assignedUser || l.assignedUser === 'Unassigned');
      } else if (type === 'opportunities') {
        filtered = filtered.filter(o => !o.assignedSalesperson || o.assignedSalesperson === 'Unassigned');
      }
    }
    if (activeFilters.open) {
      if (type === 'opportunities') {
        filtered = filtered.filter(o => o.stageId !== 'p_6' && o.stageId !== 'p_7');
      }
    }
    if (activeFilters.won) {
      if (type === 'opportunities') {
        filtered = filtered.filter(o => o.stageId === 'p_6');
      }
    }
    if (activeFilters.lost) {
      if (type === 'opportunities') {
        filtered = filtered.filter(o => o.stageId === 'p_7');
      }
    }
    if (activeFilters.category) {
      if (type === 'leads') {
        filtered = filtered.filter(l => l.category === activeFilters.category);
      } else if (type === 'opportunities') {
        filtered = filtered.filter(o => o.tags.includes(activeFilters.category));
      }
    }
    if (activeFilters.serviceType) {
      if (type === 'leads') {
        filtered = filtered.filter(l => l.serviceType === activeFilters.serviceType);
      }
    }
    if (activeFilters.salesperson) {
      if (type === 'leads') {
        filtered = filtered.filter(l => l.assignedUser === activeFilters.salesperson);
      } else if (type === 'opportunities') {
        filtered = filtered.filter(o => o.assignedSalesperson === activeFilters.salesperson);
      }
    }
    if (activeFilters.team) {
      if (type === 'leads' || type === 'opportunities') {
        filtered = filtered.filter(x => x.team === activeFilters.team);
      }
    }
    if (activeFilters.city) {
      if (type === 'leads' || type === 'opportunities') {
        filtered = filtered.filter(x => x.city?.toLowerCase().includes(activeFilters.city.toLowerCase()));
      }
    }
    if (activeFilters.country) {
      if (type === 'leads' || type === 'opportunities') {
        filtered = filtered.filter(x => x.country?.toLowerCase().includes(activeFilters.country.toLowerCase()));
      }
    }
    if (activeFilters.campaign) {
      if (type === 'leads' || type === 'opportunities') {
        filtered = filtered.filter(x => x.campaign === activeFilters.campaign);
      }
    }
    if (activeFilters.source) {
      if (type === 'leads') {
        filtered = filtered.filter(l => l.source === activeFilters.source);
      } else if (type === 'opportunities') {
        filtered = filtered.filter(o => o.source === activeFilters.source || o.tags.includes(activeFilters.source));
      }
    }
    // Date Limit Filters
    if (activeFilters.createdDateStart) {
      filtered = filtered.filter(x => x.createdDate && x.createdDate >= activeFilters.createdDateStart);
    }
    if (activeFilters.createdDateEnd) {
      filtered = filtered.filter(x => x.createdDate && x.createdDate <= activeFilters.createdDateEnd);
    }
    if (activeFilters.expectedClosingStart) {
      if (type === 'opportunities') {
        filtered = filtered.filter(o => o.expectedClosing && o.expectedClosing >= activeFilters.expectedClosingStart);
      }
    }
    if (activeFilters.expectedClosingEnd) {
      if (type === 'opportunities') {
        filtered = filtered.filter(o => o.expectedClosing && o.expectedClosing <= activeFilters.expectedClosingEnd);
      }
    }
    if (activeFilters.closedDateStart) {
      if (type === 'opportunities') {
        filtered = filtered.filter(o => o.closedDate && o.closedDate >= activeFilters.closedDateStart);
      }
    }
    if (activeFilters.closedDateEnd) {
      if (type === 'opportunities') {
        filtered = filtered.filter(o => o.closedDate && o.closedDate <= activeFilters.closedDateEnd);
      }
    }

    return filtered;
  };

  const handleSaveCustomFilter = () => {
    if (!customFilterName) return;
    setCustomFilters(prev => [...prev, customFilterName]);
    addToast('success', `Saved custom filter: ${customFilterName}`);
    setCustomFilterName('');
  };

  const clearAllFilters = () => {
    setActiveFilters({
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
      closedDateEnd: ''
    });
    setSearchQuery('');
    addToast('info', 'Filters cleared');
  };

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    localStorage.setItem('crm_theme', nextTheme);
    if (nextTheme === 'dark') {
      document.body.classList.add('dark-theme');
      document.documentElement.classList.add('dark');
    } else {
      document.body.classList.remove('dark-theme');
      document.documentElement.classList.remove('dark');
    }
    addToast('info', `Switched to ${nextTheme} mode`);
  };

  return (
    <CRMContext.Provider value={{
      mounted,
      user,
      setUser,
      authMode,
      setAuthMode,
      authForm,
      setAuthForm,
      leads,
      setLeads,
      opportunities,
      setOpportunities,
      pipelines,
      setPipelines,
      referralPipelines,
      setReferralPipelines,
      activities,
      setActivities,
      emails,
      setEmails,
      quotations,
      setQuotations,
      referrals,
      setReferrals,
      referralForm,
      setReferralForm,
      categories,
      setCategories,
      serviceTypes,
      auditLogs,
      setAuditLogs,
      companyBranding,
      setCompanyBranding,
      theme,
      setTheme,
      toasts,
      setToasts,
      searchQuery,
      setSearchQuery,
      activeFilters,
      setActiveFilters,
      customFilters,
      setCustomFilters,
      customFilterName,
      setCustomFilterName,
      showFilterDrawer,
      setShowFilterDrawer,
      showLeadCreateModal,
      setShowLeadCreateModal,
      showStageModal,
      setShowStageModal,
      showActivityModal,
      setShowActivityModal,
      showQuoteModal,
      setShowQuoteModal,
      showReferralModal,
      setShowReferralModal,
      settingsUsers,
      setSettingsUsers,
      apiCall,
      loadCRMData,
      addToast,
      handleAuthSubmit,
      handleLogout,
      selectQuickAccount,
      handleCreateLeadFromView,
      handleUpdateLeadFromView,
      handleDeleteLeadFromView,
      handleConvertLeadFromView,
      handleMoveOpportunity,
      handleAddStage,
      handleStageReorder,
      handleStageDelete,
      handleActivityCreate,
      toggleActivityDone,
      handleSendEmail,
      handleQuotationCreate,
      updateQuoteStatus,
      handleReferralCreate,
      handleApproveReward,
      handleAddCategory,
      handleDeleteCategory,
      handleBrandingSave,
      handleDeleteUser,
      applyFilters,
      handleSaveCustomFilter,
      clearAllFilters,
      toggleTheme
    }}>
      {children}
    </CRMContext.Provider>
  );
};

export const useCRM = () => {
  const context = useContext(CRMContext);
  if (context === undefined) {
    throw new Error('useCRM must be used within a CRMProvider');
  }
  return context;
};
