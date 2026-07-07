"use client";

import React, { createContext, useState, useContext } from 'react';
import { Quotation } from '../types/quotation';
import { quotationService } from '../services/quotation.service';
import { ToastContext } from './ToastContext';
import { OFFLINE_QUOTATIONS } from '../utils/constants';

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
      setQuotations(OFFLINE_QUOTATIONS);
    }
  };

  const handleQuotationCreate = async (quoteForm: any) => {
    const subtotal = quoteForm.items.reduce((sum: number, item: any) => sum + (Number(item.qty) * Number(item.price)), 0);
    const taxAmount = Math.round(subtotal * (Number(quoteForm.taxRate) / 100));
    const grandTotal = subtotal + taxAmount - Number(quoteForm.discount);

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
      const mockQuote = {
        id: 'q_' + Date.now(),
        quoteNumber: `QT-2026-0${quotations.length + 1}`,
        date: new Date().toISOString().split('T')[0],
        status: 'Draft',
        subtotal,
        taxAmount,
        grandTotal,
        clientName: quoteForm.customerName || quoteForm.clientName || '',
        ...payload
      };
      setQuotations(prev => [...prev, mockQuote]);
      if (toastCtx) toastCtx.addToast('success', 'Quotation draft created (Offline)');
    }
    setShowQuoteModal(false);
  };

  const handleQuotationUpdate = async (id: string, data: any) => {
    const res = await quotationService.updateQuotation(id, data);
    if (res) {
      await loadQuotations();
      if (toastCtx) toastCtx.addToast("success", "Quotation Updated Successfully");
    } else {
      setQuotations(prev => prev.map(q => q.id === id ? { ...q, ...data } : q));
      if (toastCtx) toastCtx.addToast("success", "Quotation Updated (Offline)");
    }
  };

  const updateQuoteStatus = async (quoteId: string, status: string) => {
    const res = await quotationService.updateQuotationStatus(quoteId, status);
    if (res) {
      if (toastCtx) toastCtx.addToast('success', `Quotation status updated to ${status}`);
      await loadQuotations();
    } else {
      setQuotations(prev => prev.map(q => q.id === quoteId ? { ...q, status } : q));
      if (toastCtx) toastCtx.addToast('success', `Quotation status updated (Offline)`);
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
