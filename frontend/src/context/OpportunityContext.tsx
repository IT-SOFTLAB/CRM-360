"use client";

import React, { createContext, useState, useEffect, useContext } from 'react';
import { Opportunity } from '../types/opportunity';
import { PipelineStage } from '../types/pipeline';
import { opportunityService } from '../services/opportunity.service';
import { ToastContext } from './ToastContext';
import { AuthContext } from './AuthContext';
import { ReferralContext } from './ReferralContext';
import { LeadContext } from './LeadContext';
import { OFFLINE_OPPORTUNITIES, OFFLINE_PIPELINES, OFFLINE_REFERRAL_PIPELINES } from '../utils/constants';

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

  const loadOpportunities = async () => {
    const apiOpps = await opportunityService.getOpportunities();
    const apiPipelines = await opportunityService.getPipelines();
    const apiRefPipelines = await opportunityService.getReferralPipelines();

    if (apiPipelines) setPipelines(apiPipelines);
    else if (pipelines.length === 0) setPipelines(OFFLINE_PIPELINES);

    if (apiRefPipelines) setReferralPipelines(apiRefPipelines);
    else if (referralPipelines.length === 0) setReferralPipelines(OFFLINE_REFERRAL_PIPELINES);

    if (apiOpps) {
      const formatted = apiOpps.map((opp: any) => {
        const stageObj = (apiPipelines || pipelines || OFFLINE_PIPELINES)?.find(
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
      setOpportunities(OFFLINE_OPPORTUNITIES);
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
      if (toastCtx) toastCtx.addToast('success', `Opportunity moved to stage`);
      await loadOpportunities();
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

      if (stageId === 'p_6' && referralCtx) {
        const already = referralCtx.referrals.some(r => r.referrerName === opp.customerName);
        if (!already) {
          const newRef = {
            id: 'ref_' + Date.now(),
            referrerName: opp.customerName,
            referrerCompany: opp.company,
            referredLeadName: 'Pending referral',
            referredCompany: 'Pending Company Corp',
            dealValue: 0,
            stage: 'rp_1',
            dateSubmitted: new Date().toISOString().split('T')[0],
            rewardType: 'Credits',
            rewardValue: '₹1,000 Credits',
            rewardApproved: false
          };
          referralCtx.setReferrals(prev => [...prev, newRef]);
          if (toastCtx) toastCtx.addToast('success', `${opp.customerName} enrolled in Referral Program!`);
        }
      }
      if (toastCtx) toastCtx.addToast('success', 'Opportunity moved (Offline Mode)');
    }
  };

  const handleAddStage = async (stageName: string) => {
    const user = authCtx?.user;
    if (user?.role !== 'Super Admin') {
      if (toastCtx) toastCtx.addToast('error', 'Only Super Admin can edit pipelines');
      return;
    }
    const res = await opportunityService.addStage(stageName);
    if (res) {
      setPipelines(prev => [...prev, res].sort((a, b) => a.order - b.order));
      if (toastCtx) toastCtx.addToast('success', `Created stage: ${stageName}`);
    } else {
      const mockStage = { id: 'p_' + Date.now(), name: stageName, order: pipelines.length + 1 };
      setPipelines(prev => [...prev, mockStage]);
      if (toastCtx) toastCtx.addToast('success', `Created stage: ${stageName} (Offline)`);
    }
    await loadOpportunities();
  };

  const handleStageReorder = async (stageId: string, direction: 'left' | 'right') => {
    const user = authCtx?.user;
    if (user?.role !== 'Super Admin') {
      if (toastCtx) toastCtx.addToast('error', 'Only Super Admin can manage pipelines');
      return;
    }
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
      if (toastCtx) toastCtx.addToast('success', 'Reordered stages (Offline)');
    }
  };

  const handleStageDelete = async (stageId: string) => {
    const user = authCtx?.user;
    if (user?.role !== 'Super Admin') {
      if (toastCtx) toastCtx.addToast('error', 'Only Super Admin can manage pipelines');
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
        if (toastCtx) toastCtx.addToast('success', `Deleted stage ${stage.name} (Offline)`);
      }
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
      handleStageDelete
    }}>
      {children}
    </OpportunityContext.Provider>
  );
};
