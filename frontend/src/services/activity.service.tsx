import api from './api';

export const activityService = {
  getActivities: async () => {
    try {
      const res = await api.get('/activities');
      return res.data;
    } catch (err) {
      console.warn('API error fetching activities, fallback to offline', err);
      return null;
    }
  },
  createActivity: async (activityForm: any) => {
    try {
      const res = await api.post('/activities', activityForm);
      return res.data;
    } catch (err) {
      console.warn('API error creating activity, fallback to offline', err);
      return null;
    }
  },
  updateActivity: async (activityId: string, activityData: any) => {
    try {
      const res = await api.put(`/activities/${activityId}`, activityData);
      return res.data;
    } catch (err) {
      console.warn('API error updating activity, fallback to offline', err);
      return null;
    }
  }
};
