"use client";

import React, { createContext, useState, useContext } from 'react';
import { Lead } from '../types/lead';
import { leadService } from '../services/lead.service';
import { ToastContext } from './ToastContext';
import { OFFLINE_LEADS } from '../utils/constants';

export interface LeadContextType {
  leads: Lead[];
  setLeads: React.Dispatch<React.SetStateAction<Lead[]>>;
  showLeadCreateModal: boolean;
  setShowLeadCreateModal: React.Dispatch<React.SetStateAction<boolean>>;
  loadLeads: () => Promise<void>;
  handleCreateLeadFromView: (leadForm: any) => Promise<void>;
  handleUpdateLeadFromView: (leadId: string, leadData: any) => Promise<void>;
  handleDeleteLeadFromView: (leadId: string) => Promise<void>;
}

export const LeadContext = createContext<LeadContextType | undefined>(undefined);

export const LeadProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [showLeadCreateModal, setShowLeadCreateModal] = useState(false);
  const toastCtx = useContext(ToastContext);

  const loadLeads = async () => {
    const apiLeads = await leadService.getLeads();
    if (apiLeads) {
      setLeads(apiLeads);
    } else if (leads.length === 0) {
      setLeads(OFFLINE_LEADS);
    }
  };

  const handleCreateLeadFromView = async (leadForm: any) => {
    const res = await leadService.createLead(leadForm);
    if (res) {
      setLeads(prev => [...prev, res]);
      if (toastCtx) toastCtx.addToast('success', `Lead for ${res.name} created!`);
    } else {
      const mockLead = {
        id: 'l_' + Date.now(),
        createdDate: new Date().toISOString().split('T')[0],
        status: 'New',
        ...leadForm
      };
      setLeads(prev => [...prev, mockLead]);
      if (toastCtx) toastCtx.addToast('success', `Lead for ${mockLead.name} created (Offline Mode)`);
    }
    setShowLeadCreateModal(false);
    await loadLeads();
  };

  const handleUpdateLeadFromView = async (leadId: string, leadData: any) => {
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, ...leadData } : l));
    await leadService.updateLead(leadId, leadData);
  };

  const handleDeleteLeadFromView = async (leadId: string) => {
    const res = await leadService.deleteLead(leadId);
    if (res) {
      if (toastCtx) toastCtx.addToast('success', 'Lead deleted');
      await loadLeads();
    } else {
      setLeads(prev => prev.filter(l => l.id !== leadId));
      if (toastCtx) toastCtx.addToast('success', 'Lead deleted (Offline)');
    }
  };

  return (
    <LeadContext.Provider value={{
      leads,
      setLeads,
      showLeadCreateModal,
      setShowLeadCreateModal,
      loadLeads,
      handleCreateLeadFromView,
      handleUpdateLeadFromView,
      handleDeleteLeadFromView
    }}>
      {children}
    </LeadContext.Provider>
  );
};
