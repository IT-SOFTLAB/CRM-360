import api from './api';

export const dashboardService = {
  getDashboard: async () => {
    const res = await api.get('/dashboard');
    return res.data;
  },

  getLeads: async () => {
    const res = await api.get('/leads');
    return res.data;
  },

  getOpportunities: async () => {
    const res = await api.get('/opportunities');
    return res.data;
  },

  getActivities: async () => {
    const res = await api.get('/activities');
    return res.data;
  },

  getQuotations: async () => {
    const res = await api.get('/quotations');
    return res.data;
  },

  getCustomers: async () => {
    const res = await api.get('/customers');
    return res.data;
  },

  getReferrals: async () => {
    const res = await api.get('/referrals');
    return res.data;
  },

  getUsers: async () => {
    const res = await api.get('/users');
    return res.data;
  },

  getSalesTeams: async () => {
    const res = await api.get('/salesteam');
    return res.data;
  },
};

export default dashboardService;