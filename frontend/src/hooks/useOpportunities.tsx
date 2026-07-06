"use client";

import { useContext } from 'react';
import { OpportunityContext, OpportunityContextType } from '../context/OpportunityContext';

export const useOpportunities = (): OpportunityContextType => {
  const context = useContext(OpportunityContext);
  if (context === undefined) {
    throw new Error('useOpportunities must be used within an OpportunityProvider');
  }
  return context;
};
