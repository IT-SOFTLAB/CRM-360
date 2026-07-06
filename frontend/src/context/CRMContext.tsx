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

export interface CRMContextType {
  mounted: boolean;
  user: any;
  setUser: React.Dispatch<React.SetStateAction<any>>;
  authMode: 'login' | 'register' | 'setup';
  setAuthMode: React.Dispatch<React.SetStateAction<'login' | 'register' | 'setup'>>;
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
  handleConvertLeadFromView: (leadId: string, dealValue: string) => Promise<void>;
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
  handleQuotationUpdate: (id: string, data: any) => Promise<void>;
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
  const emailCtx = useEmails();
  const settingsCtx = useSettings();

  // Local filter and UI states
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);
  const [activeFilters, setActiveFilters] = useState<any>(DEFAULT_ACTIVE_FILTERS);
  const [customFilters, setCustomFilters] = useState<string[]>([]);
  const [customFilterName, setCustomFilterName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Initial load
  useEffect(() => {
    loadCRMData();
  }, []);

  const loadCRMData = async () => {
    await Promise.all([
      leadsCtx.loadLeads(),
      oppCtx.loadOpportunities(),
      customerCtx.loadCustomers(),
      activityCtx.loadActivities(),
      quoteCtx.loadQuotations(),
      referralCtx.loadReferrals(),
      emailCtx.loadEmails(),
      settingsCtx.loadSettings()
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
    const salesperson = leadObj?.assignedUser || auth.user?.name || 'Unassigned';

    const res = await leadService.convertLead(leadId, { dealValue, salesperson });
    if (res) {
      oppCtx.setOpportunities(prev => [res.opportunity, ...prev]);
      leadsCtx.setLeads(prev => prev.filter(l => l.id !== leadId));
      toastCtx.addToast("success", "Converted successfully");
      await loadCRMData();
    } else {
      if (leadObj) {
        const sortedPipes = [...oppCtx.pipelines].sort((a, b) => a.order - b.order);
        const newStage = oppCtx.pipelines.find(p => p.name.toLowerCase() === 'new') || sortedPipes[0];
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
          stage: newStage ? newStage.name : 'New',
          createdDate: new Date().toISOString().split('T')[0]
        };
        oppCtx.setOpportunities(prev => [...prev, mockOpp]);
        leadsCtx.setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: newStage ? newStage.name : 'New' } : l));
        toastCtx.addToast('success', 'Converted lead to Opportunity (Offline Mode)');
      }
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
      referralPipelines: oppCtx.referralPipelines,
      setReferralPipelines: oppCtx.setReferralPipelines,
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
      auditLogs: settingsCtx.auditLogs,
      setAuditLogs: settingsCtx.setAuditLogs,
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
      handleAddStage: oppCtx.handleAddStage,
      handleStageReorder: oppCtx.handleStageReorder,
      handleStageDelete: oppCtx.handleStageDelete,
      handleActivityCreate: activityCtx.handleActivityCreate,
      toggleActivityDone: activityCtx.toggleActivityDone,
      handleSendEmail: emailCtx.handleSendEmail,
      handleQuotationCreate: quoteCtx.handleQuotationCreate,
      handleQuotationUpdate: quoteCtx.handleQuotationUpdate,
      updateQuoteStatus: quoteCtx.updateQuoteStatus,
      handleReferralCreate: referralCtx.handleReferralCreate,
      handleApproveReward: referralCtx.handleApproveReward,
      handleAddCategory: settingsCtx.handleAddCategory,
      handleDeleteCategory: settingsCtx.handleDeleteCategory,
      handleBrandingSave: settingsCtx.handleBrandingSave,
      handleDeleteUser: settingsCtx.handleDeleteUser,
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
