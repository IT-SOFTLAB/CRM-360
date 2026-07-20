import api from "./api";

export const activityService = {

  // ==========================
  // CRM Activities
  // ==========================

  getActivities: async () => {
    try {
      const res = await api.get("/activities");
      return res.data;
    } catch (err) {
      console.warn("Failed to load CRM activities", err);
      return [];
    }
  },

  createActivity: async (activityForm: any) => {
    try {

      const payload = {

        ...activityForm,

        attendees: Array.isArray(activityForm.attendees)
          ? activityForm.attendees
          : String(activityForm.attendees || "")
              .split(",")
              .map((email: string) => email.trim())
              .filter(Boolean),

        duration: Number(activityForm.duration),

        syncOutlook: !!activityForm.syncOutlook

      };

      console.log("===== ACTIVITY PAYLOAD =====");
console.log(payload);


      const res = await api.post("/activities", payload);

      return res.data;

    } catch (err) {

      console.warn("Failed to create activity", err);

      return null;

    }
  },

  updateActivity: async (
    activityId: string,
    activityData: any
  ) => {

    try {

      const res = await api.put(
        `/activities/${activityId}`,
        activityData
      );

      return res.data;

    } catch (err) {

      console.warn("Failed to update activity", err);

      return null;

    }

  },

  deleteActivity: async (id: string) => {

    const res = await api.delete(`/activities/${id}`);

    return res.data;

  },

  // ==========================
  // Outlook Calendar
  // ==========================

  getCalendarStatus: async () => {
    try {
      console.log("Calling /calendar/status");
      const res = await api.get("/calendar/status");
      return res.data;
    } catch (err) {
      console.warn("Failed to get calendar status", err);
      return { connected: false };
    }
  },

  getCalendarEvents: async () => {
    try {
      console.log("Calling /calendar/events");
      const res = await api.get("/calendar/events");
      return res.data;
    } catch (err) {
      console.warn("Failed to get calendar events", err);
      return [];
    }
  },

connectCalendar: () => {
  window.location.href =
     `${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/login/outlook?redirect=activities`;
},

  createCalendarEvent: async (payload: any) => {

    const res = await api.post(
      "/calendar/events",
      payload
    );

    return res.data;

  },

  updateCalendarEvent: async (
    id: string,
    payload: any
  ) => {

    const res = await api.patch(
      `/calendar/events/${id}`,
      payload
    );

    return res.data;

  },

  deleteCalendarEvent: async (
    id: string
  ) => {

    const res = await api.delete(
      `/calendar/events/${id}`
    );

    return res.data;

  }

};