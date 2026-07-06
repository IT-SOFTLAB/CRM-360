"use client";

import { useContext } from 'react';
import { LeadContext, LeadContextType } from '../context/LeadContext';

export const useLeads = (): LeadContextType => {
  const context = useContext(LeadContext);
  if (context === undefined) {
    throw new Error('useLeads must be used within a LeadProvider');
  }
  return context;
};
