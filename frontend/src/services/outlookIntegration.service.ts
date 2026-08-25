import api from "./api";

export interface OutlookIntegrationPayload {
  clientId: string;
  clientSecret: string;
  tenantId: string;
  redirectUri: string;
}

export interface OutlookIntegration {
  id: string;
  clientId: string;
  tenantId: string;
  redirectUri: string;
  isActive: boolean;
  hasClientSecret: boolean;
}

export const outlookIntegrationService = {
  getIntegration: async () => {
    const res = await api.get("/outlook-integration");
    return res.data;
  },

  saveIntegration: async (
    payload: OutlookIntegrationPayload
  ) => {
    const res = await api.put(
      "/outlook-integration",
      payload
    );

    return res.data;
  },

  deleteIntegration: async () => {
    const res = await api.delete(
      "/outlook-integration"
    );

    return res.data;
  },
};