import api from './api';

export const leadService = {
  getLeads: async () => {
    try {
      const res = await api.get('/leads');
      return res.data;
    } catch (err) {
      console.warn('API error fetching leads, fallback to offline', err);
      return null;
    }
  },
  createLead: async (leadForm: any) => {
    try {
      const res = await api.post('/leads', leadForm);
      return res.data;
    } catch (err) {
      console.warn('API error creating lead, fallback to offline', err);
      return null;
    }
  },
  updateLead: async (leadId: string, leadData: any) => {
    try {
      const res = await api.put(`/leads/${leadId}`, leadData);
      return res.data;
    } catch (err) {
      console.warn('API error updating lead, fallback to offline', err);
      return null;
    }
  },
  deleteLead: async (leadId: string) => {
    try {
      const res = await api.delete(`/leads/${leadId}`);
      return res.data;
    } catch (err) {
      console.warn('API error deleting lead, fallback to offline', err);
      return null;
    }
  },
  convertLead: async (leadId: string, payload: any) => {
    try {
      const res = await api.post(`/opportunities/convert/${leadId}`, payload);
      return res.data;
    } catch (err) {
      console.warn('API error converting lead, fallback to offline', err);
      return null;
    }
  }
};
