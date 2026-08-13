"use client";

import React, { createContext, useState, useEffect, useContext } from 'react';
import { Opportunity } from '../types/opportunity';
import { PipelineStage } from '../types/pipeline';
import { opportunityService } from '../services/opportunity.service';
import { ToastContext } from './ToastContext';
import { AuthContext } from './AuthContext';
import { ReferralContext } from './ReferralContext';
import { LeadContext } from './LeadContext';
import { CustomerContext } from './CustomerContext';

export interface OpportunityContextType {
  opportunities: Opportunity[];
  setOpportunities: React.Dispatch<React.SetStateAction<Opportunity[]>>;
  pipelines: PipelineStage[];
  setPipelines: React.Dispatch<React.SetStateAction<PipelineStage[]>>;
  referralPipelines: PipelineStage[];
  setReferralPipelines: React.Dispatch<React.SetStateAction<PipelineStage[]>>;
  showStageModal: boolean;
  setShowStageModal: React.Dispatch<React.SetStateAction<boolean>>;
  loadOpportunities: () => Promise<void>;
  handleMoveOpportunity: (oppId: string, stageId: string) => Promise<void>;
  handleAddStage: (stageName: string) => Promise<void>;
  handleStageReorder: (stageId: string, direction: 'left' | 'right') => Promise<void>;
  handleStageDelete: (stageId: string) => Promise<void>;
  handleDeleteOpportunity: (oppId: string) => Promise<void>;
  handleUpdateOpportunity: (oppId: string, oppData: any) => Promise<void>;
  handleBulkAssignOpportunities: (oppIds: string[], assignedSalespersonId: string, assignedSalesperson: string) => Promise<void>;
  handleBulkDeleteOpportunities: (oppIds: string[]) => Promise<void>;
}

export const OpportunityContext = createContext<OpportunityContextType | undefined>(undefined);

export const OpportunityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [pipelines, setPipelines] = useState<PipelineStage[]>([]);
  const [referralPipelines, setReferralPipelines] = useState<PipelineStage[]>([]);
  const [showStageModal, setShowStageModal] = useState(false);

  const toastCtx = useContext(ToastContext);
  const authCtx = useContext(AuthContext);
  const referralCtx = useContext(ReferralContext);
  const leadCtx = useContext(LeadContext);
  const customerCtx = useContext(CustomerContext);

  const loadOpportunities = async () => {
    const apiOpps = await opportunityService.getOpportunities();
    const apiPipelines = await opportunityService.getPipelines();
    const apiRefPipelines = await opportunityService.getReferralPipelines();

    if (apiPipelines) setPipelines(apiPipelines);
    else if (pipelines.length === 0) setPipelines([]);

    if (apiRefPipelines) setReferralPipelines(apiRefPipelines);
    else if (referralPipelines.length === 0) setReferralPipelines([]);

    if (apiOpps) {
      const formatted = apiOpps.map((opp: any) => {
        const stageObj = (apiPipelines || pipelines)?.find(
          (p: any) => p.id === opp.stageId || p.name === opp.stage
        );
        return {
          ...opp,
          stageId: stageObj?.id,
          stage: stageObj?.name || opp.stage
        };
      });
      setOpportunities(formatted);
    } else if (opportunities.length === 0) {
      setOpportunities([]);
    }
  };

  const handleMoveOpportunity = async (oppId: string, stageId: string) => {
    const opp = opportunities.find(o => o.id === oppId);
    if (!opp) return;

    const stage = pipelines.find(p => p.id === stageId);
    const updatedOpps = opportunities.map(o =>
      o.id === oppId
        ? { ...o, stageId, stage: stage?.name || o.stage }
        : o
    );
    setOpportunities(updatedOpps);

    const res = await opportunityService.updateOpportunity(oppId, {
      stageId,
      stage: stage?.name
    });

    if (res) {
      // if (toastCtx) toastCtx.addToast('success', `Opportunity moved to stage`);
      await loadOpportunities();
      if (leadCtx) await leadCtx.loadLeads();
      // If moved to Won, refresh customers so Clients page updates immediately
      const isWon = (stage?.name || '').toLowerCase().includes('won');
      if (isWon && customerCtx) await customerCtx.loadCustomers();
    } else {
      if (stage) {
        const stageName = stage.name;
        if (leadCtx) {
          leadCtx.setLeads(prev => prev.map(l => {
            const isMatch = opp.leadId ? (l.id === opp.leadId) : ((l.name === opp.customerName || l.contactName === opp.customerName) && l.company === opp.company);
            if (isMatch) {
              return { ...l, status: stageName };
            }
            return l;
          }));
        }
      }

      const isWonMove = stageId === 'p_6' || String(stageId || '').toLowerCase().includes('won') || (stage?.name || '').toLowerCase().includes('won');
      if (isWonMove && referralCtx) {
        const already = referralCtx.referrals.some(r => r.referrerName === opp.customerName);
        if (!already) {
         await referralCtx.handleReferralCreate({
  referrerId: opp.id,
  referrerName: opp.customerName,
  referrerCompany: opp.company,
  referredLeadName: "Pending Referral",
  referredCompany: "Pending Company",
  referredEmail: "",
  referredPhone: "",
  rewardType: "Credits",
  rewardValue: 1000,
});
          if (toastCtx) toastCtx.addToast('success', `${opp.customerName} enrolled in Referral Program!`);
        }
      }
      // if (toastCtx) toastCtx.addToast('success', 'Opportunity moved');
    }
  };

  const handleAddStage = async (stageName: string) => {

    const res = await opportunityService.addStage(stageName);
    if (res) {
      setPipelines(prev => [...prev, res].sort((a, b) => a.order - b.order));
      if (toastCtx) toastCtx.addToast('success', `Created stage: ${stageName}`);
    } else {
      const mockStage = { id: 'p_' + Date.now(), name: stageName, order: pipelines.length + 1 };
      setPipelines(prev => [...prev, mockStage]);
      if (toastCtx) toastCtx.addToast('success', `Created stage: ${stageName}`);
    }
    await loadOpportunities();
  };

  const handleStageReorder = async (stageId: string, direction: 'left' | 'right') => {

    const stageIdx = pipelines.findIndex(p => p.id === stageId);
    if (stageIdx === -1) return;
    const targetIdx = direction === 'left' ? stageIdx - 1 : stageIdx + 1;
    if (targetIdx < 0 || targetIdx >= pipelines.length) return;

    const updated = [...pipelines];
    const temp = updated[stageIdx].order;
    updated[stageIdx].order = updated[targetIdx].order;
    updated[targetIdx].order = temp;

    const res = await opportunityService.reorderStages(
      updated.map(p => ({ id: p.id, order: p.order }))
    );
    if (res) {
      setPipelines(res);
    } else {
      setPipelines(updated.sort((a, b) => a.order - b.order));
      if (toastCtx) toastCtx.addToast('success', 'Reordered stages');
    }
  };

  const handleStageDelete = async (stageId: string) => {
    const stage = pipelines.find(p => p.id === stageId);
    const mandatory = ['new', 'won', 'lost'];
    if (stage && mandatory.includes((stage.name || '').trim().toLowerCase())) {
      if (toastCtx) toastCtx.addToast('error', `Stage "${stage.name}" is mandatory and cannot be deleted.`);
      return;
    }

    const res = await opportunityService.deleteStage(stageId);
    if (res) {
      if (toastCtx) toastCtx.addToast('success', 'Stage deleted successfully');
      await loadOpportunities();
    } else {
      const stage = pipelines.find(p => p.id === stageId);
      if (stage) {
        setPipelines(prev => prev.filter(p => p.id !== stageId));
        const fallback = pipelines[0]?.id || '';
        setOpportunities(prev => prev.map(o => o.stageId === stageId ? { ...o, stageId: fallback } : o));
        if (toastCtx) toastCtx.addToast('success', `Deleted stage ${stage.name}`);
      }
    }
  };
  const handleDeleteOpportunity = async (oppId: string) => {
    const opp = opportunities.find(o => o.id === oppId);
    const res = await opportunityService.deleteOpportunity(oppId);
    if (res) {
      if (toastCtx) toastCtx.addToast('success', 'Opportunity deleted successfully');
      await loadOpportunities();
      if (leadCtx) await leadCtx.loadLeads();
    } else {
      setOpportunities(prev => prev.filter(o => o.id !== oppId));
      if (leadCtx && opp && opp.leadId) {
        leadCtx.setLeads(prev => prev.filter(l => l.id !== opp.leadId));
      }
      if (toastCtx) toastCtx.addToast('success', 'Deleted opportunity');
    }
  };

  const handleUpdateOpportunity = async (oppId: string, oppData: any) => {
    // Optimistic update
    setOpportunities(prev => prev.map(o => o.id === oppId ? { ...o, ...oppData } : o));

    // Also update associated lead details optimistically
    const oppObj = opportunities.find(o => o.id === oppId);
    if (oppObj && oppObj.leadId && leadCtx) {
      const leadUpdate: any = {};
      if (oppData.customerName !== undefined) leadUpdate.contactName = oppData.customerName;
      if (oppData.company !== undefined) leadUpdate.company = oppData.company;
      if (oppData.email !== undefined) leadUpdate.email = oppData.email;
      if (oppData.phone !== undefined) leadUpdate.phone = oppData.phone;
      if (oppData.dealValue !== undefined) leadUpdate.dealValue = oppData.dealValue;
      if (oppData.assignedSalesperson !== undefined) leadUpdate.assignedUser = oppData.assignedSalesperson;
      if (oppData.assignedSalespersonId !== undefined) leadUpdate.assignedUserId = oppData.assignedSalespersonId;
      if (oppData.stage !== undefined) leadUpdate.status = oppData.stage;
      if (oppData.category !== undefined) leadUpdate.category = oppData.category;
      if (oppData.serviceType !== undefined) leadUpdate.serviceType = oppData.serviceType;

      if (Object.keys(leadUpdate).length > 0) {
        leadCtx.setLeads((prev: any[]) => prev.map(l =>
          l.id === oppObj.leadId ? { ...l, ...leadUpdate } : l
        ));
      }
    }

    const res = await opportunityService.updateOpportunity(oppId, oppData);
    if (res) {
      // Merge with server response state
      setOpportunities(prev => prev.map(o => o.id === oppId ? { ...o, ...res } : o));
      if (leadCtx) {
        await leadCtx.loadLeads();
      }
    } else {
      if (toastCtx) toastCtx.addToast('success', 'Opportunity updated');
    }
  };

  const handleBulkAssignOpportunities = async (oppIds: string[], assignedSalespersonId: string, assignedSalesperson: string) => {
    // Optimistic update
    setOpportunities(prev => prev.map(o => oppIds.includes(o.id) ? { ...o, assignedSalespersonId, assignedSalesperson } : o));

    // Also update associated leads
    if (leadCtx) {
      const leadIdsToUpdate = opportunities
        .filter(o => oppIds.includes(o.id) && o.leadId)
        .map(o => o.leadId);

      if (leadIdsToUpdate.length > 0) {
        leadCtx.setLeads((prev: any[]) => prev.map(l =>
          leadIdsToUpdate.includes(l.id)
            ? { ...l, assignedUser: assignedSalesperson, assignedUserId: assignedSalespersonId }
            : l
        ));
      }
    }

    const res = await opportunityService.bulkAssignOpportunities(oppIds, {
      assignedSalespersonId,
      assignedSalesperson
    });
    if (res && res.success) {
      if (toastCtx) toastCtx.addToast('success', `Assigned ${oppIds.length} opportunities successfully`);
      await loadOpportunities();
      if (leadCtx) {
        await leadCtx.loadLeads();
      }
    } else {
      if (toastCtx) toastCtx.addToast('error', 'Failed to assign opportunities');
      await loadOpportunities();
    }
  };

  const handleBulkDeleteOpportunities = async (ids: string[]) => {
    const oppsToDelete = opportunities.filter(o => ids.includes(o.id));
    const leadIdsToDelete = oppsToDelete.map(o => o.leadId).filter(Boolean);

    const res = await opportunityService.bulkDeleteOpportunities(ids);
    if (res) {
      if (toastCtx) toastCtx.addToast('success', 'Selected opportunities deleted successfully');
      await loadOpportunities();
      if (leadCtx) await leadCtx.loadLeads();
    } else {
      // Offline fallback
      setOpportunities(prev => prev.filter(o => !ids.includes(o.id)));
      if (leadCtx && leadIdsToDelete.length > 0) {
        leadCtx.setLeads(prev => prev.filter(l => !leadIdsToDelete.includes(l.id)));
      }
      if (toastCtx) toastCtx.addToast('success', 'Deleted selected opportunities');
    }
  };

  return (
    <OpportunityContext.Provider value={{
      opportunities,
      setOpportunities,
      pipelines,
      setPipelines,
      referralPipelines,
      setReferralPipelines,
      showStageModal,
      setShowStageModal,
      loadOpportunities,
      handleMoveOpportunity,
      handleAddStage,
      handleStageReorder,
      handleStageDelete,
      handleDeleteOpportunity,
      handleUpdateOpportunity,
      handleBulkAssignOpportunities,
      handleBulkDeleteOpportunities
    }}>
      {children}
    </OpportunityContext.Provider>
  );
};