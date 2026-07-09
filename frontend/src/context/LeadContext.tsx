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
    setShowLeadCreateModal(false);
    
    // Optimistically render the new lead instantly
    const tempId = 'l_temp_' + Date.now();
    const tempLead = {
      id: tempId,
      status: 'New',
      createdAt: new Date().toISOString(),
      contactName: leadForm.contactName,
      name: leadForm.contactName || leadForm.name || "Unknown",
      source: leadForm.source || 'Direct',
      createdDate: new Date().toISOString().split('T')[0],
      company: leadForm.company,
      email: leadForm.email,
      phone: leadForm.phone,
      category: leadForm.category,
      serviceType: leadForm.serviceType,
      assignedUser: leadForm.assignedUser || 'Unassigned'
    };
    setLeads(prev => [...prev, tempLead as any]);

    const res = await leadService.createLead(leadForm);
    if (res) {
      setLeads(prev => prev.map(l => l.id === tempId ? res : l));
      if (toastCtx) toastCtx.addToast('success', `Lead for ${res.contactName || res.name} created!`);
    } else {
      setLeads(prev => prev.filter(l => l.id !== tempId));
      if (toastCtx) toastCtx.addToast('error', 'Failed to create lead');
    }
  };

  const handleUpdateLeadFromView = async (leadId: string, leadData: any) => {
    
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, ...leadData } : l));

    const res = await leadService.updateLead(leadId, leadData);
    if (res) {
      setLeads(prev => prev.map(l => l.id === leadId ? res : l));
      if (toastCtx) toastCtx.addToast('success', 'Lead updated');
    } else {
      if (toastCtx) toastCtx.addToast('error', 'Failed to update lead');
      await loadLeads(); // Revert/reload on failure
    }
  };

  const handleDeleteLeadFromView = async (leadId: string) => {
    // Optimistically remove lead state immediately
    const originalLeads = leads;
    setLeads(prev => prev.filter(l => l.id !== leadId));

    const res = await leadService.deleteLead(leadId);
    if (res) {
      if (toastCtx) toastCtx.addToast('success', 'Lead deleted');
    } else {
      setLeads(originalLeads);
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
