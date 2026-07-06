import api from './api';

export const authService = {
  checkSetupStatus: async () => {
    try {
      const res = await api.get('/auth/setup-status');
      return res.data; // e.g. { setupRequired: true/false }
    } catch (err) {
      console.warn('API error checking setup status', err);
      return { setupRequired: false };
    }
  },

  setup: async (setupData: any) => {
    try {
      const res = await api.post('/auth/setup', setupData);
      return res.data;
    } catch (err) {
      console.error('API error during organization setup', err);
      return null;
    }
  },

  login: async (credentials: any) => {
    try {
      const res = await api.post('/auth/login', credentials);
      return res.data;
    } catch (err) {
      console.warn('API error during login', err);
      return null;
    }
  },

  register: async (userData: any) => {
    try {
      const res = await api.post('/auth/register', userData);
      return res.data;
    } catch (err) {
      console.warn('API error during registration', err);
      return null;
    }
  },

  logout: async () => {
    try {
      const res = await api.post('/auth/logout');
      return res.data;
    } catch (err) {
      console.error('API error during logout', err);
      return null;
    }
  },

  changePassword: async (passwordData: any) => {
    try {
      const res = await api.post('/auth/change-password', passwordData);
      return res.data;
    } catch (err) {
      console.error('API error changing password', err);
      throw err;
    }
  },

  inviteUser: async (invitationData: any) => {
    try {
      const res = await api.post('/auth/invite', invitationData);
      return res.data;
    } catch (err) {
      console.error('API error inviting user', err);
      throw err;
    }
  },

  acceptInvitation: async (acceptData: any) => {
    try {
      const res = await api.post('/auth/accept-invitation', acceptData);
      return res.data;
    } catch (err) {
      console.error('API error accepting invitation', err);
      throw err;
    }
  }
};
