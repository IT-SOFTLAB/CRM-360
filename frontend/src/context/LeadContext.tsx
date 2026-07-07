"use client";

import React, { createContext, useState, useContext } from 'react';
import { Lead } from '../types/lead';
import { leadService } from '../services/lead.service';
import { ToastContext } from './ToastContext';

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
      setLeads([]);
    }
  };

  const handleCreateLeadFromView = async (leadForm: any) => {
    const res = await leadService.createLead(leadForm);
    if (res) {
      setLeads(prev => [...prev, res]);
      if (toastCtx) toastCtx.addToast('success', `Lead for ${res.name} created!`);
    } else {
      if (toastCtx) toastCtx.addToast('error', 'Failed to create lead');
    }
    setShowLeadCreateModal(false);
    await loadLeads();
  };

  const handleUpdateLeadFromView = async (leadId: string, leadData: any) => {
    const res = await leadService.updateLead(leadId, leadData);
    if (res) {
      if (toastCtx) toastCtx.addToast('success', 'Lead updated');
      await loadLeads();
    } else {
      if (toastCtx) toastCtx.addToast('error', 'Failed to update lead');
    }
  };

  const handleDeleteLeadFromView = async (leadId: string) => {
    const res = await leadService.deleteLead(leadId);
    if (res) {
      if (toastCtx) toastCtx.addToast('success', 'Lead deleted');
      await loadLeads();
    } else {
      if (toastCtx) toastCtx.addToast('error', 'Failed to delete lead');
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
