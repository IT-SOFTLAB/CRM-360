"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { AppProvider } from '../providers/AppProvider';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { useToast } from '../hooks/useToast';
import { useLeads } from '../hooks/useLeads';
import { useOpportunities } from '../hooks/useOpportunities';
import { useCustomers } from '../hooks/useCustomers';
import { useActivities } from '../hooks/useActivities';
import { useQuotations } from '../hooks/useQuotations';
import { useReferrals } from '../hooks/useReferrals';
import { useEmails } from '../hooks/useEmails';
import { useSettings } from '../hooks/useSettings';
import { applyFilters as applyFiltersUtil } from '../utils/filters';
import { DEFAULT_ACTIVE_FILTERS } from '../utils/constants';
import { leadService } from '../services/lead.service';
import api from '../services/api';
import { usePipeline } from "../hooks/usePipeline";
import { useNotifications } from "../hooks/useNotifications";

export interface CRMContextType {
  mounted: boolean;
  authReady: boolean;
  user: any;
  setUser: React.Dispatch<React.SetStateAction<any>>;
  authMode: 'login' | 'register' | 'setup'| 'forgotPassword' ;
  setAuthMode: React.Dispatch<React.SetStateAction<'login' | 'register' | 'setup'| 'forgotPassword' >>;
  authForm: any;
  setAuthForm: React.Dispatch<React.SetStateAction<any>>;
  setupRequired: boolean;
  setSetupRequired: React.Dispatch<React.SetStateAction<boolean>>;
  handleSetupSubmit: (setupData: any) => Promise<boolean>;
  leads: any[];
  setLeads: React.Dispatch<React.SetStateAction<any[]>>;
  opportunities: any[];
  setOpportunities: React.Dispatch<React.SetStateAction<any[]>>;
  pipelines: any[];
  setPipelines: React.Dispatch<React.SetStateAction<any[]>>;
  referralPipelines: any[];
  setReferralPipelines: React.Dispatch<React.SetStateAction<any[]>>;
  dashboard: any;

  loadDashboard: () => Promise<void>;
  loadReferralPipelines: () => Promise<void>;

  handleAddReferralStage: (data: any) => Promise<void>;

  handleDeleteReferralStage: (id: string) => Promise<void>;

  handleReferralStageReorder: (stages: any[]) => Promise<void>;
  activities: any[];
  setActivities: React.Dispatch<React.SetStateAction<any[]>>;
  emails: any[];
  setEmails: React.Dispatch<React.SetStateAction<any[]>>;
  quotations: any[];
  setQuotations: React.Dispatch<React.SetStateAction<any[]>>;
  referrals: any[];
  setReferrals: React.Dispatch<React.SetStateAction<any[]>>;
  customers: any[];
  setCustomers: React.Dispatch<React.SetStateAction<any[]>>;
  referralForm: any;
  setReferralForm: React.Dispatch<React.SetStateAction<any>>;
  categories: string[];
  setCategories: React.Dispatch<React.SetStateAction<string[]>>;
  serviceTypes: string[];
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
  handleConvertLeadFromView: (leadId: string, dealValue: string) => Promise<void>;
  handleMoveOpportunity: (oppId: string, stageId: string) => Promise<void>;
  handleDeleteOpportunity: (oppId: string) => Promise<void>;
  handleUpdateOpportunity: (oppId: string, oppData: any) => Promise<void>;
  handleAddStage: (stageName: string) => Promise<void>;
  handleStageReorder: (stageId: string, direction: 'left' | 'right') => Promise<void>;
  handleStageDelete: (stageId: string) => Promise<void>;
  handleActivityCreate: (activityForm: any) => Promise<void>;
  toggleActivityDone: (activityId: string, currentStatus: boolean) => Promise<void>;
  handleSendEmail: (replyText: string, emailObject: any) => Promise<boolean>;
  isConnected: boolean;

connectedEmail: string;

connectOutlook: () => void;

// Outlook Calendar
calendarConnected: boolean;

calendarEmail: string;

connectCalendar: () => void;

checkCalendarStatus: () => Promise<void>;

currentFolder: string;

loadInbox: () => Promise<void>;

loadSent: () => Promise<void>;

loadDrafts: () => Promise<void>;

loadTrash: () => Promise<void>;

refreshInbox: () => Promise<void>;

deleteEmail: (id: string) => Promise<void>;

restoreEmail: (id: string) => Promise<void>;

markRead: (id: string) => Promise<void>;

markUnread: (id: string) => Promise<void>;

forwardEmail: (
  id: string,
  to: string
) => Promise<void>;

getEmailDetails: (
  id: string
) => Promise<any>;

getConversation: (
  id: string
) => Promise<any>;

replyEmail: (
  id: string,
  message: string
) => Promise<void>;

replyAllEmail: (
  id: string,
  message: string
) => Promise<void>;

permanentDelete: (
  id: string
) => Promise<void>;

searchEmails: (
  keyword: string
) => Promise<any>;

getProfile: () => Promise<any>;

getAttachments: (
  id: string
) => Promise<any>;

createDraft: (
  payload: any
) => Promise<any>;

updateDraft: (
  id: string,
  payload: any
) => Promise<any>;

sendDraft: (
  id: string
) => Promise<any>;

  emailLogs: any[];
  loadEmailLogs: () => Promise<void>;

  handleQuotationCreate: (quoteForm: any) => Promise<void>;
  updateQuoteStatus: (quoteId: string, status: string) => Promise<void>;
  handleReferralCreate: (referralForm: any) => Promise<void>;
  handleApproveReward: (refId: string) => Promise<void>;
  handlePayReward: (refId: string) => Promise<void>;
  handleDeleteReferral: (id: string) => Promise<void>;
  handleAddCategory: (catName: string) => Promise<void>;
  handleDeleteCategory: (catName: string) => Promise<void>;
  handleBrandingSave: (e: React.FormEvent) => Promise<void>;
  handleDeleteUser: (id: string) => Promise<void>;
  handleUpdateUser: (userId: string, name: string, email: string, role: string, status: string, adminId?: string) => Promise<void>;
  applyFilters: (data: any[], type: 'leads' | 'opportunities' | 'emails') => any[];
  handleSaveCustomFilter: () => void;
  clearAllFilters: () => void;
  toggleTheme: () => void;
  handleQuotationUpdate: (id: string, data: any) => Promise<void>;
  handleMoveReferral: (
    id: string,
    stageId: string
  ) => Promise<void>;
}

const CRMContext = createContext<CRMContextType | undefined>(undefined);

const CRMProviderInner: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const auth = useAuth();
  const themeCtx = useTheme();
  const toastCtx = useToast();
  const leadsCtx = useLeads();
  const oppCtx = useOpportunities();
  const customerCtx = useCustomers();
  const activityCtx = useActivities();
  const quoteCtx = useQuotations();
  const referralCtx = useReferrals();
  const pipelineCtx = usePipeline();
  const emailCtx = useEmails();
  const settingsCtx = useSettings();
  const notificationsCtx = useNotifications();

  // Local filter and UI states
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);
  const [activeFilters, setActiveFilters] = useState<any>(DEFAULT_ACTIVE_FILTERS);
  const [customFilters, setCustomFilters] = useState<string[]>([]);
  const [customFilterName, setCustomFilterName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Initial load — wait for authReady so the token is refreshed before fetching
  useEffect(() => {
    if (!auth.authReady) return;  // auth still initialising
    if (!auth.user) return;        // not logged in
    loadCRMData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth.authReady, auth.user]);

  const loadCRMData = async () => {
    try {
      const res = await api.get('/bootstrap');
      if (res && res.data) {
        const {
    leads,
    opportunities,
    customers,
    activities,
    quotations,
    referrals,
    referralDashboard,
    referralPipelineStages,
    pipelines,
    referralPipelines,
    categories,
    companyBranding,
    settingsUsers,
    notifications
} = res.data;
        if (leads !== undefined) leadsCtx.setLeads(leads ?? []);
        if (opportunities !== undefined) oppCtx.setOpportunities(opportunities ?? []);
        if (pipelines !== undefined) oppCtx.setPipelines(pipelines ?? []);
        if (referralPipelines !== undefined) oppCtx.setReferralPipelines(referralPipelines ?? []);
        if (customers !== undefined) customerCtx.setCustomers(customers ?? []);
       await activityCtx.loadActivities();
        if (quotations !== undefined) quoteCtx.setQuotations(quotations ?? []);
        if (referrals !== undefined) referralCtx.setReferrals(referrals ?? []);
        if (referralDashboard !== undefined) referralCtx.setDashboard(referralDashboard);
        if (referralPipelineStages !== undefined) pipelineCtx.setStages(referralPipelineStages ?? []);
      //  if (emails !== undefined) emailCtx.setEmails(emails ?? []);
        if (categories !== undefined) settingsCtx.setCategories(categories ?? []);
        if (companyBranding !== undefined) settingsCtx.setCompanyBranding(companyBranding);
        if (settingsUsers !== undefined) settingsCtx.setSettingsUsers(settingsUsers ?? []);
        if (notifications !== undefined) notificationsCtx.setNotifications(notifications ?? []);
        return;
      }
    } catch (err) {
      console.warn("Bootstrap loading failed. Falling back to parallel individual requests...", err);
    }

    await Promise.all([
      leadsCtx.loadLeads(),
    oppCtx.loadOpportunities(),
    customerCtx.loadCustomers(),
    activityCtx.loadActivities(),
    quoteCtx.loadQuotations(),
    referralCtx.loadReferrals(),
    pipelineCtx.loadStages(),
    settingsCtx.loadSettings(),

    emailCtx.loadInbox()
]);
  };

  // Compatibility API call
  const apiCall = async (path: string, method = 'GET', body: any = null) => {
    try {
      const config: any = { method };
      if (body) config.data = body;
      const res = await api(path, config);
      return res.data;
    } catch (err) {
      console.warn(`Express API offline (${path} - ${method}). Operating in local state fallback mode.`);
      return null;
    }
  };

  const handleConvertLeadFromView = async (leadId: string, dealValue: string) => {
    const leadObj = leadsCtx.leads.find(l => l.id === leadId);
    if (!leadObj) return;
    const salesperson = leadObj.assignedUser || auth.user?.name || 'Unassigned';

    // Optimistically update lead status and append opportunity instantly
    const sortedPipes = [...oppCtx.pipelines].sort((a, b) => a.order - b.order);
    const newStage = oppCtx.pipelines.find(p => p.name.toLowerCase() === 'new') || sortedPipes[0];
    const stageId = newStage ? newStage.id : 'p_1';

    const tempOppId = 'o_temp_' + Date.now();
    const tempOpp = {
      id: tempOppId,
      leadId: leadId,
      customerName: leadObj.contactName || leadObj.name || 'Unknown',
      company: leadObj.company || 'Unknown',
      dealValue: Number(dealValue) || 10000,
      expectedClosing: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      assignedSalesperson: salesperson,
      priority: 0,
      tags: [],
      stageId: stageId,
      stage: newStage ? newStage.name : 'New',
      createdDate: new Date().toISOString().split('T')[0]
    };

    oppCtx.setOpportunities(prev => [tempOpp, ...prev]);
    leadsCtx.setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: 'Converted' } : l));

    const res = await leadService.convertLead(leadId, { dealValue, salesperson });
    if (res) {
      oppCtx.setOpportunities(prev => prev.map(o => o.id === tempOppId ? res.opportunity : o));
      toastCtx.addToast("success", "Converted successfully");
      await loadCRMData();
    } else {
      oppCtx.setOpportunities(prev => prev.map(o => o.id === tempOppId ? { ...o, id: 'o_' + Date.now() } : o));
      leadsCtx.setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: newStage ? newStage.name : 'New' } : l));
      toastCtx.addToast('success', 'Converted lead to Opportunity');
    }
  };

  const handleSaveCustomFilter = () => {
    if (!customFilterName) return;
    setCustomFilters(prev => [...prev, customFilterName]);
    toastCtx.addToast('success', `Saved custom filter: ${customFilterName}`);
    setCustomFilterName('');
  };

  const clearAllFilters = () => {
    setActiveFilters(DEFAULT_ACTIVE_FILTERS);
    setSearchQuery('');
    toastCtx.addToast('info', 'Filters cleared');
  };

  const applyFilters = (data: any[], type: 'leads' | 'opportunities' | 'emails') => {
    return applyFiltersUtil(data, type, searchQuery, activeFilters, auth.user);
  };

  return (
    <CRMContext.Provider value={{
      mounted: auth.mounted,
      authReady: auth.authReady,
      user: auth.user,
      setUser: auth.setUser,
      authMode: auth.authMode,
      setAuthMode: auth.setAuthMode,
      authForm: auth.authForm,
      setAuthForm: auth.setAuthForm,
      setupRequired: auth.setupRequired,
      setSetupRequired: auth.setSetupRequired,
      handleSetupSubmit: (setupData) => auth.handleSetupSubmit(setupData, loadCRMData),
      leads: leadsCtx.leads,
      setLeads: leadsCtx.setLeads,
      opportunities: oppCtx.opportunities,
      setOpportunities: oppCtx.setOpportunities,
      pipelines: oppCtx.pipelines,
      setPipelines: oppCtx.setPipelines,
      referralPipelines: pipelineCtx.stages,
      loadReferralPipelines: pipelineCtx.loadStages,
      dashboard: referralCtx.dashboard,
      loadDashboard: referralCtx.loadDashboard,
      handleAddReferralStage: pipelineCtx.handleCreateStage,

      handleDeleteReferralStage: pipelineCtx.handleDeleteStage,

      handleReferralStageReorder:
        pipelineCtx.handleReorderStages,
      setReferralPipelines: pipelineCtx.setStages,
      activities: activityCtx.activities,
      setActivities: activityCtx.setActivities,
      emails: emailCtx.emails,
      setEmails: emailCtx.setEmails,
      
      quotations: quoteCtx.quotations,
      setQuotations: quoteCtx.setQuotations,
      referrals: referralCtx.referrals,
      setReferrals: referralCtx.setReferrals,
      customers: customerCtx.customers,
      setCustomers: customerCtx.setCustomers,
      referralForm: referralCtx.referralForm,
      setReferralForm: referralCtx.setReferralForm,
      categories: settingsCtx.categories,
      setCategories: settingsCtx.setCategories,
      serviceTypes: settingsCtx.serviceTypes,
      companyBranding: settingsCtx.companyBranding,
      setCompanyBranding: settingsCtx.setCompanyBranding,
      theme: themeCtx.theme,
      setTheme: themeCtx.setTheme,
      toasts: toastCtx.toasts,
      setToasts: toastCtx.setToasts,
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
      showLeadCreateModal: leadsCtx.showLeadCreateModal,
      setShowLeadCreateModal: leadsCtx.setShowLeadCreateModal,
      showStageModal: oppCtx.showStageModal,
      setShowStageModal: oppCtx.setShowStageModal,
      showActivityModal: activityCtx.showActivityModal,
      setShowActivityModal: activityCtx.setShowActivityModal,
      showQuoteModal: quoteCtx.showQuoteModal,
      setShowQuoteModal: quoteCtx.setShowQuoteModal,
      showReferralModal: referralCtx.showReferralModal,
      setShowReferralModal: referralCtx.setShowReferralModal,
      settingsUsers: settingsCtx.settingsUsers,
      setSettingsUsers: settingsCtx.setSettingsUsers,
      apiCall,
      loadCRMData,
      addToast: toastCtx.addToast,

      handleAuthSubmit: (e) => auth.handleAuthSubmit(e, loadCRMData),
      handleLogout: auth.handleLogout,
      selectQuickAccount: auth.selectQuickAccount,
      handleCreateLeadFromView: leadsCtx.handleCreateLeadFromView,
      handleUpdateLeadFromView: leadsCtx.handleUpdateLeadFromView,
      handleDeleteLeadFromView: leadsCtx.handleDeleteLeadFromView,
      handleConvertLeadFromView,
      handleMoveOpportunity: oppCtx.handleMoveOpportunity,
      handleDeleteOpportunity: oppCtx.handleDeleteOpportunity,
      handleUpdateOpportunity: oppCtx.handleUpdateOpportunity,
      handleAddStage: oppCtx.handleAddStage,
      handleStageReorder: oppCtx.handleStageReorder,
      handleStageDelete: oppCtx.handleStageDelete,
      handleActivityCreate: activityCtx.handleActivityCreate,
      toggleActivityDone: activityCtx.toggleActivityDone,
      calendarConnected: activityCtx.calendarConnected,

calendarEmail: activityCtx.calendarEmail,

connectCalendar: activityCtx.connectCalendar,

checkCalendarStatus: activityCtx.checkCalendarStatus,
      handleSendEmail: emailCtx.handleSendEmail,
      isConnected: emailCtx.isConnected,

connectedEmail: emailCtx.connectedEmail,

connectOutlook: emailCtx.connectOutlook,

currentFolder: emailCtx.currentFolder,

loadInbox: emailCtx.loadInbox,

loadSent: emailCtx.loadSent,

loadDrafts: emailCtx.loadDrafts,

loadTrash: emailCtx.loadTrash,

refreshInbox: emailCtx.refreshInbox,

deleteEmail: emailCtx.deleteEmail,

restoreEmail: emailCtx.restoreEmail,

markRead: emailCtx.markRead,

markUnread: emailCtx.markUnread,

forwardEmail: emailCtx.forwardEmail,

getEmailDetails: emailCtx.getEmailDetails,

getConversation: emailCtx.getConversation,

replyEmail: emailCtx.replyEmail,

replyAllEmail: emailCtx.replyAllEmail,

permanentDelete: emailCtx.permanentDelete,

searchEmails: emailCtx.searchEmails,

getProfile: emailCtx.getProfile,

getAttachments: emailCtx.getAttachments,

createDraft: emailCtx.createDraft,

updateDraft: emailCtx.updateDraft,

sendDraft: emailCtx.sendDraft,
      emailLogs: emailCtx.emailLogs,
      loadEmailLogs: emailCtx.loadEmailLogs,
      handleQuotationCreate: quoteCtx.handleQuotationCreate,
      handleQuotationUpdate: quoteCtx.handleQuotationUpdate,
      updateQuoteStatus: quoteCtx.updateQuoteStatus,
      handleReferralCreate: referralCtx.handleReferralCreate,
      handleApproveReward: referralCtx.handleApproveReward,
      handlePayReward: referralCtx.handlePayReward,
      handleDeleteReferral: referralCtx.handleDeleteReferral,
      handleMoveReferral: referralCtx.handleMoveReferral,
      handleAddCategory: settingsCtx.handleAddCategory,
      handleDeleteCategory: settingsCtx.handleDeleteCategory,
      handleBrandingSave: settingsCtx.handleBrandingSave,
      handleDeleteUser: settingsCtx.handleDeleteUser,
      handleUpdateUser: settingsCtx.handleUpdateUser,
      applyFilters,
      handleSaveCustomFilter,
      clearAllFilters,

      toggleTheme: themeCtx.toggleTheme

    }}>
      {children}
    </CRMContext.Provider>
  );
};

export const CRMProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <AppProvider>
      <CRMProviderInner>
        {children}
      </CRMProviderInner>
    </AppProvider>
  );
};

export const useCRM = () => {
  const context = useContext(CRMContext);
  if (context === undefined) {
    throw new Error('useCRM must be used within a CRMProvider');
  }
  return context;
};
