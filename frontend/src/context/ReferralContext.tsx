"use client";

import React, { createContext, useState, useContext } from 'react';
import { Referral } from '../types/referral';
import { referralService } from '../services/referral.service';
import { ToastContext } from './ToastContext';
import { AuthContext } from './AuthContext';
import { DEFAULT_REFERRAL_FORM, OFFLINE_REFERRALS } from '../utils/constants';

export interface ReferralContextType {
  referrals: Referral[];
  setReferrals: React.Dispatch<React.SetStateAction<Referral[]>>;
  referralForm: any;
  setReferralForm: React.Dispatch<React.SetStateAction<any>>;
  showReferralModal: boolean;
  setShowReferralModal: React.Dispatch<React.SetStateAction<boolean>>;
  loadReferrals: () => Promise<void>;
  handleReferralCreate: (referralForm: any) => Promise<void>;
  handleApproveReward: (refId: string) => Promise<void>;
}

export const ReferralContext = createContext<ReferralContextType | undefined>(undefined);

export const ReferralProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [referralForm, setReferralForm] = useState<any>(DEFAULT_REFERRAL_FORM);
  const [showReferralModal, setShowReferralModal] = useState(false);

  const toastCtx = useContext(ToastContext);
  const authCtx = useContext(AuthContext);

  const loadReferrals = async () => {
    const apiReferrals = await referralService.getReferrals();
    if (apiReferrals) {
      setReferrals(apiReferrals);
    } else if (referrals.length === 0) {
      setReferrals(OFFLINE_REFERRALS);
    }
  };

  const handleReferralCreate = async (form: any) => {
    const res = await referralService.createReferral(form);
    if (res) {
      setReferrals(prev => [...prev, res]);
      if (toastCtx) toastCtx.addToast('success', 'Referral submitted!');
    } else {
      const mockRef = {
        id: 'ref_' + Date.now(),
        dateSubmitted: new Date().toISOString().split('T')[0],
        stage: 'rp_1',
        rewardApproved: false,
        ...form
      };
      setReferrals(prev => [...prev, mockRef]);
      if (toastCtx) toastCtx.addToast('success', 'Referral submitted (Offline)');
    }
    setShowReferralModal(false);
  };

  const handleApproveReward = async (refId: string) => {
    const user = authCtx?.user;
    if (user?.role !== 'Super Admin') {
      if (toastCtx) toastCtx.addToast('error', 'Only Super Admin can approve referral rewards');
      return;
    }
    const res = await referralService.updateReferral(refId, { rewardApproved: true, stage: 'rp_5' });
    if (res) {
      if (toastCtx) toastCtx.addToast('success', 'Referral Reward Approved!');
      await loadReferrals();
    } else {
      setReferrals(prev => prev.map(r => r.id === refId ? { ...r, rewardApproved: true, stage: 'rp_5' } : r));
      if (toastCtx) toastCtx.addToast('success', 'Referral Reward Approved (Offline)');
    }
  };

  return (
    <ReferralContext.Provider value={{
      referrals,
      setReferrals,
      referralForm,
      setReferralForm,
      showReferralModal,
      setShowReferralModal,
      loadReferrals,
      handleReferralCreate,
      handleApproveReward
    }}>
      {children}
    </ReferralContext.Provider>
  );
};
