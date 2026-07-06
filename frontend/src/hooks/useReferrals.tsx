"use client";

import { useContext } from 'react';
import { ReferralContext, ReferralContextType } from '../context/ReferralContext';

export const useReferrals = (): ReferralContextType => {
  const context = useContext(ReferralContext);
  if (context === undefined) {
    throw new Error('useReferrals must be used within a ReferralProvider');
  }
  return context;
};
