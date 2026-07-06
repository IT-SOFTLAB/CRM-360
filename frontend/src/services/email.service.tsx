import api from './api';

export const emailService = {
  getEmails: async () => {
    try {
      const res = await api.get('/emails');
      return res.data;
    } catch (err) {
      console.warn('API error fetching emails, fallback to offline', err);
      return null;
    }
  },
  sendEmail: async (payload: any) => {
    try {
      const res = await api.post('/emails', payload);
      return res.data;
    } catch (err) {
      console.warn('API error sending email, fallback to offline', err);
      return null;
    }
  }
};
