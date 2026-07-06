import api from './api';

export const referralService = {
  getReferrals: async () => {
    try {
      const res = await api.get('/referrals');
      return res.data;
    } catch (err) {
      console.warn('API error fetching referrals, fallback to offline', err);
      return null;
    }
  },
  createReferral: async (referralForm: any) => {
    try {
      const res = await api.post('/referrals', referralForm);
      return res.data;
    } catch (err) {
      console.warn('API error creating referral, fallback to offline', err);
      return null;
    }
  },
  updateReferral: async (refId: string, refData: any) => {
    try {
      const res = await api.put(`/referrals/${refId}`, refData);
      return res.data;
    } catch (err) {
      console.warn('API error updating referral, fallback to offline', err);
      return null;
    }
  }
};
