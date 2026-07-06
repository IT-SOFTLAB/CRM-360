"use client";

import { useContext } from 'react';
import { QuotationContext, QuotationContextType } from '../context/QuotationContext';

export const useQuotations = (): QuotationContextType => {
  const context = useContext(QuotationContext);
  if (context === undefined) {
    throw new Error('useQuotations must be used within a QuotationProvider');
  }
  return context;
};
