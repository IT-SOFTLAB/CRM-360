import api from "./api";

export const pipelineService = {

  // Get all pipeline stages
  getStages: async () => {
    try {
      const res = await api.get("/referral-pipeline");
      return res.data;
    } catch (err) {
      console.warn("Failed to load pipeline", err);
      return [];
    }
  },

  // Create a new stage
  createStage: async (stage: any) => {
    try {
      const res = await api.post("/referral-pipeline", stage);
      return res.data;
    } catch (err) {
      console.warn("Failed to create stage", err);
      return null;
    }
  },

  // Delete stage
  deleteStage: async (id: string) => {
    try {
      const res = await api.delete(`/referral-pipeline/${id}`);
      return res.data;
    } catch (err) {
      console.warn("Failed to delete stage", err);
      return null;
    }
  },

  // Reorder stages
  reorderStages: async (stages: any[]) => {
    try {
      const res = await api.put("/referral-pipeline/reorder", stages);
      return res.data;
    } catch (err) {
      console.warn("Failed to reorder stages", err);
      return null;
    }
  }

};