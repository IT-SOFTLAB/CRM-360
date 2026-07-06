import api from './api';

export const settingsService = {
  getCategories: async () => {
    try {
      const res = await api.get('/categories');
      return res.data;
    } catch (err) {
      console.warn('API error fetching categories, fallback to offline', err);
      return null;
    }
  },
  addCategory: async (catName: string) => {
    try {
      const res = await api.post('/categories', { category: catName });
      return res.data;
    } catch (err) {
      console.warn('API error adding category, fallback to offline', err);
      return null;
    }
  },
  deleteCategory: async (catName: string) => {
    try {
      const res = await api.delete(`/categories/${catName}`);
      return res.data;
    } catch (err) {
      console.warn('API error deleting category, fallback to offline', err);
      return null;
    }
  },
  getUsers: async () => {
    try {
      const res = await api.get('/users');
      return res.data;
    } catch (err) {
      console.warn('API error fetching users, fallback to offline', err);
      return null;
    }
  },
  deleteUser: async (userId: string) => {
    try {
      const res = await api.delete(`/users/${userId}`);
      return res.data;
    } catch (err) {
      console.warn('API error deleting user, fallback to offline', err);
      return null;
    }
  },
  getBranding: async () => {
    try {
      const res = await api.get('/settings/branding');
      return res.data;
    } catch (err) {
      console.warn('API error fetching branding, fallback to offline', err);
      return null;
    }
  },
  saveBranding: async (brandingData: any) => {
    try {
      const res = await api.put('/settings/branding', brandingData);
      return res.data;
    } catch (err) {
      console.warn('API error saving branding, fallback to offline', err);
      return null;
    }
  },
  getAuditLogs: async () => {
    try {
      const res = await api.get('/settings/logs');
      return res.data;
    } catch (err) {
      console.warn('API error fetching audit logs, fallback to offline', err);
      return null;
    }
  }
};
