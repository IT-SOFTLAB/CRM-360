"use client";

import React, { createContext, useState, useContext } from 'react';
import { Quotation } from '../types/quotation';
import { quotationService } from '../services/quotation.service';
import { ToastContext } from './ToastContext';

export interface QuotationContextType {
  quotations: Quotation[];
  setQuotations: React.Dispatch<React.SetStateAction<Quotation[]>>;
  showQuoteModal: boolean;
  setShowQuoteModal: React.Dispatch<React.SetStateAction<boolean>>;
  loadQuotations: () => Promise<void>;
  handleQuotationCreate: (quoteForm: any) => Promise<void>;
  handleQuotationUpdate: (id: string, data: any) => Promise<void>;
  updateQuoteStatus: (quoteId: string, status: string) => Promise<void>;
}

export const QuotationContext = createContext<QuotationContextType | undefined>(undefined);

export const QuotationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const toastCtx = useContext(ToastContext);

  const loadQuotations = async () => {
    const apiQuotes = await quotationService.getQuotations();
    if (apiQuotes) {
      setQuotations(apiQuotes);
    } else if (quotations.length === 0) {
      setQuotations([]);
    }
  };

  const handleQuotationCreate = async (quoteForm: any) => {
    const payload = {
      customerName: quoteForm.customerName,
      company: quoteForm.company,
      opportunityId: quoteForm.opportunityId,
      taxRate: Number(quoteForm.taxRate),
      discount: Number(quoteForm.discount),
      items: quoteForm.items
    };

    const res = await quotationService.createQuotation(payload);
    if (res) {
      setQuotations(prev => [...prev, res]);
      if (toastCtx) toastCtx.addToast('success', 'Quotation draft created');
    } else {
      if (toastCtx) toastCtx.addToast('error', 'Failed to create quotation');
    }
    setShowQuoteModal(false);
  };

  const handleQuotationUpdate = async (id: string, data: any) => {
    const res = await quotationService.updateQuotation(id, data);
    if (res) {
      await loadQuotations();
      if (toastCtx) toastCtx.addToast("success", "Quotation Updated Successfully");
    } else {
      if (toastCtx) toastCtx.addToast("error", "Failed to update quotation");
    }
  };

  const updateQuoteStatus = async (quoteId: string, status: string) => {
    const res = await quotationService.updateQuotationStatus(quoteId, status);
    if (res) {
      if (toastCtx) toastCtx.addToast('success', `Quotation status updated to ${status}`);
      await loadQuotations();
    } else {
      if (toastCtx) toastCtx.addToast('error', `Failed to update quotation status`);
    }
  };

  return (
    <QuotationContext.Provider value={{
      quotations,
      setQuotations,
      showQuoteModal,
      setShowQuoteModal,
      loadQuotations,
      handleQuotationCreate,
      handleQuotationUpdate,
      updateQuoteStatus
    }}>
      {children}
    </QuotationContext.Provider>
  );
};
