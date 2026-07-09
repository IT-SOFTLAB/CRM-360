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
    setShowQuoteModal(false);
    
    // Calculate total from items
    const subtotal = (quoteForm.items || []).reduce((sum: number, item: any) => sum + (Number(item.price) * Number(item.quantity)), 0);
    const tax = subtotal * (Number(quoteForm.taxRate || 0) / 100);
    const grandTotal = subtotal + tax - Number(quoteForm.discount || 0);

    const tempId = 'q_temp_' + Date.now();
    const tempQuote = {
      id: tempId,
      customerName: quoteForm.customerName,
      company: quoteForm.company,
      opportunityId: quoteForm.opportunityId,
      status: 'Draft',
      total: grandTotal,
      grandTotal: grandTotal,
      createdAt: new Date().toISOString(),
      salesperson: 'Unassigned',
      items: quoteForm.items || []
    };
    setQuotations(prev => [...prev, tempQuote as any]);

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
      setQuotations(prev => prev.map(q => q.id === tempId ? res : q));
      if (toastCtx) toastCtx.addToast('success', 'Quotation draft created');
    } else {
      setQuotations(prev => prev.filter(q => q.id !== tempId));
      if (toastCtx) toastCtx.addToast('error', 'Failed to create quotation');
    }
  };

  const handleQuotationUpdate = async (id: string, data: any) => {
    // Optimistically update local quotation list
    setQuotations(prev => prev.map(q => q.id === id ? { ...q, ...data } : q));

    const res = await quotationService.updateQuotation(id, data);
    if (res) {
      setQuotations(prev => prev.map(q => q.id === id ? res : q));
      if (toastCtx) toastCtx.addToast("success", "Quotation Updated Successfully");
    } else {
      if (toastCtx) toastCtx.addToast("error", "Failed to update quotation");
      await loadQuotations();
    }
  };

  const updateQuoteStatus = async (quoteId: string, status: string) => {
    // Optimistically update local quotation status
    setQuotations(prev => prev.map(q => q.id === quoteId ? { ...q, status } : q));

    const res = await quotationService.updateQuotationStatus(quoteId, status);
    if (res) {
      if (toastCtx) toastCtx.addToast('success', `Quotation status updated to ${status}`);
    } else {
      if (toastCtx) toastCtx.addToast('error', `Failed to update quotation status`);
      await loadQuotations();
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
