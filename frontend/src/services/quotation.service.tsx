import api from './api';

export const quotationService = {
  getQuotations: async () => {
    try {
      const res = await api.get('/quotations');
      return res.data;
    } catch (err) {
      console.warn('API error fetching quotations, fallback to offline', err);
      return null;
    }
  },
  createQuotation: async (quoteForm: any) => {
    try {
      const res = await api.post('/quotations', quoteForm);
      return res.data;
    } catch (err) {
      console.warn('API error creating quotation, fallback to offline', err);
      return null;
    }
  },
  updateQuotation: async (quoteId: string, quoteData: any) => {
    try {
      const res = await api.put(`/quotations/${quoteId}`, quoteData);
      return res.data;
    } catch (err) {
      console.warn('API error updating quotation, fallback to offline', err);
      return null;
    }
  },
  updateQuotationStatus: async (quoteId: string, status: string) => {
    try {
      const res = await api.patch(`/quotations/${quoteId}/status`, { status });
      return res.data;
    } catch (err) {
      console.warn('API error updating status, fallback to offline', err);
      return null;
    }
  }
};
