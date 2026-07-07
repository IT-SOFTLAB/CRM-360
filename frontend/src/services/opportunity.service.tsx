import api from './api';

export const opportunityService = {
  getOpportunities: async () => {
    try {
      const res = await api.get('/opportunities');
      return res.data;
    } catch (err) {
      console.warn('API error fetching opportunities, fallback to offline', err);
      return null;
    }
  },
  getPipelines: async () => {
    try {
      const res = await api.get('/pipelines');
      return res.data;
    } catch (err) {
      console.warn('API error fetching pipelines, fallback to offline', err);
      return null;
    }
  },
  getReferralPipelines: async () => {
    try {
      const res = await api.get('/referral-pipelines');
      return res.data;
    } catch (err) {
      console.warn('API error fetching referral pipelines, fallback to offline', err);
      return null;
    }
  },
  updateOpportunity: async (oppId: string, oppData: any) => {
    try {
      const res = await api.put(`/opportunities/${oppId}`, oppData);
      return res.data;
    } catch (err) {
      console.warn('API error updating opportunity, fallback to offline', err);
      return null;
    }
  },
  addStage: async (stageName: string) => {
    try {
      const res = await api.post('/pipelines', { name: stageName });
      return res.data;
    } catch (err) {
      console.warn('API error adding stage, fallback to offline', err);
      return null;
    }
  },
  reorderStages: async (stages: { id: string; order: number }[]) => {
    try {
      const res = await api.post('/pipelines/reorder', { stages });
      return res.data;
    } catch (err) {
      console.warn('API error reordering stages, fallback to offline', err);
      return null;
    }
  },
  deleteStage: async (stageId: string) => {
    try {
      const res = await api.delete(`/pipelines/${stageId}`);
      return res.data;
    } catch (err) {
      console.warn('API error deleting stage, fallback to offline', err);
      return null;
    }
  },
  deleteOpportunity: async (oppId: string) => {
    try {
      const res = await api.delete(`/opportunities/${oppId}`);
      return res.data;
    } catch (err) {
      console.warn('API error deleting opportunity, fallback to offline', err);
      return null;
    }
  }
};
