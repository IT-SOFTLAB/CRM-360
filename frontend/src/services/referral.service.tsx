import api from "./api";

export const referralService = {
  // ==========================
  // Get All Referrals
  // ==========================
  getReferrals: async () => {
    try {
      const res = await api.get("/referrals");
      return res.data;
    } catch (err) {
      console.warn("Failed to fetch referrals", err);
      return [];
    }
  },

  // ==========================
  // Get Single Referral
  // ==========================
  getReferral: async (id: string) => {
    try {
      const res = await api.get(`/referrals/${id}`);
      return res.data;
    } catch (err) {
      console.warn("Failed to fetch referral", err);
      return null;
    }
  },

  // ==========================
  // Create Referral
  // ==========================
  createReferral: async (data: any) => {
    try {
      const res = await api.post("/referrals", data);
      return res.data;
    } catch (err) {
      console.warn("Failed to create referral", err);
      return null;
    }
  },

  // ==========================
  // Update Referral
  // ==========================
  updateReferral: async (id: string, data: any) => {
    try {
      const res = await api.put(`/referrals/${id}`, data);
      return res.data;
    } catch (err) {
      console.warn("Failed to update referral", err);
      return null;
    }
  },

  // ==========================
  // Delete Referral
  // ==========================
  deleteReferral: async (id: string) => {
    try {
      const res = await api.delete(`/referrals/${id}`);
      return res.data;
    } catch (err) {
      console.warn("Failed to delete referral", err);
      return null;
    }
  },

  // ==========================
  // Approve Reward
  // PUT /api/referrals/:id/approve
  // ==========================
  approveReward: async (id: string) => {
    try {
      const res = await api.put(`/referrals/${id}/approve`);
      return res.data;
    } catch (err) {
      console.warn("Failed to approve reward", err);
      return null;
    }
  },

  // ==========================
  // Move Referral to another Stage
  // PUT /api/referrals/:id/stage
  // ==========================
  moveReferral: async (
    id: string,
    stageId: string
  ) => {
    try {
      const res = await api.put(`/referrals/${id}/stage`, {
        stageId,
      });

      return res.data;
    } catch (err) {
      console.warn("Failed to move referral", err);
      return null;
    }
  },

  // ==========================
  // Dashboard Analytics
  // ==========================
  getDashboard: async () => {
    try {
      const res = await api.get("/referrals/dashboard");
      return res.data;
    } catch (err) {
      console.warn("Failed to fetch dashboard", err);
      return null;
    }
  },
};